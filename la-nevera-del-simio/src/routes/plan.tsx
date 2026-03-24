import { useState } from 'react';
import {
  UtensilsCrossed, Flame, Scale, Target,
  Sparkles, Loader2, RotateCcw, User, AlertCircle,
} from 'lucide-react';
import { usePlan } from '~/context/PlanContext';
import { useFood } from '~/context/FoodContext';
import { useUserProfile } from '~/context/UserProfileContext';
import PlanView from '~/components/PlanView';
import type { PlanGoal } from '~/lib/types';
import { useNavigate } from 'react-router';

export function meta() {
  return [
    { title: 'Generador de Plan — La Nevera del Simio' },
    { name: 'description', content: 'Genera tu plan nutricional semanal personalizado con IA real' },
  ];
}

const GOALS: { value: PlanGoal; label: string; Icon: typeof Target; desc: string }[] = [
  { value: 'mantener', label: 'Mantener peso', Icon: Scale, desc: 'Equilibrio calórico' },
  { value: 'ganar_masa', label: 'Ganar masa', Icon: Target, desc: 'Superávit calórico' },
  { value: 'perder_grasa', label: 'Perder grasa', Icon: Flame, desc: 'Déficit calórico' },
];

export default function PlanScreen() {
  const { generateNewPlan, currentPlan, isGenerating, clearPlan, error } = usePlan();
  const { foods } = useFood();
  const { profile, tdee, targetCalories } = useUserProfile();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<PlanGoal>(profile?.goal ?? 'mantener');
  const [restrictions, setRestrictions] = useState('');
  const [days, setDays] = useState(5);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateNewPlan({ goal, restrictions, days });
  };

  return (
    <main className="screen" id="plan-screen">
      <div className="screen-header">
        <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UtensilsCrossed size={28} strokeWidth={1.6} color="var(--color-accent)" />
          Generador de Plan
        </h1>
        <p className="screen-subtitle">
          {foods.length > 0 ? `Basado en tus ${foods.length} alimentos` : 'Añade alimentos a tu nevera primero'}
        </p>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {/* User stats strip */}
        {profile && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <User size={18} strokeWidth={1.75} color="var(--color-accent)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {profile.name} · {profile.weight} kg · {profile.height} cm
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>
                TDEE: <strong style={{ color: 'var(--color-accent)' }}>{tdee} kcal</strong>
                {' '}· Objetivo: <strong>{targetCalories} kcal/día</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', fontSize: 12 }}
            >
              Editar
            </button>
          </div>
        )}

        {!currentPlan && (
          <form onSubmit={handleGenerate}>
            {/* Goal */}
            <div className="form-card">
              <p className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} strokeWidth={2} /> Objetivo nutricional
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GOALS.map(({ value, label, Icon, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                      border: `1.5px solid ${goal === value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: goal === value ? 'var(--color-surface-2)' : 'var(--color-surface)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <input type="radio" name="goal" value={value} checked={goal === value}
                      onChange={() => setGoal(value)} style={{ display: 'none' }} />
                    <Icon size={22} strokeWidth={1.75} color={goal === value ? 'var(--color-accent)' : 'var(--color-text-3)'} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>{desc}</p>
                    </div>
                    {goal === value && <span style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontWeight: 800 }}>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="form-card">
              <p className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} strokeWidth={2} /> Número de días
              </p>
              <div className="chips-row">
                {[3, 5, 7].map(d => (
                  <button key={d} type="button" className={`chip${days === d ? ' active' : ''}`}
                    onClick={() => setDays(d)}>
                    {d} días
                  </button>
                ))}
              </div>
            </div>

            {/* Restrictions */}
            <div className="form-card">
              <p className="form-card-title">Restricciones alimentarias</p>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor="restrictions">Separadas por coma (opcional)</label>
                <input id="restrictions" className="field-input" type="text"
                  placeholder="ej: gluten, lactosa, frutos secos"
                  value={restrictions} onChange={e => setRestrictions(e.target.value)} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--urgente-bg)', border: '1px solid var(--urgente-color)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <AlertCircle size={18} strokeWidth={2} color="var(--urgente-color)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: 'var(--urgente-color)', margin: 0, lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isGenerating} id="generate-plan-btn">
              {isGenerating ? (
                <><Loader2 size={18} strokeWidth={2} style={{ animation: 'spin 0.7s linear infinite' }} /> Gemini está generando tu dieta…</>
              ) : (
                <><Sparkles size={18} strokeWidth={2} /> Generar Plan con IA</>
              )}
            </button>
          </form>
        )}

        {currentPlan && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="section-title">Plan generado 🎉</p>
              <button className="btn btn-ghost" onClick={clearPlan}
                style={{ width: 'auto', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={14} strokeWidth={2} /> Nuevo plan
              </button>
            </div>
            <PlanView plan={currentPlan} />
          </div>
        )}
      </div>
    </main>
  );
}
