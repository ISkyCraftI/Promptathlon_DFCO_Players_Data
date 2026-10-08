import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Parcours de retour au jeu : étapes, étape en cours, date prévue. Lecture staff, pas une validation médicale. */
@Component({
  selector: "ef-recovery-steps",
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <strong>{{ steps()[current()] || "Disponible" }}</strong>
      @if (returnDate()) { <span>Retour prévu le {{ returnDate() | date: "d MMMM" }}@if (daysLeft() !== null) { <em>· J-{{ daysLeft() }}</em> }</span> }
    </div>
    <div class="bar" role="progressbar" [attr.aria-valuenow]="progress()" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Avancement estimé ' + progress() + ' %'">
      <span [style.width.%]="progress()"></span>
    </div>
    <ol>
      @for (s of steps(); track s; let i = $index) {
        <li [class.done]="i < current()" [class.current]="i === current()">
          <span class="dot">@if (i < current()) { <i class="pi pi-check"></i> } @else { <b>{{ i + 1 }}</b> }</span>{{ s }}
        </li>
      }
    </ol>
  `,
  styleUrl: "./recovery-steps.css",
})
export class RecoverySteps {
  readonly steps = input.required<string[]>();
  readonly current = input.required<number>();
  readonly progress = input(0);
  readonly returnDate = input<string | null>(null);
  readonly daysLeft = input<number | null>(null);
}
