import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EmptyState, Panel, PlayerAvatar } from "../../../shared/ui";
import { Dashboard } from "../../coach.model";

/** Derniers bilans du staff et des joueurs, tous joueurs confondus. */
@Component({
  selector: "ef-activity-feed",
  imports: [DatePipe, RouterLink, EmptyState, Panel, PlayerAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Derniers bilans" subheading="Staff et joueurs">
      <ul>
        @for (a of items(); track $index) {
          <li>
            <ef-player-avatar [name]="a.player_name" [size]="28" />
            <div>
              <a [routerLink]="['/effectif', a.player_id]" [queryParams]="{ onglet: 'history' }"><strong>{{ a.player_name }}</strong></a>
              <small> · {{ a.author === "Joueur" ? "message du joueur" : "observation staff" }} · {{ a.date | date: "d MMM, HH:mm" }}</small>
              <p>{{ a.note }}</p>
              @if (a.soreness >= 4) { <span class="warn">Gêne {{ a.soreness }}/10</span> }
            </div>
          </li>
        } @empty {
          <ef-empty-state icon="pi-comments" heading="Aucun bilan récent" text="Les bilans saisis depuis les fiches ou l'espace joueur s'affichent ici." />
        }
      </ul>
    </ef-panel>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; display: grid; }
    li { display: flex; gap: var(--ef-space-3); padding: var(--ef-space-2) 0; }
    li + li { border-top: 1px solid var(--ef-border-subtle); }
    a { text-decoration: none; }
    a:hover strong { color: var(--ef-accent-text); }
    small { color: var(--ef-text-muted); font-size: var(--ef-text-xs); }
    p { font-size: var(--ef-text-sm); color: var(--ef-text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .warn { font-size: var(--ef-text-xs); font-weight: 700; color: var(--ef-warn-text); }
  `,
})
export class ActivityFeed {
  readonly items = input.required<Dashboard["activity"]>();
}
