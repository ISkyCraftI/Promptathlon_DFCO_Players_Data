import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, Observable, shareReplay, switchMap } from "rxjs";
import { z } from "zod";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import { FollowupInput, FollowupSchema, Player, PlayerDetail, PlayerDetailSchema, PlayerKind, PlayerSchema } from "./players.model";

/** Accès API joueurs + état partagé de l'effectif (rafraîchi après chaque bilan). */
@Injectable({ providedIn: "root" })
export class PlayersService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);

  /** Effectif DFCO (30 joueurs). */
  readonly squad = toSignal(this.refreshTrigger.pipe(switchMap(() => this.list("DFCO").pipe(toLoadState<Player[]>()))),
    { initialValue: LOADING as LoadState<Player[]> });

  /** Tous les joueurs (effectif + prospects), chargé à la demande pour la recherche globale. */
  readonly everyone$ = this.list("ALL").pipe(shareReplay(1));

  list(kind: PlayerKind = "DFCO"): Observable<Player[]> {
    return this.http.get<unknown>("/players/", { kind }).pipe(map((data) => z.array(PlayerSchema).parse(data)));
  }

  detail(id: string): Observable<PlayerDetail> {
    return this.http.get<unknown>(`/players/${encodeURIComponent(id)}`).pipe(map((data) => PlayerDetailSchema.parse(data)));
  }

  saveFollowup(id: string, payload: FollowupInput) {
    return this.http.post<unknown>({ endpoint: `/players/${encodeURIComponent(id)}/followups/`, json: payload })
      .pipe(map((data) => FollowupSchema.parse(data)));
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
