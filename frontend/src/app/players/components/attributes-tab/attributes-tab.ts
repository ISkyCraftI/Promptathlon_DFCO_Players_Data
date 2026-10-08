import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { CatalogService } from "../../../core/catalog/catalog.service";
import { AttributeBar, Panel, Rating } from "../../../shared/ui";
import { PlayerDetail } from "../../players.model";

/** Sous-attributs regroupés (libellés issus du catalogue API), gardien en tête pour les gardiens. */
@Component({
  selector: "ef-attributes-tab",
  imports: [TagModule, AttributeBar, Panel, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="intro">{{ detail().player.fc27 ? "Sous-attributs FC 27 importés depuis FUTWIZ." : "Sous-attributs simulés : joueur absent du filtre FC 27." }}</p>
    <div class="grid">
      @for (g of groups(); track g.key) {
        <ef-panel [heading]="g.label">
          <ef-rating panel-actions [value]="g.rating" [pill]="true" />
          @for (a of g.attributes; track a.key) { <ef-attribute-bar [label]="a.label" [value]="detail().attributes[a.key]" /> }
        </ef-panel>
      }
    </div>
    <ef-panel heading="PlayStyles relevés" subheading="Libellés FC 27 d'origine, non traduits">
      <div class="tags">
        @for (s of detail().playstyles; track s) { <p-tag [value]="s" severity="secondary" /> }
        @empty { <span class="ef-muted">Aucun PlayStyle relevé sur la fiche source.</span> }
      </div>
    </ef-panel>
  `,
  styles: `
    :host { display: grid; gap: var(--ef-space-4); }
    .intro { color: var(--ef-text-muted); font-size: var(--ef-text-sm); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--ef-space-4); }
    .tags { display: flex; flex-wrap: wrap; gap: var(--ef-space-2); }
  `,
})
export class AttributesTab {
  private readonly catalog = inject(CatalogService);
  readonly detail = input.required<PlayerDetail>();
  readonly groups = computed(() => {
    const groups = this.catalog.state().data?.groups ?? [];
    const gk = this.detail().player.goalkeeper;
    const ordered = gk ? [...groups.filter((g) => g.key === "gardien"), ...groups.filter((g) => g.key !== "gardien")]
      : groups.filter((g) => g.key !== "gardien");
    return ordered.map((g) => ({ ...g, rating: g.key === "gardien" ? null : this.detail().player.ratings[g.key] ?? null }));
  });
}
