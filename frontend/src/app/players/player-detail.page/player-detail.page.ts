import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, signal, viewChild } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TabsModule } from "primeng/tabs";
import { BehaviorSubject, combineLatest, switchMap } from "rxjs";
import { CatalogService } from "../../core/catalog/catalog.service";
import { LOADING, LoadState, toLoadState } from "../../shared/state/load-state";
import { AsyncState } from "../../shared/ui";
import { AttributesTab } from "../components/attributes-tab/attributes-tab";
import { FinanceTab } from "../components/finance-tab/finance-tab";
import { FollowupTab } from "../components/followup-tab/followup-tab";
import { MatchesTab } from "../components/matches-tab/matches-tab";
import { OverviewTab } from "../components/overview-tab/overview-tab";
import { PhysicalTab } from "../components/physical-tab/physical-tab";
import { PlayerHero } from "../components/player-hero/player-hero";
import { ReadinessCard } from "../components/readiness-card/readiness-card";
import { PlayerDetail } from "../players.model";
import { PlayersService } from "../players.service";

const TABS = ["overview", "attributes", "physical", "matches", "history", "finance"] as const;
type Tab = (typeof TABS)[number];

/** Fiche joueur centralisée : la page orchestre, chaque onglet est un composant autonome. */
@Component({
  selector: "app-player-detail-page",
  imports: [RouterLink, ButtonModule, TabsModule, AsyncState, AttributesTab, FinanceTab, FollowupTab, MatchesTab, OverviewTab, PhysicalTab,
    PlayerHero, ReadinessCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./player-detail.page.html",
  styleUrl: "./player-detail.page.css",
})
export class PlayerDetailPage {
  private readonly players = inject(PlayersService);
  readonly catalog = inject(CatalogService);
  /** Paramètres de route liés par withComponentInputBinding. */
  readonly id = input.required<string>();
  readonly onglet = input<string>();
  private readonly tabsAnchor = viewChild<ElementRef<HTMLElement>>("tabsAnchor");
  private readonly reload = new BehaviorSubject<void>(undefined);

  readonly state = toSignal(combineLatest([toObservable(this.id), this.reload]).pipe(
    switchMap(([id]) => this.players.detail(id).pipe(toLoadState<PlayerDetail>())),
  ), { initialValue: LOADING as LoadState<PlayerDetail> });

  readonly tab = signal<Tab>("overview");
  readonly isProspect = computed(() => this.state().data?.player.kind === "PROSPECT");

  constructor() {
    effect(() => {
      const requested = this.onglet() as Tab | undefined;
      this.tab.set(requested && TABS.includes(requested) ? requested : "overview");
    });
  }

  open(section: string): void {
    if (TABS.includes(section as Tab)) this.tab.set(section as Tab);
    this.tabsAnchor()?.nativeElement.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  retry(): void {
    this.reload.next();
  }
}
