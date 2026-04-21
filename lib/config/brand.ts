export const brand = {
  name: "UStart",
  tagline: "Your Move, Made Simple",
  logo: {
    // Placeholder — replace with actual logo asset path when finalised
    wordmark: "UStart",
    icon: null,
  },
  font: {
    // To switch to Salmond: change this value and update the Google Fonts
    // import in app/layout.tsx
    primary: "Plus Jakarta Sans",
  },
  colors: {
    skyBlue: "#3083DC",
    warmRed: "#E54B4B",
    creme: "#F2F1EF",
    navy: "#1C2B3A",
    phases: {
      beforeArrival: "#4ECBA5",
      first7Days: "#F5C842",
      settlingIn: "#9B8EC4",
      ongoingSupport: "#3083DC",
    },
  },
} as const;

export type Brand = typeof brand;
