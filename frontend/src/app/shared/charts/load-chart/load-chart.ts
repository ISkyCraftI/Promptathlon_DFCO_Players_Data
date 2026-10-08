import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ChartModule } from "primeng/chart";
import { ChartThemeService } from "../../../core/theme/chart-theme.service";

export interface LoadPoint { date: string; load: number; acwr?: number | null; }

/** Charge quotidienne (barres, UA) + ratio aigu/chronique (ligne, axe droit) avec la zone 0,8–1,3 en repère. */
@Component({
  selector: "ef-load-chart",
  imports: [ChartModule],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-chart type="bar" [data]="data()" [options]="options()" [height]="height()" [ariaLabel]="label()" />`,
})
export class LoadChart {
  private readonly theme = inject(ChartThemeService);
  private readonly datePipe = inject(DatePipe);
  readonly points = input.required<LoadPoint[]>();
  readonly height = input("240px");
  readonly label = input("Charge quotidienne et ratio aigu/chronique");
  readonly showRatio = computed(() => this.points().some((p) => p.acwr !== undefined && p.acwr !== null));

  readonly data = computed(() => {
    const c = this.theme.palette();
    const datasets: object[] = [{
      type: "bar", label: "Charge (UA)", data: this.points().map((p) => p.load), yAxisID: "y",
      backgroundColor: this.points().map((_, i, a) => (i === a.length - 1 ? c["--ef-accent"] : c["--slate-8"])),
      borderRadius: 3, maxBarThickness: 18, order: 2,
    }];
    if (this.showRatio()) {
      datasets.push({ type: "line", label: "Ratio aigu/chronique", data: this.points().map((p) => p.acwr ?? null), yAxisID: "ratio",
        borderColor: c["--blue-9"], backgroundColor: c["--blue-9"], borderWidth: 2, pointRadius: 0, tension: 0.3, order: 1 });
    }
    return { labels: this.points().map((p) => this.datePipe.transform(p.date, "d MMM") ?? p.date), datasets };
  });

  readonly options = computed(() => {
    const base = this.theme.base();
    const c = this.theme.palette();
    const ratio = this.showRatio();
    return {
      ...base,
      plugins: { ...base.plugins, legend: { ...base.plugins.legend, display: ratio, position: "bottom" as const, align: "start" as const } },
      scales: {
        x: { ...base.scales.x, ticks: { ...base.scales.x.ticks, maxRotation: 0, autoSkipPadding: 12 } },
        y: { ...base.scales.y, beginAtZero: true, title: { display: true, text: "UA", color: c["--ef-text-muted"] } },
        ...(ratio ? { ratio: { position: "right" as const, min: 0, max: 2.2, grid: { display: false }, border: { display: false },
          ticks: { ...base.scales.y.ticks, stepSize: 0.5 } } } : {}),
      },
    };
  });
}
