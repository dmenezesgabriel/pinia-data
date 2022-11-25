import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";
// https://vitejs.dev/config/

export default defineConfig(() => {
  return {
    plugins: [
      vue({
        reactivityTransform: true,
      }),
      dts({
        insertTypesEntry: true,
        tsConfigFilePath: "./tsconfig.json",
        compilerOptions: {
          paths: {
            "~/*": ["./src/*"],
          },
        },
        outputDir: "./dist/types",
        copyDtsFiles: true,
      }),
    ],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, "./src/index.ts"),
        formats: ["cjs", "es"],
        fileName: (format) => `pinia-data.${format}.js`,
      },
      rollupOptions: {
        external: [
          "vue",
          "@codemirror/state",
          "@codemirror/view",
          "codemirror",
        ],
        output: {
          globals: {
            vue: "Vue",
          },
        },
      },
    },
  };
});
