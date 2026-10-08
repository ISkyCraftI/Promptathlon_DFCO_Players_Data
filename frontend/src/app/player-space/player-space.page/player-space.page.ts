import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { SelectModule } from "primeng/select";
import { combineLatest, of, switchMap } from "rxjs";
import { FollowupForm } from "../../players/components/followup-form/followup-form";
import { ReadinessCard } from "../../players/components/readiness-card/readiness-card";
import { PlayersService } from "../../players/players.service";
import { LoadChart } from "../../shared/charts/load-chart/load-chart";
import { LoadState, toLoadState } from "../../shared/state/load-state";
import { AsyncState, EmptyState, FrPipe, PageHeader, Panel, PlayerAvatar, RecoverySteps } from "../../shared/ui";
import { PlayerSpace, PlayerSpaceService } from "../player-space.service";

const IDLE = { data: null, loading: false, error: null } as LoadState<PlayerSpace>;
const ZONE_TEXT: Record<string, string> = {
  "sous-charge": "Votre charge de la semaine est plus basse que d'habitude.",
  optimale: "Votre charge de la semaine est dans vos habitudes.",
  vigilance: "Votre semaine est plus chargée que d'habitude : signalez toute fatigue.",
  risque: "Votre semaine est nettement plus chargée que d'habitude : parlez-en au staff.",
  retour: "Votre charge suit votre protocole de retour, défini avec le staff médical.",
};

/** Espace personnel du joueur (démo sans authentification : le joueur est choisi dans une liste). */
@Component({
  selector: "app-player-space-page",
  imports: [DatePipe, FormsModule, RouterLink, SelectModule, FollowupForm, ReadinessCard, LoadChart, AsyncState, EmptyState, FrPipe,
    PageHeader, Panel, PlayerAvatar, RecoverySteps],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./player-space.page.html",
  styleUrl: "./player-space.page.css",
})
export class PlayerSpacePage {
  private readonly service = inject(PlayerSpaceService);
  private readonly players = inject(PlayersService);
  private readonly router = inject(Router);
  readonly id = input<string>();
  private readonly version = signal(0);
  readonly options = computed(() => (this.players.squad().data ?? []).map((p) => ({ label: `${p.name} · ${p.position}`, value: p.id }))
    .sort((a, b) => a.label.localeCompare(b.label)));
  readonly state = toSignal(combineLatest([toObservable(this.id), toObservable(this.version)]).pipe(
    switchMap(([id]) => id ? this.service.load(id).pipe(toLoadState<PlayerSpace>()) : of(IDLE)),
  ), { initialValue: IDLE });
  readonly firstName = computed(() => this.state().data?.detail.player.name.split(" ")[0] ?? "");
  readonly zoneText = computed(() => ZONE_TEXT[this.state().data?.load.player.zone ?? ""] ?? "");

  choose(id: string | null): void {
    this.router.navigate(id ? ["/mon-espace", id] : ["/mon-espace"]);
  }

  saved(): void {
    this.version.update((v) => v + 1);
  }
}
