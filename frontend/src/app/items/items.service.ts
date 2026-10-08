/**
 * EXAMPLE — feature CRUD de reference (desactivee).
 * Garder ce dossier comme template pour de nouvelles features.
 * Reactiver : decommenter la route dans app.routes.ts
 * et ajouter une entree dans shared/components/menu-bar.
 */

import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { Item, ItemCreate, ItemSchema } from "./items.model";

@Injectable({
  providedIn: "root",
})
export class ItemsService {
  //
  //   Interfaces
  //

  private readonly http = inject(AsyncHttpClient);

  //
  //   Methods
  //

  public getAllItems(): Observable<Item[]> {
    return this.http.get<Item[]>("/items/").pipe(
      map((response) => {
        if (!(response instanceof Array)) {
          throw new TypeError("Invalid response format !");
        }

        return response.map((item) => ItemSchema.parse(item));
      }),
    );
  }

  public getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`/items/${id}`).pipe(
      map((response) => ItemSchema.parse(response)),
    );
  }

  public addItem(payload: ItemCreate): Observable<Item> {
    return this.http.post<Item>({
      endpoint: "/items/",
      json: payload,
    }).pipe(
      map((response) => ItemSchema.parse(response)),
    );
  }

  public editItem(id: number, payload: ItemCreate): Observable<Item> {
    return this.http.put<Item>({
      endpoint: `/items/${id}`,
      json: payload,
    }).pipe(
      map((response) => ItemSchema.parse(response)),
    );
  }

  public deleteItem(id: number): Observable<unknown> {
    return this.http.delete(`/items/${id}`);
  }

  //
  //   Refreshable data
  //

  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);

  public refresh(): void {
    this.refreshTrigger.next();
  }

  public items = toSignal(
    this.refreshTrigger.pipe(
      switchMap(() => this.getAllItems())
    )
  );
}
