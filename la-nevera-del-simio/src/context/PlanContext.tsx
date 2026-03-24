import { createContext, useContext, useState } from 'react';
import { saveCurrentPlan, getCurrentPlan } from '~/lib/db';
import { generateMealPlan, getTargetCalories } from '~/lib/gemini';
import type { MealPlan, PlanGoal } from '~/lib/types';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';
import { useFood } from './FoodContext';

interface PlanPayload {
  goal: PlanGoal;
  restrictions: string;
  days: number;
}

interface PlanContextValue {
  currentPlan: MealPlan | null;
  isGenerating: boolean;
  error: string | null;
  generateNewPlan: (payload: PlanPayload) => Promise<void>;
  clearPlan: () => void;
  loadSavedPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile, tdee } = useUserProfile();
  const { foods } = useFood();
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewPlan = async ({ goal, restrictions, days }: PlanPayload) => {
    if (!user || !profile) return;
    setIsGenerating(true);
    setError(null);

    try {
      const targetCalories = getTargetCalories(tdee, goal);
      const plan = await generateMealPlan(
        profile,
        tdee,
        foods,
        goal,
        days,
        restrictions,
        targetCalories
      );
      setCurrentPlan(plan);
      // Persist to Firestore
      await saveCurrentPlan(user.uid, plan);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? '';
      const raw = String(err);
      if (msg === 'GEMINI_KEY_MISSING') {
        setError('⚠️ Configura la clave VITE_GEMINI_API_KEY en el archivo .env para generar dietas con IA.');
      } else if (msg.startsWith('PARSE_ERROR')) {
        setError('La IA devolvió un formato inesperado. Inténtalo de nuevo.');
      } else if (raw.includes('429') || raw.includes('Too Many Requests') || raw.includes('RESOURCE_EXHAUSTED')) {
        setError('⏳ Demasiadas peticiones. El plan es largo de generar — espera 30-60 segundos e inténtalo de nuevo.');
      } else if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY') || raw.includes('invalid')) {
        setError('❌ Clave Gemini no válida. Comprueba VITE_GEMINI_API_KEY en tu .env.');
      } else if (raw.includes('No Gemini model available') || raw.includes('404')) {
        setError('⚠️ Modelo no disponible. Activa la Gemini API en Google AI Studio.');
      } else {
        setError('Error generando el plan. Comprueba tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setIsGenerating(false);
    }

  };

  const clearPlan = () => setCurrentPlan(null);

  const loadSavedPlan = async () => {
    if (!user) return;
    const plan = await getCurrentPlan(user.uid);
    if (plan) setCurrentPlan(plan);
  };

  return (
    <PlanContext.Provider value={{ currentPlan, isGenerating, error, generateNewPlan, clearPlan, loadSavedPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}

