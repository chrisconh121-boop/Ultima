import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import type { PlayerData } from '@/contexts/auth-context';
import { useLogin, useRegister } from '@workspace/api-client-react';
import type { ErrorType } from '@workspace/api-client-react';

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, player } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (player?.avatar) {
    setLocation('/plaza');
    return null;
  }
  if (player && !player.avatar) {
    setLocation('/avatar');
    return null;
  }

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.player as unknown as PlayerData);
        if (data.player.avatar) {
          setLocation('/plaza');
        } else {
          setLocation('/avatar');
        }
      },
      onError: (err) => {
        const e = err as ErrorType<{ error?: string }>;
        setError(e.data?.error ?? 'Error al iniciar sesión');
      },
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.player as unknown as PlayerData);
        setLocation('/avatar');
      },
      onError: (err) => {
        const e = err as ErrorType<{ error?: string }>;
        setError(e.data?.error ?? 'Error al registrarse');
      },
    },
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isRegister) {
      registerMutation.mutate({ data: { username, password } });
    } else {
      loginMutation.mutate({ data: { username, password } });
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #2A5022 0%, #3A6E2F 60%, #2A5022 100%)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,0.5) 31px,rgba(255,255,255,0.5) 32px),' +
            'repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,0.5) 31px,rgba(255,255,255,0.5) 32px)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🌾</div>
          <h1
            className="font-['VT323'] text-6xl text-yellow-300 tracking-widest"
            style={{ textShadow: '3px 3px 0 #1A3A12' }}
          >
            FarmCity
          </h1>
          <p className="font-['VT323'] text-xl text-green-200 mt-1">
            Tu ciudad campestre en línea
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#FFF8E7', border: '4px solid #3D2010' }}>
          {/* Tab header */}
          <div
            className="flex"
            style={{ background: '#7A4F1E', borderBottom: '3px solid #3D2010' }}
          >
            {[
              { label: '🌾 Entrar', isReg: false },
              { label: '🌱 Registrarse', isReg: true },
            ].map(({ label, isReg }) => (
              <button
                key={label}
                onClick={() => {
                  setIsRegister(isReg);
                  setError('');
                }}
                className="flex-1 py-2 font-['VT323'] text-lg transition-colors"
                style={{
                  background: isRegister === isReg ? '#3D2010' : 'transparent',
                  color: '#FFF8E7',
                  border: 'none',
                  borderRight: isReg ? 'none' : '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="font-['VT323'] text-base text-[#7A4F1E] uppercase tracking-wider block mb-1">
                Nombre de jugador
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                placeholder="mínimo 3 caracteres..."
                className="w-full px-3 py-2 font-['VT323'] text-base focus:outline-none"
                style={{
                  background: '#FFFDF0',
                  border: '2px solid #3D2010',
                  color: '#3D2010',
                }}
              />
            </div>

            <div>
              <label className="font-['VT323'] text-base text-[#7A4F1E] uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="mínimo 6 caracteres..."
                className="w-full px-3 py-2 font-['VT323'] text-base focus:outline-none"
                style={{
                  background: '#FFFDF0',
                  border: '2px solid #3D2010',
                  color: '#3D2010',
                }}
              />
            </div>

            {error && (
              <div
                className="font-['VT323'] text-sm px-3 py-2"
                style={{ background: '#FFE5E5', border: '2px solid #CC3300', color: '#8B0000' }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 font-['VT323'] text-xl tracking-widest transition-all active:translate-y-px"
              style={{
                background: isPending ? '#A0856A' : '#7A4F1E',
                color: '#FFF8E7',
                border: '3px solid #3D2010',
                cursor: isPending ? 'wait' : 'pointer',
              }}
            >
              {isPending
                ? '⏳ Cargando...'
                : isRegister
                  ? '🌱 Crear cuenta'
                  : '🌾 Entrar al mundo'}
            </button>
          </form>
        </div>

        <p className="text-center font-['VT323'] text-green-400 mt-4 text-sm tracking-wide">
          Mundo multijugador en tiempo real ·{' '}
          {isRegister ? 'Crea tu cuenta gratis' : 'Ya tienes cuenta? Inicia sesión'}
        </p>
      </div>
    </div>
  );
}
