import { Outlet, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '~/context/AuthContext';
import { UserProfileProvider, useUserProfile } from '~/context/UserProfileContext';
import { FoodProvider } from '~/context/FoodContext';
import { PlanProvider } from '~/context/PlanContext';
import BottomNav from '~/components/BottomNav';

// Inner guard — has access to auth + profile contexts
function AppGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    } else if (!profile) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, authLoading, profileLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-bg)',
        flexDirection: 'column', gap: 14,
      }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p style={{ color: 'var(--color-text-2)', fontSize: 14 }}>Cargando…</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  return <>{children}</>;
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <FoodProvider>
          <PlanProvider>
            <AppGuard>
              <div className="app-shell">
                <Outlet />
                <BottomNav />
              </div>
            </AppGuard>
          </PlanProvider>
        </FoodProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
