import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

export interface PitchMarker {
  x: number;
  y: number;
  label: string;
  sub?: string;
  tone?: "accent" | "success" | "warn" | "danger" | "info" | "muted";
  link?: unknown[];
}

/** Terrain vertical (attaque en haut) avec marqueurs positionnés en %. */
@Component({
  selector: "ef-pitch",
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.compact]": "compact()" },
  template: `
    <svg class="lines" viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="1" width="66" height="98" rx="1" />
      <line x1="1" y1="50" x2="67" y2="50" />
      <circle cx="34" cy="50" r="7" />
      <rect x="15" y="1" width="38" height="14" />
      <rect x="25" y="1" width="18" height="5" />
      <rect x="15" y="85" width="38" height="14" />
      <rect x="25" y="94" width="18" height="5" />
    </svg>
    @for (m of markers(); track $index) {
      @if (m.link) {
        <a class="marker" [routerLink]="m.link" [attr.data-tone]="m.tone ?? 'accent'" [style.left.%]="m.x" [style.top.%]="m.y">
          <span class="dot"></span><span class="name">{{ m.label }}</span>@if (m.sub) {<span class="sub">{{ m.sub }}</span>}
        </a>
      } @else {
        <span class="marker" [attr.data-tone]="m.tone ?? 'accent'" [style.left.%]="m.x" [style.top.%]="m.y">
          <span class="dot"></span>@if (!compact()) {<span class="name">{{ m.label }}</span>}@if (m.sub && !compact()) {<span class="sub">{{ m.sub }}</span>}
        </span>
      }
    }
  `,
  styleUrl: "./pitch.css",
})
export class Pitch {
  readonly markers = input<PitchMarker[]>([]);
  /** Mini-carte (poste d'un joueur) : marqueurs sans libellé. */
  readonly compact = input(false);
}
