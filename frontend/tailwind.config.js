/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#002B5B', // Azul escuro principal
        primaryLight: '#00509D', // Azul médio
        primaryLighter: '#3A7CA5', // Azul claro
        accent: '#F0F4FA', // Cinza/azul clarinho para fundo
        card: '#FFFFFF', // Branco
        border: '#E5E7EB', // Cinza borda
        whatsapp: '#25D366', // Verde WhatsApp
        tag: '#E3EFFF', // Azul clarinho para tags
        tagText: '#00509D', // Azul médio para texto de tag
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 