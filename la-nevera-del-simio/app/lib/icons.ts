// Central icon export — using Lucide React
// Import this anywhere to get consistent icons across the app

export {
    // Navigation
    Refrigerator,
    UtensilsCrossed,
    ShoppingCart,

    // Actions
    Plus,
    Trash2,
    X,
    Share2,
    ChevronDown,
    ChevronUp,
    Check,
    Copy,
    ArrowRight,

    // Meal types
    Sun,        // desayuno
    Utensils,   // comida
    Apple,      // merienda
    Moon,       // cena

    // Nutritional categories
    Dumbbell,       // proteína
    Zap,            // energía
    Leaf,           // micronutriente
    Droplets,       // grasa
    FlaskConical,   // funcional
    Cookie,         // capricho

    // Plan / Form
    Target,
    Flame,
    Scale,
    CalendarDays,
    AlertCircle,
    Sparkles,
    ClipboardList,

    // Zones
    ThermometerSnowflake,  // congelador
    Archive,               // despensa
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import {
    Dumbbell,
    Zap,
    Leaf,
    Droplets,
    FlaskConical,
    Cookie,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    proteina: Dumbbell,
    energia: Zap,
    micronutriente: Leaf,
    grasa: Droplets,
    funcional: FlaskConical,
    capricho: Cookie,
};
