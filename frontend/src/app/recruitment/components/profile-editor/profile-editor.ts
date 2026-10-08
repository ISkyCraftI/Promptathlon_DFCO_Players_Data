import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { RatingModule } from "primeng/rating";
import { SelectButtonModule } from "primeng/selectbutton";
import { TextareaModule } from "primeng/textarea";
import { CatalogService } from "../../../core/catalog/catalog.service";
import { errorMessage } from "../../../shared/state/load-state";
import { Profile, ProfileInput, ROLES } from "../../recruitment.model";
import { RecruitmentService } from "../../recruitment.service";

type Role = (typeof ROLES)[number];

/** Création / édition d'un profil de poste : importance de chaque attribut de 0 à 3 étoiles. */
@Component({
  selector: "ef-profile-editor",
  imports: [FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule, RatingModule,
    SelectButtonModule, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-editor.html",
  styleUrl: "./profile-editor.css",
})
export class ProfileEditor {
  private readonly service = inject(RecruitmentService);
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);
  /** null = fermé, "new" = création, Profile = édition. */
  readonly profile = input<Profile | "new" | null>(null);
  readonly closed = output<void>();
  readonly saved = output<Profile>();
  readonly removed = output<void>();
  readonly roles = ROLES.map((r) => ({ label: r, value: r }));
  readonly visible = computed(() => this.profile() !== null);
  readonly editing = computed(() => typeof this.profile() === "object" && this.profile() !== null);
  readonly role = signal<Role>("Milieu");
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  draft: ProfileInput = this.blank("Milieu");

  /** Groupes affichés : gardien seulement pour le poste Gardien. */
  readonly groups = computed(() => (this.catalog.state().data?.groups ?? [])
    .filter((g) => this.role() === "Gardien" || g.key !== "gardien")
    .sort((a, b) => Number(b.key === "gardien") - Number(a.key === "gardien")));
  readonly weighted = signal(0);

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p === null) return;
      if (p === "new") {
        this.draft = this.blank("Milieu");
      } else {
        this.draft = { ...p, weights: { ...p.weights } };
      }
      this.role.set(this.draft.role);
      this.error.set(null);
      this.count();
    });
  }

  private blank(role: Role): ProfileInput {
    const defaults = this.catalog.state().data?.role_weights[role] ?? {};
    return { name: "", role, description: "", weights: { ...defaults }, max_age: null, min_overall: null };
  }

  changeRole(role: Role): void {
    this.role.set(role);
    this.draft.role = role;
    if (!this.editing()) this.draft.weights = { ...(this.catalog.state().data?.role_weights[role] ?? {}) };
    this.count();
  }

  count(): void {
    this.weighted.set(Object.values(this.draft.weights).filter((v) => v > 0).length);
  }

  submit(): void {
    if (this.draft.name.trim().length < 3) { this.error.set("Donnez un nom d'au moins trois caractères."); return; }
    if (!this.weighted()) { this.error.set("Donnez de l'importance à au moins un attribut."); return; }
    const p = this.profile();
    this.saving.set(true);
    this.error.set(null);
    const weights = Object.fromEntries(Object.entries(this.draft.weights).filter(([, v]) => v > 0));
    this.service.save({ ...this.draft, name: this.draft.name.trim(), weights }, typeof p === "object" && p ? p.id : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (saved) => { this.saving.set(false); this.service.refresh(); this.saved.emit(saved); },
        error: (e) => { this.saving.set(false); this.error.set(errorMessage(e)); },
      });
  }

  remove(): void {
    const p = this.profile();
    if (typeof p !== "object" || !p) return;
    this.saving.set(true);
    this.service.remove(p.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.service.refresh(); this.removed.emit(); },
      error: (e) => { this.saving.set(false); this.error.set(errorMessage(e)); },
    });
  }
}
