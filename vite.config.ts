import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pagesBasePath = "/PACMAN/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? pagesBasePath : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
}));
