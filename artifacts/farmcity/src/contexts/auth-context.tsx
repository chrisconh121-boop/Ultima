import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export interface AvatarData {
  id: number;
  playerId: number;
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  shirtColor: string;
  pantsColor: string;
  hatStyle: string | null;
  accessory: string | null;
}

export interface PlayerData {
  id: number;
  username: string;
  createdAt: string;
  isOnline: boolean;
  avatar?: AvatarData;
}

interface AuthContextValue {
  token: string | null;
  player: PlayerData | null;
  setPlayer: (player: PlayerData) => void;
  login: (token: string, player: PlayerData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'farmcity_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [player, setPlayerState] = useState<PlayerData | null>(null);

  // Register the token getter — reads localStorage directly to avoid React state race conditions
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
    return () => setAuthTokenGetter(null);
  }, []);

  const login = useCallback((newToken: string, newPlayer: PlayerData) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setPlayerState(newPlayer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPlayerState(null);
  }, []);

  const setPlayer = useCallback((newPlayer: PlayerData) => {
    setPlayerState(newPlayer);
  }, []);

  return (
    <AuthContext.Provider value={{ token, player, setPlayer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
