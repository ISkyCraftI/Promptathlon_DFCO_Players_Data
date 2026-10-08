import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EurPipe, FrPipe, Panel } from "../../../shared/ui";
import { signed } from "../../../shared/utils/football";
import { Dashboard } from "../../coach.model";

/** Meilleure piste par profil de recrutement, et son écart avec l'effectif actuel. */
@Component({
  selector: "ef-pipeline-list",
  imports: [RouterLink, EurPipe, FrPipe, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Pistes de recrutement" subheading="Meilleur prospect par profil de poste">
      <a panel-actions class="more" routerLink="/recrutement">Tout voir</a>
      <ul>
        @for (p of items(); track p.profile_id) {
          <li>
            <span class="prof"><small>{{ p.profile_name }}</small>
              @if (p.candidate_id) {
                <span class="who"><a [routerLink]="['/effectif', p.candidate_id]">{{ p.candidate_name }}</a>
                  @if (p.market_value !== null) { <span class="cost" title="Coût de transfert estimé">{{ p.market_value | eur }}</span> }</span>
              } @else { <span class="ef-muted">Aucun prospect</span> }
            </span>
            @if (p.score !== null) {
              <span class="ef-num score">{{ p.score | fr }}</span>
              <span class="ef-num delta" [class.up]="(p.delta_vs_squad ?? 0) > 0" title="Écart avec le meilleur joueur de l'effectif sur ce profil">{{ signed(p.delta_vs_squad ?? 0, 1) }}</span>
            }
          </li>
        }
      </ul>
    </ef-panel>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: var(--ef-space-3); padding: var(--ef-space-2) 0; }
    li + li { border-top: 1px solid var(--ef-border-subtle); }
    .prof { display: grid; flex: 1; min-width: 0; }
    .prof small { color: var(--ef-text-muted); font-size: var(--ef-text-xs); }
    .prof a { font-weight: 700; text-decoration: none; }
    .prof a:hover { color: var(--ef-accent-text); }
    .who { display: flex; align-items: baseline; gap: var(--ef-space-2); flex-wrap: wrap; }
    .cost { font-size: var(--ef-text-xs); font-weight: 600; color: var(--ef-text-muted); }
    .score { font-size: 1.2rem; }
    .delta { min-width: 3rem; text-align: right; color: var(--ef-text-muted); }
    .delta.up { color: var(--ef-success-text); }
    .more { font-size: var(--ef-text-sm); font-weight: 600; color: var(--ef-accent-text); text-decoration: none; }
  `,
})
export class PipelineList {
  readonly items = input.required<Dashboard["pipeline"]>();
  readonly signed = signed;
}
