const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/*',
      'dist/*',
      'web-build/*',
      '.expo/*',
      'android/*',
      'ios/*',
      '*.config.js',
    ],
  },
  {
    rules: {
      // Nessun 'any' esplicito senza motivo: nel codice attuale ce ne sono
      // parecchi (es. cast a `as any`, parametri `event: any`) — abbassiamo
      // a "warning" per non bloccare da subito la CI, ma restano visibili.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Variabili non usate: errore reale (spesso segnala bug/refusi).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
