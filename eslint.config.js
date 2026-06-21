const js = require('@eslint/js')

module.exports = [
  js.configs.recommended,
  {
    files: ['server/src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]