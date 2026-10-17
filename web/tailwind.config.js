/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ---- Tokens semánticos (resueltos vía CSS variables en index.css) ----
        // Aportan dark mode automático: bg/card/line/ink se adaptan al tema.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        placeholder: 'rgb(var(--placeholder) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-mid': 'rgb(var(--ink-mid) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        link: 'rgb(var(--link) / <alpha-value>)',

        // Neutros temáticos: permiten que clases heredadas (text-gray-900,
        // border-gray-200, ...) se adapten a light/dark. `white` NO se
        // sobreescribe para que text-white funcione sobre fondos de color.
        gray: {
          50: 'rgb(var(--bg) / <alpha-value>)',
          100: 'rgb(var(--subtle) / <alpha-value>)',
          200: 'rgb(var(--line) / <alpha-value>)',
          300: 'rgb(var(--line-strong) / <alpha-value>)',
          400: 'rgb(var(--placeholder) / <alpha-value>)',
          500: 'rgb(var(--muted) / <alpha-value>)',
          600: 'rgb(var(--ink-soft) / <alpha-value>)',
          700: 'rgb(var(--ink-mid) / <alpha-value>)',
          900: 'rgb(var(--ink) / <alpha-value>)',
        },
        // Azul principal (marca) #1969A8 — enlaces y énfasis
        primary: {
          50: '#eef6fb',
          100: '#d5e8f4',
          200: '#aed1e9',
          300: '#7db4da',
          400: '#4e93c6',
          500: '#1969a8',
          600: '#1969a8',
          700: '#145689',
          800: '#114a75',
          900: '#0f3d61',
        },
        // Naranja acento (CTAs / acción) #DE863B
        accent: {
          50: '#fdf5ed',
          100: '#fae6d4',
          200: '#f4c9a7',
          300: '#eba871',
          400: '#e3944f',
          500: '#de863b',
          600: '#c5732a',
          700: '#a35d22',
          800: '#844a1e',
          900: '#6b3d1b',
        },
        // Azul oscuro (texto/encabezados) #173F63
        navy: '#173f63',
        // Gris neutro (secundario/bordes) #8B9BA8
        neutralbrand: '#8b9ba8',
      },
    },
  },
  plugins: [],
};
