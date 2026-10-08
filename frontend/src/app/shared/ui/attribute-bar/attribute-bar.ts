import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { ratingTier } from "../../utils/football";

/** Ligne d'attribut : libellé, jauge 0-100, valeur. `reference` ajoute un repère (comparaison). */
@Component({
  selector: "ef-attribute-bar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.data-tier]": "tier()" },
  template: `
    <span class="label">{{ label() }}</span>
    <span class="track" role="img" [attr.aria-label]="label() + ' : ' + (value() ?? 'non renseigné') + (reference() !== null ? ', référence ' + reference() : '')">
      <span class="fill" [style.width.%]="value() ?? 0"></span>
      @if (reference() !== null) { <span class="marker" [style.left.%]="reference()"></span> }
    </span>
    <span class="value ef-num">{{ value() ?? "—" }}</span>
  `,
  styleUrl: "./attribute-bar.css",
})
export class AttributeBar {
  readonly label = input.required<string>();
  readonly value = input<number | null | undefined>(null);
  readonly reference = input<number | null>(null);
  readonly tier = computed(() => ratingTier(this.value()));
}
