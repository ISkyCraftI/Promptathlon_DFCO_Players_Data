/**
 * EXAMPLE — feature CRUD de reference (desactivee).
 * Garder ce dossier comme template pour de nouvelles features.
 * Reactiver : decommenter la route dans app.routes.ts
 * et ajouter une entree dans shared/components/menu-bar.
 */

import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { ItemsService } from "../items.service";

@Component({
  selector: "app-items-page",
  standalone: true,
  imports: [FormsModule, Button, InputText, Textarea, TableModule],
  templateUrl: "./items.page.html",
  styleUrl: "./items.page.css",
})
export class ItemsPage {
  private readonly itemsService = inject(ItemsService);

  protected readonly items = this.itemsService.items;

  protected title = "";
  protected description = "";

  protected createItem(): void {
    const title = this.title.trim();
    if (!title) {
      return;
    }

    this.itemsService.addItem({
      title,
      description: this.description.trim(),
    }).subscribe({
      next: () => {
        this.title = "";
        this.description = "";
        this.itemsService.refresh();
      },
      error: (err) => console.error(err),
    });
  }

  protected removeItem(id: number): void {
    this.itemsService.deleteItem(id).subscribe({
      next: () => this.itemsService.refresh(),
      error: (err) => console.error(err),
    });
  }
}
