// Public layout — wraps login and onboarding with Auth context
// (Onboarding also needs UserProfileContext to call saveProfile)
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '~/context/AuthContext';
import { UserProfileProvider } from '~/context/UserProfileContext';

export default function PublicLayout() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <Outlet />
      </UserProfileProvider>
    </AuthProvider>
  );
}

