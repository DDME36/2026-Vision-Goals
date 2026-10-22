import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'next-env.d.ts'] },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Hydrating from browser-only APIs (localStorage, Date) after mount and resetting
      // dialog forms on open are intentional here.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
