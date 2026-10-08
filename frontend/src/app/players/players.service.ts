import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { ErrorWrapper } from "../shared/errors/error-wrapper";
import { FollowupInput, FollowupSchema, LoadState, Player, PlayerDetail, PlayerDetailSchema, PlayerSchema, STAT_GROUPS } from "./players.model";
import { z } from "zod";

@Injectable({providedIn: "root"})
export class PlayersService {
  private readonly http = inject(AsyncHttpClient);
  private readonly refreshTrigger = new BehaviorSubject<void>(undefined);
  public readonly state = toSignal(this.refreshTrigger.pipe(switchMap(() => this.getAll().pipe(
    map(data => ({data, loading: false, error: null} as LoadState<Player[]>)),
    startWith({data: null, loading: true, error: null} as LoadState<Player[]>),
    catchError(error => of({data: null, loading: false, error: this.errorMessage(error)} as LoadState<Player[]>)),
  ))), {initialValue: {data: null, loading: true, error: null} as LoadState<Player[]>});

  getAll(): Observable<Player[]> {
    return this.http.get<unknown>("/players/").pipe(map(data => z.array(PlayerSchema).parse(data)));
  }
  detail(id: string): Observable<PlayerDetail> {
    return this.http.get<unknown>(`/players/${encodeURIComponent(id)}`).pipe(map(data => PlayerDetailSchema.parse(data)));
  }
  saveFollowup(id: string, payload: FollowupInput) {
    return this.http.post<unknown>({endpoint: `/players/${encodeURIComponent(id)}/followups/`, json: payload})
      .pipe(map(data => FollowupSchema.parse(data)));
  }
  refresh() { this.refreshTrigger.next(); }
  errorMessage(error: unknown): string {
    return error instanceof ErrorWrapper ? error.userSafeDescription : "Impossible de charger les données. Vérifiez que le serveur est démarré.";
  }
  severity(status: string): "success" | "warn" | "danger" {
    return status === "Disponible" ? "success" : status === "Blessé" ? "danger" : "warn";
  }
  initials(name: string) { return name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(n => n[0]).join(""); }
  filtered(players: Player[], search: string, role: string | null, scope: string): Player[] {
    const normalize = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return players.filter(p => normalize(p.name).includes(normalize(search)) && (!role || p.role === role)
      && (scope === "all" || (scope === "attention" ? p.alerts.length > 0 : ["Blessé", "Réathlétisation"].includes(p.status))));
  }
  overview(players: Player[]) {
    return {available: players.filter(p => p.status === "Disponible").length,
      attention: players.filter(p => p.alerts.length > 0).length,
      recovery: players.filter(p => ["Blessé", "Réathlétisation"].includes(p.status)).length,
      priorities: [...players].filter(p => p.alerts.length).sort((a, b) =>
        Number(b.alerts.some(x => x.level === "danger")) - Number(a.alerts.some(x => x.level === "danger")) || b.alerts.length - a.alerts.length).slice(0, 4)};
  }
  insights(detail: PlayerDetail) {
    const ratingGroups = detail.player.goalkeeper ? [
      {key: "gardien_plongeon", label: "Plongeon", short: "DIV"}, {key: "gardien_prise_de_balle", label: "Prise de balle", short: "HAN"},
      {key: "gardien_jeu_au_pied", label: "Jeu au pied", short: "KIC"}, {key: "gardien_reflexes", label: "Réflexes", short: "REF"},
      {key: "gardien_vitesse", label: "Vitesse", short: "SPD"}, {key: "gardien_placement", label: "Placement", short: "POS"},
    ].map((g, i) => ({...g, color: STAT_GROUPS[i].color, value: detail.attributes[g.key] ?? null}))
      : STAT_GROUPS.map(g => ({...g, value: detail.player.ratings[g.key]}));
    const groups = ratingGroups.filter(g => g.value !== null).sort((a, b) => b.value! - a.value!);
    const sessions = detail.sessions.slice(-6);
    return {ratingGroups, strengths: groups.slice(0, 2), improve: groups.at(-1)!,
      minutes: detail.matches.reduce((v, m) => v + m.minutes, 0),
      goals: detail.matches.reduce((v, m) => v + m.goals, 0),
      assists: detail.matches.reduce((v, m) => v + m.assists, 0),
      distance: Math.round(sessions.reduce((v, s) => v + s.distance_km, 0) * 10) / 10,
      sprints: sessions.reduce((v, s) => v + s.sprints, 0),
      highSpeed: sessions.reduce((v, s) => v + s.high_speed_m, 0),
      maxSpeed: Math.max(...sessions.map(s => s.max_speed)),
      lastSession: sessions.at(-1)!,
      polar: {labels: ratingGroups.map(g => g.label), datasets: [{data: ratingGroups.map(g => g.value),
        backgroundColor: ratingGroups.map(g => g.color + "cc"), borderColor: "#202023", borderWidth: 3}]},
      loadChart: {labels: detail.sessions.map(s => s.date.slice(8) + "/" + s.date.slice(5, 7)), datasets: [
        {label: "Charge (UA)", data: detail.sessions.map(s => s.load), backgroundColor: "#e94551", borderRadius: 5, maxBarThickness: 28},
      ]},
    };
  }
  readonly polarOptions = {responsive: true, maintainAspectRatio: false,
    plugins: {legend: {display: false}, tooltip: {callbacks: {label: (item: {label: string; raw: number}) => `${item.label} : ${item.raw}/100`}}},
    scales: {r: {min: 0, max: 100, ticks: {stepSize: 25, color: "#88848a", backdropColor: "transparent", font: {size: 10}},
      grid: {color: "#ffffff12"}, angleLines: {color: "#ffffff12"}, pointLabels: {display: true, centerPointLabels: true, color: "#d7d1d0", font: {size: 12, family: "Figtree"}}}}};
  readonly loadOptions = {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}},
    scales: {x: {grid: {display: false}, ticks: {color: "#a9a1a3", font: {size: 10}}},
      y: {beginAtZero: true, grid: {color: "#ffffff0b"}, ticks: {color: "#a9a1a3"}, title: {display: true, text: "Charge · UA", color: "#a9a1a3"}}}};
}
