import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { filter, switchMap } from "rxjs";
import { LOADING, LoadState, toLoadState } from "../../shared/state/load-state";
import { AsyncState, PageHeader, Panel } from "../../shared/ui";
import { ProfileEditor } from "../components/profile-editor/profile-editor";
import { ProfileList } from "../components/profile-list/profile-list";
import { ShortlistView } from "../components/shortlist/shortlist";
import { SimilarFinder } from "../components/similar-finder/similar-finder";
import { Profile, Shortlist } from "../recruitment.model";
import { RecruitmentService } from "../recruitment.service";

@Component({
  selector: "app-recruitment-page",
  imports: [ButtonModule, TagModule, AsyncState, PageHeader, Panel, ProfileEditor, ProfileList, ShortlistView, SimilarFinder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./recruitment.page.html",
  styleUrl: "./recruitment.page.css",
})
export class RecruitmentPage {
  readonly service = inject(RecruitmentService);
  /** ?similaire=<id> : pré-remplit la recherche de profils similaires (depuis une fiche joueur). */
  readonly similaire = input<string>();
  readonly similarId = signal<string | null>(null);
  readonly selectedId = signal<number | null>(null);
  readonly editing = signal<Profile | "new" | null>(null);
  readonly profiles = computed(() => this.service.profiles().data ?? []);
  readonly selected = computed(() => this.profiles().find((p) => p.id === this.selectedId()) ?? null);
  readonly version = signal(0);

  readonly shortlist = toSignal(toObservable(computed(() => ({ id: this.selectedId(), v: this.version() }))).pipe(
    filter((s) => s.id !== null), switchMap((s) => this.service.shortlist(s.id!).pipe(toLoadState<Shortlist>())),
  ), { initialValue: LOADING as LoadState<Shortlist> });

  constructor() {
    effect(() => {
      const list = this.profiles();
      if (list.length && !list.some((p) => p.id === this.selectedId())) this.selectedId.set(list[0].id);
    });
    effect(() => { if (this.similaire()) this.similarId.set(this.similaire()!); });
  }

  onSaved(profile: Profile): void {
    this.editing.set(null);
    this.selectedId.set(profile.id);
    this.version.update((v) => v + 1);
  }

  onRemoved(): void {
    this.editing.set(null);
    this.selectedId.set(null);
  }
}
