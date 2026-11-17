/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"IBM Plex Sans Arabic"',
          "Segoe UI",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        /* ── الهوية: أخضر حبري + نحاسي على ورق ── */
        brand: {
          DEFAULT: "#0E6E5A",
          700: "#0A5646",
          800: "#084436",
          900: "#063027",
          200: "#CFE4DC",
          100: "#E7F1ED",
          50: "#F1F8F5",
        },
        brass: {
          DEFAULT: "#AE8130",
          100: "#F6EFDD",
        },
        ink: {
          900: "#0F1D19",
          800: "#14251F",
          700: "#1B3229",
        },
        paper: "#F5F7F5",
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#FAFBFA",
        },
        line: {
          DEFAULT: "#E2E7E3",
          strong: "#CBD4CE",
        },
        fg: {
          DEFAULT: "#14201C",
          2: "#4C5C56",
          3: "#66756F",
        },
        ok: "#1D7A54",
        warn: "#8A6420",
        danger: {
          DEFAULT: "#A23A2C",
          100: "#F6E8E5",
        },

        /* ── توافق خلفي: الصفحات القديمة تستخدم primary-* ── */
        primary: {
          50: "#F1F8F5",
          100: "#E7F1ED",
          200: "#CFE4DC",
          300: "#A8CFC2",
          400: "#5FA893",
          500: "#17836B",
          600: "#0E6E5A",
          700: "#0A5646",
          800: "#084436",
          900: "#063027",
        },
      },
      borderRadius: {
        field: "8px",
        card: "14px",
      },
      boxShadow: {
        hair: "0 1px 2px rgba(16,32,28,.05)",
        card: "0 1px 3px rgba(16,32,28,.07), 0 8px 24px -12px rgba(16,32,28,.18)",
      },
    },
  },
  plugins: [],
};
