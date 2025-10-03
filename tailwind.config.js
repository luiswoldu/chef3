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
          // Core colors
          core: {
            white: "#FFFFFF",
            black: "#000000",
            strawberry: "#FE303F",
          },

          // Accent colors
          accent: {
            spring: {
              DEFAULT: "#6ED308",   // Spring Green
              light: "#A5E765",     // Gradient variant
            },
            green: {
              DEFAULT: "#6CD401",   // Primary (Log In, Save..)
              lime: "#98E14D",      // 6CD401 @70%
              honeydew: "#F0FBE5",  // 6CD401 @10%
            },
          },

          // Greys
          grey: {
            calcium: "#F7F7F7",   // Import input field / Secondary button
            silver: "#DFE0E1",    // Usage
            magnesium: "#B2B2B2", // Arrow Up Default / Icons
            DEFAULT: "#9F9F9F",   // Secondary text / Placeholder
            iron: "#58575C",      // Unselected navigation text
            graphite: "#343434",  // Dark text
          },
        },
      },
      boxShadow: {
        'custom': '0 2px 10px 2px rgba(0, 0, 0, 0.1)',
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
        'sm': '375px',   // Small iPhones (375px) and up to ~440px
        'md': '440px',   // Medium tablets 440px to ~834px  
        'lg': '834px',   // Large screens 834px and above (no upper limit)
      },
    },
  },
  plugins: [],
} 