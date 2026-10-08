import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SelectButtonModule } from "primeng/selectbutton";
import { TableModule } from "primeng/table";
import { AsyncState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, Rating, StatTile, StatusTag } from "../../shared/ui";
import { FinanceService } from "../finance.service";

/** Valeur du club : somme des valorisations de l'effectif, répartition par poste et classement des joueurs. */
@Component({
  selector: "app-finance-page",
  imports: [FormsModule, RouterLink, ButtonModule, SelectButtonModule, TableModule, AsyncState, EurPipe, FrPipe, PageHeader, Panel,
    PlayerAvatar, Rating, StatTile, StatusTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./finance.page.html",
  styleUrl: "./finance.page.css",
})
export class FinancePage {
  readonly service = inject(FinanceService);
  readonly role = signal<string | null>(null);
  readonly roles = computed(() => [{ label: "Tous", value: null },
    ...(this.service.club().data?.by_role ?? []).map((r) => ({ label: r.role + "s", value: r.role }))]);
  readonly players = computed(() => {
    const all = this.service.club().data?.players ?? [];
    return this.role() ? all.filter((p) => p.role === this.role()) : all;
  });
  /** Plus grosse valeur de l'effectif : sert d'échelle aux barres du tableau. */
  readonly maxValue = computed(() => this.service.club().data?.players[0]?.market_value ?? 1);
}
