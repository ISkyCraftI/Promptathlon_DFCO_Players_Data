import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import { ClubValue, ClubValueSchema, Valuation, ValuationSchema } from "./finance.model";

@Injectable({ providedIn: "root" })
export class FinanceService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);

  /** Valeur de l'effectif DFCO (somme des valorisations de tous les joueurs du club). */
  readonly club = toSignal(this.refreshTrigger.pipe(
    switchMap(() => this.http.get<unknown>("/finance/club/").pipe(map((d) => ClubValueSchema.parse(d)), toLoadState<ClubValue>())),
  ), { initialValue: LOADING as LoadState<ClubValue> });

  /** Valorisation auditable d'un joueur (valeur de marché, ou coût de transfert estimé pour un prospect). */
  valuation(playerId: string): Observable<Valuation> {
    return this.http.get<unknown>(`/finance/${encodeURIComponent(playerId)}/`).pipe(map((d) => ValuationSchema.parse(d)));
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
