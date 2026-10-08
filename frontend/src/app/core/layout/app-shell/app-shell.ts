import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";
import { Topbar } from "../topbar/topbar";

/** Cadre de l'application : navigation latérale (tiroir sur mobile), barre haute, contenu routé. */
@Component({
  selector: "ef-app-shell",
  imports: [RouterOutlet, Sidebar, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-sidebar class="sidebar" [class.open]="menuOpen()" (navigate)="menuOpen.set(false)" />
    @if (menuOpen()) { <div class="backdrop" (click)="menuOpen.set(false)" aria-hidden="true"></div> }
    <div class="main">
      <ef-topbar (menu)="menuOpen.set(true)" />
      <main id="contenu"><router-outlet /></main>
    </div>
  `,
  styles: `
    :host { display: grid; grid-template-columns: var(--ef-sidebar-width) minmax(0, 1fr); min-height: 100vh; }
    .sidebar { position: sticky; top: 0; height: 100vh; }
    .main { display: flex; flex-direction: column; min-width: 0; }
    ef-topbar { position: sticky; top: 0; z-index: 5; }
    .backdrop { position: fixed; inset: 0; z-index: 19; background: var(--slate-a8); }
    @media (max-width: 900px) {
      :host { grid-template-columns: minmax(0, 1fr); }
      .sidebar { position: fixed; z-index: 20; left: 0; width: var(--ef-sidebar-width); transform: translateX(-100%);
        transition: transform 0.2s ease; box-shadow: var(--ef-shadow-pop); }
      .sidebar.open { transform: none; }
    }
  `,
})
export class AppShell {
  readonly menuOpen = signal(false);
}
