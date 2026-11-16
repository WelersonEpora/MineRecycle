import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        Intl: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'vue/multi-word-component-names': 'off'
    }
  }
]
