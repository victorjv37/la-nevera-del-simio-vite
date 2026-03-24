import type {
    FoodItem,
    ExpirationBadge,
    MealPlan,
    ShoppingItem,
    NutritionCategoryId,
    PlanPayload,
} from './types';

// ─── Expiration badge ─────────────────────────────────────────────────────────

export function getExpirationBadge(expiration: string): ExpirationBadge {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiration);
    exp.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { label: 'Caducado', color: '#9B1C1C', bg: '#FEE2E2' };
    }
    if (diffDays < 3) {
        return { label: 'Urgente', color: '#C53030', bg: '#FEE2E2' };
    }
    if (diffDays < 7) {
        return { label: 'Pronto', color: '#C05621', bg: '#FEECE2' };
    }
    return { label: 'Fresco', color: '#276749', bg: '#E6F4EA' };
}

// ─── Shopping list calculation ────────────────────────────────────────────────

export function buildShoppingListFromPlan(
    plan: MealPlan,
    pantry: FoodItem[]
): ShoppingItem[] {
    // Build stock index
    const stock: Record<string, { remaining: number; categoria: string; unidad: string }> = {};
    for (const food of pantry) {
        const key = food.name.toLowerCase();
        stock[key] = {
            remaining: food.quantity,
            categoria: food.nutritionCategory,
            unidad: food.unit,
        };
    }

    const needed: Record<string, { cantidad: number; unidad: string; categoria: string }> = {};

    // Iterate plan ingredients
    for (const dia of plan.dias) {
        for (const comida of dia.comidas) {
            for (const receta of comida.recetas) {
                for (const ing of receta.ingredientes) {
                    const key = ing.nombre.toLowerCase();
                    if (!needed[key]) {
                        needed[key] = { cantidad: 0, unidad: ing.unidad, categoria: 'otros' };
                    }
                    needed[key].cantidad += ing.cantidad;
                }
            }
        }
    }

    // Also add explicit faltantes from AI
    for (const f of plan.faltantes) {
        const key = f.nombre.toLowerCase();
        if (!needed[key]) {
            needed[key] = { cantidad: f.cantidad, unidad: f.unidad, categoria: 'otros' };
        }
    }

    // Calculate deficit
    const result: ShoppingItem[] = [];
    for (const [key, info] of Object.entries(needed)) {
        const inStock = stock[key]?.remaining ?? 0;
        const deficit = info.cantidad - inStock;
        if (deficit > 0) {
            result.push({
                nombre: key.charAt(0).toUpperCase() + key.slice(1),
                cantidad: Math.ceil(deficit),
                unidad: info.unidad,
                categoria: stock[key]?.categoria ?? 'otros',
                checked: false,
            });
        }
        // Deduct from stock
        if (stock[key]) {
            stock[key].remaining = Math.max(0, inStock - info.cantidad);
        }
    }

    return result;
}

// ─── Group by category ────────────────────────────────────────────────────────

export function groupByCategory<T extends { categoria: string }>(
    items: T[]
): Record<string, T[]> {
    return items.reduce(
        (acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            acc[item.categoria].push(item);
            return acc;
        },
        {} as Record<string, T[]>
    );
}

// ─── Mock plan generator ──────────────────────────────────────────────────────

export function createMockPlan(payload: PlanPayload): MealPlan {
    const { days } = payload;
    const dias = Array.from({ length: days }, (_, i) => ({
        dia: i + 1,
        comidas: [
            {
                tipo: 'desayuno' as const,
                recetas: [
                    {
                        nombre: 'Porridge de avena con fruta',
                        ingredientes: [
                            { nombre: 'Avena', cantidad: 80, unidad: 'g' },
                            { nombre: 'Leche', cantidad: 200, unidad: 'ml' },
                            { nombre: 'Plátano', cantidad: 1, unidad: 'unidades' },
                            { nombre: 'Miel', cantidad: 1, unidad: 'cda' },
                        ],
                        pasos: [
                            'Calentar la leche en un cazo a fuego medio.',
                            'Añadir la avena y remover durante 5 minutos hasta que espese.',
                            'Servir con el plátano en rodajas y un chorrito de miel.',
                        ],
                    },
                ],
            },
            {
                tipo: 'comida' as const,
                recetas: [
                    {
                        nombre: 'Arroz con pollo y verduras',
                        ingredientes: [
                            { nombre: 'Pechuga de pollo', cantidad: 150, unidad: 'g' },
                            { nombre: 'Arroz integral', cantidad: 100, unidad: 'g' },
                            { nombre: 'Brócoli', cantidad: 100, unidad: 'g' },
                            { nombre: 'Aceite de oliva', cantidad: 1, unidad: 'cda' },
                            { nombre: 'Cúrcuma', cantidad: 1, unidad: 'cdta' },
                        ],
                        pasos: [
                            'Cocer el arroz integral en agua con sal durante 20 minutos.',
                            'Saltear el pollo en trozos con un poco de aceite y cúrcuma.',
                            'Añadir el brócoli al salteado y cocinar 5 minutes más.',
                            'Servir el pollo y verduras sobre el arroz.',
                        ],
                    },
                ],
            },
            {
                tipo: 'merienda' as const,
                recetas: [
                    {
                        nombre: 'Puñado de frutos secos',
                        ingredientes: [
                            { nombre: 'Almendras', cantidad: 30, unidad: 'g' },
                        ],
                        pasos: ['Tomar las almendras directamente como snack.'],
                    },
                ],
            },
            {
                tipo: 'cena' as const,
                recetas: [
                    {
                        nombre: 'Tortilla de espinacas',
                        ingredientes: [
                            { nombre: 'Huevos', cantidad: 3, unidad: 'unidades' },
                            { nombre: 'Espinacas', cantidad: 80, unidad: 'g' },
                            { nombre: 'Aceite de oliva', cantidad: 1, unidad: 'cda' },
                            { nombre: 'Sal', cantidad: 1, unidad: 'cdta' },
                        ],
                        pasos: [
                            'Batir los huevos con sal.',
                            'Saltear las espinacas con aceite hasta que reduzcan.',
                            'Añadir los huevos batidos y cuajar la tortilla a fuego suave.',
                        ],
                    },
                ],
            },
        ],
    }));

    const faltantes = [
        { nombre: 'Leche', cantidad: 200 * days, unidad: 'ml' },
        { nombre: 'Plátano', cantidad: days, unidad: 'unidades' },
        { nombre: 'Miel', cantidad: days, unidad: 'cda' },
        { nombre: 'Sal', cantidad: 10, unidad: 'g' },
    ];

    return { dias, faltantes };
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Category color lookup ───────────────────────────────────────────────────

export function getCategoryColor(categoryId: NutritionCategoryId | string): string {
    const colors: Record<string, string> = {
        proteina: '#C06070',
        energia: '#D4936B',
        micronutriente: '#6BAE8A',
        grasa: '#839791',
        funcional: '#896978',
        capricho: '#AAC0AF',
        otros: '#A0AEC0',
    };
    return colors[categoryId] ?? '#A0AEC0';
}
