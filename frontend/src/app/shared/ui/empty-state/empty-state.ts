import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Absence de contenu : explique quoi faire ensuite (bouton projeté). */
@Component({
  selector: "ef-empty-state",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <i [class]="'pi ' + icon()" aria-hidden="true"></i>
    <strong>{{ heading() }}</strong>
    @if (text()) { <p>{{ text() }}</p> }
    <ng-content />
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: var(--ef-space-2); padding: var(--ef-space-6) var(--ef-space-4); text-align: center; }
    i { font-size: 1.25rem; color: var(--ef-text-faint); }
    p { color: var(--ef-text-muted); max-width: 46ch; font-size: var(--ef-text-sm); }
  `,
})
export class EmptyState {
  readonly icon = input("pi-inbox");
  readonly heading = input.required<string>();
  readonly text = input<string>();
}
