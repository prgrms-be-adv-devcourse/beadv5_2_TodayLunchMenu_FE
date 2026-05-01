/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e60023',
          hover:   '#ad081b',
        },
        plum:   '#211922',
        olive:  '#62625b',
        silver: '#91918c',
        sand:   '#e5e5e0',
        fog:    '#f6f6f3',
        warm:   '#e0e0d9',
        'dark-surface': '#33332e',
        'pin-focus': '#435ee5',
      },
      borderRadius: {
        pin:       '16px',
        card:      '20px',
        container: '28px',
        hero:      '40px',
      },
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', 'Segoe UI', 'Roboto',
          'Oxygen-Sans', 'Helvetica Neue', 'Helvetica', 'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
