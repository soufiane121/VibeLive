/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({addUtilities}) => {
      addUtilities({
        primaryIconColor: {
          color: 'red',
        },
        navigationBottomBackground: {
          backGroundColor: '#1e293b',
        },
      });
    }),
  ],
};
