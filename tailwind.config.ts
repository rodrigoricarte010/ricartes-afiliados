import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070c',
          900: '#0b0b13',
          850: '#10101a',
          800: '#15151f',
          700: '#1e1e2b',
          600: '#2a2a3a',
          500: '#3b3b50',
        },
        brand: {
          50: '#fff1f0',
          100: '#ffe0dd',
          200: '#ffc5bf',
          300: '#ff9d93',
          400: '#ff6455',
          500: '#ff3a26',
          600: '#ec1d09',
          700: '#c71305',
          800: '#a4140a',
          900: '#87170f',
        },
        lime: {
          400: '#b6f24a',
          500: '#9ee22b',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px -18px rgba(255,58,38,0.45)',
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
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
