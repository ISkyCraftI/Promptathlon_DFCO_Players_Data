import { ChangeDetectionStrategy, Component, computed, inject, output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ThemeService } from "../../theme/theme.service";
import { NAVIGATION } from "../navigation";

@Component({
  selector: "ef-sidebar",
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./sidebar.html",
  styleUrl: "./sidebar.css",
})
export class Sidebar {
  private readonly theme = inject(ThemeService);
  readonly navigate = output<void>();
  readonly sections = NAVIGATION;
  readonly wordmark = computed(() => this.theme.mode() === "dark" ? "brand/easyfoot-dark.svg" : "brand/easyfoot.svg");
}
