import { ChangeDetectionStrategy, Component, inject, output, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from "primeng/autocomplete";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { filter, map, startWith } from "rxjs";
import { Player } from "../../../players/players.model";
import { PlayersService } from "../../../players/players.service";
import { PlayerAvatar } from "../../../shared/ui";
import { normalize } from "../../../shared/utils/football";
import { ThemeService } from "../../theme/theme.service";

@Component({
  selector: "ef-topbar",
  imports: [FormsModule, AutoCompleteModule, ButtonModule, TooltipModule, PlayerAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./topbar.html",
  styleUrl: "./topbar.css",
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly players = inject(PlayersService);
  readonly theme = inject(ThemeService);
  readonly menu = output<void>();

  /** Fil d'Ariane issu de `data.section` / `data.heading` de la route active. */
  readonly crumbs = toSignal(this.router.events.pipe(
    filter((e) => e instanceof NavigationEnd), startWith(null),
    map(() => {
      let r = this.route.snapshot;
      while (r.firstChild) r = r.firstChild;
      return { section: r.data["section"] as string | undefined, heading: r.data["heading"] as string | undefined };
    }),
  ), { initialValue: { section: undefined, heading: undefined } });

  private all: Player[] = [];
  readonly suggestions = signal<Player[]>([]);
  query: Player | string | null = null;

  constructor() {
    this.players.everyone$.subscribe({ next: (list) => (this.all = list), error: () => (this.all = []) });
  }

  search(event: AutoCompleteCompleteEvent): void {
    const q = normalize(event.query);
    this.suggestions.set(this.all.filter((p) => normalize(p.name).includes(q)).slice(0, 8));
  }

  open(event: AutoCompleteSelectEvent): void {
    const player = event.value as Player;
    this.query = null;
    this.router.navigate(["/effectif", player.id]);
  }
}
