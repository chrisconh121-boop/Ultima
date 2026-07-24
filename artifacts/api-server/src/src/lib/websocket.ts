import { WebSocketServer, WebSocket } from "ws";
import { type IncomingMessage } from "http";
import { verifyToken } from "./auth";
import { db } from "@workspace/db";
import { chatMessagesTable, playerPositionsTable, avatarsTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

interface GameClient {
  ws: WebSocket;
  playerId: number;
  username: string;
  posX: number;
  posY: number;
}

const clients = new Map<number, GameClient>();

function safeSend(ws: WebSocket, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(data: unknown, excludePlayerId?: number): void {
  for (const [playerId, client] of clients) {
    if (excludePlayerId !== undefined && playerId === excludePlayerId) continue;
    safeSend(client.ws, data);
  }
}

export function createWebSocketServer(server: import("http").Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Token requerido");
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(1008, "Token inválido");
      return;
    }

    const { playerId, username } = payload;

    // Get initial position
    const [pos] = await db
      .select()
      .from(playerPositionsTable)
      .where(eq(playerPositionsTable.playerId, playerId))
      .limit(1);
    const posX = pos?.posX ?? Math.floor(Math.random() * 10 + 5);
    const posY = pos?.posY ?? Math.floor(Math.random() * 10 + 5);

    // Mark online
    await db.update(playersTable).set({ isOnline: true }).where(eq(playersTable.id, playerId));

    // Get avatar
    const [avatar] = await db
      .select()
      .from(avatarsTable)
      .where(eq(avatarsTable.playerId, playerId))
      .limit(1);

    const client: GameClient = { ws, playerId, username, posX, posY };
    clients.set(playerId, client);

    logger.info({ playerId, username }, "WebSocket player connected");

    // Notify others: player joined
    broadcast(
      {
        type: "player_joined",
        player: { id: playerId, username, posX, posY, avatar: avatar ?? undefined },
      },
      playerId,
    );

    // Send current players list to new client
    const currentPlayers = Array.from(clients.values())
      .filter((c) => c.playerId !== playerId)
      .map((c) => ({ id: c.playerId, username: c.username, posX: c.posX, posY: c.posY }));

    safeSend(ws, { type: "players_update", players: currentPlayers });

    // Send initial chat history
    const recentMessages = await db
      .select({
        id: chatMessagesTable.id,
        playerId: chatMessagesTable.playerId,
        username: playersTable.username,
        message: chatMessagesTable.message,
        createdAt: chatMessagesTable.createdAt,
      })
      .from(chatMessagesTable)
      .innerJoin(playersTable, eq(playersTable.id, chatMessagesTable.playerId))
      .orderBy(chatMessagesTable.createdAt)
      .limit(20);

    for (const msg of recentMessages) {
      safeSend(ws, {
        type: "chat_message",
        playerId: msg.playerId,
        username: msg.username,
        message: msg.message,
        createdAt: msg.createdAt?.toISOString() ?? new Date().toISOString(),
      });
    }

    ws.on("message", async (raw) => {
      let msg: { type: string; posX?: number; posY?: number; message?: string };
      try {
        msg = JSON.parse(raw.toString()) as typeof msg;
      } catch {
        return;
      }

      if (msg.type === "move" && msg.posX !== undefined && msg.posY !== undefined) {
        const newX = Math.max(0, Math.min(19, Math.round(msg.posX)));
        const newY = Math.max(0, Math.min(19, Math.round(msg.posY)));

        client.posX = newX;
        client.posY = newY;

        // Persist position
        await db
          .insert(playerPositionsTable)
          .values({ playerId, posX: newX, posY: newY })
          .onConflictDoUpdate({
            target: playerPositionsTable.playerId,
            set: { posX: newX, posY: newY },
          });

        // Broadcast movement to others
        broadcast({ type: "player_moved", playerId, posX: newX, posY: newY }, playerId);
      } else if (msg.type === "chat" && msg.message) {
        const text = String(msg.message).slice(0, 200).trim();
        if (!text) return;

        const [saved] = await db
          .insert(chatMessagesTable)
          .values({ playerId, message: text })
          .returning();

        // Exclude sender — client shows their own message optimistically
        broadcast(
          {
            type: "chat_message",
            playerId,
            username,
            message: text,
            createdAt: saved?.createdAt?.toISOString() ?? new Date().toISOString(),
          },
          playerId,
        );
      }
    });

    ws.on("close", async () => {
      clients.delete(playerId);
      logger.info({ playerId, username }, "WebSocket player disconnected");

      await db.update(playersTable).set({ isOnline: false }).where(eq(playersTable.id, playerId));

      // Save last known position
      await db
        .insert(playerPositionsTable)
        .values({ playerId, posX: client.posX, posY: client.posY })
        .onConflictDoUpdate({
          target: playerPositionsTable.playerId,
          set: { posX: client.posX, posY: client.posY },
        });

      broadcast({ type: "player_left", playerId });
    });

    ws.on("error", (err) => {
      logger.error({ err, playerId }, "WebSocket error");
    });
  });

  return wss;
}
