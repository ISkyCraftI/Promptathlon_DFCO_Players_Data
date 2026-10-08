import { Component, computed, effect, ElementRef, inject, signal, viewChild } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, catchError, map, of, startWith, switchMap } from "rxjs";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TabsModule } from "primeng/tabs";
import { ChartModule } from "primeng/chart";
import { KnobModule } from "primeng/knob";
import { ProgressBarModule } from "primeng/progressbar";
import { SelectButtonModule } from "primeng/selectbutton";
import { TextareaModule } from "primeng/textarea";
import { SliderModule } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { PlayersService } from "../players.service";
import { GOALKEEPER_STATS, LoadState, PlayerDetail, STAT_GROUPS } from "../players.model";
import { FinanceService } from "../../finance/finance.service";
import { Valuation } from "../../finance/finance.model";

const DETAIL_TABS = ["physical", "history", "attributes", "matches", "finance"];

@Component({selector: "app-player-detail-page", standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, ButtonModule, TagModule, TabsModule, ChartModule,
    KnobModule, ProgressBarModule, SelectButtonModule, TextareaModule, SliderModule, InputNumberModule, MessageModule, SkeletonModule, TableModule],
  templateUrl: "./player-detail.page.html"})
export class PlayerDetailPage {
  readonly service = inject(PlayersService);
  readonly finance = inject(FinanceService);
  private readonly playerContent = viewChild<ElementRef<HTMLElement>>("playerContent");
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new BehaviorSubject<void>(undefined);
  private readonly financeReload = new BehaviorSubject<void>(undefined);
  readonly mode = signal("coach");
  readonly activeTab = signal(
    DETAIL_TABS.includes(this.route.snapshot.queryParamMap.get("tab") ?? "")
      ? this.route.snapshot.queryParamMap.get("tab")! : "overview");
  readonly state = toSignal(this.route.paramMap.pipe(switchMap(params => this.reload.pipe(switchMap(() =>
    this.service.detail(params.get("id") ?? "").pipe(
      map(data => ({data, loading: false, error: null} as LoadState<PlayerDetail>)),
      startWith({data: null, loading: true, error: null} as LoadState<PlayerDetail>),
      catchError(error => of({data: null, loading: false, error: this.service.errorMessage(error)} as LoadState<PlayerDetail>)),
    ))))), {initialValue: {data: null, loading: true, error: null} as LoadState<PlayerDetail>});
  readonly financeState = toSignal(this.route.paramMap.pipe(switchMap(params => this.financeReload.pipe(switchMap(() => {
    const id = params.get("id") ?? "";
    if (!id || this.activeTab() !== "finance") {
      return of({data: null, loading: false, error: null} as LoadState<Valuation>);
    }
    return this.finance.valuation(id).pipe(
      map(data => ({data, loading: false, error: null} as LoadState<Valuation>)),
      startWith({data: null, loading: true, error: null} as LoadState<Valuation>),
      catchError(error => of({
        data: null, loading: false, error: this.finance.errorMessage(error),
      } as LoadState<Valuation>)),
    );
  })))), {initialValue: {data: null, loading: false, error: null} as LoadState<Valuation>});
  readonly insight = computed(() => this.state().data ? this.service.insights(this.state().data!) : null);
  readonly modes = [{label: "Vue coach", value: "coach"}, {label: "Vue joueur", value: "player"}];
  readonly groups = STAT_GROUPS;
  readonly goalkeeperStats = GOALKEEPER_STATS;
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  draft = {note: "", fatigue: 0, soreness: 0, rpe: 5};

  constructor() {
    effect(() => {
      const data = this.state().data;
      if (data) { this.draft.fatigue = data.player.fatigue; }
    });
    effect(() => {
      this.activeTab();
      this.financeReload.next();
    });
  }
  changeMode(mode: string) { this.mode.set(mode); this.activeTab.set(mode === "player" ? "history" : "overview"); }
  openSection(section: string) {
    this.activeTab.set(section);
    this.playerContent()?.nativeElement.scrollIntoView({block: "start", behavior: "smooth"});
  }
  retry() { this.reload.next(); }
  retryFinance() { this.financeReload.next(); }
  save() {
    const id = this.state().data?.player.id;
    if (!id || this.saving()) return;
    if (this.draft.note.trim().length < 3) {
      this.saveError.set("Ajoutez une observation de trois caractères minimum."); return;
    }
    this.saving.set(true); this.saveError.set(null); this.saveSuccess.set(false);
    this.service.saveFollowup(id, {...this.draft, author: this.mode() === "coach" ? "Staff" : "Joueur"})
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.saving.set(false); this.saveSuccess.set(true); this.draft.note = ""; this.service.refresh(); this.reload.next(); },
        error: error => { this.saving.set(false); this.saveError.set(this.service.errorMessage(error)); },
      });
  }
}
