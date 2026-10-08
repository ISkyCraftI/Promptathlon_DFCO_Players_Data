import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

/** Mini-histogramme (charge quotidienne) : jours de repos visibles en creux. */
@Component({
  selector: "ef-sparkline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' 24'" preserveAspectRatio="none" role="img" [attr.aria-label]="label()">
      @for (b of bars(); track $index) {
        <rect [attr.x]="b.x" [attr.y]="24 - b.h" [attr.width]="b.w" [attr.height]="b.h" rx="0.6" [class.last]="$last" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-block; width: 96px; height: 24px; }
    svg { width: 100%; height: 100%; display: block; }
    rect { fill: var(--slate-8); }
    rect.last { fill: var(--ef-accent); }
  `,
})
export class Sparkline {
  readonly values = input<number[]>([]);
  readonly label = input("Évolution");
  readonly width = computed(() => Math.max(1, this.values().length * 4));
  readonly bars = computed(() => {
    const values = this.values();
    const max = Math.max(1, ...values);
    return values.map((v, i) => ({ x: i * 4 + 0.5, w: 3, h: v ? Math.max(1.5, (v / max) * 24) : 0.8 }));
  });
}
