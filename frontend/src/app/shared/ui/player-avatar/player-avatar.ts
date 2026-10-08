import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { initials } from "../../utils/football";

/** Pastille joueur : initiales, anneau couleur DFCO pour l'effectif, neutre pour un prospect. */
@Component({
  selector: "ef-player-avatar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.data-kind]": "kind()", "[style.--size]": "size() + 'px'", "aria-hidden": "true" },
  template: `{{ letters() }}`,
  styles: `
    :host { --size: 36px; display: inline-grid; place-items: center; flex-shrink: 0; width: var(--size); height: var(--size);
      border-radius: 50%; font-family: var(--ef-font-display); font-weight: 700; font-size: calc(var(--size) * 0.4);
      letter-spacing: 0.02em; color: var(--ef-accent-text); background: var(--ef-accent-soft);
      box-shadow: inset 0 0 0 1.5px var(--ef-accent-border); }
    :host([data-kind="PROSPECT"]) { color: var(--ef-info-text); background: var(--ef-info-soft); box-shadow: inset 0 0 0 1.5px var(--blue-7); }
  `,
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly kind = input<string>("DFCO");
  readonly size = input(36);
  readonly letters = computed(() => initials(this.name()));
}
