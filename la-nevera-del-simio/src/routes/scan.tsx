import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Trash2, Plus, Check, ChevronLeft,
  AlertCircle, Loader2, ScanLine, CalendarDays,
} from 'lucide-react';
import { scanFoodsFromImage } from '~/lib/gemini';
import { addUserFood } from '~/lib/db';
import { useAuth } from '~/context/AuthContext';
import type { EditableScannedFood } from '~/lib/types';

export function meta() {
  return [{ title: 'Escanear alimentos — La Nevera del Simio' }];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:image/jpeg;base64,XXXX"
      const [header, base64] = result.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Quick date helpers ───────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const QUICK_DATES = [
  { label: '2 días', days: 2 },
  { label: '5 días', days: 5 },
  { label: '1 semana', days: 7 },
  { label: '2 semanas', days: 14 },
  { label: '1 mes', days: 30 },
];

const UNITS = ['g', 'kg', 'ml', 'l', 'unidad'] as const;
const VALID_CATS = ['proteina', 'energia', 'micronutriente', 'grasa', 'funcional', 'capricho'] as const;

// ─── Component ───────────────────────────────────────────────────────────────

type Phase = 'capture' | 'analyzing' | 'review';

export default function ScanScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [preview, setPreview] = useState<string | null>(null);
  const [foods, setFoods] = useState<EditableScannedFood[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePickerId, setDatePickerId] = useState<string | null>(null);

  // ─── Image capture ────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setPreview(URL.createObjectURL(file));
    setPhase('analyzing');

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await scanFoodsFromImage(base64, mimeType);

      if (result.length === 0) {
        setError('No se detectaron alimentos en la imagen. Inténtalo con otra foto.');
        setPhase('capture');
        return;
      }

      setFoods(result.map(f => ({
        ...f,
        _id: normalizeId(),
        // Normalize — Gemini may return null for nested objects
        nombre: f.nombre ?? '',
        categoria: f.categoria ?? 'energia',
        cantidad: f.cantidad
          ? { valor: f.cantidad.valor ?? null, unidad: f.cantidad.unidad ?? 'unidad' }
          : { valor: null, unidad: 'unidad' as const },
        formato: f.formato
          ? { tipo: f.formato.tipo ?? 'otro', unidades: f.formato.unidades ?? 1 }
          : { tipo: 'otro' as const, unidades: 1 },
        fecha: f.fecha
          ? { fecha_detectada_texto: f.fecha.fecha_detectada_texto ?? null, fecha_caducidad_estimada: f.fecha.fecha_caducidad_estimada ?? null }
          : { fecha_detectada_texto: null, fecha_caducidad_estimada: null },
      })));

      setPhase('review');
    } catch (err: unknown) {
      const raw = String(err);
      if (raw.includes('429')) {
        setError('⏳ Límite de peticiones alcanzado. Espera 30 segundos e inténtalo de nuevo.');
      } else if (raw.includes('GEMINI_KEY_MISSING')) {
        setError('⚠️ Configura VITE_GEMINI_API_KEY en tu .env');
      } else if (raw.includes('PARSE_ERROR')) {
        setError('La IA devolvió un formato inesperado. Prueba con otra foto.');
      } else {
        setError('Error al analizar la imagen. Comprueba tu conexión.');
      }
      setPhase('capture');
    }
  };

  // ─── Food list editing ────────────────────────────────────────────────────

  const updateFood = (id: string, patch: Partial<EditableScannedFood>) => {
    setFoods(prev => prev.map(f => f._id === id ? { ...f, ...patch } : f));
  };

  const removeFood = (id: string) => {
    setFoods(prev => prev.filter(f => f._id !== id));
  };

  const addBlankFood = () => {
    setFoods(prev => [...prev, {
      _id: normalizeId(),
      nombre: '',
      categoria: 'energia',
      cantidad: { valor: null, unidad: 'unidad' },
      formato: { tipo: 'otro', unidades: 1 },
      fecha: { fecha_detectada_texto: null, fecha_caducidad_estimada: null },
    }]);
  };

  // ─── Save to Firestore ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    // Map ScannedFood unit → FoodItem UnitId
    const mapUnit = (u: string): 'g' | 'ml' | 'kg' | 'L' | 'unidades' => {
      if (u === 'l') return 'L';
      if (u === 'unidad') return 'unidades';
      if (u === 'g' || u === 'ml' || u === 'kg') return u;
      return 'unidades';
    };

    // Map ScannedFood category → valid NutritionCategoryId
    const mapCategory = (cat: any): typeof VALID_CATS[number] => {
      if (VALID_CATS.includes(cat)) return cat;
      return 'energia'; // fallback
    };

    try {
      const validFoods = foods.filter(f => f.nombre.trim());
      await Promise.all(validFoods.map(f =>
        addUserFood(user.uid, {
          name: f.nombre.trim(),
          nutritionCategory: mapCategory(f.categoria),
          nutritionTags: [],
          quantity: f.cantidad.valor ?? 1,
          unit: mapUnit(f.cantidad.unidad),
          expiration: f.fecha.fecha_caducidad_estimada ?? '',
          zone: 'nevera',
        })
      ));
      navigate('/fridge');
    } catch {
      setError('Error guardando los alimentos. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };


  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="screen" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div className="screen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)', display: 'flex' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22 }}>
              <ScanLine size={24} strokeWidth={1.75} color="var(--color-accent)" />
              {phase === 'capture' ? 'Escanear alimentos' : phase === 'analyzing' ? 'Analizando…' : 'Revisar lista'}
            </h1>
            <p className="screen-subtitle">
              {phase === 'capture' && 'Haz una foto a varios alimentos a la vez'}
              {phase === 'analyzing' && 'Gemini Vision está detectando los alimentos…'}
              {phase === 'review' && `${foods.length} alimentos detectados · Revisa antes de guardar`}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px' }}>

        {/* ─── CAPTURE PHASE ─── */}
        {phase === 'capture' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 24 }}>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 20, border: '2px solid var(--color-border)' }}
              />
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
                border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(212,147,107,0.5)',
                transition: 'transform 0.15s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Camera size={36} strokeWidth={1.5} color="white" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>
                {preview ? 'NUEVA FOTO' : 'ESCANEAR'}
              </span>
            </button>

            <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center', maxWidth: 260 }}>
              En móvil abre la cámara directamente. En escritorio puedes subir una foto.
            </p>

            {error && (
              <div style={{
                background: 'var(--urgente-bg)', border: '1px solid var(--urgente-color)',
                borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 8, width: '100%',
              }}>
                <AlertCircle size={18} color="var(--urgente-color)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: 'var(--urgente-color)', margin: 0 }}>{error}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* ─── ANALYZING PHASE ─── */}
        {phase === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 40 }}>
            {preview && (
              <div style={{ position: 'relative', width: '100%', maxHeight: 220, overflow: 'hidden', borderRadius: 20 }}>
                <img src={preview} alt="Preview" style={{ width: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <Loader2 size={40} strokeWidth={1.75} color="white" style={{ animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: '0.3px' }}>Analizando imagen…</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>2–4 segundos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── REVIEW PHASE ─── */}
        {phase === 'review' && (
          <>
            {/* Retake button */}
            <button
              onClick={() => { setPhase('capture'); setFoods([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--color-text-3)', fontSize: 13, marginBottom: 16,
              }}
            >
              <Camera size={14} /> Nueva foto
            </button>

            {/* Food cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {foods.map((food) => (
                <div
                  key={food._id}
                  style={{
                    background: 'var(--color-surface)', borderRadius: 16, padding: 16,
                    border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="Nombre del alimento"
                      value={food.nombre}
                      onChange={e => updateFood(food._id, { nombre: e.target.value })}
                      style={{ flex: 1, fontWeight: 700, fontSize: 15 }}
                    />
                    <button
                      onClick={() => removeFood(food._id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-3)', padding: 4, borderRadius: 8,
                        display: 'flex', flexShrink: 0,
                      }}
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  </div>

                  {/* Quantity row */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      className="field-input"
                      type="number"
                      placeholder="Cantidad"
                      value={food.cantidad.valor ?? ''}
                      onChange={e => updateFood(food._id, { cantidad: { ...food.cantidad, valor: e.target.value ? parseFloat(e.target.value) : null } })}
                      style={{ flex: 1 }}
                    />
                    <select
                      className="field-input"
                      value={food.cantidad.unidad}
                      onChange={e => updateFood(food._id, { cantidad: { ...food.cantidad, unidad: e.target.value as typeof UNITS[number] } })}
                      style={{ flex: 1 }}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Date row */}
                  <div>
                    {food.fecha.fecha_detectada_texto && (
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 4 }}>
                        Detectado: {food.fecha.fecha_detectada_texto}
                      </p>
                    )}
                    {food.fecha.fecha_caducidad_estimada ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarDays size={14} color="var(--color-accent)" />
                        <input
                          className="field-input"
                          type="date"
                          value={food.fecha.fecha_caducidad_estimada}
                          onChange={e => updateFood(food._id, { fecha: { ...food.fecha, fecha_caducidad_estimada: e.target.value } })}
                          style={{ flex: 1, fontSize: 13 }}
                        />
                      </div>
                    ) : (
                      <>
                        {datePickerId === food._id ? (
                          <div>
                            <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 6 }}>Fecha de caducidad rápida:</p>
                            <div className="chips-row" style={{ marginBottom: 8 }}>
                              {QUICK_DATES.map(q => (
                                <button
                                  key={q.label}
                                  className="chip"
                                  onClick={() => {
                                    updateFood(food._id, { fecha: { ...food.fecha, fecha_caducidad_estimada: addDays(q.days) } });
                                    setDatePickerId(null);
                                  }}
                                >
                                  {q.label}
                                </button>
                              ))}
                            </div>
                            <input
                              className="field-input"
                              type="date"
                              style={{ fontSize: 13 }}
                              onChange={e => {
                                updateFood(food._id, { fecha: { ...food.fecha, fecha_caducidad_estimada: e.target.value } });
                                setDatePickerId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setDatePickerId(food._id)}
                            style={{
                              background: 'none', border: '1.5px dashed var(--color-border)', borderRadius: 8,
                              cursor: 'pointer', color: 'var(--color-text-3)', fontSize: 12, fontWeight: 600,
                              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                              fontFamily: 'var(--font)',
                            }}
                          >
                            <CalendarDays size={12} /> Añadir caducidad
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add blank food */}
            <button
              onClick={addBlankFood}
              className="btn btn-secondary"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Plus size={16} /> Añadir manualmente
            </button>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--urgente-bg)', borderRadius: 12, padding: '12px 14px',
                fontSize: 13, color: 'var(--urgente-color)', marginTop: 8,
              }}>
                {error}
              </div>
            )}

            {/* Save button */}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || foods.filter(f => f.nombre.trim()).length === 0}
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving
                ? <span className="spinner" />
                : <><Check size={18} strokeWidth={2.5} /> Guardar {foods.filter(f => f.nombre.trim()).length} alimentos</>
              }
            </button>
          </>
        )}
      </div>
    </main>
  );
}

