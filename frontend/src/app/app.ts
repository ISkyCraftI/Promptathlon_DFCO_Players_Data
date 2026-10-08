import { Component } from "@angular/core";
import { AppShell } from "./core/layout/app-shell/app-shell";

@Component({
  selector: "app-root",
  imports: [AppShell],
  template: `<ef-app-shell />`,
})
export class App {}
