/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Washi (Japanese paper) palette
        washi: '#F5F2EB',
        'washi-cream': '#EDE8DC',
        'washi-warm': '#E5DFD0',

        // Sumi (ink) palette
        sumi: '#1A1A1A',
        'sumi-medium': '#3D3D3D',
        'sumi-light': '#6B6B6B',

        // Moegi (young bamboo green) - the beloved accent
        moegi: '#5B7553',
        'moegi-light': '#7A9472',
        'moegi-soft': '#E8EDE6',

        // Legacy compatibility
        primary: '#5B7553',
        background: '#F5F2EB',
        warmBrown: '#1A1A1A',
        placeholder: '#6B6B6B',
        border: '#E5DFD0',
      },
      fontFamily: {
        nunito: ['Nunito_400Regular'],
        'nunito-bold': ['Nunito_700Bold'],
        'nunito-semibold': ['Nunito_600SemiBold'],
      },
      // Gentle border radii (wabi-sabi inspired)
      borderRadius: {
        'subtle': '2px',
        'gentle': '4px',
        'soft': '8px',
        'round': '16px',
      },
      // Ma (間) - meaningful spacing
      spacing: {
        'ma-5': '24px',
        'ma-6': '32px',
        'ma-7': '48px',
        'ma-8': '64px',
        'ma-9': '96px',
      },
    },
  },
  plugins: [],
};
