import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { filter, switchMap } from "rxjs";
import { LoadChart } from "../../../shared/charts/load-chart/load-chart";
import { AsyncState, FrPipe, RecoverySteps, ZoneBadge } from "../../../shared/ui";
import { errorMessage, LOADING, LoadState, toLoadState } from "../../../shared/state/load-state";
import { Flag, PlayerLoad, PlayerLoadDetail } from "../../physical.model";
import { PhysicalService } from "../../physical.service";

/** Détail de charge d'un joueur dans un tiroir : série 21 j, signaux à marquer comme examinés, bilans. */
@Component({
  selector: "ef-player-load-drawer",
  imports: [DatePipe, FormsModule, RouterLink, ButtonModule, DrawerModule, InputTextModule, TagModule, LoadChart, AsyncState,
    FrPipe, RecoverySteps, ZoneBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./player-load-drawer.html",
  styleUrl: "./player-load-drawer.css",
})
export class PlayerLoadDrawer {
  private readonly service = inject(PhysicalService);
  private readonly destroyRef = inject(DestroyRef);
  readonly player = input<PlayerLoad | null>(null);
  readonly closed = output<void>();
  readonly visible = computed(() => this.player() !== null);
  private readonly reload = signal(0);
  readonly state = toSignal(toObservable(computed(() => ({ id: this.player()?.id, n: this.reload() }))).pipe(
    filter((v) => !!v.id), switchMap((v) => this.service.player(v.id!).pipe(toLoadState<PlayerLoadDetail>())),
  ), { initialValue: LOADING as LoadState<PlayerLoadDetail> });
  readonly notes: Record<string, string> = {};
  readonly saving = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  markReviewed(flag: Flag): void {
    const id = this.player()?.id;
    if (!id) return;
    this.saving.set(flag.code);
    this.error.set(null);
    this.service.review(id, flag.code, this.notes[flag.code] ?? "").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(null); this.reload.update((n) => n + 1); this.service.refresh(); },
      error: (e) => { this.saving.set(null); this.error.set(errorMessage(e)); },
    });
  }
}
