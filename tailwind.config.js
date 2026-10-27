/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ivory: {
          50: '#fdfbf7',
          100: '#f8f4ec',
          200: '#f0e9dc',
          300: '#e5dccb',
          400: '#d6cab4',
        },
        sage: {
          50: '#f5f7f4',
          100: '#e8ede4',
          200: '#cfdcc6',
          300: '#a9c19c',
          400: '#82a473',
          500: '#5f854f',
          600: '#4a6a3d',
          700: '#3a5430',
          800: '#2f4427',
          900: '#25351e',
        },
        charcoal: {
          50: '#f7f7f6',
          100: '#e9e8e6',
          200: '#d2d0cd',
          300: '#b0ada7',
          400: '#86827a',
          500: '#67635c',
          600: '#504d47',
          700: '#3f3c37',
          800: '#2b2926',
          900: '#1c1b19',
        },
        terracotta: {
          400: '#d49577',
          500: '#c07a59',
          600: '#a8623f',
        },
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,27,25,0.04), 0 8px 24px rgba(28,27,25,0.06)',
        lift: '0 2px 4px rgba(28,27,25,0.05), 0 16px 40px rgba(28,27,25,0.10)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.1)', opacity: '0' },
          '100%': { transform: 'scale(1.1)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'shimmer': 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
