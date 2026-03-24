import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
    // Silence Chrome DevTools internal requests that React Router can't handle
    {
      name: 'silence-devtools',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/.well-known/')) {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
