import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { AsyncState, FrPipe, PageHeader, StatTile } from "../../shared/ui";
import { signed } from "../../shared/utils/football";
import { LoadTable } from "../components/load-table/load-table";
import { PlayerLoadDrawer } from "../components/player-load-drawer/player-load-drawer";
import { ReturnsBoard } from "../components/returns-board/returns-board";
import { TeamLoadPanel } from "../components/team-load-panel/team-load-panel";
import { PlayerLoad } from "../physical.model";
import { PhysicalService } from "../physical.service";

@Component({
  selector: "app-physical-page",
  imports: [AsyncState, FrPipe, PageHeader, StatTile, LoadTable, PlayerLoadDrawer, ReturnsBoard, TeamLoadPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ef-page">
      <ef-page-header heading="Suivi physique et réathlétisation"
        description="Charge d'entraînement du groupe, signaux à examiner par le staff et retours de blessure." />
      <ef-async-state [state]="service.overview()" [skeleton]="['6.5rem', '20rem', '24rem']" (retry)="service.refresh()" />
      @if (service.overview().data; as o) {
        <div class="ef-grid ef-grid-kpi">
          <ef-stat-tile label="Charge moyenne" icon="pi-chart-bar" [value]="o.team.weekly_load_avg" unit="UA / 7 j" [hint]="change() + ' % vs semaine précédente'" />
          <ef-stat-tile label="Ratio aigu/chronique" icon="pi-sliders-h" [value]="o.team.acwr_avg | fr: 2" hint="Moyenne des joueurs valides" [tone]="(o.team.acwr_avg ?? 1) > 1.3 ? 'warn' : 'success'" />
          <ef-stat-tile label="Signaux à examiner" icon="pi-flag" [value]="o.team.open_flags" tone="warn" hint="Charge, fatigue, gêne, reprise" />
          <ef-stat-tile label="Retours de blessure" icon="pi-heart" [value]="o.returns.length" tone="info" hint="Blessés ou en réathlétisation" />
        </div>
        <div class="ef-grid ef-grid-main-aside">
          <ef-team-load-panel [team]="o.team" [series]="o.team_series" />
          <ef-returns-board [returns]="o.returns" />
        </div>
        <ef-load-table [players]="o.players" (select)="selected.set($event)" />
        <ef-player-load-drawer [player]="selected()" (closed)="selected.set(null)" />
      }
    </div>
  `,
})
export class PhysicalPage {
  readonly service = inject(PhysicalService);
  readonly selected = signal<PlayerLoad | null>(null);
  readonly change = computed(() => signed(this.service.overview().data?.team.load_change ?? 0, 1));
}
