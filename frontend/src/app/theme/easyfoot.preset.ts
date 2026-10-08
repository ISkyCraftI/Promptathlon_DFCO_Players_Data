import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * Preset PrimeNG branché sur les échelles Radix (src/theme/radix).
 * Les valeurs sont des var(--…) : le passage clair / sombre se fait côté Radix,
 * PrimeNG n'a qu'à inverser l'usage des paliers « surface » en sombre.
 */
const brand = {
  50: "var(--brand-2)", 100: "var(--brand-3)", 200: "var(--brand-5)", 300: "var(--brand-7)", 400: "var(--brand-8)",
  500: "var(--brand-9)", 600: "var(--brand-10)", 700: "var(--brand-11)", 800: "var(--brand-11)", 900: "var(--brand-12)",
  950: "var(--brand-12)",
};

const radixTone = (scale: string) => ({
  background: `var(--${scale}-3)`, color: `var(--${scale}-11)`,
});

export const EasyfootPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: "0", xs: "3px", sm: "5px", md: "7px", lg: "10px", xl: "14px" },
  },
  semantic: {
    primary: brand,
    focusRing: { width: "2px", style: "solid", color: "var(--brand-9)", offset: "2px" },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff", 50: "var(--slate-2)", 100: "var(--slate-3)", 200: "var(--slate-4)", 300: "var(--slate-6)",
          400: "var(--slate-8)", 500: "var(--slate-9)", 600: "var(--slate-10)", 700: "var(--slate-11)",
          800: "var(--slate-12)", 900: "var(--slate-12)", 950: "var(--slate-12)",
        },
        primary: { color: "var(--brand-9)", contrastColor: "#ffffff", hoverColor: "var(--brand-10)", activeColor: "var(--brand-10)" },
        highlight: { background: "var(--brand-3)", focusBackground: "var(--brand-4)", color: "var(--brand-11)", focusColor: "var(--brand-12)" },
        text: { color: "var(--slate-12)", hoverColor: "var(--slate-12)", mutedColor: "var(--slate-11)", hoverMutedColor: "var(--slate-12)" },
        content: { borderColor: "var(--slate-6)", hoverBackground: "var(--slate-3)" },
        formField: { borderColor: "var(--slate-7)", hoverBorderColor: "var(--slate-8)", placeholderColor: "var(--slate-10)" },
      },
      dark: {
        surface: {
          0: "var(--slate-12)", 50: "var(--slate-12)", 100: "var(--slate-11)", 200: "var(--slate-10)", 300: "var(--slate-9)",
          400: "var(--slate-8)", 500: "var(--slate-7)", 600: "var(--slate-6)", 700: "var(--slate-5)", 800: "var(--slate-3)",
          900: "var(--slate-2)", 950: "var(--slate-1)",
        },
        primary: { color: "var(--brand-9)", contrastColor: "#ffffff", hoverColor: "var(--brand-10)", activeColor: "var(--brand-10)" },
        highlight: { background: "var(--brand-4)", focusBackground: "var(--brand-5)", color: "var(--brand-12)", focusColor: "var(--brand-12)" },
        text: { color: "var(--slate-12)", hoverColor: "var(--slate-12)", mutedColor: "var(--slate-11)", hoverMutedColor: "var(--slate-12)" },
        content: { background: "var(--slate-2)", borderColor: "var(--slate-6)", hoverBackground: "var(--slate-4)" },
        formField: { background: "var(--slate-2)", borderColor: "var(--slate-7)", hoverBorderColor: "var(--slate-8)", placeholderColor: "var(--slate-10)" },
        overlay: { popover: { background: "var(--slate-3)" }, modal: { background: "var(--slate-2)" }, select: { background: "var(--slate-3)" } },
      },
    },
  },
  components: {
    tag: {
      colorScheme: {
        light: {
          success: radixTone("grass"), info: radixTone("blue"), warn: radixTone("amber"), danger: radixTone("red"),
          secondary: { background: "var(--slate-4)", color: "var(--slate-11)" },
          primary: { background: "var(--brand-3)", color: "var(--brand-11)" },
        },
        dark: {
          success: radixTone("grass"), info: radixTone("blue"), warn: radixTone("amber"), danger: radixTone("red"),
          secondary: { background: "var(--slate-4)", color: "var(--slate-11)" },
          primary: { background: "var(--brand-4)", color: "var(--brand-12)" },
        },
      },
    },
  },
});
