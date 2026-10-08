import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { Tone } from "../../utils/football";

/** Indicateur clé : libellé, valeur en police condensée, unité et précision. */
@Component({
  selector: "ef-stat-tile",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.data-tone]": "tone()" },
  template: `
    <span class="label">@if (icon()) {<i [class]="'pi ' + icon()" aria-hidden="true"></i>} {{ label() }}</span>
    <strong class="value ef-num">{{ value() }}@if (unit()) {<small>{{ unit() }}</small>}</strong>
    @if (hint()) { <span class="hint">{{ hint() }}</span> }
  `,
  styleUrl: "./stat-tile.css",
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly unit = input<string>();
  readonly hint = input<string>();
  readonly icon = input<string>();
  readonly tone = input<Tone>("neutral");
}
