import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { Rating } from "../rating/rating";

export interface FcCardStat { short: string; value: number | null; }

/** Carte façon FC : note générale, poste et six notes globales, en version épurée. */
@Component({
  selector: "ef-fc-card",
  imports: [Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.data-kind]": "kind()" },
  template: `
    <div class="top">
      <div class="ovr">
        <strong class="ef-num">{{ overall() ?? "—" }}</strong>
        <span class="ef-num">{{ position() }}</span>
      </div>
      <span class="source">{{ source() }}</span>
    </div>
    <ul class="stats">
      @for (s of stats(); track s.short) {
        <li><span>{{ s.short }}</span><ef-rating [value]="s.value" /></li>
      }
    </ul>
  `,
  styleUrl: "./fc-card.css",
})
export class FcCard {
  readonly overall = input<number | null>(null);
  readonly position = input.required<string>();
  readonly kind = input("DFCO");
  readonly stats = input.required<FcCardStat[]>();
  readonly fc27 = input(true);
  readonly source = computed(() => (this.fc27() ? "Notes FC 27" : "Notes simulées"));
}
