import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { SelectModule } from "primeng/select";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { MessageModule } from "primeng/message";
import { ProspectionService } from "../prospection.service";
import {
  EMPTY_FILTERS,
  ProspectFilters,
  RATING_FILTERS,
  STAT_SHORT,
} from "../prospection.model";

@Component({
  selector: "app-prospection-page",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    SkeletonModule,
    MessageModule,
  ],
  templateUrl: "./prospection.page.html",
})
export class ProspectionPage {
  readonly service = inject(ProspectionService);
  readonly draft = signal<ProspectFilters>({...EMPTY_FILTERS});
  readonly suggestionRole = signal<string | null>(null);
  readonly ratingFilters = RATING_FILTERS;
  readonly ratingKeys = Object.keys(STAT_SHORT);
  readonly statShort = STAT_SHORT;
  readonly roles = [
    {label: "Tous les postes", value: null},
    ...["Gardien", "Défenseur", "Milieu", "Attaquant"].map(value => ({
      label: value + "s",
      value,
    })),
  ];
  readonly feet = [
    {label: "Tous les pieds", value: null},
    {label: "Droit", value: "Droit"},
    {label: "Gauche", value: "Gauche"},
  ];
  readonly suggestionRoles = this.roles;

  readonly prospects = computed(() => this.service.searchState().data ?? []);
  readonly suggestions = computed(
    () => this.service.suggestionState().data?.suggestions ?? [],
  );
  readonly profile = computed(
    () => this.service.suggestionState().data?.profile ?? null,
  );

  apply(): void {
    this.service.setFilters(this.draft());
  }

  reset(): void {
    this.draft.set({...EMPTY_FILTERS});
    this.service.resetFilters();
  }

  patch<K extends keyof ProspectFilters>(
    key: K,
    value: ProspectFilters[K],
  ): void {
    this.draft.update(current => ({...current, [key]: value}));
  }

  setSuggestionRole(role: string | null): void {
    this.suggestionRole.set(role);
    this.service.setSuggestionRole(role);
  }

  coverLabels(covers: string[]): string {
    return covers.map(key => this.statShort[key] ?? key).join(" · ");
  }
}
