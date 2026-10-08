import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { LoadState } from "../../state/load-state";

/** Affiche le squelette pendant le chargement ou l'erreur avec « Réessayer ». Le contenu est géré par la page. */
@Component({
  selector: "ef-async-state",
  imports: [ButtonModule, MessageModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state().loading) {
      <div class="sk" aria-busy="true" aria-label="Chargement">
        @for (h of skeleton(); track $index) { <p-skeleton [height]="h" borderRadius="10px" /> }
      </div>
    } @else if (state().error; as error) {
      <div class="err">
        <p-message severity="error">{{ error }}</p-message>
        <p-button label="Réessayer" icon="pi pi-refresh" [outlined]="true" (onClick)="retry.emit()" />
      </div>
    }
  `,
  styles: `
    .sk { display: grid; gap: var(--ef-space-4); }
    .err { display: grid; justify-items: start; gap: var(--ef-space-3); }
  `,
})
export class AsyncState {
  readonly state = input.required<LoadState<unknown>>();
  readonly skeleton = input<string[]>(["7rem", "24rem"]);
  readonly retry = output<void>();
}
