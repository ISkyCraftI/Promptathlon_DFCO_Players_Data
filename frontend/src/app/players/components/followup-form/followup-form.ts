import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { SliderModule } from "primeng/slider";
import { TextareaModule } from "primeng/textarea";
import { errorMessage } from "../../../shared/state/load-state";
import { Followup } from "../../players.model";
import { PlayersService } from "../../players.service";

/** Bilan de suivi (staff ou joueur) : fatigue, gêne, effort perçu et message. Réutilisé dans la fiche et l'espace joueur. */
@Component({
  selector: "ef-followup-form",
  imports: [FormsModule, ButtonModule, InputNumberModule, MessageModule, SliderModule, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./followup-form.html",
  styleUrl: "./followup-form.css",
})
export class FollowupForm {
  private readonly players = inject(PlayersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly playerId = input.required<string>();
  readonly author = input<"Staff" | "Joueur">("Staff");
  readonly initialFatigue = input(30);
  readonly saved = output<Followup>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  draft = { note: "", fatigue: 30, soreness: 0, rpe: 5 };

  constructor() {
    effect(() => { this.draft.fatigue = this.initialFatigue(); });
  }

  submit(): void {
    if (this.saving()) return;
    if (this.draft.note.trim().length < 3) {
      this.error.set("Ajoutez un message d'au moins trois caractères.");
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    this.players.saveFollowup(this.playerId(), { ...this.draft, author: this.author() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          this.saving.set(false);
          this.success.set(true);
          this.draft.note = "";
          this.players.refresh();
          this.saved.emit(entry);
        },
        error: (e) => {
          this.saving.set(false);
          this.error.set(errorMessage(e));
        },
      });
  }
}
