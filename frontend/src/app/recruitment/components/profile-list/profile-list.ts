import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { CatalogService } from "../../../core/catalog/catalog.service";
import { Profile } from "../../recruitment.model";

/** Liste des profils de poste ; le profil actif pilote la shortlist. */
@Component({
  selector: "ef-profile-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul role="listbox" aria-label="Profils de recrutement">
      @for (p of profiles(); track p.id) {
        <li>
          <button type="button" role="option" [attr.aria-selected]="p.id === selectedId()" [class.active]="p.id === selectedId()" (click)="select.emit(p)">
            <span class="role">{{ p.role }}</span>
            <strong>{{ p.name }}</strong>
            <span class="keys">{{ topKeys(p) }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ef-space-1); }
    button { display: grid; gap: 1px; width: 100%; padding: var(--ef-space-3); border: 1px solid transparent; border-radius: var(--ef-radius-sm);
      background: none; text-align: left; font: inherit; color: var(--ef-text); cursor: pointer; }
    button:hover { background: var(--ef-hover); }
    button.active { background: var(--ef-accent-soft); border-color: var(--ef-accent-border); }
    .role { font-size: var(--ef-text-xs); font-weight: 600; color: var(--ef-text-muted); }
    button.active .role, button.active strong { color: var(--ef-accent-text); }
    .keys { font-size: var(--ef-text-xs); color: var(--ef-text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `,
})
export class ProfileList {
  private readonly catalog = inject(CatalogService);
  readonly profiles = input.required<Profile[]>();
  readonly selectedId = input<number | null>(null);
  readonly select = output<Profile>();

  topKeys(p: Profile): string {
    const labels = this.catalog.labels();
    return Object.entries(p.weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => labels[k] ?? k).join(", ");
  }
}
