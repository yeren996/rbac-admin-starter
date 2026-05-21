import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['front/src/views/system/**/*.vue'],
    rules: {
      'vue/html-closing-bracket-newline': 'off',
    },
  },
  {
    files: ['backend/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      'n/prefer-global/process': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-nested-ternary': 'off',
    },
  },
]);
