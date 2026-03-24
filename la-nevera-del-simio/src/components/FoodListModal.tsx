import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useFood } from '~/context/FoodContext';
import { NUTRITIONAL_CATEGORIES } from '~/lib/constants';
import { CATEGORY_ICON_MAP } from '~/lib/icons';
import type { NutritionCategoryId } from '~/lib/types';
import FoodCard from './FoodCard';
import AddFoodModal from './AddFoodModal';

interface Props {
    categoryId: NutritionCategoryId;
    onClose: () => void;
}

export default function FoodListModal({ categoryId, onClose }: Props) {
    const { foods, removeFood } = useFood();
    const [showAdd, setShowAdd] = useState(false);

    const category = NUTRITIONAL_CATEGORIES.find(c => c.id === categoryId)!;
    const CategoryIcon = CATEGORY_ICON_MAP[categoryId];

    const primaryFoods = foods.filter(f => f.nutritionCategory === categoryId);
    const secondaryFoods = foods.filter(
        f => f.nutritionCategory !== categoryId && f.nutritionTags.includes(categoryId)
    );

    const allFoods = [...primaryFoods, ...secondaryFoods];

    return (
        <>
            <div
                className="modal-overlay"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="food-list-title"
            >
                <div className="modal-sheet">
                    <div className="modal-handle" />
                    <div className="modal-header" style={{ background: category.bgColor }}>
                        <h2
                            className="modal-title"
                            id="food-list-title"
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                            {CategoryIcon && (
                                <CategoryIcon size={20} strokeWidth={1.75} color={category.color} />
                            )}
                            {category.label}
                        </h2>
                        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {allFoods.length === 0 ? (
                            <div className="empty-state" style={{ padding: '32px 0' }}>
                                {CategoryIcon && (
                                    <CategoryIcon
                                        size={48}
                                        strokeWidth={1.2}
                                        color={category.color}
                                        style={{ opacity: 0.6 }}
                                    />
                                )}
                                <p className="empty-title">Sin alimentos aquí</p>
                                <p className="empty-desc">{category.description}</p>
                            </div>
                        ) : (
                            <>
                                {primaryFoods.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <p className="text-sm text-muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                                            Categoría principal ({primaryFoods.length})
                                        </p>
                                        {primaryFoods.map(food => (
                                            <FoodCard key={food.id} food={food} onDelete={removeFood} />
                                        ))}
                                    </div>
                                )}
                                {secondaryFoods.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                                            También tiene este rol ({secondaryFoods.length})
                                        </p>
                                        {secondaryFoods.map(food => (
                                            <FoodCard key={food.id} food={food} onDelete={removeFood} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ height: 12 }} />
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAdd(true)}
                            style={{
                                background: category.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Añadir a {category.label}
                        </button>
                        <div style={{ height: 8 }} />
                    </div>
                </div>
            </div>

            {showAdd && (
                <AddFoodModal
                    preselectedCategory={categoryId}
                    onClose={() => setShowAdd(false)}
                />
            )}
        </>
    );
}
