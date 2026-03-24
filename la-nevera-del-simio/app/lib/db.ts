// Firestore data layer for La Nevera del Simio (TypeScript/Vite version)
// Mirrors the structure in firebase/firestore.js but typed for the web app

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FoodItem, UserProfile, MealPlan } from './types';

// ─── Collections ──────────────────────────────────────────────────────────────

const userFoodsRef = (uid: string) =>
  collection(db, 'users', uid, 'foods');

const userProfileRef = (uid: string) =>
  doc(db, 'users', uid, 'profile', 'data');

const userPlansRef = (uid: string) =>
  collection(db, 'users', uid, 'planes');

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userProfileRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(userProfileRef(uid), { ...profile, updated_at: serverTimestamp() });
}

// ─── Foods ────────────────────────────────────────────────────────────────────

export function subscribeToFoods(
  uid: string,
  callback: (foods: FoodItem[]) => void
): Unsubscribe {
  const q = query(userFoodsRef(uid), orderBy('created_at', 'asc'));
  return onSnapshot(q, snapshot => {
    const foods = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem));
    callback(foods);
  });
}

export async function addUserFood(uid: string, food: Omit<FoodItem, 'id' | 'created_at'>): Promise<string> {
  const ref = await addDoc(userFoodsRef(uid), {
    ...food,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteUserFood(uid: string, foodId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'foods', foodId));
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function saveCurrentPlan(uid: string, plan: MealPlan): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'planes', 'current'), {
    ...plan,
    saved_at: serverTimestamp(),
  });
}

export async function getCurrentPlan(uid: string): Promise<MealPlan | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'planes', 'current'));
  return snap.exists() ? (snap.data() as MealPlan) : null;
}
