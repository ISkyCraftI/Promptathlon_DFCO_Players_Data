import { DatePipe, DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { LoadChart } from "../../../shared/charts/load-chart/load-chart";
import { FrPipe, Panel, RecoverySteps, StatTile, ZoneBadge } from "../../../shared/ui";
import { signed } from "../../../shared/utils/football";
import { PlayerDetail } from "../../players.model";
import { playerInsights } from "../../players.utils";

@Component({
  selector: "ef-physical-tab",
  imports: [DatePipe, DecimalPipe, RouterLink, ButtonModule, TableModule, LoadChart, FrPipe, Panel, RecoverySteps, StatTile, ZoneBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./physical-tab.html",
  styles: `
    :host { display: grid; gap: var(--ef-space-4); }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--ef-space-3); }
    .head { display: flex; align-items: center; gap: var(--ef-space-3); flex-wrap: wrap; margin-bottom: var(--ef-space-3); font-size: var(--ef-text-sm); color: var(--ef-text-muted); }
    .head strong { color: var(--ef-text); font-size: 1.5rem; }
    .note { margin-top: var(--ef-space-2); font-size: var(--ef-text-xs); color: var(--ef-text-faint); }
  `,
})
export class PhysicalTab {
  readonly detail = input.required<PlayerDetail>();
  readonly info = computed(() => playerInsights(this.detail()));
  readonly change = computed(() => signed(this.detail().player.load_change) + " %");
  readonly points = computed(() => this.detail().sessions.map((s) => ({ date: s.date, load: s.load })));
}
