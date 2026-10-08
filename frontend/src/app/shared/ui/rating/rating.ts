import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { ratingTier } from "../../utils/football";

/** Note 0-100 colorée par palier (lecture rapide façon Football Manager). */
@Component({
  selector: "ef-rating",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.data-tier]": "tier()", "[class.pill]": "pill()", class: "ef-num" },
  template: `{{ display() }}`,
  styles: `
    :host { display: inline-block; min-width: 1.6em; text-align: center; font-size: 1.05em; color: var(--ef-text); }
    :host([data-tier="elite"]) { color: var(--ef-success-text); font-weight: 700; }
    :host([data-tier="good"]) { color: var(--ef-success-text); }
    :host([data-tier="low"]) { color: var(--ef-warn-text); }
    :host([data-tier="poor"]) { color: var(--ef-danger-text); }
    :host([data-tier="none"]) { color: var(--ef-text-faint); }
    :host(.pill) { padding: 1px 6px; border-radius: var(--ef-radius-sm); background: var(--ef-surface-sunken); }
    :host(.pill[data-tier="elite"]), :host(.pill[data-tier="good"]) { background: var(--ef-success-soft); }
    :host(.pill[data-tier="low"]) { background: var(--ef-warn-soft); }
    :host(.pill[data-tier="poor"]) { background: var(--ef-danger-soft); }
  `,
})
export class Rating {
  readonly value = input<number | null | undefined>(null);
  readonly pill = input(false);
  readonly tier = computed(() => ratingTier(this.value()));
  /** Notes entières (les moyennes simulées arrivent avec décimales). */
  readonly display = computed(() => { const v = this.value(); return v === null || v === undefined ? "—" : Math.round(v); });
}
