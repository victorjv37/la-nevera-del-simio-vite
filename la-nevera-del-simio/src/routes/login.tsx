import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, LogIn, UserPlus, Leaf } from 'lucide-react';
import { useAuth } from '~/context/AuthContext';

export function meta() {
  return [{ title: 'Acceder — La Nevera del Simio' }];
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/fridge');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No existe ninguna cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/email-already-in-use': 'Ese email ya está registrado.',
        'auth/invalid-email': 'El formato del email no es válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
      };
      setError(messages[code] ?? 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '24px 16px',
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(212,147,107,0.4)',
          }}
        >
          <Leaf size={32} strokeWidth={1.75} color="white" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.5 }}>
          La Nevera del Simio
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 6 }}>
          Tu nevera inteligente
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 24,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Mode switch */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-surface-2)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                fontFamily: 'var(--font)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === m ? 'var(--color-surface)' : 'transparent',
                color: mode === m ? 'var(--color-text)' : 'var(--color-text-2)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="field-group">
            <label className="field-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="field-input"
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-3)',
                  display: 'flex',
                }}
                aria-label={showPw ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                background: 'var(--urgente-bg)',
                color: 'var(--urgente-color)',
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <span className="spinner" />
            ) : mode === 'login' ? (
              <><LogIn size={18} /> Entrar</>
            ) : (
              <><UserPlus size={18} /> Crear cuenta</>
            )}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 24, textAlign: 'center' }}>
        Al continuar, aceptas el uso de tus datos para mejorar tu experiencia nutricional.
      </p>
    </div>
  );
}
