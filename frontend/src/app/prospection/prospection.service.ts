import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { z } from "zod";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import {
  EMPTY_FILTERS,
  Prospect,
  ProspectFilters,
  ProspectSchema,
  SuggestionsPayload,
  SuggestionsSchema,
} from "./prospection.model";

@Injectable({ providedIn: "root" })
export class ProspectionService {
  private readonly http = inject(AsyncHttpClient);
  private readonly filters$ = new BehaviorSubject<ProspectFilters>({ ...EMPTY_FILTERS });
  private readonly suggestionRole$ = new BehaviorSubject<string | null>(null);

  readonly searchState = toSignal(this.filters$.pipe(
    switchMap((filters) => this.search(filters).pipe(toLoadState<Prospect[]>())),
  ), { initialValue: LOADING as LoadState<Prospect[]> });

  readonly suggestionState = toSignal(this.suggestionRole$.pipe(
    switchMap((role) => this.suggestions(role).pipe(toLoadState<SuggestionsPayload>())),
  ), { initialValue: LOADING as LoadState<SuggestionsPayload> });

  search(filters: ProspectFilters): Observable<Prospect[]> {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === "q") {
        if (String(value).trim()) params["q"] = String(value).trim();
      } else if (value !== null && value !== undefined) {
        params[key] = value as string | number;
      }
    }
    return this.http.get<unknown>("/prospection/prospects/", params).pipe(map((d) => z.array(ProspectSchema).parse(d)));
  }

  suggestions(role: string | null = null): Observable<SuggestionsPayload> {
    const params: Record<string, string | number> = { limit: 8 };
    if (role) params["role"] = role;
    return this.http.get<unknown>("/prospection/suggestions/", params).pipe(map((d) => SuggestionsSchema.parse(d)));
  }

  setFilters(filters: ProspectFilters): void {
    this.filters$.next({ ...filters });
  }

  resetFilters(): void {
    this.filters$.next({ ...EMPTY_FILTERS });
  }

  setSuggestionRole(role: string | null): void {
    this.suggestionRole$.next(role);
  }

  refresh(): void {
    this.filters$.next({ ...this.filters$.value });
    this.suggestionRole$.next(this.suggestionRole$.value);
  }
}
