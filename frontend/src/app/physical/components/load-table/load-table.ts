import { ChangeDetectionStrategy, Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { EmptyState, FrPipe, Panel, PlayerAvatar, Sparkline, StatusTag, ZoneBadge } from "../../../shared/ui";
import { signed } from "../../../shared/utils/football";
import { PlayerLoad } from "../../physical.model";

/** Tableau de charge par joueur, trié par signaux ouverts ; un clic ouvre le détail. */
@Component({
  selector: "ef-load-table",
  imports: [FormsModule, TableModule, TagModule, ToggleSwitchModule, EmptyState, FrPipe, Panel, PlayerAvatar, Sparkline, StatusTag, ZoneBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./load-table.html",
  styleUrl: "./load-table.css",
})
export class LoadTable {
  readonly players = input.required<PlayerLoad[]>();
  readonly select = output<PlayerLoad>();
  readonly onlyOpen = signal(false);
  readonly signed = signed;
  readonly rows = computed(() => this.onlyOpen()
    ? this.players().filter((p) => p.flags.some((f) => !f.reviewed)) : this.players());
  onSelect(row: unknown): void { if (row && !Array.isArray(row)) this.select.emit(row as PlayerLoad); }
  openFlags(p: PlayerLoad) { return p.flags.filter((f) => !f.reviewed); }
}
