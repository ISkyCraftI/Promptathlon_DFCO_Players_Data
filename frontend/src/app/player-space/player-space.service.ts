import { inject, Injectable } from "@angular/core";
import { catchError, forkJoin, Observable, of } from "rxjs";
import { Comparison } from "../comparison/comparison.model";
import { ComparisonService } from "../comparison/comparison.service";
import { PlayerLoadDetail } from "../physical/physical.model";
import { PhysicalService } from "../physical/physical.service";
import { PlayerDetail } from "../players/players.model";
import { PlayersService } from "../players/players.service";

export interface PlayerSpace {
  detail: PlayerDetail;
  load: PlayerLoadDetail;
  /** Objectifs issus de la comparaison avec la référence du poste (null si aucune référence). */
  goals: Comparison | null;
}

/** Compose les API existantes pour la vue personnelle du joueur (aucun endpoint dédié nécessaire). */
@Injectable({ providedIn: "root" })
export class PlayerSpaceService {
  private readonly players = inject(PlayersService);
  private readonly physical = inject(PhysicalService);
  private readonly comparison = inject(ComparisonService);

  load(id: string): Observable<PlayerSpace> {
    return forkJoin({
      detail: this.players.detail(id),
      load: this.physical.player(id),
      goals: this.comparison.compare(id).pipe(catchError(() => of(null))),
    });
  }
}
