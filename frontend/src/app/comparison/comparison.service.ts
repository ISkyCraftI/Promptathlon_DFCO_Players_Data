import { inject, Injectable } from "@angular/core";
import { map, Observable, shareReplay } from "rxjs";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { Candidates, CandidatesSchema, Comparison, ComparisonMode, ComparisonSchema } from "./comparison.model";

@Injectable({ providedIn: "root" })
export class ComparisonService {
  private readonly http = inject(AsyncHttpClient);
  private readonly cache = new Map<ComparisonMode, Observable<Candidates>>();

  /** Joueurs comparables et références du collectif pour un mode (mis en cache). */
  candidates(mode: ComparisonMode): Observable<Candidates> {
    if (!this.cache.has(mode)) {
      this.cache.set(mode, this.http.get<unknown>("/comparison/players/", { mode })
        .pipe(map((d) => CandidatesSchema.parse(d)), shareReplay(1)));
    }
    return this.cache.get(mode)!;
  }

  /** Sans `referenceId`, l'API choisit la référence du collectif (même poste, style le plus proche). */
  compare(subjectId: string, referenceId?: string | null, mode: ComparisonMode = "squad"): Observable<Comparison> {
    const params: Record<string, string> = { subject_id: subjectId, mode };
    if (referenceId) params["reference_id"] = referenceId;
    return this.http.get<unknown>("/comparison/", params).pipe(map((d) => ComparisonSchema.parse(d)));
  }
}
