import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite build configuration for the React frontend served by Nginx.
 */
export default defineConfig({
  plugins: [react()],
});
