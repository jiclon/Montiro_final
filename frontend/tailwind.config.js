/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0C0D10',
        deep: '#08090B',
        raise: '#16181C',
        line: '#262A30',
        mist: '#7C838C',
        steel: '#C3C8CE',
        bright: '#F4F6F8',
        gold: '#C9A86A',
      },
    },
  },
  plugins: [],
}
