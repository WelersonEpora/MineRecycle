"use strict";

module.exports = [
  { ignores: ["node_modules/**", "storage/**"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        structuredClone: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  },
  // Regras puras (importação e política de acesso): sem banco, rede nem disco, para serem testadas isoladas.
  {
    files: ["src/domain/**/*.js", "src/import/**/*.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='require'][arguments.0.value=/(models|services|storage|config|sequelize)/]",
          message: "Domain and import modules are pure: no database, storage or config access."
        }
      ]
    }
  }
];
