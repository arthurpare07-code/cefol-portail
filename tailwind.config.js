export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#1B4F8A',
        'brand-light': '#EBF2FB',
        'brand-mid': '#3B72B8',
        accent: '#E8A020',
        'accent-light': '#FEF6E7',
        surface: '#F7F8FA',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
