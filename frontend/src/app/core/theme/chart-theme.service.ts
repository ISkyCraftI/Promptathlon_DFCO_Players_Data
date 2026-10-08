import { computed, inject, Injectable } from "@angular/core";
import { ThemeService } from "./theme.service";

const VARS = ["--ef-text", "--ef-text-muted", "--ef-text-faint", "--ef-border-subtle", "--ef-border", "--ef-accent",
  "--ef-accent-soft", "--ef-success", "--ef-warn", "--ef-danger", "--ef-info", "--slate-8", "--slate-a4",
  "--blue-9", "--grass-9", "--amber-9", "--red-9", "--ef-surface", "--brand-7"] as const;
export type ChartPalette = Record<(typeof VARS)[number], string>;

/**
 * Couleurs Chart.js lues depuis les tokens CSS : les graphiques suivent le thème
 * sans couleur codée en dur dans les composants.
 */
@Injectable({ providedIn: "root" })
export class ChartThemeService {
  private readonly theme = inject(ThemeService);

  readonly palette = computed<ChartPalette>(() => {
    this.theme.mode();
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(VARS.map((v) => [v, style.getPropertyValue(v).trim()])) as ChartPalette;
  });

  /** Options de base : axes discrets, police de l'app, légende masquée. */
  readonly base = computed(() => {
    const c = this.palette();
    const font = { family: "Manrope, 'Segoe UI', system-ui, sans-serif", size: 11 };
    return {
      locale: "fr-FR",
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false, labels: { color: c["--ef-text-muted"], font, boxWidth: 10, boxHeight: 10 } },
        tooltip: { backgroundColor: c["--ef-text"], titleColor: c["--ef-surface"], bodyColor: c["--ef-surface"],
          padding: 10, cornerRadius: 6, titleFont: { ...font, weight: 700 }, bodyFont: font },
      },
      scales: {
        x: { grid: { display: false }, border: { color: c["--ef-border"] }, ticks: { color: c["--ef-text-muted"], font } },
        y: { grid: { color: c["--ef-border-subtle"] }, border: { display: false }, ticks: { color: c["--ef-text-muted"], font } },
      },
    };
  });
}
