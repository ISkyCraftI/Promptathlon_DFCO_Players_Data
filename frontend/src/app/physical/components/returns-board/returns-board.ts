import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EmptyState, Panel, PlayerAvatar, RecoverySteps, StatusTag } from "../../../shared/ui";
import { ReturnToPlay } from "../../physical.model";

/** Retours de blessure en cours, du plus proche au plus lointain. */
@Component({
  selector: "ef-returns-board",
  imports: [RouterLink, EmptyState, Panel, PlayerAvatar, RecoverySteps, StatusTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Retours de blessure" [subheading]="returns().length + ' parcours en cours'">
      <ul>
        @for (r of returns(); track r.id) {
          <li>
            <div class="who">
              <ef-player-avatar [name]="r.name" [size]="30" />
              <span><a [routerLink]="['/effectif', r.id]" [queryParams]="{ onglet: 'physical' }">{{ r.name }}</a><small>{{ r.injury }}</small></span>
              <ef-status-tag [status]="r.status" />
            </div>
            <ef-recovery-steps [steps]="r.steps" [current]="r.current_step" [progress]="r.progress" [returnDate]="r.return_date" [daysLeft]="r.days_left" />
          </li>
        } @empty {
          <ef-empty-state icon="pi-heart" heading="Aucun retour en cours" text="Aucun joueur n'est blessé ou en réathlétisation." />
        }
      </ul>
      <p class="note">Avancement estimé à partir des dates prévues. La reprise est validée par le staff médical.</p>
    </ef-panel>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; display: grid; }
    li { display: grid; gap: var(--ef-space-3); padding: var(--ef-space-4) 0; }
    li:first-child { padding-top: 0; }
    li + li { border-top: 1px solid var(--ef-border-subtle); }
    .who { display: flex; align-items: center; gap: var(--ef-space-3); }
    .who > span { display: grid; flex: 1; min-width: 0; }
    .who a { font-weight: 700; text-decoration: none; }
    .who a:hover { color: var(--ef-accent-text); }
    small { color: var(--ef-text-muted); font-size: var(--ef-text-xs); }
    .note { font-size: var(--ef-text-xs); color: var(--ef-text-faint); }
  `,
})
export class ReturnsBoard {
  readonly returns = input.required<ReturnToPlay[]>();
}
