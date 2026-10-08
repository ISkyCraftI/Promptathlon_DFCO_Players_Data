import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MenuBar } from "./shared/components/menu-bar/menu-bar";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, MenuBar],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {}
