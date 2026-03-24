import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FoodItem, MealPlan, PlanGoal, UserProfile, ScannedFood } from './types';


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function buildPrompt(
  profile: UserProfile,
  tdee: number,
  foods: FoodItem[],
  goal: PlanGoal,
  days: number,
  restrictions: string,
  targetCalories: number
): string {
  const goalLabel = {
    mantener: 'mantener peso',
    ganar_masa: 'ganar masa muscular',
    perder_grasa: 'perder grasa',
  }[goal];

  const activityLabel = {
    sedentario: 'sedentario',
    ligero: 'ligeramente activo (1-3 días/semana)',
    moderado: 'moderadamente activo (3-5 días/semana)',
    activo: 'muy activo (6-7 días/semana)',
    extra: 'extra activo (atleta o trabajo físico intenso)',
  }[profile.activityLevel] ?? profile.activityLevel;

  const foodsList = foods.length > 0
    ? foods.map(f => `- ${f.name} (${f.quantity}${f.unit}, categoría: ${f.nutritionCategory})`).join('\n')
    : 'La nevera está vacía.';

  return `Eres un nutricionista experto creando planes de comidas personalizados.

DATOS DEL USUARIO:
- Nombre: ${profile.name}
- Edad: ${profile.age} años
- Sexo: ${profile.sex === 'male' ? 'Hombre' : 'Mujer'}
- Peso: ${profile.weight} kg | Altura: ${profile.height} cm
- Nivel de actividad: ${activityLabel}
- TDEE calculado: ${tdee} kcal/día
- Objetivo: ${goalLabel}
- Calorías objetivo/día: ${targetCalories} kcal
${restrictions ? `- Restricciones alimentarias: ${restrictions}` : ''}

ALIMENTOS DISPONIBLES EN SU NEVERA:
${foodsList}

INSTRUCCIONES:
1. Genera un plan nutricional de ${days} días con desayuno, comida, merienda y cena cada día.
2. PRIORIZA los alimentos disponibles en la nevera cuando sea posible.
3. Para cada receta, incluye ingredientes con cantidades precisas y pasos de preparación.
4. Adapta las porciones a las calorías objetivo (${targetCalories} kcal/día).
5. Lista todos los ingredientes que NO están en la nevera en el campo "faltantes".
6. Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques markdown.

FORMATO DE RESPUESTA (JSON puro):
{"dias":[{"dia":1,"comidas":[{"tipo":"desayuno","recetas":[{"nombre":"Nombre receta","ingredientes":[{"nombre":"ingrediente","cantidad":100,"unidad":"g"}],"pasos":["Paso 1","Paso 2"]}]},{"tipo":"comida","recetas":[...]},{"tipo":"merienda","recetas":[...]},{"tipo":"cena","recetas":[...]}]}],"faltantes":[{"nombre":"ingrediente","cantidad":200,"unidad":"g"}]}`;
}

export async function generateMealPlan(
  profile: UserProfile,
  tdee: number,
  foods: FoodItem[],
  goal: PlanGoal,
  days: number,
  restrictions: string,
  targetCalories: number
): Promise<MealPlan> {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = buildPrompt(profile, tdee, foods, goal, days, restrictions, targetCalories);
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as MealPlan;
  } catch {
    throw new Error('PARSE_ERROR: ' + cleaned.slice(0, 200));
  }
}

// ─── Gemini Vision: detect foods from image ───────────────────────────────────

  const VISION_PROMPT = `Analiza la imagen y detecta todos los alimentos visibles.
Devuelve SOLO JSON válido (sin texto adicional, sin bloques markdown) con un array de hasta 10 objetos:
[{
  "nombre": "nombre del alimento (incluye marca si es visible)",
  "categoria": "proteina" | "energia" | "micronutriente" | "grasa" | "funcional" | "capricho",
  "cantidad": {
    "valor": número o null,
    "unidad": "g" | "kg" | "ml" | "l" | "unidad"
  },
  "formato": {
    "tipo": "bandeja" | "botella" | "lata" | "pack" | "otro",
    "unidades": número de unidades visibles
  },
  "fecha": {
    "fecha_detectada_texto": "texto tal como aparece en el envase, o null",
    "fecha_caducidad_estimada": "YYYY-MM-DD si es inferible, o null"
  }
}]

Reglas:
- Categoría debe ser una de las permitidas: 
  - proteina (carnes, huevos, lácteos, legumbres puras)
  - energia (cereales, pan, pasta, arroz, patata)
  - micronutriente (frutas, verduras, hortalizas)
  - grasa (aceites, frutos secos, semillas, aguacate)
  - funcional (especias, vinagres, caldos, conservantes)
  - capricho (dulces, refrescos, alcohol, ultraprocesados)
- Prioriza cantidades en gramos o mililitros
- Si aparece "500g", "1L", "330ml", úsalo directamente
- Si hay packs (ej: "6x125g"), intéprétalo como valor=125 unidad=g unidades=6
- No inventes datos que no se vean claramente
- Si no estás seguro deja los campos como null`;

export async function scanFoodsFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<ScannedFood[]> {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const result = await model.generateContent([
    { text: VISION_PROMPT },
    { inlineData: { data: base64Image, mimeType } },
  ]);

  const text = result.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed as ScannedFood[];
  } catch {
    throw new Error('PARSE_ERROR: ' + cleaned.slice(0, 200));
  }
}

export function calculateTDEE(profile: UserProfile): number {
  // Mifflin-St Jeor
  const bmr =
    profile.sex === 'male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    activo: 1.725,
    extra: 1.9,
  };

  return Math.round(bmr * (multipliers[profile.activityLevel] ?? 1.2));
}

export function getTargetCalories(tdee: number, goal: PlanGoal): number {
  if (goal === 'perder_grasa') return Math.round(tdee * 0.8);   // −20%
  if (goal === 'ganar_masa') return Math.round(tdee * 1.15);    // +15%
  return tdee; // mantener
}
