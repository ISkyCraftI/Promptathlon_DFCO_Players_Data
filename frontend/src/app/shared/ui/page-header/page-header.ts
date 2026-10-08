import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** En-tête de page : titre, description courte et actions à droite. */
@Component({
  selector: "ef-page-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ph-text">
      <ng-content select="[ph-before]" />
      <h1>{{ heading() }}</h1>
      @if (description()) { <p>{{ description() }}</p> }
    </div>
    <div class="ph-actions"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--ef-space-4); flex-wrap: wrap; }
    h1 { font-size: var(--ef-text-2xl); font-weight: 800; letter-spacing: -0.02em; }
    p { margin-top: var(--ef-space-1); color: var(--ef-text-muted); max-width: 70ch; }
    .ph-actions { display: flex; align-items: center; gap: var(--ef-space-2); flex-wrap: wrap; }
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
