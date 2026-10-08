import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import { FlagCode, OverviewSchema, PhysicalOverview, PlayerLoadDetail, PlayerLoadDetailSchema, Review, ReviewSchema } from "./physical.model";

@Injectable({ providedIn: "root" })
export class PhysicalService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);

  readonly overview = toSignal(this.refreshTrigger.pipe(
    switchMap(() => this.http.get<unknown>("/physical/overview/").pipe(map((d) => OverviewSchema.parse(d)), toLoadState<PhysicalOverview>())),
  ), { initialValue: LOADING as LoadState<PhysicalOverview> });

  player(id: string): Observable<PlayerLoadDetail> {
    return this.http.get<unknown>(`/physical/players/${encodeURIComponent(id)}/`).pipe(map((d) => PlayerLoadDetailSchema.parse(d)));
  }

  review(playerId: string, flag: FlagCode, note: string): Observable<Review> {
    return this.http.post<unknown>({ endpoint: "/physical/reviews/", json: { player_id: playerId, flag, note } })
      .pipe(map((d) => ReviewSchema.parse(d)));
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
