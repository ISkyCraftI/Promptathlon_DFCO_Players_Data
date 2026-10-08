import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { z } from "zod";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { LOADING, LoadState, toLoadState } from "../shared/state/load-state";
import { Profile, ProfileInput, ProfileSchema, Shortlist, ShortlistSchema, Similar, SimilarSchema } from "./recruitment.model";

@Injectable({ providedIn: "root" })
export class RecruitmentService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);

  readonly profiles = toSignal(this.refreshTrigger.pipe(
    switchMap(() => this.http.get<unknown>("/recruitment/profiles/").pipe(map((d) => z.array(ProfileSchema).parse(d)), toLoadState<Profile[]>())),
  ), { initialValue: LOADING as LoadState<Profile[]> });

  shortlist(profileId: number, limit = 20): Observable<Shortlist> {
    return this.http.get<unknown>(`/recruitment/profiles/${profileId}/candidates/`, { limit }).pipe(map((d) => ShortlistSchema.parse(d)));
  }

  similar(playerId: string, limit = 8): Observable<Similar[]> {
    return this.http.get<unknown>(`/recruitment/similar/${encodeURIComponent(playerId)}/`, { limit }).pipe(map((d) => z.array(SimilarSchema).parse(d)));
  }

  save(profile: ProfileInput, id?: number): Observable<Profile> {
    const request = id
      ? this.http.put<unknown>({ endpoint: `/recruitment/profiles/${id}`, json: profile })
      : this.http.post<unknown>({ endpoint: "/recruitment/profiles/", json: profile });
    return request.pipe(map((d) => ProfileSchema.parse(d)));
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete<unknown>(`/recruitment/profiles/${id}`);
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
