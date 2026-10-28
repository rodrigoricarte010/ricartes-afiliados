import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06060d',
          900: '#0a0a15',
          850: '#0f0f1d',
          800: '#141425',
          700: '#1d1d33',
          600: '#282849',
          500: '#3a3a5f',
        },
        // Primária: azul/violeta "tech"
        brand: {
          50: '#eef0ff',
          100: '#e2e3ff',
          200: '#cac9ff',
          300: '#a9a4ff',
          400: '#8d78fd',
          500: '#7350f7',
          600: '#6234e8',
          700: '#5226c9',
          800: '#4421a3',
          900: '#3a2081',
        },
        // Ação de compra / conversão
        lime: {
          400: '#b6f24a',
          500: '#9ee22b',
          600: '#84c60f',
        },
        // Apoio para dados e destaques secundários
        sky: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px -18px rgba(115,80,247,0.55)',
        'glow-lime': '0 18px 45px -16px rgba(158,226,43,0.5)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -32px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(158,226,43,0.45)' },
          '100%': { boxShadow: '0 0 0 14px rgba(158,226,43,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
