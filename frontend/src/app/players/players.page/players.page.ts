import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SelectButtonModule } from "primeng/selectbutton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { AsyncState, EmptyState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, Rating, StatTile, StatusTag, ZoneBadge } from "../../shared/ui";
import { RATING_GROUPS } from "../players.model";
import { PlayersService } from "../players.service";
import { filterSquad, SquadScope, squadOverview } from "../players.utils";

@Component({
  selector: "app-players-page",
  imports: [FormsModule, RouterLink, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule,
    SelectButtonModule, TableModule, TagModule, AsyncState, EmptyState, EurPipe, FrPipe, PageHeader, Panel, PlayerAvatar, Rating, StatTile,
    StatusTag, ZoneBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./players.page.html",
  styleUrl: "./players.page.css",
})
export class PlayersPage {
  readonly service = inject(PlayersService);
  readonly search = signal("");
  readonly role = signal<string | null>(null);
  readonly scope = signal<SquadScope>("all");
  readonly groups = RATING_GROUPS;
  readonly roles = [{ label: "Tous les postes", value: null }, ...["Gardien", "Défenseur", "Milieu", "Attaquant"].map((v) => ({ label: v + "s", value: v }))];
  readonly scopes = [{ label: "Tous", value: "all" }, { label: "À examiner", value: "attention" }, { label: "Retour de blessure", value: "recovery" }];
  readonly players = computed(() => this.service.squad().data ?? []);
  readonly overview = computed(() => squadOverview(this.players()));
  readonly filtered = computed(() => filterSquad(this.players(), this.search(), this.role(), this.scope()));

  reset(): void {
    this.search.set("");
    this.role.set(null);
    this.scope.set("all");
  }
}
