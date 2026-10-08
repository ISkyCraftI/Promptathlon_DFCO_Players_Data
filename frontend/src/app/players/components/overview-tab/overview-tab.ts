import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RadarChart, RadarSeries } from "../../../shared/charts/radar-chart/radar-chart";
import { FrPipe, Panel, Rating, StatTile } from "../../../shared/ui";
import { PlayerDetail, RATING_GROUPS } from "../../players.model";
import { playerInsights } from "../../players.utils";

@Component({
  selector: "ef-overview-tab",
  imports: [ButtonModule, RadarChart, FrPipe, Panel, Rating, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let info = insights();
    <div class="grid">
      <ef-panel heading="Profil" [subheading]="detail().player.fc27 ? 'Six notes globales FC 27, sur 100' : 'Notes simulées, sur 100'">
        <ef-radar-chart [labels]="labels" [series]="series()" height="260px" [ariaLabel]="'Profil de ' + detail().player.name" />
        <ul class="legend">
          @for (g of groups(); track g.key) { <li><span>{{ g.label }}</span><ef-rating [value]="g.value" /></li> }
        </ul>
      </ef-panel>
      <div class="col">
        <ef-panel heading="Lecture rapide">
          <p class="read">
            Points forts : <strong>{{ info.strengths[0].label }}</strong> ({{ info.strengths[0].value }})
            et <strong>{{ info.strengths[1].label }}</strong> ({{ info.strengths[1].value }}).
            Domaine le moins noté : <strong>{{ info.improve.label }}</strong> ({{ info.improve.value }}), à confronter aux observations terrain.
          </p>
          <p-button label="Voir les attributs détaillés" icon="pi pi-list" [text]="true" size="small" (onClick)="open.emit('attributes')" />
        </ef-panel>
        <div class="tiles">
          <ef-stat-tile label="Note moyenne" [value]="info.avgRating | fr: 2" unit="/ 10" [hint]="info.appearances + ' match(s) joué(s) sur 6'" />
          <ef-stat-tile label="Minutes" [value]="info.minutes" hint="6 dernières journées" />
          <ef-stat-tile label="Buts" [value]="info.goals" />
          <ef-stat-tile label="Passes déc." [value]="info.assists" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: var(--ef-space-4); }
    .col { display: grid; gap: var(--ef-space-4); align-content: start; }
    .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ef-space-3); }
    .legend { list-style: none; margin: var(--ef-space-3) 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ef-space-2) var(--ef-space-4); }
    .legend li { display: flex; justify-content: space-between; font-size: var(--ef-text-sm); color: var(--ef-text-muted); }
    .read { color: var(--ef-text-muted); line-height: 1.6; }
    .read strong { color: var(--ef-text); }
    @media (max-width: 900px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class OverviewTab {
  readonly detail = input.required<PlayerDetail>();
  readonly open = output<string>();
  readonly labels = RATING_GROUPS.map((g) => g.label);
  readonly insights = computed(() => playerInsights(this.detail()));
  readonly groups = computed(() => RATING_GROUPS.map((g) => ({ ...g, value: this.detail().player.ratings[g.key] ?? null })));
  readonly series = computed<RadarSeries[]>(() => [{
    label: this.detail().player.name, tone: this.detail().player.kind === "DFCO" ? "accent" : "info",
    values: RATING_GROUPS.map((g) => this.detail().player.ratings[g.key] ?? 0),
  }]);
}
