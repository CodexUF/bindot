/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        carbon: {
          950: '#1e293b', 
          900: '#334155', 
          800: '#475569', 
          700: '#64748b', 
          600: '#94a3b8', 
          500: '#cbd5e1', 
        },
        amber: {
          400: '#d8b4fe', 
          500: '#9333ea', 
          600: '#7e22ce', 
        },
        accent: {
          light: '#f3e8ff', 
        },
      },
    },
  },
  plugins: [],
}
