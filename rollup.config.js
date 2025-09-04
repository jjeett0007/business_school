import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/server.ts",
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
    entryFileNames: "[name].js",
    preserveModules: true,
    preserveModulesRoot: "src",
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(),
  ],
  external: ["express", "mock-aws-s3", "aws-sdk", "nock"],
};
