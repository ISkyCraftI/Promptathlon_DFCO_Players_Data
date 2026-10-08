import { catchError, map, Observable, of, OperatorFunction, startWith } from "rxjs";
import { ErrorWrapper } from "../errors/error-wrapper";

/** État d'un chargement asynchrone, consommé par les pages via un signal. */
export interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const LOADING: LoadState<never> = { data: null, loading: true, error: null };

export function errorMessage(error: unknown): string {
  return error instanceof ErrorWrapper
    ? error.userSafeDescription
    : "Impossible de charger les données. Vérifiez que le serveur est démarré.";
}

/** Transforme un flux de données en flux d'états (chargement -> données | erreur). */
export function toLoadState<T>(): OperatorFunction<T, LoadState<T>> {
  return (source: Observable<T>) => source.pipe(
    map((data) => ({ data, loading: false, error: null }) as LoadState<T>),
    startWith(LOADING as LoadState<T>),
    catchError((error) => of({ data: null, loading: false, error: errorMessage(error) } as LoadState<T>)),
  );
}
