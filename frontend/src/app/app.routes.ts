import { Routes } from "@angular/router";
import { HomePage } from "./home/home.page/home.page";

// EXAMPLE — feature items (désactivée). Décommenter pour réactiver :
// import { ItemsPage } from "./items/items.page/items.page";

export const routes: Routes = [
  {
    path: "",
    component: HomePage,
  },
  // EXAMPLE
  // {
  //   path: "items",
  //   component: ItemsPage,
  // },
  {
    path: "effectif",
    loadComponent: () => import("./players/players.page/players.page").then(m => m.PlayersPage),
  },
  {
    path: "effectif/:id",
    loadComponent: () => import("./players/player-detail.page/player-detail.page").then(m => m.PlayerDetailPage),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
