import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  // Public routes — auth + profile context, no app shell
  layout('./routes/_public.tsx', [
    route('login', './routes/login.tsx'),
    route('onboarding', './routes/onboarding.tsx'),
  ]),

  // Protected routes — full app shell with auth guard
  layout('./routes/_layout.tsx', [
    index('./routes/home.tsx'),
    route('fridge', './routes/fridge.tsx'),
    route('plan', './routes/plan.tsx'),
    route('shopping', './routes/shopping.tsx'),
    route('scan', './routes/scan.tsx'),
  ]),
] satisfies RouteConfig;
