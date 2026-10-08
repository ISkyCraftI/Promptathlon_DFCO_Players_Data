import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { LoadChart } from "../../../shared/charts/load-chart/load-chart";
import { Panel } from "../../../shared/ui";
import { SeriesPoint, TeamLoad } from "../../physical.model";

/** Charge moyenne du groupe sur 21 jours + répartition des joueurs par zone ACWR. */
@Component({
  selector: "ef-team-load-panel",
  imports: [LoadChart, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Charge du groupe" subheading="Moyenne par joueur valide, 21 derniers jours">
      <ef-load-chart [points]="series()" height="240px" label="Charge moyenne du groupe et ratio aigu/chronique moyen" />
      <div class="zones" role="img" [attr.aria-label]="ariaZones()">
        @for (z of segments(); track z.key) {
          @if (z.count) { <span [attr.data-zone]="z.key" [style.flex-grow]="z.count"></span> }
        }
      </div>
      <ul class="legend">
        @for (z of segments(); track z.key) {
          <li><span class="sw" [attr.data-zone]="z.key"></span>{{ z.label }} <strong class="ef-num">{{ z.count }}</strong></li>
        }
      </ul>
    </ef-panel>
  `,
  styleUrl: "./team-load-panel.css",
})
export class TeamLoadPanel {
  readonly team = input.required<TeamLoad>();
  readonly series = input.required<SeriesPoint[]>();
  readonly segments = computed(() => this.team().zones);
  readonly ariaZones = computed(() => this.segments().map((z) => `${z.label} : ${z.count}`).join(", "));
}
