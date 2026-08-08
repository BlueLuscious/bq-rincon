/**
 * @description Defines CSS quality rules for stylesheets and Astro component styles.
 */
const stylelintConfig = {
  extends: ['stylelint-config-standard', 'stylelint-config-html/astro'],
  ignoreFiles: ['.astro/**', 'dist/**', 'node_modules/**'],
};

export default stylelintConfig;
