import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check,
  Ruler, Weight, Activity, Target, Flame, Scale,
} from 'lucide-react';
import { useUserProfile } from '~/context/UserProfileContext';
import type { UserProfile, ActivityLevel, PlanGoal } from '~/lib/types';
import { calculateTDEE, getTargetCalories } from '~/lib/gemini';

export function meta() {
  return [{ title: 'Configurar perfil — La Nevera del Simio' }];
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentario', label: 'Sedentario', desc: 'Sin ejercicio o muy poco' },
  { value: 'ligero', label: 'Ligeramente activo', desc: '1-3 días de ejercicio/semana' },
  { value: 'moderado', label: 'Moderadamente activo', desc: '3-5 días de ejercicio/semana' },
  { value: 'activo', label: 'Muy activo', desc: '6-7 días de ejercicio/semana' },
  { value: 'extra', label: 'Extra activo', desc: 'Atleta o trabajo físico intenso' },
];

const GOAL_OPTIONS: { value: PlanGoal; label: string; desc: string; Icon: typeof Flame }[] = [
  { value: 'perder_grasa', label: 'Perder grasa', desc: 'Déficit calórico · –20% TDEE', Icon: Flame },
  { value: 'mantener', label: 'Mantener peso', desc: 'Equilibrio calórico · TDEE exacto', Icon: Scale },
  { value: 'ganar_masa', label: 'Ganar masa', desc: 'Superávit calórico · +15% TDEE', Icon: Target },
];

