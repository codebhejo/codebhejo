import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig({
  plugins: [
    vue(),
    monacoEditorPlugin.default({
      languageWorkers: ["editorWorkerService", "typescript", "json", "html", "css"],
    }),
  ],

  build: {
    target: "es2018",

    cssCodeSplit: true,

    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("vue")) {
              return "vue";
            }
            if (id.includes("codemirror") || id.includes("monaco")) {
              return "editor";
            }
            return "vendor";
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: ["vue", "vue-router"],
    exclude: ["codemirror"],
  },
});
