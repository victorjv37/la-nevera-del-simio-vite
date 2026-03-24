import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseConfig';

export const db = getFirestore(firebaseApp);

///////////////////////////////////////////////////////////
// 🔹 HELPERS
///////////////////////////////////////////////////////////

function normalizeId(text) {
  return text
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

///////////////////////////////////////////////////////////
// 🔹 COLECCIONES
///////////////////////////////////////////////////////////

// Base global educativa
export const foodsBaseCollection = collection(db, 'foods_base');

// Datos del usuario
export const userFoodsCollection = (uid) =>
  collection(db, 'users', uid, 'foods');

export const userPlansCollection = (uid) =>
  collection(db, 'users', uid, 'planes');

///////////////////////////////////////////////////////////
// 🔹 BASE GLOBAL (foods_base)
///////////////////////////////////////////////////////////

export async function createBaseFood(data) {
  if (!data?.nombre_base) return null;

  const id = normalizeId(data.nombre_base);
  const ref = doc(db, 'foods_base', id);

  return setDoc(
    ref,
    {
      ...data,
      created_at: new Date(),
    },
    { merge: false }
  );
}

export async function getBaseFood(nombre_base) {
  const id = normalizeId(nombre_base);
  const ref = doc(db, 'foods_base', id);
  const snapshot = await getDoc(ref);

  return snapshot.exists() ? { id, ...snapshot.data() } : null;
}

export async function listBaseFoods() {
  const snapshot = await getDocs(collection(db, 'foods_base'));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

///////////////////////////////////////////////////////////
// 🔹 NEVERA DEL USUARIO
///////////////////////////////////////////////////////////

export async function createUserFood(uid, data) {
  if (!uid) return null;
  return addDoc(userFoodsCollection(uid), {
    ...data,
    created_at: new Date(),
  });
}

export async function listUserFoods(uid) {
  if (!uid) return [];
  const snapshot = await getDocs(userFoodsCollection(uid));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function deleteUserFood(uid, foodId) {
  if (!uid || !foodId) return;
  const ref = doc(db, 'users', uid, 'foods', foodId);
  return deleteDoc(ref);
}

///////////////////////////////////////////////////////////
// 🔹 PLANES
///////////////////////////////////////////////////////////

export async function savePlan(uid, planId, payload) {
  if (!uid) return null;

  const ref = doc(db, 'users', uid, 'planes', planId);

  return setDoc(
    ref,
    {
      ...payload,
      updated_at: new Date(),
    },
    { merge: true }
  );
}

export async function getPlan(uid, planId) {
  if (!uid) return null;

  const ref = doc(db, 'users', uid, 'planes', planId);
  const snapshot = await getDoc(ref);

  return snapshot.exists()
    ? { id: planId, ...snapshot.data() }
    : null;
}

///////////////////////////////////////////////////////////
// 🔹 FLUJO INTELIGENTE (RECOMENDADO)
///////////////////////////////////////////////////////////

/**
 * Añade alimento al usuario asegurando que exista en foods_base
 */
export async function addFoodToUser(uid, foodData) {
  if (!uid || !foodData?.nombre_base) return null;

  // 1️⃣ Buscar en base global
  let baseFood = await getBaseFood(foodData.nombre_base);

  // 2️⃣ Si no existe, lo crea
  if (!baseFood) {
    await createBaseFood(foodData);
    baseFood = await getBaseFood(foodData.nombre_base);
  }

  // 3️⃣ Lo añade a la nevera del usuario
  return createUserFood(uid, {
    food_base_id: baseFood.id,
    nombre_base: baseFood.nombre_base,
    categoria_principal: baseFood.categoria_principal,
    etiquetas_secundarias: baseFood.etiquetas_secundarias || [],
  });
}