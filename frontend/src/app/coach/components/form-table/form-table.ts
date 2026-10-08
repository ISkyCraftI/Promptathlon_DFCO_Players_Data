import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FrPipe, Panel } from "../../../shared/ui";
import { Dashboard } from "../../coach.model";

/** Joueurs en forme : note moyenne sur les six dernières journées et suite des notes. */
@Component({
  selector: "ef-form-table",
  imports: [RouterLink, FrPipe, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Joueurs en forme" subheading="Note moyenne sur 10, six dernières journées (simulées)">
      <ol>
        @for (f of form(); track f.id) {
          <li>
            <a [routerLink]="['/effectif', f.id]" [queryParams]="{ onglet: 'matches' }"><strong>{{ f.name }}</strong><small>{{ f.role }} · {{ f.minutes }} min · {{ f.goals }} b · {{ f.assists }} pd</small></a>
            <span class="seq" aria-hidden="true">
              @for (r of f.ratings; track $index) { <span [attr.data-good]="(r ?? 0) >= 7" [class.none]="r === null">{{ r === null ? "–" : (r | fr) }}</span> }
            </span>
            <span class="avg ef-num">{{ f.rating | fr: 2 }}</span>
          </li>
        }
      </ol>
    </ef-panel>
  `,
  styles: `
    ol { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: var(--ef-space-3); padding: var(--ef-space-2) 0; }
    li + li { border-top: 1px solid var(--ef-border-subtle); }
    a { display: grid; flex: 1; min-width: 0; text-decoration: none; }
    a:hover strong { color: var(--ef-accent-text); }
    small { color: var(--ef-text-muted); font-size: var(--ef-text-xs); }
    .seq { display: flex; gap: 3px; }
    .seq span { width: 2rem; padding: 1px 0; text-align: center; border-radius: 4px; background: var(--ef-surface-sunken);
      font-family: var(--ef-font-display); font-weight: 600; font-size: 0.85rem; color: var(--ef-text-muted); }
    .seq span[data-good="true"] { background: var(--ef-success-soft); color: var(--ef-success-text); }
    .seq span.none { color: var(--ef-text-faint); }
    .avg { font-size: 1.35rem; min-width: 3rem; text-align: right; }
    @media (max-width: 560px) { .seq { display: none; } }
  `,
})
export class FormTable {
  readonly form = input.required<Dashboard["form"]>();
}
