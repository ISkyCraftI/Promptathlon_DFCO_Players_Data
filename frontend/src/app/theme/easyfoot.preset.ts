import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * Preset PrimeNG aux couleurs DFCO (rouge / noir).
 */
export const EasyfootPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#fff1f1",
      100: "#ffd6d6",
      200: "#ffb0b0",
      300: "#ff7a7a",
      400: "#f53d3d",
      500: "#e30613",
      600: "#c10510",
      700: "#9b0410",
      800: "#70040f",
      900: "#4a030b",
      950: "#2a0207",
    },
    colorScheme: {
      light: {
        primary: {
          color: "#e30613",
          inverseColor: "#fff5f0",
          hoverColor: "#c10510",
          activeColor: "#9b0410",
        },
        highlight: {
          background: "rgba(227, 6, 19, 0.12)",
          focusBackground: "rgba(227, 6, 19, 0.2)",
          color: "#e30613",
          focusColor: "#c10510",
        },
      },
      dark: {
        primary: {
          color: "#e30613",
          inverseColor: "#fff5f0",
          hoverColor: "#f53d3d",
          activeColor: "#ff7a7a",
        },
        highlight: {
          background: "rgba(227, 6, 19, 0.2)",
          focusBackground: "rgba(227, 6, 19, 0.3)",
          color: "#ffb0b0",
          focusColor: "#ffd6d6",
        },
      },
    },
  },
});
