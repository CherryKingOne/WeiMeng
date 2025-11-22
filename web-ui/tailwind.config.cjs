module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4285F4', // Google Blue (Primary) - Mapped to 'green' key for compatibility
          blue: '#34A853',  // Google Green (Secondary)
          dark: '#202124',  // Google Dark Gray (Background)
          accent: '#EA4335' // Google Red (Accent)
        },
        dark: { cta: '#1E293B' }, // Slate 800
        light: { gray: '#F8FAFC' }, // Slate 50
        primary: '#0F172A', // Slate 900
        secondary: '#64748B', // Slate 500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "url('/src/assets/hero-pattern.svg')", // Placeholder if needed
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
