/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chef: {
          core: {
            white: "#FFFFFF",
            black: "#000000",
            strawberry: "#FE303F",
          },
          accent: {
            spring: {
              DEFAULT: "#6ED308",
              light: "#A5E765",
            },
            green: {
              DEFAULT: "#6CD401",
              lime: "#98E14D",
              honeydew: "#F0FBE5",
            },
          },
          grey: {
            calcium: "#F7F7F7",
            silver: "#DFE0E1",
            magnesium: "#B2B2B2",
            DEFAULT: "#9F9F9F",
            iron: "#58575C",
            graphite: "#343434",
          },
        },
      },

      boxShadow: {
        custom: '0 2px 10px 2px rgba(0, 0, 0, 0.1)',
        hands: '0 2px 18px 0 rgba(0, 0, 0, 0.06)',
      },

      keyframes: {
        shimmer: {
          "0%": { backgroundColor: "hsl(var(--muted))" },
          "50%": { backgroundColor: "hsl(var(--muted-foreground))" },
          "100%": { backgroundColor: "hsl(var(--muted))" },
        },
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      screens: {
        'sm': '375px',
        'md': '440px',
        'lg': '834px',
      },
    },
  },
  plugins: [],
}