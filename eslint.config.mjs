import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

/**
 * @description Defines repository-wide static analysis for JavaScript, TypeScript and Astro files.
 */
const eslintConfig = [
  {
    ignores: ['.astro/', 'dist/', 'node_modules/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
];

export default eslintConfig;
