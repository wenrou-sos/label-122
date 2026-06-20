/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF5F7',
          100: '#FFE4EC',
          200: '#FFC9D9',
          300: '#FF9DBB',
          400: '#FF6B9D',
          500: '#F64E8B',
          600: '#E63946',
          700: '#C41E3A',
          800: '#9E1B32',
          900: '#7F1D1D',
        },
        ovulation: {
          400: '#4CC9F0',
          500: '#4361EE',
          600: '#3A0CA3',
        },
        symptom: {
          400: '#C77DFF',
          500: '#9D4EDD',
          600: '#7B2CBF',
        },
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'HarmonyOS Sans',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(255, 107, 157, 0.12)',
        'soft-lg': '0 8px 32px rgba(255, 107, 157, 0.18)',
        glass: '0 8px 32px rgba(255, 255, 255, 0.25)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
};
