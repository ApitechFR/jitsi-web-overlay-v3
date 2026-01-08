import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DS_MAP = {
  "joona": resolve(__dirname, "src/design_system/react-dsapitech"),
  "webconf": resolve(__dirname, "src/design_system/dsfr"),
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const appTemplate = env.VITE_APP_TEMPLATE === 'joona' || env.VITE_APP_TEMPLATE === 'webconf' ? env.VITE_APP_TEMPLATE : 'joona';

  return {
    base: "/",
    plugins: [react()],
    assetsInclude: ["**/*.md"],
    server: {
      port: 3000,
    },
    build: {
      outDir: "dist",
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@ds": DS_MAP[appTemplate]
      },
    },
  };
});

