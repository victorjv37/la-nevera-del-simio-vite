import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Refrigerator, Plus, LogOut, Camera } from 'lucide-react';
import { useFood } from '~/context/FoodContext';
import { useAuth } from '~/context/AuthContext';
import { useUserProfile } from '~/context/UserProfileContext';
import { NUTRITIONAL_CATEGORIES } from '~/lib/constants';
import type { NutritionCategoryId } from '~/lib/types';
import CategoryCard from '~/components/CategoryCard';
import FoodListModal from '~/components/FoodListModal';
import AddFoodModal from '~/components/AddFoodModal';

export function meta() {
  return [
    { title: 'La Nevera del Simio' },
    { name: 'description', content: 'Inventario visual de tu nevera por categoría nutricional' },
  ];
}

export default function FridgeScreen() {
  const { foods, loading } = useFood();
  const { logout } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<NutritionCategoryId | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <main className="screen" id="fridge-screen">
      <div className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Refrigerator size={28} strokeWidth={1.6} color="var(--color-accent)" />
              Mi Nevera
            </h1>
            <p className="screen-subtitle">
              {profile ? `Hola, ${profile.name} · ¡Este es tu armario de bananas!` : '¡Este es tu armario de bananas!'}
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-3)', padding: '4px 8px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
              transition: 'all 0.15s',
            }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ─── Scan banner ─── */}
      <button
        onClick={() => navigate('/scan')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '0 16px 12px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
          border: 'none', borderRadius: 16, cursor: 'pointer',
          color: 'white', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 16px rgba(212,147,107,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          width: 'calc(100% - 32px)',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Camera size={22} strokeWidth={1.75} />
        <div style={{ textAlign: 'left' }}>
          <div>📷 Escanear alimentos con IA</div>
          <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>Haz una foto y detectamos los alimentos automáticamente</div>
        </div>
      </button>


      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      ) : (
        <>
          <div className="food-count-strip">
            <span className="food-count-number">{foods.length}</span>
            <span className="food-count-label">
              {foods.length === 1 ? 'alimento guardado' : 'alimentos guardados'}
            </span>
          </div>

          <div className="category-grid">
            {NUTRITIONAL_CATEGORIES.map(cat => {
              const primaryCount = foods.filter(f => f.nutritionCategory === cat.id).length;
              const secondaryCount = foods.filter(
                f => f.nutritionCategory !== cat.id && f.nutritionTags.includes(cat.id)
              ).length;
              return (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  primaryCount={primaryCount}
                  secondaryCount={secondaryCount}
                  onClick={() => setSelectedCategory(cat.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* FAB group: scan + manual add */}
      <div style={{ position: 'fixed', bottom: 'calc(68px + 16px)', right: 20, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 100 }}>
        <button
          className="fab"
          onClick={() => navigate('/scan')}
          aria-label="Escanear alimentos"
          id="fab-scan"
          style={{ width: 52, height: 52, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
          title="Escanear con cámara"
        >
          <Camera size={22} strokeWidth={1.75} color="var(--color-accent)" />
        </button>
        <button
          className="fab"
          onClick={() => setShowAdd(true)}
          aria-label="Añadir alimento"
          id="fab-add-food"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {selectedCategory && (
        <FoodListModal
          categoryId={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {showAdd && (
        <AddFoodModal onClose={() => setShowAdd(false)} />
      )}
    </main>
  );
}
