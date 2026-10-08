import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, switchMap } from "rxjs";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import { Dashboard, DashboardSchema } from "./coach.model";

@Injectable({ providedIn: "root" })
export class CoachService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);
  readonly dashboard = toSignal(this.refreshTrigger.pipe(
    switchMap(() => this.http.get<unknown>("/coach/dashboard/").pipe(map((d) => DashboardSchema.parse(d)), toLoadState<Dashboard>())),
  ), { initialValue: LOADING as LoadState<Dashboard> });

  refresh(): void {
    this.refreshTrigger.next();
  }
}
