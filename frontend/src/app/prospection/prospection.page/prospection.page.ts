import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { RATING_GROUPS } from "../../players/players.model";
import { AsyncState, EmptyState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, Rating, StatTile } from "../../shared/ui";
import { BUDGETS, EMPTY_FILTERS, ProspectFilters, RATING_FILTERS, STAT_SHORT } from "../prospection.model";
import { ProspectionService } from "../prospection.service";

/** Prospection : recherche de profils hors effectif (avec budget) et suggestions qui comblent les faiblesses du groupe. */
@Component({
  selector: "app-prospection-page",
  imports: [FormsModule, RouterLink, ButtonModule, IconFieldModule, InputIconModule, InputNumberModule, InputTextModule, SelectModule,
    TableModule, TagModule, AsyncState, EmptyState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, Rating, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./prospection.page.html",
  styleUrl: "./prospection.page.css",
})
export class ProspectionPage {
  readonly service = inject(ProspectionService);
  readonly draft = signal<ProspectFilters>({ ...EMPTY_FILTERS });
  readonly suggestionRole = signal<string | null>(null);
  readonly ratingFilters = RATING_FILTERS;
  readonly groups = RATING_GROUPS;
  readonly budgets = BUDGETS;
  readonly roles = [{ label: "Tous les postes", value: null }, ...["Gardien", "Défenseur", "Milieu", "Attaquant"].map((v) => ({ label: v + "s", value: v }))];
  readonly feet = [{ label: "Tous les pieds", value: null }, { label: "Droit", value: "Droit" }, { label: "Gauche", value: "Gauche" }];

  readonly prospects = computed(() => this.service.searchState().data ?? []);
  readonly suggestions = computed(() => this.service.suggestionState().data?.suggestions ?? []);
  readonly profile = computed(() => this.service.suggestionState().data?.profile ?? null);

  apply(): void {
    this.service.setFilters(this.draft());
  }

  reset(): void {
    this.draft.set({ ...EMPTY_FILTERS });
    this.service.resetFilters();
  }

  patch<K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
  }

  /** Le budget s'applique tout de suite : c'est le filtre le plus utilisé. */
  setBudget(value: number | null): void {
    this.patch("budget_max", value);
    this.apply();
  }

  setSuggestionRole(role: string | null): void {
    this.suggestionRole.set(role);
    this.service.setSuggestionRole(role);
  }

  coverLabels(covers: string[]): string {
    return covers.map((key) => STAT_SHORT[key] ?? key).join(" · ");
  }
}
