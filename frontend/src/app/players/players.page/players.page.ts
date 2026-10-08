import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SelectButtonModule } from "primeng/selectbutton";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { MessageModule } from "primeng/message";
import { PlayersService } from "../players.service";
import { STAT_GROUPS } from "../players.model";

@Component({selector: "app-players-page", standalone: true,
  imports: [RouterLink, FormsModule, ButtonModule, TableModule, InputTextModule, SelectModule, SelectButtonModule, TagModule, ProgressBarModule, SkeletonModule, MessageModule],
  templateUrl: "./players.page.html"})
export class PlayersPage {
  readonly service = inject(PlayersService);
  readonly search = signal("");
  readonly role = signal<string | null>(null);
  readonly scope = signal("all");
  readonly groups = STAT_GROUPS;
  readonly roles = [{label: "Tous les postes", value: null}, ...["Gardien", "Défenseur", "Milieu", "Attaquant"].map(value => ({label: value + "s", value}))];
  readonly scopes = [{label: "Tout l’effectif", value: "all"}, {label: "À examiner", value: "attention"}, {label: "Retour de blessure", value: "recovery"}];
  readonly players = computed(() => this.service.state().data ?? []);
  readonly overview = computed(() => this.service.overview(this.players()));
  readonly filtered = computed(() => this.service.filtered(this.players(), this.search(), this.role(), this.scope()));
  reset() { this.search.set(""); this.role.set(null); this.scope.set("all"); }
}
