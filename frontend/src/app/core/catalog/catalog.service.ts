import { computed, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, shareReplay } from "rxjs";
import { AsyncHttpClient } from "../../shared/services/async-http-client";
import { toLoadState } from "../../shared/state/load-state";
import { Catalog, CatalogSchema } from "./catalog.model";

/** Référentiel football (attributs, groupes, postes) chargé une fois et partagé par toutes les features. */
@Injectable({ providedIn: "root" })
export class CatalogService {
  private readonly http = inject(AsyncHttpClient);
  readonly catalog$ = this.http.get<unknown>("/catalog/").pipe(map((d) => CatalogSchema.parse(d)), shareReplay(1));
  readonly state = toSignal(this.catalog$.pipe(toLoadState<Catalog>()), { requireSync: false, initialValue: { data: null, loading: true, error: null } });
  /** Libellé français d'un attribut (clé API -> « Vitesse de pointe »). */
  readonly labels = computed(() => Object.fromEntries(
    (this.state().data?.groups ?? []).flatMap((g) => g.attributes.map((a) => [a.key, a.label])),
  ) as Record<string, string>);
}
