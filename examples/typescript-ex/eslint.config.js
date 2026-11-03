module.exports = [
  {
    ignores: ['build/'],
  },
  ...require('gts'),
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        module: 'writable',
        exports: 'writable',
        require: 'readonly',
      },
    },
  },
];
