import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { switchMap } from "rxjs";
import { Valuation } from "../../../finance/finance.model";
import { FinanceService } from "../../../finance/finance.service";
import { LOADING, LoadState, toLoadState } from "../../../shared/state/load-state";
import { AsyncState, EurPipe, FrPipe, Panel, StatTile } from "../../../shared/ui";
import { signedEuros } from "../../../shared/utils/football";
import { Player } from "../../players.model";

/** Valorisation auditable : valeur de marché (ou coût de transfert d'un prospect), étapes du calcul et journal ligne par ligne. */
@Component({
  selector: "ef-finance-tab",
  imports: [TableModule, TagModule, AsyncState, EurPipe, FrPipe, Panel, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-async-state [state]="state()" [skeleton]="['7rem', '20rem']" />
    @if (state().data; as v) {
      <div class="tiles">
        <ef-stat-tile [label]="isProspect() ? 'Coût de transfert estimé' : 'Valeur de marché estimée'" icon="pi-wallet" tone="accent"
          [value]="v.final_valuation | eur" [hint]="v.position_label + ' · indice de performance ' + (v.positional_performance_score | fr) + ' / 100'" />
        <ef-stat-tile label="Plafond salarial" icon="pi-money-bill" [value]="v.recommended_wage_ceiling.monthly_euros | eur" unit="/ mois"
          [hint]="(v.recommended_wage_ceiling.annual_euros | eur) + ' par an · ' + (v.recommended_wage_ceiling.wage_to_value_ratio * 100 | fr: 0) + ' % de la valeur'" />
      </div>

      <ef-panel heading="Du prix de base à la valeur finale" subheading="Chaque étape multiplie la précédente">
        <ol class="steps">
          @for (s of steps(); track s.label) {
            <li><span>{{ s.label }}</span><strong class="ef-num">{{ s.value | eur }}</strong></li>
          }
        </ol>
      </ef-panel>

      <ef-panel heading="Journal de calcul" subheading="Chaque opération, ligne par ligne" [flush]="true">
        <p-tag panel-actions [value]="v.formula_version" severity="secondary" />
        <p-table [value]="v.explainability_ledger" [scrollable]="true" [tableStyle]="{ 'min-width': '680px' }">
          <ng-template #header><tr><th>Catégorie</th><th>Paramètre</th><th class="r">Impact</th><th>Règle</th></tr></ng-template>
          <ng-template #body let-e>
            <tr>
              <td><p-tag [value]="e.category" severity="secondary" /></td>
              <td>{{ e.parameter }}</td>
              <td class="r ef-num impact" [attr.data-sign]="e.impact_euros > 0 ? 'up' : e.impact_euros < 0 ? 'down' : null">{{ signed(e.impact_euros) }}</td>
              <td class="rule">{{ e.calculation_rule }}</td>
            </tr>
          </ng-template>
        </p-table>
      </ef-panel>
      <p class="note">Estimation indicative : ancre Ligue 2, note pondérée par poste, âge, personnalité, relations et décote blessures. Forme issue des matchs simulés.</p>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--ef-space-4); }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ef-space-4); }
    .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--ef-space-2); }
    .steps li { display: grid; gap: 2px; padding: var(--ef-space-3); border-radius: var(--ef-radius-sm); background: var(--ef-surface-sunken); }
    .steps li:last-child { background: var(--ef-accent-soft); }
    .steps span { font-size: var(--ef-text-xs); font-weight: 600; color: var(--ef-text-muted); }
    .steps strong { font-size: 1.35rem; }
    .steps li:last-child strong { color: var(--ef-accent-text); }
    .r { text-align: right; }
    .impact { white-space: nowrap; font-size: 1rem; }
    .impact[data-sign="up"] { color: var(--ef-success-text); }
    .impact[data-sign="down"] { color: var(--ef-danger-text); }
    .rule { color: var(--ef-text-muted); font-size: var(--ef-text-xs); max-width: 340px; }
    .note { font-size: var(--ef-text-xs); color: var(--ef-text-faint); }
  `,
})
export class FinanceTab {
  private readonly finance = inject(FinanceService);
  readonly player = input.required<Player>();
  readonly isProspect = computed(() => this.player().kind === "PROSPECT");
  readonly state = toSignal(toObservable(this.player).pipe(
    switchMap((p) => this.finance.valuation(p.id).pipe(toLoadState<Valuation>())),
  ), { initialValue: LOADING as LoadState<Valuation> });
  readonly steps = computed(() => {
    const v = this.state().data;
    if (!v) return [];
    return [
      { label: "1 · Base Ligue 2", value: v.base_league_value },
      { label: "2 · Performance", value: v.value_after_performance },
      { label: "3 · Âge", value: v.value_after_age },
      { label: "4 · Personnalité", value: v.value_after_intangibles },
      { label: `5 · Blessures (×${v.injury_discount_factor.toLocaleString("fr-FR")})`, value: v.final_valuation },
    ];
  });

  signed(value: number): string {
    return signedEuros(value);
  }
}
