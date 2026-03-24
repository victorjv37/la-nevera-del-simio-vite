import { useState, useMemo } from 'react';
import { ShoppingCart, Check, Share2, UtensilsCrossed } from 'lucide-react';
import { usePlan } from '~/context/PlanContext';
import { useFood } from '~/context/FoodContext';
import { buildShoppingListFromPlan, groupByCategory, getCategoryColor } from '~/lib/helpers';
import { NUTRITIONAL_CATEGORIES } from '~/lib/constants';
import { CATEGORY_ICON_MAP } from '~/lib/icons';
import { useNavigate } from 'react-router';

export function meta() {
    return [
        { title: 'Lista de la Compra — La Nevera del Simio' },
        { name: 'description', content: 'Lo que te falta para completar tu plan nutricional' },
    ];
}

export default function ShoppingScreen() {
    const { currentPlan } = usePlan();
    const { foods } = useFood();
    const navigate = useNavigate();

    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const shoppingList = useMemo(() => {
        if (!currentPlan) return [];
        return buildShoppingListFromPlan(currentPlan, foods);
    }, [currentPlan, foods]);

    const grouped = useMemo(() => groupByCategory(shoppingList), [shoppingList]);

    const toggleCheck = (nombre: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            if (next.has(nombre)) next.delete(nombre);
            else next.add(nombre);
            return next;
        });
    };

    const checkedCount = checkedItems.size;
    const totalCount = shoppingList.length;

    const handleShare = () => {
        const text = Object.entries(grouped)
            .map(([cat, items]) => {
                const catLabel = NUTRITIONAL_CATEGORIES.find(c => c.id === cat)?.label ?? cat;
                const lines = items.map(i => `• ${i.nombre} (${i.cantidad} ${i.unidad})`).join('\n');
                return `${catLabel}:\n${lines}`;
            })
            .join('\n\n');

        const full = `🛒 Lista de la compra — La Nevera del Simio\n\n${text}`;

        if (navigator.share) {
            navigator.share({ title: 'Lista de la compra', text: full });
        } else {
            navigator.clipboard
                .writeText(full)
                .then(() => alert('Lista copiada al portapapeles ✓'));
        }
    };

    if (!currentPlan) {
        return (
            <main className="screen" id="shopping-screen">
                <div className="screen-header">
                    <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShoppingCart size={28} strokeWidth={1.6} color="var(--color-accent)" />
                        Lista de la Compra
                    </h1>
                </div>
                <div className="empty-state">
                    <UtensilsCrossed size={52} strokeWidth={1.2} color="var(--color-accent)" style={{ opacity: 0.5 }} />
                    <p className="empty-title">Sin plan todavía</p>
                    <p className="empty-desc">
                        Genera un plan nutricional en la pestaña Plan y la lista de la compra aparecerá
                        automáticamente.
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: 8, maxWidth: 260 }}
                        onClick={() => navigate('/plan')}
                    >
                        Ir al Generador de Plan
                    </button>
                </div>
            </main>
        );
    }

    if (shoppingList.length === 0) {
        return (
            <main className="screen" id="shopping-screen">
                <div className="screen-header">
                    <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShoppingCart size={28} strokeWidth={1.6} color="var(--color-accent)" />
                        Lista de la Compra
                    </h1>
                </div>
                <div className="empty-state">
                    <Check size={52} strokeWidth={1.5} color="var(--fresco-color)" />
                    <p className="empty-title">¡Todo listo!</p>
                    <p className="empty-desc">
                        Tu nevera ya tiene todo lo necesario para ejecutar el plan. No falta nada.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="screen" id="shopping-screen">
            <div className="screen-header">
                <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShoppingCart size={28} strokeWidth={1.6} color="var(--color-accent)" />
                    Lista de la Compra
                </h1>
                <p className="screen-subtitle">
                    {checkedCount}/{totalCount} productos comprados
                </p>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 16px 12px' }}>
                <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                        style={{
                            height: '100%',
                            background: 'var(--fresco-color)',
                            borderRadius: 3,
                            width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
                            transition: 'width 0.4s ease',
                        }}
                    />
                </div>
            </div>

            {/* Share button */}
            <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleShare}
                    id="share-shopping-list"
                >
                    <Share2 size={14} strokeWidth={2} />
                    Compartir lista
                </button>
            </div>

            {/* Grouped items */}
            <div style={{ padding: '0 16px' }}>
                {Object.entries(grouped).map(([cat, items]) => {
                    const category = NUTRITIONAL_CATEGORIES.find(c => c.id === cat);
                    const color = getCategoryColor(cat);
                    const CatIcon = CATEGORY_ICON_MAP[cat];
                    return (
                        <div key={cat} className="shopping-section">
                            <p
                                className="shopping-section-title"
                                style={{
                                    color,
                                    borderBottomColor: `${color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {CatIcon
                                    ? <CatIcon size={13} strokeWidth={2} />
                                    : null}
                                {category ? category.label : cat}
                            </p>
                            {items.map(item => {
                                const isChecked = checkedItems.has(item.nombre);
                                return (
                                    <div
                                        key={item.nombre}
                                        className={`shopping-item${isChecked ? ' checked' : ''}`}
                                        onClick={() => toggleCheck(item.nombre)}
                                        role="checkbox"
                                        aria-checked={isChecked}
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') toggleCheck(item.nombre); }}
                                    >
                                        <div className="shopping-item-check">
                                            {isChecked && <Check size={12} strokeWidth={3} color="white" />}
                                        </div>
                                        <span className="shopping-item-name">{item.nombre}</span>
                                        <span className="shopping-item-qty">
                                            {item.cantidad} {item.unidad}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
