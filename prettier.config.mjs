/**
 * @description Defines deterministic formatting for source code and repository documentation.
 */
const prettierConfig = {
  plugins: ['prettier-plugin-astro'],
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};

export default prettierConfig;
