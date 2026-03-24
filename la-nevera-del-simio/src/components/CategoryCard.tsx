import { CATEGORY_ICON_MAP } from '~/lib/icons';
import type { NutritionalCategory } from '~/lib/types';

interface Props {
    category: NutritionalCategory;
    primaryCount: number;
    secondaryCount: number;
    onClick: () => void;
}

export default function CategoryCard({ category, primaryCount, secondaryCount, onClick }: Props) {
    const IconComponent = CATEGORY_ICON_MAP[category.id];

    return (
        <button
            className="category-card"
            onClick={onClick}
            aria-label={`Ver ${category.label}`}
            style={{
                borderColor: primaryCount > 0 ? `${category.color}40` : 'transparent',
            }}
        >
            {/* Decorative corner */}
            <span
                style={{
                    position: 'absolute',
                    top: 0, right: 0,
                    width: 60, height: 60,
                    borderRadius: '0 24px 0 50%',
                    background: category.color,
                    opacity: 0.12,
                    pointerEvents: 'none',
                }}
            />

            {/* Lucide icon */}
            <span className="category-card-icon">
                {IconComponent && (
                    <IconComponent
                        size={32}
                        strokeWidth={1.6}
                        color={category.color}
                    />
                )}
            </span>

            <p className="category-card-label">{category.label}</p>
            <div className="category-card-counts">
                {primaryCount > 0 ? (
                    <span
                        className="count-badge primary"
                        style={{ background: category.color }}
                    >
                        {primaryCount} principal{primaryCount !== 1 ? 'es' : ''}
                    </span>
                ) : (
                    <span className="count-badge secondary">Vacía</span>
                )}
                {secondaryCount > 0 && (
                    <span className="count-badge secondary">+{secondaryCount} extra</span>
                )}
            </div>
        </button>
    );
}