type Step = 0 | 1 | 2 | 3 | 4;
const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { saveProfile } = useUserProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Profile fields
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderado');
  const [goal, setGoal] = useState<PlanGoal>('mantener');

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1) as Step);
  const prev = () => setStep(s => Math.max(s - 1, 0) as Step);

  const partialProfile: UserProfile = {
    name, sex,
    age: parseInt(age) || 25,
    height: parseInt(height) || 170,
    weight: parseInt(weight) || 70,
    activityLevel, goal,
  };
  const tdee = calculateTDEE(partialProfile);
  const targetKcal = getTargetCalories(tdee, goal);

  const handleFinish = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await saveProfile(partialProfile);
      navigate('/fridge');
    } catch (err: unknown) {
      console.error('Error guardando perfil:', err);
      const code = (err as { code?: string })?.code ?? '';
      const message = (err as Error)?.message ?? '';
      if (code.includes('permission-denied') || message.includes('permission-denied')) {
        setSaveError('⚠️ Permisos de Firestore denegados. Ve a Firebase Console → Firestore → Reglas y activa el acceso para usuarios autenticados.');
      } else if (code.includes('unauthenticated') || message.includes('unauthenticated')) {
        setSaveError('⚠️ Sesión caducada. Vuelve al inicio de sesión.');
      } else {
        setSaveError(`Error: ${code || message || 'No se pudo guardar el perfil. Revisa la consola del navegador (F12).'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / (TOTAL_STEPS - 1)) * 100;

  const stepValid = [
    name.trim().length > 0,
    !!(sex && age && parseInt(age) > 0 && parseInt(age) < 120),
    !!(height && weight && parseInt(height) > 0 && parseInt(weight) > 0),
    !!activityLevel,
    true,
  ][step];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 10, padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Paso {step + 1} de {TOTAL_STEPS}
          </span>
          {step > 0 && (
            <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600 }}>
              <ChevronLeft size={16} /> Atrás
            </button>
          )}
        </div>
        <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-2))', borderRadius: 2, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 20px 24px', display: 'flex', flexDirection: 'column' }}>

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>¡Hola! ¿Cómo te llamas?</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 32, lineHeight: 1.5 }}>
              Vamos a configurar tu perfil nutricional para personalizar tu plan de alimentación.
            </p>
            <div className="field-group">
              <label className="field-label" htmlFor="name">Tu nombre</label>
              <input id="name" className="field-input" type="text" placeholder="ej: Carlos"
                value={name} onChange={e => setName(e.target.value)} autoFocus style={{ fontSize: 18 }} />
            </div>
          </>
        )}

        {/* ── Step 1: Sex + Age ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Datos básicos</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 32 }}>Los necesitamos para calcular tu metabolismo basal.</p>
            <div className="field-group">
              <label className="field-label">Sexo biológico</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['male', 'female'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSex(s)} style={{
                    flex: 1, padding: '16px', borderRadius: 14,
                    border: `2px solid ${sex === s ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: sex === s ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
                    color: sex === s ? 'var(--color-accent)' : 'var(--color-text-2)', transition: 'all 0.15s',
                  }}>
                    {s === 'male' ? '♂ Hombre' : '♀ Mujer'}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="age">Edad (años)</label>
              <input id="age" className="field-input" type="number" min="10" max="120" placeholder="ej: 30"
                value={age} onChange={e => setAge(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Step 2: Height + Weight ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Altura y peso</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 32 }}>Usamos esto para calcular tu consumo energético diario.</p>
            <div className="field-group">
              <label className="field-label" htmlFor="height" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Ruler size={13} strokeWidth={2} /> Altura (cm)
              </label>
              <input id="height" className="field-input" type="number" min="100" max="250" placeholder="ej: 175"
                value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="weight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Weight size={13} strokeWidth={2} /> Peso (kg)
              </label>
              <input id="weight" className="field-input" type="number" min="30" max="300" step="0.1" placeholder="ej: 72"
                value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Step 3: Activity + Goal ── */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Nivel de actividad</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 24 }}>Sé honesto/a, esto afecta directamente a las calorías que necesitas.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ACTIVITY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setActivityLevel(opt.value)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 14, border: `2px solid ${activityLevel === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: activityLevel === opt.value ? 'var(--color-surface-2)' : 'var(--color-surface)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'all 0.15s',
                }}>
                  <Activity size={20} strokeWidth={1.75} color={activityLevel === opt.value ? 'var(--color-accent)' : 'var(--color-text-3)'} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>{opt.desc}</p>
                  </div>
                  {activityLevel === opt.value && <Check size={18} strokeWidth={2.5} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            <div className="field-group" style={{ marginTop: 24 }}>
              <label className="field-label">Objetivo principal</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GOAL_OPTIONS.map(({ value, label, desc, Icon }) => (
                  <button key={value} type="button" onClick={() => setGoal(value)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 14, border: `2px solid ${goal === value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: goal === value ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'all 0.15s',
                  }}>
                    <Icon size={20} strokeWidth={1.75} color={goal === value ? 'var(--color-accent)' : 'var(--color-text-3)'} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>{desc}</p>
                    </div>
                    {goal === value && <Check size={18} strokeWidth={2.5} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Summary ── */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>¡Todo listo, {name}!</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 28 }}>Este es tu perfil nutricional calculado. Podrás editarlo más adelante.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { value: `${tdee} kcal`, sub: 'TDEE calculado' },
                { value: `${targetKcal} kcal`, sub: { perder_grasa: '–20% TDEE', mantener: 'Equilibrio', ganar_masa: '+15% TDEE' }[goal] },
                { value: `${weight} kg · ${height} cm`, sub: `IMC ≈ ${(parseInt(weight) / ((parseInt(height) / 100) ** 2)).toFixed(1)}` },
                { value: ACTIVITY_OPTIONS.find(a => a.value === activityLevel)?.label ?? '', sub: 'Nivel de actividad' },
              ].map((card, i) => (
                <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 16, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-accent)', margin: '0 0 4px', lineHeight: 1.2 }}>{card.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.5 }}>
              La IA usará estos datos junto con lo que tengas en la nevera para generar tu dieta personalizada.
            </p>
          </>
        )}

        {/* ── Navigation ── */}
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          {saveError && (
            <div style={{
              background: 'var(--urgente-bg)', border: '1px solid var(--urgente-color)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 12,
              fontSize: 13, color: 'var(--urgente-color)', lineHeight: 1.4,
            }}>
              {saveError}
            </div>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button className="btn btn-primary" onClick={next} disabled={!stepValid}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Continuar <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <span className="spinner" /> : <><Check size={18} /> Empezar a usar la app</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

