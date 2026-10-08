import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Panel, Pitch, PitchMarker } from "../../../shared/ui";
import { Dashboard } from "../../coach.model";

/** Onze disponible (4-3-3) sur le terrain + profondeur de banc par ligne. */
@Component({
  selector: "ef-lineup-panel",
  imports: [RouterLink, Panel, Pitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ef-panel heading="Onze disponible" subheading="4-3-3 · meilleure note générale parmi les joueurs disponibles">
      <div class="grid">
        <ef-pitch [markers]="markers()" />
        <div class="depth">
          @for (d of data().depth; track d.role) {
            <section>
              <h3>{{ d.role }}s <span class="ef-num">{{ d.available }}/{{ d.total }}</span></h3>
              <ul>
                @for (p of d.players; track p.id) {
                  <li [class.out]="p.status === 'Blessé' || p.status === 'Réathlétisation'">
                    <span class="st" [attr.data-status]="p.status" [title]="p.status"></span>
                    <a [routerLink]="['/effectif', p.id]">{{ p.name }}@if (p.status !== "Disponible") {<span class="sr-only"> ({{ p.status }})</span>}</a>
                    <span class="pos">{{ p.position.length > 4 ? "—" : p.position }}</span>
                    <span class="ef-num ovr">{{ p.overall ?? "—" }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      </div>
      <p class="legend"><span class="st" data-status="Disponible"></span> Disponible <span class="st" data-status="Vigilance"></span> Vigilance
        <span class="st" data-status="Réathlétisation"></span> Réathlétisation <span class="st" data-status="Blessé"></span> Blessé</p>
    </ef-panel>
  `,
  styleUrl: "./lineup-panel.css",
})
export class LineupPanel {
  readonly data = input.required<Dashboard>();
  readonly markers = computed<PitchMarker[]>(() => this.data().lineup.map((s) => ({
    x: s.x, y: s.y, label: s.player ? s.player.name.split(" ").slice(-1)[0] : "À pourvoir",
    sub: s.player ? `${s.slot} · ${s.player.overall ?? "—"}` : s.slot,
    tone: !s.player ? "muted" : s.player.status === "Vigilance" ? "warn" : "accent",
    link: s.player ? ["/effectif", s.player.id] : undefined,
  })));
}
