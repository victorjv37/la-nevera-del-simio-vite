import { useState } from 'react';
import { Sun, Utensils, Apple, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import type { MealPlan } from '~/lib/types';

const MEAL_ICONS: Record<string, React.ReactNode> = {
    desayuno: <Sun size={13} strokeWidth={2} />,
    comida: <Utensils size={13} strokeWidth={2} />,
    merienda: <Apple size={13} strokeWidth={2} />,
    cena: <Moon size={13} strokeWidth={2} />,
};

const MEAL_ICON_LG: Record<string, React.ReactNode> = {
    desayuno: <Sun size={15} strokeWidth={2} />,
    comida: <Utensils size={15} strokeWidth={2} />,
    merienda: <Apple size={15} strokeWidth={2} />,
    cena: <Moon size={15} strokeWidth={2} />,
};

interface Props {
    plan: MealPlan;
}

export default function PlanView({ plan }: Props) {
    const [openDays, setOpenDays] = useState<number[]>([1]);
    const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

    const toggleDay = (dia: number) => {
        setOpenDays(prev =>
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
        );
    };

    const toggleRecipe = (key: string) => {
        setExpandedRecipes(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div>
            {/* Summary strip */}
            <div className="plan-summary-strip">
                <div className="plan-summary-chip">
                    <strong>{plan.dias.length}</strong>
                    días
                </div>
                <div className="plan-summary-chip">
                    <strong>{plan.dias.reduce((a, d) => a + d.comidas.length, 0)}</strong>
                    comidas
                </div>
                <div className="plan-summary-chip">
                    <strong>
                        {plan.dias.reduce(
                            (a, d) => a + d.comidas.reduce((b, c) => b + c.recetas.length, 0),
                            0
                        )}
                    </strong>
                    recetas
                </div>
                {plan.faltantes.length > 0 && (
                    <div className="plan-summary-chip">
                        <strong style={{ color: 'var(--urgente-color)' }}>{plan.faltantes.length}</strong>
                        faltan
                    </div>
                )}
            </div>

            {/* Days */}
            {plan.dias.map(dia => {
                const isOpen = openDays.includes(dia.dia);
                return (
                    <div key={dia.dia} className="plan-day">
                        <button
                            className="plan-day-header"
                            onClick={() => toggleDay(dia.dia)}
                            aria-expanded={isOpen}
                        >
                            <span className="plan-day-number">Día {dia.dia}</span>
                            <span className="plan-day-title" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {dia.comidas.map(c => (
                                    <span key={c.tipo} style={{ color: 'var(--color-accent)' }}>
                                        {MEAL_ICONS[c.tipo]}
                                    </span>
                                ))}
                            </span>
                            <span className="plan-day-chevron">
                                {isOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                            </span>
                        </button>

                        {isOpen && (
                            <div>
                                {dia.comidas.map(comida => (
                                    <div key={comida.tipo} className="plan-meal">
                                        <p
                                            className="plan-meal-type"
                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <span style={{ color: 'var(--color-accent)' }}>{MEAL_ICON_LG[comida.tipo]}</span>
                                            {comida.tipo.charAt(0).toUpperCase() + comida.tipo.slice(1)}
                                        </p>

                                        {comida.recetas.map((receta, ri) => {
                                            const key = `${dia.dia}-${comida.tipo}-${ri}`;
                                            const isExpanded = expandedRecipes.has(key);
                                            return (
                                                <div key={ri} className="plan-recipe">
                                                    <button
                                                        className="plan-recipe-name"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            font: 'inherit',
                                                            padding: 0,
                                                            width: '100%',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                        }}
                                                        onClick={() => toggleRecipe(key)}
                                                    >
                                                        <span>{receta.nombre}</span>
                                                        {isExpanded
                                                            ? <ChevronUp size={14} strokeWidth={2} color="var(--color-text-3)" />
                                                            : <ChevronDown size={14} strokeWidth={2} color="var(--color-text-3)" />
                                                        }
                                                    </button>

                                                    {isExpanded && (
                                                        <div style={{ marginTop: 12 }}>
                                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', marginBottom: 6 }}>
                                                                INGREDIENTES
                                                            </p>
                                                            <ul className="plan-ingredients">
                                                                {receta.ingredientes.map((ing, ii) => (
                                                                    <li key={ii}>
                                                                        {ing.nombre}: {ing.cantidad} {ing.unidad}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', marginBottom: 6, marginTop: 10 }}>
                                                                PREPARACIÓN
                                                            </p>
                                                            <ol className="plan-steps">
                                                                {receta.pasos.map((paso, pi) => (
                                                                    <li key={pi}>{paso}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
