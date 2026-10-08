import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { EurPipe, FcCard, FrPipe, Pitch, PitchMarker, PlayerAvatar, StatusTag } from "../../../shared/ui";
import { POSITION_COORDS, POSITION_LABELS } from "../../../shared/utils/football";
import { PlayerDetail } from "../../players.model";
import { cardStats } from "../../players.utils";

/** Bandeau d'identité : nom, poste sur le terrain, carte de notes et raccourcis vers les autres outils. */
@Component({
  selector: "ef-player-hero",
  imports: [RouterLink, ButtonModule, TagModule, EurPipe, FcCard, FrPipe, Pitch, PlayerAvatar, StatusTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./player-hero.html",
  styleUrl: "./player-hero.css",
})
export class PlayerHero {
  readonly detail = input.required<PlayerDetail>();
  readonly youngMaxAge = input(21);
  readonly player = computed(() => this.detail().player);
  readonly stats = computed(() => cardStats(this.player()));
  /** Mode de la page Comparaison : prospect, jeune du club ou joueur du collectif. */
  readonly compareMode = computed(() => {
    const p = this.player();
    if (p.kind === "PROSPECT") return "prospect";
    return p.age <= this.youngMaxAge() ? "young" : "squad";
  });
  readonly positionLabel = computed(() => POSITION_LABELS[this.player().position] ?? this.player().position);
  readonly marker = computed<PitchMarker[]>(() => {
    const [x, y] = POSITION_COORDS[this.player().position] ?? POSITION_COORDS[this.player().role] ?? [50, 50];
    return [{ x, y, label: this.player().position, tone: this.player().kind === "DFCO" ? "accent" : "info" }];
  });
}
