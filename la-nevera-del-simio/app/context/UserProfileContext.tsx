import { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile, saveUserProfile } from '~/lib/db';
import { calculateTDEE, getTargetCalories } from '~/lib/gemini';
import type { UserProfile, PlanGoal } from '~/lib/types';
import { useAuth } from './AuthContext';

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  tdee: number;
  targetCalories: number;
  saveProfile: (p: UserProfile) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't do anything while Firebase Auth is still checking session
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getUserProfile(user.uid)
      .then(p => setProfile(p))
      .finally(() => setLoading(false));
  }, [user, authLoading]);


  const tdee = profile ? calculateTDEE(profile) : 2000;
  const targetCalories = profile ? getTargetCalories(tdee, profile.goal) : 2000;

  const saveProfile = async (p: UserProfile) => {
    if (!user) return;
    await saveUserProfile(user.uid, p);
    setProfile(p);
  };

  return (
    <UserProfileContext.Provider value={{ profile, loading, tdee, targetCalories, saveProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used inside UserProfileProvider');
  return ctx;
}
