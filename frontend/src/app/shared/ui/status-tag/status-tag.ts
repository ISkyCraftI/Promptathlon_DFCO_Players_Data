import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { statusSeverity } from "../../utils/football";

/** Statut de santé du joueur (Disponible, Vigilance, Réathlétisation, Blessé). */
@Component({
  selector: "ef-status-tag",
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="status()" [severity]="severity()" [rounded]="true" />`,
})
export class StatusTag {
  readonly status = input.required<string>();
  readonly severity = computed(() => statusSeverity(this.status()));
}
