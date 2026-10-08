import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { SelectModule } from "primeng/select";
import { SelectButtonModule } from "primeng/selectbutton";
import { TableModule } from "primeng/table";
import { combineLatest, of, switchMap } from "rxjs";
import { RadarChart, RadarSeries } from "../../shared/charts/radar-chart/radar-chart";
import { LOADING, LoadState, toLoadState } from "../../shared/state/load-state";
import { AsyncState, EmptyState, FrPipe, PageHeader, Panel } from "../../shared/ui";
import { euros } from "../../shared/utils/football";
import { DuelHeader } from "../components/duel-header/duel-header";
import { GapList } from "../components/gap-list/gap-list";
import { ProgressAxes } from "../components/progress-axes/progress-axes";
import { Candidates, Comparison, ComparisonMode, MODE_COPY, MODES, PlayerLite } from "../comparison.model";
import { ComparisonService } from "../comparison.service";

const IDLE = { data: null, loading: false, error: null } as LoadState<Comparison>;

@Component({
  selector: "app-comparison-page",
  imports: [FormsModule, SelectModule, SelectButtonModule, TableModule, RadarChart, AsyncState, EmptyState, FrPipe, PageHeader, Panel,
    DuelHeader, GapList, ProgressAxes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./comparison.page.html",
  styleUrl: "./comparison.page.css",
})
export class ComparisonPage {
  private readonly service = inject(ComparisonService);
  private readonly router = inject(Router);
  /** ?mode=young|squad|prospect&joueur=<id>&reference=<id> (partageable, utilisé depuis la fiche joueur). */
  readonly modeParam = input<string>(undefined, { alias: "mode" });
  readonly joueur = input<string>();
  readonly reference = input<string>();

  readonly mode = signal<ComparisonMode>("young");
  readonly subjectId = signal<string | null>(null);
  readonly referenceId = signal<string | null>(null);
  readonly copy = computed(() => MODE_COPY[this.mode()]);
  readonly modes = MODES.map((value) => ({ label: MODE_COPY[value].tab, value }));

  readonly candidates = toSignal(toObservable(this.mode).pipe(
    switchMap((mode) => this.service.candidates(mode).pipe(toLoadState<Candidates>())),
  ), { initialValue: LOADING as LoadState<Candidates> });

  readonly subjectOptions = computed(() => groupByRole(this.candidates().data?.subjects ?? [],
    (p) => `${p.name} · ${p.position} · ${p.age} ans · ${euros(p.market_value, true)}`));
  readonly subjectRole = computed(() => this.candidates().data?.subjects.find((p) => p.id === this.subjectId())?.role ?? null);
  readonly referenceOptions = computed(() => (this.candidates().data?.references ?? [])
    .filter((p) => p.role === this.subjectRole() && p.id !== this.subjectId())
    .map((p) => ({ label: `${p.name} · ${p.position} · ${p.overall ?? "—"} · ${euros(p.market_value, true)}`, value: p.id })));

  readonly result = toSignal(combineLatest([toObservable(this.subjectId), toObservable(this.referenceId)]).pipe(
    switchMap(([s, r]) => s ? this.service.compare(s, r, this.mode()).pipe(toLoadState<Comparison>()) : of(IDLE)),
  ), { initialValue: IDLE });

  readonly radarLabels = computed(() => this.result().data?.groups.map((g) => g.label) ?? []);
  readonly radar = computed<RadarSeries[]>(() => {
    const r = this.result().data;
    if (!r) return [];
    return [
      { label: r.subject.name, values: r.groups.map((g) => g.subject), tone: "info" },
      { label: r.reference.name, values: r.groups.map((g) => g.reference), tone: "accent" },
    ];
  });
  readonly physicalRows = computed(() => {
    const r = this.result().data;
    if (!r) return [];
    const s = r.physical.subject, ref = r.physical.reference;
    return [
      { label: "Charge sur 7 jours", unit: "UA", subject: s.weekly_load, ref: ref.weekly_load },
      { label: "Distance moyenne par séance", unit: "km", subject: s.distance_km, ref: ref.distance_km },
      { label: "Sprints moyens par séance", unit: "", subject: s.sprints, ref: ref.sprints },
      { label: "Vitesse max (14 j)", unit: "km/h", subject: s.max_speed, ref: ref.max_speed },
      { label: "Minutes (6 journées)", unit: "min", subject: s.minutes, ref: ref.minutes },
    ];
  });

  constructor() {
    effect(() => {
      const mode = this.modeParam() as ComparisonMode | undefined;
      this.mode.set(mode && MODES.includes(mode) ? mode : "young");
      this.subjectId.set(this.joueur() ?? null);
      this.referenceId.set(this.reference() ?? null);
    });
  }

  chooseMode(mode: ComparisonMode): void {
    this.mode.set(mode);
    this.subjectId.set(null);
    this.referenceId.set(null);
    this.sync();
  }

  chooseSubject(id: string | null): void {
    this.subjectId.set(id);
    this.referenceId.set(null);
    this.sync();
  }

  chooseReference(id: string | null): void {
    this.referenceId.set(id);
    this.sync();
  }

  private sync(): void {
    this.router.navigate([], {
      queryParams: { mode: this.mode(), joueur: this.subjectId(), reference: this.referenceId() }, replaceUrl: true,
    });
  }
}

/** Options de sélection groupées par poste (Gardien, Défenseur…). */
function groupByRole(players: PlayerLite[], label: (p: PlayerLite) => string) {
  const roles = [...new Set(players.map((p) => p.role))];
  return roles.map((role) => ({
    label: role + "s",
    items: players.filter((p) => p.role === role).map((p) => ({ label: label(p), value: p.id })),
  }));
}
