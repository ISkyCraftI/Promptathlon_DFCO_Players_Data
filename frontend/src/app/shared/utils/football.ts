/** Fonctions pures d'affichage partagées (aucune dépendance Angular). */

export type Tone = "neutral" | "accent" | "success" | "warn" | "danger" | "info";
export type Severity = "success" | "info" | "warn" | "danger" | "secondary" | "contrast";

export function statusSeverity(status: string): Severity {
  switch (status) {
    case "Disponible": return "success";
    case "Vigilance": return "warn";
    case "Réathlétisation": return "info";
    case "Blessé": return "danger";
    default: return "secondary";
  }
}

/** Palier de note façon Football Manager (couleur de la valeur). */
export function ratingTier(value: number | null | undefined): "elite" | "good" | "fair" | "low" | "poor" | "none" {
  if (value === null || value === undefined) return "none";
  if (value >= 80) return "elite";
  if (value >= 70) return "good";
  if (value >= 60) return "fair";
  if (value >= 50) return "low";
  return "poor";
}

export function zoneTone(zone: string): Tone {
  switch (zone) {
    case "optimale": return "success";
    case "vigilance": return "warn";
    case "risque": return "danger";
    case "sous-charge": return "info";
    default: return "neutral";
  }
}

export function initials(name: string): string {
  return name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const FORMATS = new Map<number, Intl.NumberFormat>();

/** Nombre au format français (virgule décimale), `digits` décimales au plus. */
export function fr(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—";
  if (!FORMATS.has(digits)) FORMATS.set(digits, new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }));
  return FORMATS.get(digits)!.format(value);
}

/** Nombre signé au format français : +12,5 / −3. */
export function signed(value: number, digits = 0): string {
  const text = fr(Math.abs(value), digits);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

/** Position approximative sur le terrain (x, y en %) à partir du poste FC. y = 0 côté attaque. */
export const POSITION_COORDS: Record<string, [number, number]> = {
  GK: [50, 92], CB: [50, 76], LB: [15, 70], RB: [85, 70], LWB: [12, 58], RWB: [88, 58],
  CDM: [50, 58], CM: [50, 46], CAM: [50, 32], LM: [16, 42], RM: [84, 42],
  LW: [18, 20], RW: [82, 20], CF: [50, 18], ST: [50, 12],
  Gardien: [50, 92], "Défenseur": [50, 74], Milieu: [50, 46], Attaquant: [50, 14],
};

export const POSITION_LABELS: Record<string, string> = {
  GK: "Gardien", CB: "Défenseur central", LB: "Latéral gauche", RB: "Latéral droit", CDM: "Milieu défensif",
  CM: "Milieu central", CAM: "Milieu offensif", LM: "Milieu gauche", RM: "Milieu droit", LW: "Ailier gauche",
  RW: "Ailier droit", ST: "Avant-centre", CF: "Second attaquant",
};

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/**
 * Montant en euros. `compact` : « 1,25 M€ », « 760 k€ » (tableaux, tuiles) ; sinon « 1 250 000 € ».
 */
export function euros(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined) return "—";
  if (!compact) return EUROS.format(value);
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${fr(value / 1_000_000, abs >= 10_000_000 ? 1 : 2)} M€`;
  if (abs >= 1_000) return `${fr(value / 1_000, 0)} k€`;
  return `${fr(value, 0)} €`;
}

/** Montant signé : +120 k€ / −1,2 M€. */
export function signedEuros(value: number, compact = false): string {
  const text = euros(Math.abs(value), compact);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}
