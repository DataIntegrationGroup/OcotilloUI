import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      light: "#A6CCD6", // Soft Aqua
      main: "#006E7B", // Deep Cyan
      dark: "#004153" // Deep Teal
    },
    secondary: {
      light: "#E1E4C6", // Beige Sand
      main: "#86911A", // Citron Green
      dark: "#3C410C", // Olive Green
    },
    warning: {
      light: "#F5B9B4", // Muted Rose
      main: "#C04034", // Curnt Sienna
      dark: "#5B1610", // Crimson Red
    },
    background: {
      default: "#f4f4f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#333",
      secondary: "#666",
    },
  },
  typography: {
    fontFamily: ["Roboto Condensed", "Open Sans", "Arial", "sans-serif"].join(","),
    h1: {
      fontFamily: "Roboto Condensed",
      fontWeight: 700,
      fontSize: "48px",
      lineHeight: 1.4,
      "@media (max-width:600px)": {  // Mobile
        fontSize: "36px",
      },
    },
    h2: {
      fontFamily: "Roboto Condensed",
      fontWeight: 600,
      fontSize: "36px",
      lineHeight: 1.5,
      "@media (max-width:600px)": {  // Mobile
        fontSize: "28px",
      },
    },
    h3: {
      fontFamily: "Roboto Condensed",
      fontWeight: 500,
      fontSize: "28px",
      lineHeight: 1.5,
      "@media (max-width:600px)": {  // Mobile
        fontSize: "24px",
        lineHeight: 1.6,
      },
    },
    h4: {
      fontFamily: "Roboto Condensed",
      fontWeight: 500,
      fontSize: "22px",
      lineHeight: 1.6,
      "@media (max-width:600px)": {  // Mobile
        fontSize: "20px",
      },
    },
    body1: {
      fontFamily: "Open Sans",
      fontWeight: 400,
      fontSize: "16px",
      lineHeight: 1.5,
      "@media (max-width:600px)": {  // Mobile
        fontSize: "14px",
      },
    },
  },
});
