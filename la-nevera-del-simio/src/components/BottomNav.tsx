import { NavLink } from 'react-router';
import { Refrigerator, UtensilsCrossed, ShoppingCart } from 'lucide-react';

const tabs = [
    { to: '/fridge', Icon: Refrigerator, label: 'Nevera' },
    { to: '/plan', Icon: UtensilsCrossed, label: 'Plan' },
    { to: '/shopping', Icon: ShoppingCart, label: 'Compras' },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav" aria-label="Navegación principal">
            {tabs.map(({ to, Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
                    aria-label={label}
                >
                    <Icon className="nav-tab-icon" size={24} strokeWidth={1.75} />
                    <span className="nav-tab-label">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
