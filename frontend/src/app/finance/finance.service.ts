import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { ErrorWrapper } from "../shared/errors/error-wrapper";
import { Valuation, ValuationSchema } from "./finance.model";

@Injectable({providedIn: "root"})
export class FinanceService {
  private readonly http = inject(AsyncHttpClient);

  valuation(playerId: string): Observable<Valuation> {
    return this.http.get<unknown>(
      `/finance/${encodeURIComponent(playerId)}/`,
    ).pipe(map(data => ValuationSchema.parse(data)));
  }

  errorMessage(error: unknown): string {
    return error instanceof ErrorWrapper
      ? error.userSafeDescription
      : "Impossible de calculer la valorisation.";
  }

  euros(value: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  signedEuros(value: number): string {
    const formatted = this.euros(Math.abs(value));
    if (value > 0) return "+" + formatted;
    if (value < 0) return "−" + formatted;
    return formatted;
  }
}
