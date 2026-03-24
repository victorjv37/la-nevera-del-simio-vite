import { Trash2 } from 'lucide-react';
import { getExpirationBadge } from '~/lib/helpers';
import { NUTRITIONAL_CATEGORIES } from '~/lib/constants';
import { CATEGORY_ICON_MAP } from '~/lib/icons';
import type { FoodItem } from '~/lib/types';

interface Props {
    food: FoodItem;
    onDelete: (id: string) => void;
}

const ZONE_LABELS: Record<string, string> = {
    nevera: 'Nevera',
    congelador: 'Congelador',
    despensa: 'Despensa',
};

export default function FoodCard({ food, onDelete }: Props) {
    const badge = getExpirationBadge(food.expiration);
    const secondaryCategories = NUTRITIONAL_CATEGORIES.filter(c =>
        food.nutritionTags.includes(c.id)
    );

    const daysLeft = Math.ceil(
        (new Date(food.expiration).getTime() - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

    return (
        <article className="food-card">
            <div className="food-card-info">
                <p className="food-card-name">{food.name}</p>
                <div className="food-card-meta">
                    {/* Expiry badge */}
                    <span
                        className="badge"
                        style={{ background: badge.bg, color: badge.color }}
                        title={`Caduca: ${food.expiration}`}
                    >
                        {badge.label}
                        {daysLeft > 0 && daysLeft < 14 && ` · ${daysLeft}d`}
                    </span>

                    {/* Zone */}
                    <span className="badge zone-badge">
                        {ZONE_LABELS[food.zone] ?? food.zone}
                    </span>

                    {/* Quantity */}
                    <span className="badge zone-badge">
                        {food.quantity} {food.unit}
                    </span>

                    {/* Secondary category icons */}
                    {secondaryCategories.map(cat => {
                        const Icon = CATEGORY_ICON_MAP[cat.id];
                        return (
                            <span
                                key={cat.id}
                                className="badge tag-badge"
                                style={{ color: cat.color, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                title={cat.label}
                            >
                                {Icon && <Icon size={11} strokeWidth={2} />}
                                {cat.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            <button
                className="food-card-delete"
                onClick={() => onDelete(food.id)}
                aria-label={`Eliminar ${food.name}`}
                title="Eliminar"
            >
                <Trash2 size={16} strokeWidth={1.75} />
            </button>
        </article>
    );
}

