import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SelectButtonModule } from "primeng/selectbutton";
import { CatalogService } from "../../../core/catalog/catalog.service";
import { AttributeBar, Panel } from "../../../shared/ui";
import { signed } from "../../../shared/utils/football";
import { Comparison } from "../../comparison.model";

/** Tous les sous-attributs : barre = joueur comparé, repère = référence. Tri par groupe ou par écart. */
@Component({
  selector: "ef-gap-list",
  imports: [FormsModule, SelectButtonModule, AttributeBar, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Attribut par attribut" [subheading]="'Barre : ' + data().subject.name + ' · trait vertical : ' + data().reference.name">
      <p-selectbutton panel-actions [options]="modes" optionLabel="label" optionValue="value" [ngModel]="mode()" (ngModelChange)="mode.set($event ?? 'group')" [allowEmpty]="false" size="small" ariaLabel="Tri" />
      @if (mode() === "group") {
        <div class="cols">
          @for (g of grouped(); track g.key) {
            <section><h3>{{ g.label }}</h3>
              @for (a of g.items; track a.key) { <ef-attribute-bar [label]="a.display" [value]="a.subject" [reference]="a.reference" /> }
            </section>
          }
        </div>
      } @else {
        <div class="cols">
          @for (a of byGap(); track a.key) {
            <div class="gap-row"><ef-attribute-bar [label]="a.label" [value]="a.subject" [reference]="a.reference" /><span class="ef-num" [class.pos]="a.gap > 0">{{ signed(a.gap) }}</span></div>
          }
        </div>
      }
      <p class="note">★ importance de l'attribut pour le poste (référentiel ajustable par le staff).</p>
    </ef-panel>
  `,
  styles: `
    .cols { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--ef-space-2) var(--ef-space-6); }
    h3 { font-size: var(--ef-text-sm); color: var(--ef-text-muted); margin: var(--ef-space-2) 0 var(--ef-space-1); }
    .gap-row { display: grid; grid-template-columns: minmax(0, 1fr) 2.5rem; align-items: center; gap: var(--ef-space-2); }
    .gap-row .ef-num { text-align: right; color: var(--ef-text-muted); }
    .gap-row .pos { color: var(--ef-accent-text); }
    .note { margin-top: var(--ef-space-3); font-size: var(--ef-text-xs); color: var(--ef-text-faint); }
  `,
})
export class GapList {
  private readonly catalog = inject(CatalogService);
  readonly data = input.required<Comparison>();
  readonly modes = [{ label: "Par groupe", value: "group" }, { label: "Par écart", value: "gap" }];
  readonly signed = signed;
  readonly mode = signal<"group" | "gap">("group");
  readonly grouped = computed(() => {
    const groups = this.catalog.state().data?.groups ?? [];
    const attrs = this.data().attributes.map((a) => ({ ...a, display: a.importance ? `${a.label} ${"★".repeat(a.importance)}` : a.label }));
    return groups.map((g) => ({ key: g.key, label: g.label, items: g.attributes.map((a) => attrs.find((x) => x.key === a.key)).filter((x) => !!x) }))
      .filter((g) => g.items.length);
  });
  readonly byGap = computed(() => [...this.data().attributes].sort((a, b) => b.gap - a.gap));
}
