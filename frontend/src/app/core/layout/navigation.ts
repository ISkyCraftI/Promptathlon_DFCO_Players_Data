/**
 * Navigation principale. Ajouter une feature = ajouter une entrée ici + une route dans app.routes.ts.
 */
export interface NavItem { label: string; icon: string; link: string; }
export interface NavSection { label: string; items: NavItem[]; }

export const NAVIGATION: NavSection[] = [
  {
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: "pi-objects-column", link: "/tableau-de-bord" },
      { label: "Effectif", icon: "pi-users", link: "/effectif" },
      { label: "Suivi physique", icon: "pi-heart", link: "/physique" },
      { label: "Finance", icon: "pi-wallet", link: "/finance" },
    ],
  },
  {
    label: "Recrutement et formation",
    items: [
      { label: "Prospection", icon: "pi-compass", link: "/prospection" },
      { label: "Recrutement", icon: "pi-search", link: "/recrutement" },
      { label: "Comparaison", icon: "pi-arrow-right-arrow-left", link: "/comparaison" },
    ],
  },
  {
    label: "Espace joueur",
    items: [{ label: "Mon suivi", icon: "pi-user", link: "/mon-espace" }],
  },
];
