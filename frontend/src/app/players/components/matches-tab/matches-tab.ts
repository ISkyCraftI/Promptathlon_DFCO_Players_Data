import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TableModule } from "primeng/table";
import { FrPipe, Panel } from "../../../shared/ui";
import { Match } from "../../players.model";

@Component({
  selector: "ef-matches-tab",
  imports: [DatePipe, TableModule, FrPipe, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Six dernières journées" subheading="Rencontres et statistiques de simulation" [flush]="true">
      <p-table [value]="matches()" [scrollable]="true" [tableStyle]="{ 'min-width': '720px' }">
        <ng-template #header><tr><th>Journée</th><th>Date</th><th>Lieu</th><th class="c">Min.</th><th class="c">Buts</th><th class="c">P. déc.</th><th class="c">Passes</th><th class="c">Duels</th><th class="c">Distance</th><th class="c">Note</th></tr></ng-template>
        <ng-template #body let-m>
          <tr [class.bench]="m.minutes === 0">
            <td><strong>J{{ m.matchday }}</strong></td><td>{{ m.date | date: "d MMM" }}</td><td>{{ m.venue }}</td>
            <td class="c ef-num">{{ m.minutes || "—" }}</td><td class="c ef-num">{{ m.goals }}</td><td class="c ef-num">{{ m.assists }}</td>
            <td class="c">{{ m.minutes ? m.pass_accuracy + " %" : "—" }}</td><td class="c">{{ m.minutes ? m.duels_won : "—" }}</td>
            <td class="c">{{ m.minutes ? (m.distance_km | fr) + " km" : "—" }}</td>
            <td class="c"><span class="rating ef-num" [attr.data-good]="(m.rating ?? 0) >= 7">{{ m.rating === null ? "Non utilisé" : (m.rating | fr) }}</span></td>
          </tr>
        </ng-template>
      </p-table>
    </ef-panel>
  `,
  styles: `
    .c { text-align: center; }
    .bench td { color: var(--ef-text-faint); }
    .rating { display: inline-block; min-width: 2.6rem; padding: 1px 6px; border-radius: var(--ef-radius-sm); background: var(--ef-surface-sunken); font-size: 1rem; }
    .rating[data-good="true"] { background: var(--ef-success-soft); color: var(--ef-success-text); }
  `,
})
export class MatchesTab {
  readonly matches = input.required<Match[]>();
}
