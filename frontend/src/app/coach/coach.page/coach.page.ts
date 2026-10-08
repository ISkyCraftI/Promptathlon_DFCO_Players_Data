import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { LoadChart } from "../../shared/charts/load-chart/load-chart";
import { AsyncState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, StatTile } from "../../shared/ui";
import { ActivityFeed } from "../components/activity-feed/activity-feed";
import { FormTable } from "../components/form-table/form-table";
import { LineupPanel } from "../components/lineup-panel/lineup-panel";
import { PipelineList } from "../components/pipeline-list/pipeline-list";
import { CoachService } from "../coach.service";

/** Tableau de bord de l'entraîneur : agrège effectif, physique, suivi et recrutement. */
@Component({
  selector: "app-coach-page",
  imports: [DatePipe, RouterLink, ButtonModule, LoadChart, AsyncState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, StatTile, ActivityFeed,
    FormTable, LineupPanel, PipelineList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./coach.page.html",
  styleUrl: "./coach.page.css",
})
export class CoachPage {
  readonly service = inject(CoachService);
}
