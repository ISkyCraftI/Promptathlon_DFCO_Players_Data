import { Routes } from "@angular/router";

// EXAMPLE — feature items (désactivée). Décommenter pour réactiver :
// import { ItemsPage } from "./items/items.page/items.page";

/**
 * Routes : une feature = une page chargée à la demande.
 * `data.section` / `data.heading` alimentent le fil d'Ariane de la barre haute.
 */
export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "tableau-de-bord" },
  {
    path: "tableau-de-bord", title: "Tableau de bord · Easyfoot", data: { section: "Pilotage", heading: "Tableau de bord" },
    loadComponent: () => import("./coach/coach.page/coach.page").then((m) => m.CoachPage),
  },
  {
    path: "effectif", title: "Effectif · Easyfoot", data: { section: "Pilotage", heading: "Effectif" },
    loadComponent: () => import("./players/players.page/players.page").then((m) => m.PlayersPage),
  },
  {
    path: "effectif/:id", title: "Fiche joueur · Easyfoot", data: { section: "Effectif", heading: "Fiche joueur" },
    loadComponent: () => import("./players/player-detail.page/player-detail.page").then((m) => m.PlayerDetailPage),
  },
  {
    path: "physique", title: "Suivi physique · Easyfoot", data: { section: "Pilotage", heading: "Suivi physique" },
    loadComponent: () => import("./physical/physical.page/physical.page").then((m) => m.PhysicalPage),
  },
  {
    path: "finance", title: "Finance · Easyfoot", data: { section: "Pilotage", heading: "Finance" },
    loadComponent: () => import("./finance/finance.page/finance.page").then((m) => m.FinancePage),
  },
  {
    path: "prospection", title: "Prospection · Easyfoot", data: { section: "Recrutement et formation", heading: "Prospection" },
    loadComponent: () => import("./prospection/prospection.page/prospection.page").then((m) => m.ProspectionPage),
  },
  {
    path: "recrutement", title: "Recrutement · Easyfoot", data: { section: "Recrutement et formation", heading: "Recrutement" },
    loadComponent: () => import("./recruitment/recruitment.page/recruitment.page").then((m) => m.RecruitmentPage),
  },
  {
    path: "comparaison", title: "Comparaison · Easyfoot", data: { section: "Recrutement et formation", heading: "Comparaison" },
    loadComponent: () => import("./comparison/comparison.page/comparison.page").then((m) => m.ComparisonPage),
  },
  {
    path: "mon-espace", title: "Mon suivi · Easyfoot", data: { section: "Espace joueur", heading: "Mon suivi" },
    loadComponent: () => import("./player-space/player-space.page/player-space.page").then((m) => m.PlayerSpacePage),
  },
  {
    path: "mon-espace/:id", title: "Mon suivi · Easyfoot", data: { section: "Espace joueur", heading: "Mon suivi" },
    loadComponent: () => import("./player-space/player-space.page/player-space.page").then((m) => m.PlayerSpacePage),
  },
  // EXAMPLE
  // { path: "items", component: ItemsPage },
  { path: "**", redirectTo: "tableau-de-bord" },
];
