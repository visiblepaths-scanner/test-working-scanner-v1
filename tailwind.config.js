/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'scan-vertical': 'scan-v 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'scan-horizontal': 'scan-h 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'scan-v': {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%, 90%': { opacity: '0.6' },
          '50%': { transform: 'translateY(100%)', opacity: '0.6' },
        },
        'scan-h': {
          '0%, 100%': { transform: 'translateX(-100%)', opacity: '0' },
          '10%, 90%': { opacity: '0.6' },
          '50%': { transform: 'translateX(100%)', opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};