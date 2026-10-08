import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { ErrorWrapper } from "../shared/errors/error-wrapper";
import {
  EMPTY_FILTERS,
  Prospect,
  ProspectFilters,
  ProspectSchema,
  SuggestionsPayload,
  SuggestionsSchema,
} from "./prospection.model";
import { z } from "zod";

export interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

@Injectable({providedIn: "root"})
export class ProspectionService {
  private readonly http = inject(AsyncHttpClient);
  private readonly filters$ = new BehaviorSubject<ProspectFilters>({...EMPTY_FILTERS});
  private readonly suggestionRole$ = new BehaviorSubject<string | null>(null);

  readonly searchState = toSignal(this.filters$.pipe(
    switchMap(filters => this.search(filters).pipe(
      map(data => ({data, loading: false, error: null} as LoadState<Prospect[]>)),
      startWith({data: null, loading: true, error: null} as LoadState<Prospect[]>),
      catchError(error => of({
        data: null,
        loading: false,
        error: this.errorMessage(error),
      } as LoadState<Prospect[]>)),
    )),
  ), {initialValue: {data: null, loading: true, error: null} as LoadState<Prospect[]>});

  readonly suggestionState = toSignal(this.suggestionRole$.pipe(
    switchMap(role => this.suggestions(role).pipe(
      map(data => ({data, loading: false, error: null} as LoadState<SuggestionsPayload>)),
      startWith({data: null, loading: true, error: null} as LoadState<SuggestionsPayload>),
      catchError(error => of({
        data: null,
        loading: false,
        error: this.errorMessage(error),
      } as LoadState<SuggestionsPayload>)),
    )),
  ), {initialValue: {data: null, loading: true, error: null} as LoadState<SuggestionsPayload>});

  search(filters: ProspectFilters): Observable<Prospect[]> {
    const params: Record<string, string | number> = {};
    if (filters.q.trim()) params["q"] = filters.q.trim();
    if (filters.role) params["role"] = filters.role;
    if (filters.foot) params["foot"] = filters.foot;
    if (filters.age_min != null) params["age_min"] = filters.age_min;
    if (filters.age_max != null) params["age_max"] = filters.age_max;
    if (filters.overall_min != null) params["overall_min"] = filters.overall_min;
    if (filters.vitesse_min != null) params["vitesse_min"] = filters.vitesse_min;
    if (filters.frappe_min != null) params["frappe_min"] = filters.frappe_min;
    if (filters.passe_min != null) params["passe_min"] = filters.passe_min;
    if (filters.dribble_min != null) params["dribble_min"] = filters.dribble_min;
    if (filters.defense_min != null) params["defense_min"] = filters.defense_min;
    if (filters.physique_min != null) params["physique_min"] = filters.physique_min;
    return this.http.get<unknown>("/prospection/prospects/", params).pipe(
      map(data => z.array(ProspectSchema).parse(data)),
    );
  }

  suggestions(role: string | null = null): Observable<SuggestionsPayload> {
    const params: Record<string, string | number> = {limit: 8};
    if (role) params["role"] = role;
    return this.http.get<unknown>("/prospection/suggestions/", params).pipe(
      map(data => SuggestionsSchema.parse(data)),
    );
  }

  setFilters(filters: ProspectFilters): void {
    this.filters$.next({...filters});
  }

  resetFilters(): void {
    this.filters$.next({...EMPTY_FILTERS});
  }

  setSuggestionRole(role: string | null): void {
    this.suggestionRole$.next(role);
  }

  refresh(): void {
    this.filters$.next({...this.filters$.value});
    this.suggestionRole$.next(this.suggestionRole$.value);
  }

  errorMessage(error: unknown): string {
    return error instanceof ErrorWrapper
      ? error.userSafeDescription
      : "Impossible de charger la prospection. Vérifiez que le serveur est démarré.";
  }

  initials(name: string): string {
    return name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("");
  }
}
