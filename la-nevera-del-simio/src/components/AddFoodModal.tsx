import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { NUTRITIONAL_CATEGORIES, ZONES, UNITS } from '~/lib/constants';
import { CATEGORY_ICON_MAP } from '~/lib/icons';
import { useFood } from '~/context/FoodContext';
import type { NutritionCategoryId, ZoneId, UnitId } from '~/lib/types';

interface Props {
    onClose: () => void;
    preselectedCategory?: NutritionCategoryId | null;
}

export default function AddFoodModal({ onClose, preselectedCategory }: Props) {
    const { addFood } = useFood();

    const [name, setName] = useState('');
    const [nutritionCategory, setNutritionCategory] = useState<NutritionCategoryId | ''>(
        preselectedCategory ?? ''
    );
    const [nutritionTags, setNutritionTags] = useState<NutritionCategoryId[]>([]);
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState<UnitId>('unidades');
    const [expiration, setExpiration] = useState('');
    const [zone, setZone] = useState<ZoneId>('nevera');
    const [error, setError] = useState('');

    const toggleTag = (id: NutritionCategoryId) => {
        if (id === nutritionCategory) return;
        setNutritionTags(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
        if (!nutritionCategory) { setError('Elige una categoría principal.'); return; }
        if (!expiration) { setError('Introduce la fecha de caducidad.'); return; }
        setError('');
        addFood({
            name: name.trim(),
            nutritionCategory,
            nutritionTags,
            quantity: parseFloat(quantity) || 1,
            unit,
            expiration,
            zone,
        });
        onClose();
    };

    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    const defaultExpiryStr = defaultExpiry.toISOString().split('T')[0];

    const ZONE_OPTIONS = [
        { id: 'nevera' as ZoneId, label: 'Nevera' },
        { id: 'congelador' as ZoneId, label: 'Congelador' },
        { id: 'despensa' as ZoneId, label: 'Despensa' },
    ];

    return (
        <div
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-food-title"
        >
            <div className="modal-sheet">
                <div className="modal-handle" />
                <div className="modal-header">
                    <h2 className="modal-title" id="add-food-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={20} strokeWidth={2.5} color="var(--color-accent)" />
                        Añadir alimento
                    </h2>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit} noValidate>
                    {/* Name */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="food-name">Nombre *</label>
                        <input
                            id="food-name"
                            className="field-input"
                            type="text"
                            placeholder="ej: Pechuga de pollo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Primary category */}
                    <div className="field-group">
                        <label className="field-label">Categoría principal *</label>
                        <div className="chips-row">
                            {NUTRITIONAL_CATEGORIES.map(cat => {
                                const Icon = CATEGORY_ICON_MAP[cat.id];
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`chip category-chip${nutritionCategory === cat.id ? ' active' : ''}`}
                                        style={{ '--chip-color': cat.color, display: 'inline-flex', alignItems: 'center', gap: 5 } as React.CSSProperties}
                                        onClick={() => {
                                            setNutritionCategory(cat.id);
                                            setNutritionTags(prev => prev.filter(t => t !== cat.id));
                                        }}
                                    >
                                        {Icon && <Icon size={13} strokeWidth={2} />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Secondary tags */}
                    <div className="field-group">
                        <label className="field-label">Etiquetas secundarias</label>
                        <div className="chips-row">
                            {NUTRITIONAL_CATEGORIES.filter(c => c.id !== nutritionCategory).map(cat => {
                                const Icon = CATEGORY_ICON_MAP[cat.id];
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`chip category-chip${nutritionTags.includes(cat.id) ? ' active' : ''}`}
                                        style={{ '--chip-color': cat.color, display: 'inline-flex', alignItems: 'center', gap: 5 } as React.CSSProperties}
                                        onClick={() => toggleTag(cat.id)}
                                    >
                                        {Icon && <Icon size={13} strokeWidth={2} />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quantity + Unit */}
                    <div className="field-group">
                        <label className="field-label">Cantidad</label>
                        <div className="field-row">
                            <input
                                id="food-quantity"
                                className="field-input"
                                type="number"
                                min="0"
                                step="0.1"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                            <select
                                className="field-input"
                                value={unit}
                                onChange={e => setUnit(e.target.value as UnitId)}
                                aria-label="Unidad"
                            >
                                {UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Expiration */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="food-expiry">Caducidad *</label>
                        <input
                            id="food-expiry"
                            className="field-input"
                            type="date"
                            value={expiration || defaultExpiryStr}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setExpiration(e.target.value)}
                        />
                    </div>

                    {/* Zone */}
                    <div className="field-group">
                        <label className="field-label">Zona de almacenamiento</label>
                        <div className="chips-row">
                            {ZONE_OPTIONS.map(z => (
                                <button
                                    key={z.id}
                                    type="button"
                                    className={`chip${zone === z.id ? ' active' : ''}`}
                                    onClick={() => setZone(z.id)}
                                >
                                    {z.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: 'var(--urgente-color)', fontSize: 13, marginBottom: 12 }}>
                            ⚠️ {error}
                        </p>
                    )}

                    <button type="submit" className="btn btn-primary">
                        Guardar alimento
                    </button>
                    <div style={{ height: 8 }} />
                </form>
            </div>
        </div>
    );
}

