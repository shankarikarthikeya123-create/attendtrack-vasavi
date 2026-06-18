/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#173B57',
          navyDark: '#1E4565',
          teal: '#0F9D8A',
          tealLight: '#14B8A6',
          sky: '#38BDF8',
          skyBg: '#E0F2FE',
          accent: '#F59E0B',
          accentLight: '#FB923C',
          bgMain: '#F8FAFC',
          bgCard: '#FFFFFF',
          textDark: '#0F172A',
          textMedium: '#334155',
          textLight: '#64748B',
        },
        status: {
          present: '#10B981',
          absent: '#EF4444',
          halfday: '#F59E0B',
          leave: '#6366F1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        cardHover: '0 4px 6px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
