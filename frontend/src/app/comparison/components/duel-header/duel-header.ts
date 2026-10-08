import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EurPipe, FcCard, FrPipe, PlayerAvatar } from "../../../shared/ui";
import { signedEuros } from "../../../shared/utils/football";
import { RATING_GROUPS } from "../../../players/players.model";
import { Comparison, MODE_COPY, PlayerLite } from "../../comparison.model";

/** Face-à-face joueur comparé / référence : deux cartes, leur valeur, et la similarité de style au centre. */
@Component({
  selector: "ef-duel-header",
  imports: [RouterLink, EurPipe, FcCard, FrPipe, PlayerAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = data();
    <div class="side">
      <div class="who"><ef-player-avatar [name]="c.subject.name" [kind]="c.subject.kind" [size]="40" />
        <span><small>{{ subjectLabel() }} · {{ c.subject.age }} ans</small><a [routerLink]="['/effectif', c.subject.id]">{{ c.subject.name }}</a>
          <em class="price">{{ c.subject.kind === "PROSPECT" ? "Coût estimé" : "Valeur" }} <b class="ef-num">{{ c.subject.market_value | eur }}</b></em></span></div>
      <ef-fc-card [overall]="c.subject.overall" [position]="c.subject.position" [kind]="c.subject.kind" [stats]="stats(c.subject)" />
    </div>
    <div class="mid">
      <span class="ef-num sim">{{ c.similarity | fr: 0 }}<small>%</small></span>
      <span class="lbl">de similarité de style</span>
      @if (c.overall_gap !== null) { <span class="gap">{{ levelText() }}</span> }
      <span class="value" [title]="'Écart de valeur estimée avec ' + c.reference.name">{{ valueText() }}</span>
    </div>
    <div class="side">
      <div class="who"><ef-player-avatar [name]="c.reference.name" [kind]="c.reference.kind" [size]="40" />
        <span><small>Référence {{ c.reference_auto ? "proposée" : "choisie" }} · {{ c.reference.age }} ans</small><a [routerLink]="['/effectif', c.reference.id]">{{ c.reference.name }}</a>
          <em class="price">Valeur <b class="ef-num">{{ c.reference.market_value | eur }}</b></em></span></div>
      <ef-fc-card [overall]="c.reference.overall" [position]="c.reference.position" [kind]="c.reference.kind" [stats]="stats(c.reference)" />
    </div>
  `,
  styles: `
    :host { display: grid; grid-template-columns: minmax(0, 1fr) 200px minmax(0, 1fr); gap: var(--ef-space-4); align-items: end; }
    .side { display: grid; gap: var(--ef-space-3); }
    .who { display: flex; align-items: center; gap: var(--ef-space-3); }
    .who span { display: grid; }
    .who small { color: var(--ef-text-muted); font-size: var(--ef-text-xs); font-weight: 600; }
    .who a { font-family: var(--ef-font-display); font-size: 1.6rem; font-weight: 700; line-height: 1.1; text-decoration: none; }
    .who a:hover { color: var(--ef-accent-text); }
    .price { font-style: normal; font-size: var(--ef-text-xs); color: var(--ef-text-muted); }
    .price b { font-size: 1.05rem; color: var(--ef-text); margin-left: 2px; }
    .mid { display: grid; justify-items: center; text-align: center; gap: 2px; padding-bottom: var(--ef-space-5); }
    .sim { font-size: 3rem; line-height: 1; }
    .sim small { font-size: 1.25rem; color: var(--ef-text-muted); }
    .lbl { font-size: var(--ef-text-sm); color: var(--ef-text-muted); }
    .gap { margin-top: var(--ef-space-2); font-size: var(--ef-text-xs); font-weight: 600; color: var(--ef-accent-text); }
    .value { margin-top: var(--ef-space-1); padding: 2px 8px; border-radius: var(--ef-radius-sm); background: var(--ef-surface-sunken);
      font-size: var(--ef-text-xs); font-weight: 600; color: var(--ef-text-muted); }
    @media (max-width: 860px) { :host { grid-template-columns: minmax(0, 1fr); } .mid { padding: 0; } }
  `,
})
export class DuelHeader {
  readonly data = input.required<Comparison>();
  readonly subjectLabel = computed(() => MODE_COPY[this.data().mode].subjectShort);

  readonly levelText = computed(() => {
    const gap = this.data().overall_gap ?? 0;
    const points = (n: number) => `${n} point${n > 1 ? "s" : ""}`;
    if (gap > 0) return `${points(gap)} de note générale à combler`;
    if (gap < 0) return `${points(-gap)} de note générale d'avance`;
    return "Même note générale";
  });

  /** Lecture du prix : la référence vaut plus (ou moins) que le joueur comparé. */
  readonly valueText = computed(() => {
    const c = this.data();
    if (c.value_gap === 0) return "Valeurs équivalentes";
    const amount = signedEuros(-c.value_gap, true);
    return c.subject.kind === "PROSPECT"
      ? `Coût ${amount} vs ${c.reference.name}`
      : `Valeur ${amount} vs ${c.reference.name}`;
  });

  stats(p: PlayerLite) {
    return RATING_GROUPS.map((g) => ({ short: g.short, value: p.ratings[g.key] ?? null }));
  }
}
