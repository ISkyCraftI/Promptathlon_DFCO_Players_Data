import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { FrPipe, Panel } from "../../../shared/ui";
import { AttributeGap, Comparison } from "../../comparison.model";

/** Les trois axes de progression prioritaires (écart × importance au poste) et les acquis. */
@Component({
  selector: "ef-progress-axes",
  imports: [FrPipe, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Axes de progression" subheading="Écarts les plus importants pour le poste">
      <ol class="axes">
        @for (a of data().axes; track a.key; let i = $index) {
          <li>
            <span class="n ef-num">{{ i + 1 }}</span>
            <div>
              <div class="t"><strong>{{ a.label }}</strong><span class="ef-num">{{ a.subject }} → {{ a.reference }}</span><span class="g ef-num">+{{ a.gap | fr }}</span></div>
              <p>{{ a.advice }}</p>
            </div>
          </li>
        } @empty { <li class="none">Aucun écart significatif sur les attributs clés du poste.</li> }
      </ol>
      @if (data().strengths.length) {
        <p class="acq"><strong>Déjà au niveau :</strong> {{ list(data().strengths) }}.</p>
      }
    </ef-panel>
  `,
  styles: `
    .axes { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ef-space-3); }
    .axes li { display: flex; gap: var(--ef-space-3); }
    .n { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: var(--ef-accent-soft); color: var(--ef-accent-text); font-size: 1rem; }
    .t { display: flex; align-items: baseline; gap: var(--ef-space-3); flex-wrap: wrap; }
    .t .ef-num { color: var(--ef-text-muted); }
    .t .g { color: var(--ef-accent-text); font-size: 1.05rem; }
    p { font-size: var(--ef-text-sm); color: var(--ef-text-muted); }
    .acq { margin-top: var(--ef-space-4); padding-top: var(--ef-space-3); border-top: 1px solid var(--ef-border-subtle); }
    .acq strong { color: var(--ef-success-text); }
    .none { color: var(--ef-text-muted); }
  `,
})
export class ProgressAxes {
  readonly data = input.required<Comparison>();
  list(items: AttributeGap[]): string {
    return items.map((s) => `${s.label} (${s.subject})`).join(", ");
  }
}
