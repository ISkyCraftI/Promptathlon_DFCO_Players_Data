import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { LowerCasePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { EmptyState, EurPipe, FrPipe, PlayerAvatar, Rating } from "../../../shared/ui";
import { signed } from "../../../shared/utils/football";
import { Shortlist } from "../../recruitment.model";

/** Prospects classés par adéquation au profil, comparés au meilleur joueur de l'effectif sur ce même profil. */
@Component({
  selector: "ef-shortlist",
  imports: [LowerCasePipe, RouterLink, TableModule, TagModule, EmptyState, EurPipe, FrPipe, PlayerAvatar, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./shortlist.html",
  styleUrl: "./shortlist.css",
})
export class ShortlistView {
  readonly data = input.required<Shortlist>();
  readonly signed = signed;
  /** La barre zoome sur 40-90 : les écarts entre prospects restent lisibles. */
  bar(score: number): number { return Math.max(2, Math.min(100, (score - 40) / 50 * 100)); }
  readonly squadTop = computed(() => this.data().squad.slice(0, 4));
}
