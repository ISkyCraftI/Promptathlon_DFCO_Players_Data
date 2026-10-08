import { normalize } from "../shared/utils/football";
import { Player, PlayerDetail, RATING_GROUPS } from "./players.model";

/** Logique d'affichage pure (testable sans Angular). */

export type SquadScope = "all" | "attention" | "recovery";

export function filterSquad(players: Player[], search: string, role: string | null, scope: SquadScope): Player[] {
  const q = normalize(search.trim());
  return players.filter((p) => normalize(p.name).includes(q) && (!role || p.role === role)
    && (scope === "all" || (scope === "attention" ? p.alerts.length > 0 : ["Blessé", "Réathlétisation"].includes(p.status))));
}

export function squadOverview(players: Player[]) {
  const rank = (p: Player) => Number(p.alerts.some((a) => a.level === "danger")) * 10 + p.alerts.length;
  return {
    total: players.length,
    available: players.filter((p) => p.status === "Disponible").length,
    attention: players.filter((p) => p.alerts.length > 0).length,
    recovery: players.filter((p) => ["Blessé", "Réathlétisation"].includes(p.status)).length,
    totalValue: players.reduce((s, p) => s + p.market_value, 0),
    averageAge: players.length ? Math.round(players.reduce((s, p) => s + p.age, 0) / players.length * 10) / 10 : 0,
    priorities: [...players].filter((p) => p.alerts.length).sort((a, b) => rank(b) - rank(a)).slice(0, 5),
  };
}

export function cardStats(player: Player) {
  return RATING_GROUPS.map((g) => ({ short: g.short, value: player.ratings[g.key] ?? null }));
}

/** Synthèse « saison » d'une fiche : matchs, GPS récents, points forts / faibles. */
export function playerInsights(detail: PlayerDetail) {
  const groups = RATING_GROUPS.map((g) => ({ ...g, value: detail.player.ratings[g.key] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const played = detail.matches.filter((m) => m.minutes > 0);
  const rated = played.filter((m) => m.rating !== null);
  const recent = detail.sessions.slice(-6);
  return {
    strengths: groups.slice(0, 2),
    improve: groups.at(-1)!,
    minutes: played.reduce((s, m) => s + m.minutes, 0),
    goals: played.reduce((s, m) => s + m.goals, 0),
    assists: played.reduce((s, m) => s + m.assists, 0),
    avgRating: rated.length ? Math.round(rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length * 100) / 100 : null,
    appearances: played.length,
    distance: Math.round(recent.reduce((s, x) => s + x.distance_km, 0) * 10) / 10,
    sprints: recent.reduce((s, x) => s + x.sprints, 0),
    highSpeed: recent.reduce((s, x) => s + x.high_speed_m, 0),
    maxSpeed: recent.length ? Math.max(...recent.map((x) => x.max_speed)) : 0,
    lastSession: detail.sessions.at(-1) ?? null,
  };
}
