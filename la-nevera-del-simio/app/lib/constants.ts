import type { NutritionalCategory, FoodItem } from './types';

export const NUTRITIONAL_CATEGORIES: NutritionalCategory[] = [
    {
        id: 'proteina',
        label: 'Base proteica',
        description: 'Carnes, pescados, huevos, lácteos, legumbres.',
        examples: ['pechuga de pollo', 'huevos', 'atún', 'lentejas', 'tofu'],
        color: '#C06070',
        bgColor: '#FAF0F2',
        icon: 'proteina',
    },
    {
        id: 'energia',
        label: 'Base energética',
        description: 'Cereales, panes, pastas, arroces, tubérculos.',
        examples: ['arroz integral', 'avena', 'pan', 'patata', 'pasta'],
        color: '#D4936B',
        bgColor: '#FDF5EF',
        icon: 'energia',
    },
    {
        id: 'micronutriente',
        label: 'Micronutricional',
        description: 'Verduras, frutas, vitaminas, minerales y fibra.',
        examples: ['espinacas', 'brócoli', 'tomate', 'naranja', 'zanahoria'],
        color: '#6BAE8A',
        bgColor: '#F0F8F3',
        icon: 'micronutriente',
    },
    {
        id: 'grasa',
        label: 'Base grasa',
        description: 'Aceites, frutos secos, aguacate, semillas.',
        examples: ['aceite de oliva', 'almendras', 'aguacate', 'tahini'],
        color: '#839791',
        bgColor: '#F2F5F4',
        icon: 'grasa',
    },
    {
        id: 'funcional',
        label: 'Extras funcionales',
        description: 'Condimentos, especias, salsas e infusiones.',
        examples: ['cúrcuma', 'jengibre', 'kombucha', 'salsa picante'],
        color: '#896978',
        bgColor: '#F5F0F3',
        icon: 'funcional',
    },
    {
        id: 'capricho',
        label: 'Caprichos',
        description: 'Dulces, snacks y postres de consumo ocasional.',
        examples: ['chocolate', 'galletas', 'helado', 'turrón'],
        color: '#AAC0AF',
        bgColor: '#F4F8F5',
        icon: 'capricho',
    },
];

export const ZONES = [
    { id: 'nevera', label: 'Nevera' },
    { id: 'congelador', label: 'Congelador' },
    { id: 'despensa', label: 'Despensa' },
] as const;

export const UNITS = ['unidades', 'g', 'ml', 'kg', 'L', 'taza', 'cda', 'cdta'] as const;

export const SEED_FOODS: Omit<FoodItem, 'id' | 'created_at'>[] = [
    { name: 'Pechuga de pollo', nutritionCategory: 'proteina', nutritionTags: [], quantity: 400, unit: 'g', expiration: '2026-03-20', zone: 'nevera' },
    { name: 'Huevos', nutritionCategory: 'proteina', nutritionTags: ['grasa'], quantity: 6, unit: 'unidades', expiration: '2026-03-28', zone: 'nevera' },
    { name: 'Arroz integral', nutritionCategory: 'energia', nutritionTags: [], quantity: 500, unit: 'g', expiration: '2026-09-01', zone: 'despensa' },
    { name: 'Brócoli', nutritionCategory: 'micronutriente', nutritionTags: [], quantity: 300, unit: 'g', expiration: '2026-03-19', zone: 'nevera' },
    { name: 'Aguacate', nutritionCategory: 'grasa', nutritionTags: ['micronutriente'], quantity: 2, unit: 'unidades', expiration: '2026-03-18', zone: 'nevera' },
    { name: 'Aceite de oliva', nutritionCategory: 'grasa', nutritionTags: [], quantity: 1, unit: 'L', expiration: '2026-12-01', zone: 'despensa' },
    { name: 'Cúrcuma', nutritionCategory: 'funcional', nutritionTags: [], quantity: 50, unit: 'g', expiration: '2026-06-01', zone: 'despensa' },
    { name: 'Chocolate negro 85%', nutritionCategory: 'capricho', nutritionTags: ['grasa'], quantity: 100, unit: 'g', expiration: '2026-05-01', zone: 'despensa' },
    { name: 'Espinacas', nutritionCategory: 'micronutriente', nutritionTags: [], quantity: 200, unit: 'g', expiration: '2026-03-17', zone: 'nevera' },
    { name: 'Avena', nutritionCategory: 'energia', nutritionTags: [], quantity: 300, unit: 'g', expiration: '2026-08-01', zone: 'despensa' },
    { name: 'Lentejas', nutritionCategory: 'proteina', nutritionTags: ['energia'], quantity: 400, unit: 'g', expiration: '2027-01-01', zone: 'despensa' },
    { name: 'Almendras', nutritionCategory: 'grasa', nutritionTags: ['proteina'], quantity: 150, unit: 'g', expiration: '2026-07-01', zone: 'despensa' },
];
