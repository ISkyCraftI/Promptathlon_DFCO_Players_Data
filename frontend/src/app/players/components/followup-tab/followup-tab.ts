import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { TagModule } from "primeng/tag";
import { EmptyState, Panel } from "../../../shared/ui";
import { PlayerDetail } from "../../players.model";
import { FollowupForm } from "../followup-form/followup-form";

/** Suivi staff : nouveau bilan, historique des échanges, blessures, ressenti et affinités (simulés). */
@Component({
  selector: "ef-followup-tab",
  imports: [DatePipe, TagModule, EmptyState, Panel, FollowupForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./followup-tab.html",
  styleUrl: "./followup-tab.css",
})
export class FollowupTab {
  readonly detail = input.required<PlayerDetail>();
  readonly saved = output<void>();
}
