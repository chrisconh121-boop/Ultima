import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { token, setPlayer, logout } = useAuth();

  const { data: player, isSuccess, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
      // Only log out on explicit 401, not network errors or timing issues
      retryOnMount: false,
    }
  });

  useEffect(() => {
    if (isSuccess && player) {
      setPlayer(player);
    }
  }, [isSuccess, player, setPlayer]);

  useEffect(() => {
    // Only clear session on a genuine 401 (invalid/expired token)
    if (error && (error as { status?: number }).status === 401) {
      logout();
    }
  }, [error, logout]);

  return <>{children}</>;
}
