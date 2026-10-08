import { DOCUMENT } from "@angular/common";
import { inject, Injectable, signal } from "@angular/core";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "ef-theme";

/** Bascule clair / sombre : classe .app-dark sur <html> (Radix + PrimeNG s'y alignent). */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly mode = signal<ThemeMode>(this.root.classList.contains("app-dark") ? "dark" : "light");

  toggle(): void {
    this.set(this.mode() === "dark" ? "light" : "dark");
  }

  set(mode: ThemeMode): void {
    this.root.classList.toggle("app-dark", mode === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
    this.mode.set(mode);
  }
}
