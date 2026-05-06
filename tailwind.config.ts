import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f0',
          100: '#ffe7d8',
          200: '#ffc8a8',
          300: '#ffa473',
          400: '#ff7e3d',
          500: '#ee4d2d', // Shopee orange
          600: '#cc3d22',
          700: '#a32f1a',
          800: '#7a2412',
          900: '#52180b',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
