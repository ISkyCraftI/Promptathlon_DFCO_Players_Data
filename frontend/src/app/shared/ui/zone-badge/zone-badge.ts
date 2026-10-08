import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { zoneTone } from "../../utils/football";

const LABELS: Record<string, string> = {
  "sous-charge": "Sous-charge", optimale: "Optimale", vigilance: "Vigilance", risque: "Surcharge", retour: "Protocole retour", inconnue: "—",
};

/** Zone de charge ACWR sous forme de tag (couleur = tonalité de la zone). */
@Component({
  selector: "ef-zone-badge",
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="label()" [severity]="severity()" />`,
})
export class ZoneBadge {
  readonly zone = input.required<string>();
  readonly label = computed(() => LABELS[this.zone()] ?? this.zone());
  readonly severity = computed(() => {
    const tone = zoneTone(this.zone());
    return tone === "neutral" || tone === "accent" ? "secondary" : tone;
  });
}
