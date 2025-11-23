module.exports = {
  // Tailwind v3+ uses `content` instead of `purge`
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false,
  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 2s infinite",
        fadeInUp: "fadeInUp 0.5s ease-out",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
    },
  },
  variants: {
    extend: {
      opacity: ["disabled"],
      cursor: ["disabled"],
      backgroundColor: ["active"],
      transform: ["hover", "focus"],
    },
  },
  plugins: [],
};
