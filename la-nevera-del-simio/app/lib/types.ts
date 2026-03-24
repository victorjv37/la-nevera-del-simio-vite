export type NutritionCategoryId =
  | 'proteina'
  | 'energia'
  | 'micronutriente'
  | 'grasa'
  | 'funcional'
  | 'capricho';

export type ZoneId = 'nevera' | 'congelador' | 'despensa';

export type UnitId = 'unidades' | 'g' | 'ml' | 'kg' | 'L' | 'taza' | 'cda' | 'cdta';

export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'extra';

export type PlanGoal = 'mantener' | 'ganar_masa' | 'perder_grasa';

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  age: number;
  sex: 'male' | 'female';
  height: number;   // cm
  weight: number;   // kg
  activityLevel: ActivityLevel;
  goal: PlanGoal;
  updated_at?: unknown; // Firestore serverTimestamp
}

// ─── Food ─────────────────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  nutritionCategory: NutritionCategoryId;
  nutritionTags: NutritionCategoryId[];
  quantity: number;
  unit: UnitId;
  expiration: string; // YYYY-MM-DD
  zone: ZoneId;
  created_at: number;
}

export interface NutritionalCategory {
  id: NutritionCategoryId;
  label: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  icon: string;
}

export interface ExpirationBadge {
  label: string;
  color: string;
  bg: string;
}

// ─── Plan types ───────────────────────────────────────────────────────────────

export interface Ingrediente {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Receta {
  nombre: string;
  ingredientes: Ingrediente[];
  pasos: string[];
}

export interface Comida {
  tipo: 'desayuno' | 'comida' | 'cena' | 'merienda';
  recetas: Receta[];
}

export interface PlanDia {
  dia: number;
  comidas: Comida[];
}

export interface PlanFaltante {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface MealPlan {
  dias: PlanDia[];
  faltantes: PlanFaltante[];
}

// ─── Shopping ─────────────────────────────────────────────────────────────────

export interface ShoppingItem {
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria: string;
  checked: boolean;
}

// ─── Plan payload ─────────────────────────────────────────────────────────────

export interface PlanPayload {
  goal: PlanGoal;
  restrictions: string;
  calories: number;
  days: number;
}

// ─── Camera Scanner ────────────────────────────────────────────────────────────

export interface ScannedFood {
  nombre: string;
  categoria: NutritionCategoryId | string | null;
  cantidad: {
    valor: number | null;
    unidad: 'g' | 'kg' | 'ml' | 'l' | 'unidad';
  };
  formato: {
    tipo: 'bandeja' | 'botella' | 'lata' | 'pack' | 'otro';
    unidades: number;
  };
  fecha: {
    fecha_detectada_texto: string | null;
    fecha_caducidad_estimada: string | null; // YYYY-MM-DD
  };
}

// Mutable version for the review/edit screen
export interface EditableScannedFood extends ScannedFood {
  _id: string; // temp client-side ID for list key
}

