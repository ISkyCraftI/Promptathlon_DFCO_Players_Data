import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MenuItem } from "primeng/api";
import { Menubar } from "primeng/menubar";

@Component({
  selector: "app-menu-bar",
  standalone: true,
  imports: [Menubar, RouterLink],
  templateUrl: "./menu-bar.html",
  styleUrl: "./menu-bar.css",
})
export class MenuBar {
  /**
   * Entries du menu principal.
   * Ajouter ici chaque nouvelle feature front, ex. :
   * { label: "Items", routerLink: "/items" },
   */
  protected readonly items: MenuItem[] = [
    { label: "Accueil", icon: "pi pi-home", routerLink: "/" },
    { label: "Effectif", icon: "pi pi-users", routerLink: "/effectif" },
    { label: "Prospection", icon: "pi pi-search", routerLink: "/prospection" },
  ];
}
