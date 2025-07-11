import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      'src/generated/'
    ]
  }
);