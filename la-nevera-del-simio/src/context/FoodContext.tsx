import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { subscribeToFoods, addUserFood, deleteUserFood } from '~/lib/db';
import { generateId } from '~/lib/helpers';
import type { FoodItem, NutritionCategoryId, ZoneId, UnitId } from '~/lib/types';
import { useAuth } from './AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FoodState {
  foods: FoodItem[];
  loading: boolean;
}

type FoodAction =
  | { type: 'SET'; foods: FoodItem[] }
  | { type: 'SET_LOADING'; loading: boolean };

interface FoodContextValue {
  foods: FoodItem[];
  loading: boolean;
  addFood: (data: Omit<FoodItem, 'id' | 'created_at'>) => Promise<void>;
  removeFood: (id: string) => Promise<void>;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: FoodState, action: FoodAction): FoodState {
  switch (action.type) {
    case 'SET': return { ...state, foods: action.foods, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    default: return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { foods: [], loading: true });
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up on user change
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!user) {
      dispatch({ type: 'SET', foods: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });

    // Real-time Firestore subscription
    const unsub = subscribeToFoods(user.uid, foods => {
      dispatch({ type: 'SET', foods });
    });

    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [user]);

  const addFood = async (data: Omit<FoodItem, 'id' | 'created_at'>) => {
    if (!user) return;
    await addUserFood(user.uid, data);
    // Firestore onSnapshot will update the list automatically
  };

  const removeFood = async (id: string) => {
    if (!user) return;
    await deleteUserFood(user.uid, id);
  };

  return (
    <FoodContext.Provider value={{ ...state, addFood, removeFood }}>
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error('useFood must be used inside FoodProvider');
  return ctx;
}

