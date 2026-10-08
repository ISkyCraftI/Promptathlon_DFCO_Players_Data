import { ChangeDetectionStrategy, Component, computed, inject, model } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { SelectModule } from "primeng/select";
import { of, switchMap } from "rxjs";
import { PlayersService } from "../../../players/players.service";
import { LoadState, toLoadState } from "../../../shared/state/load-state";
import { AsyncState, EmptyState, EurPipe, FrPipe, Panel, PlayerAvatar, Rating } from "../../../shared/ui";
import { Similar } from "../../recruitment.model";
import { RecruitmentService } from "../../recruitment.service";

/** « Trouver un profil similaire » : prospects du même poste au style le plus proche d'un joueur de l'effectif. */
@Component({
  selector: "ef-similar-finder",
  imports: [FormsModule, RouterLink, SelectModule, AsyncState, EmptyState, EurPipe, FrPipe, Panel, PlayerAvatar, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./similar-finder.html",
  styleUrl: "./similar-finder.css",
})
export class SimilarFinder {
  private readonly service = inject(RecruitmentService);
  private readonly players = inject(PlayersService);
  readonly playerId = model<string | null>(null);
  readonly options = computed(() => (this.players.squad().data ?? []).map((p) => ({ label: `${p.name} · ${p.position}`, value: p.id }))
    .sort((a, b) => a.label.localeCompare(b.label)));
  readonly state = toSignal(toObservable(this.playerId).pipe(
    switchMap((id) => id ? this.service.similar(id).pipe(toLoadState<Similar[]>()) : of({ data: null, loading: false, error: null } as LoadState<Similar[]>)),
  ), { initialValue: { data: null, loading: false, error: null } as LoadState<Similar[]> });
}
