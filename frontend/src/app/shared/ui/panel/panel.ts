import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Conteneur de section : bordure fine, titre optionnel, zone d'actions projetée ([panel-actions]). */
@Component({
  selector: "ef-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.flush]": "flush()" },
  template: `
    @if (heading() || subheading()) {
      <header class="panel-head">
        <div>
          @if (heading()) { <h2 class="panel-title">{{ heading() }}</h2> }
          @if (subheading()) { <p class="panel-sub">{{ subheading() }}</p> }
        </div>
        <div class="panel-actions"><ng-content select="[panel-actions]" /></div>
      </header>
    }
    <div class="panel-body"><ng-content /></div>
  `,
  styleUrl: "./panel.css",
})
export class Panel {
  readonly heading = input<string>();
  readonly subheading = input<string>();
  /** Supprime le padding du corps (tableaux bord à bord). */
  readonly flush = input(false);
}
