import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ChartModule } from "primeng/chart";
import { ChartThemeService } from "../../../core/theme/chart-theme.service";

export interface RadarSeries { label: string; values: number[]; tone: "accent" | "info" | "muted"; }

/** Radar 0-100 (profil d'un joueur ou superposition jeune / référence). */
@Component({
  selector: "ef-radar-chart",
  imports: [ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-chart type="radar" [data]="data()" [options]="options()" [height]="height()" [ariaLabel]="ariaLabel()" />`,
})
export class RadarChart {
  private readonly theme = inject(ChartThemeService);
  readonly labels = input.required<string[]>();
  readonly series = input.required<RadarSeries[]>();
  readonly height = input("280px");
  readonly ariaLabel = input("Profil en radar, notes sur 100");

  readonly data = computed(() => {
    const c = this.theme.palette();
    const color = { accent: c["--ef-accent"], info: c["--blue-9"], muted: c["--slate-8"] };
    return {
      labels: this.labels(),
      datasets: this.series().map((s) => ({
        label: s.label, data: s.values, borderColor: color[s.tone], backgroundColor: color[s.tone] + "22",
        borderWidth: 2, pointRadius: 3, pointBackgroundColor: color[s.tone],
      })),
    };
  });

  readonly options = computed(() => {
    const base = this.theme.base();
    const c = this.theme.palette();
    return {
      locale: "fr-FR", responsive: true, maintainAspectRatio: false, animation: base.animation,
      plugins: { ...base.plugins, legend: { ...base.plugins.legend, display: this.series().length > 1, position: "bottom" as const } },
      scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, display: false }, grid: { color: c["--ef-border-subtle"] },
        angleLines: { color: c["--ef-border-subtle"] }, pointLabels: { color: c["--ef-text"], font: { family: "Manrope, 'Segoe UI', system-ui, sans-serif", size: 12, weight: 600 } } } },
    };
  });
}
