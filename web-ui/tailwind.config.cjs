module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { green: '#00C777', blue: '#007AFF' },
        dark: { cta: '#1C1C1E' },
        light: { gray: '#F2F2F7' },
        primary: '#1A1A1A',
        secondary: '#8E8E93',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
