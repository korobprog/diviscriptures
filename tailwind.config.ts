import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "krishna-blue": "hsl(var(--krishna-blue))",
        "temple-gold": "hsl(var(--temple-gold))",
        "lotus-pink": "hsl(var(--lotus-pink))",
        "lotus-white": "hsl(var(--lotus-white))",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-sacred': 'var(--gradient-sacred)',
        'gradient-divine': 'var(--gradient-divine)',
        'gradient-lotus': 'var(--gradient-lotus)',
        'gradient-temple': 'var(--gradient-temple)',
      },
      boxShadow: {
        'divine': 'var(--shadow-divine)',
        'lotus': 'var(--shadow-lotus)',
        'temple': 'var(--shadow-temple)',
      },
      transitionTimingFunction: {
        'sacred': 'var(--transition-sacred)',
        'gentle': 'var(--transition-gentle)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float-gently": {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        "lotus-bloom": {
          '0%': { transform: 'scale(0.8) rotate(-5deg)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.9' },
        },
        "sacred-pulse": {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
          '50%': { boxShadow: '0 0 0 10px hsl(var(--primary) / 0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-gently": "float-gently 6s ease-in-out infinite",
        "lotus-bloom": "lotus-bloom 4s ease-in-out infinite",
        "sacred-pulse": "sacred-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
} satisfies Config;
