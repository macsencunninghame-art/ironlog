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
        // Surfaces, lightest first. The scale keeps its roles - 950 is chrome,
        // 900 the page, 800 a card, 700 a subtle fill, 600 and 500 borders - so
        // components did not have to change when the theme went light.
        ink: {
          950: '#FFFFFF',
          900: '#F3F6FA',
          800: '#FFFFFF',
          700: '#EDF1F7',
          600: '#DCE3ED',
          500: '#BCC6D6',
        },
        // Text, darkest first.
        chalk: {
          DEFAULT: '#151B2B',
          muted: '#4B5668',
          faint: '#6E7A8D',
        },
        // Semantic: a PR, a completed day, anything that went well. Not anyone's
        // accent, and dark enough to read as text on white.
        volt: {
          DEFAULT: '#3E8F00',
          soft: '#59B215',
          deep: '#2C6600',
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
