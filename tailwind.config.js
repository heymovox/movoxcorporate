/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2382B8',
          50: '#EFF7FB',
          100: '#DCEEF6',
          200: '#B9DDED',
          300: '#8CC6E1',
          400: '#57A9D2',
          500: '#2382B8',
          600: '#1E6FA0',
          700: '#195C85',
          800: '#126A98',
          900: '#003655',
          950: '#00253B',
        },
        ink: '#003655',
      },
      fontFamily: {
        heading: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #003655 0%, #126A98 48%, #2382B8 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,54,85,0.04), 0 8px 24px rgba(0,54,85,0.06)',
        'card-hover': '0 2px 4px rgba(0,54,85,0.05), 0 16px 40px rgba(0,54,85,0.10)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        blob: 'blob 7s infinite',
      },
    },
  },
  plugins: [],
};
