import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { FrPipe, Panel } from "../../../shared/ui";
import { PlayerDetail } from "../../players.model";

/** Colonne de décision : état physique, signaux à examiner (cliquables) et dernière séance. */
@Component({
  selector: "ef-readiness-card",
  imports: [DatePipe, ButtonModule, FrPipe, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./readiness-card.html",
  styleUrl: "./readiness-card.css",
})
export class ReadinessCard {
  readonly detail = input.required<PlayerDetail>();
  readonly playerView = input(false);
  readonly open = output<string>();
}
