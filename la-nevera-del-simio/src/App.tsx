import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './routes/_public';
import AppLayout from './routes/_layout';
import Login from './routes/login';
import Onboarding from './routes/onboarding';
import Home from './routes/home';
import Fridge from './routes/fridge';
import Plan from './routes/plan';
import Shopping from './routes/shopping';
import Scan from './routes/scan';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/fridge" element={<Fridge />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/scan" element={<Scan />} />
      </Route>
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
