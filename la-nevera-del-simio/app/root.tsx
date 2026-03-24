import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  },
];

export function meta() {
  return [
    { title: "La Nevera del Simio" },
    { name: "description", content: "Gestión de nevera, planificación nutricional y lista de la compra inteligente." },
    { name: "theme-color", content: "#F8F5F0" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "Algo salió mal.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "Página no encontrada."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main style={{ padding: 32, fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{message}</h1>
      <p style={{ color: "#6B5E57" }}>{details}</p>
      {stack && (
        <pre style={{ marginTop: 16, padding: 16, background: "#f2ede6", borderRadius: 8, overflow: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
