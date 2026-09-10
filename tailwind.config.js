/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Full 0-100 scale so any /NN colour opacity modifier resolves.
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [i, (i / 100).toString()]),
      ),
      colors: {
        // Repainted per person: PersonScope sets these variables from their theme.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          deep: 'rgb(var(--accent-deep) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',
        },
        accent2: {
          DEFAULT: 'rgb(var(--accent-2) / <alpha-value>)',
        },
        ink: {
          950: '#070A12',
          900: '#0B0F1A',
          800: '#121826',
          700: '#1A2233',
          600: '#243049',
          500: '#33415E',
        },
        flame: {
          DEFAULT: '#FF6B18',
          soft: '#FF8A47',
          deep: '#E04E00',
        },
        hot: {
          DEFAULT: '#FF2D8A',
          soft: '#FF6BAC',
        },
        volt: {
          DEFAULT: '#C6FF3D',
          soft: '#DBFF85',
          deep: '#9BD400',
        },
        chalk: {
          DEFAULT: '#E9EEF9',
          muted: '#8B97B2',
          faint: '#5A6685',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'pr-pop': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'rise': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pr-pop': 'pr-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'rise': 'rise 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
