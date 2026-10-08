import { Component, computed, DestroyRef, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { DecimalPipe } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectButtonModule } from "primeng/selectbutton";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { DatePickerModule } from "primeng/datepicker";
import { TextareaModule } from "primeng/textarea";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { TableModule } from "primeng/table";
import { ChartModule } from "primeng/chart";
import { SkeletonModule } from "primeng/skeleton";
import { AccordionModule } from "primeng/accordion";
import { DevelopmentService } from "../development.service";
import { Category, POSITIONS, Profile } from "../development.model";

@Component({selector:"app-development-page",standalone:true,
  imports:[FormsModule,RouterLink,DecimalPipe,ButtonModule,TagModule,SelectModule,MultiSelectModule,SelectButtonModule,
    InputTextModule,InputNumberModule,DatePickerModule,TextareaModule,CheckboxModule,DialogModule,MessageModule,TableModule,ChartModule,SkeletonModule,AccordionModule],
  templateUrl:"./development.page.html"})
export class DevelopmentPage {
  readonly service=inject(DevelopmentService);
  private readonly destroyRef=inject(DestroyRef);
  private readonly route=inject(ActivatedRoute);
  private readonly router=inject(Router);
  private initialSelectionDone=false;
  readonly category=signal<Category>("youth");
  readonly search=signal("");
  readonly first=signal(0);
  readonly filtered=computed(()=>this.service.filtered(this.service.profiles().data??[],this.category(),this.search()));
  readonly mobileProfiles=computed(()=>this.service.filtered(this.service.profiles().data??[],this.category(),""));
  readonly categories=[{label:"Formation",value:"youth"},{label:"Collectif",value:"pro"},{label:"Prospects",value:"prospect"}];
  readonly referenceCategories=[{label:"Collectif professionnel",value:"pro"},{label:"Prospects",value:"prospect"},{label:"Autres jeunes",value:"youth"}];
  readonly inputCategories=[{label:"Formation",value:"youth"},{label:"Prospect",value:"prospect"}];
  readonly positions=POSITIONS;
  readonly feet=[{label:"Droit",value:"Droit"},{label:"Gauche",value:"Gauche"},{label:"Les deux",value:"Les deux"}];
  readonly formVisible=signal(false);
  readonly saving=signal(false);
  readonly formError=signal<string|null>(null);
  readonly success=signal<string|null>(null);
  editingId:string|null=null;
  draft=this.service.input();
  draftDate:Date|null=null;
  readonly today=new Date();
  constructor() {
    effect(()=>{
      const profiles=this.service.profiles().data;
      if(profiles?.length&&!this.initialSelectionDone) {
        const requested=profiles.find(p=>p.id===this.route.snapshot.queryParamMap.get("player"));
        const selected=requested??profiles.find(p=>p.id===this.service.targetId())??profiles.find(p=>p.category==="youth")??profiles[0];
        this.initialSelectionDone=true;this.category.set(selected.category);this.selectProfile(selected.id);
      }
    });
  }
  openForm(profile?:Profile) {this.editingId=profile?.id??null;this.draft=this.service.input(profile);this.draftDate=profile?.assessed_on?new Date(profile.assessed_on + "T12:00:00"):null;this.formError.set(null);this.formVisible.set(true);}
  changePosition(position:string) {
    const keeperChanged=(this.draft.position==="GK")!==(position==="GK");
    this.draft.position=position;
    if(keeperChanged) this.draft.ratings=Object.fromEntries(this.service.metrics(position).map(m=>[m.key,null]));
  }
  changeCategory(category:Category) {this.category.set(category);this.first.set(0);}
  changeSearch(search:string) {this.search.set(search);this.first.set(0);}
  selectProfile(id:string) {
    this.service.select(id);
    void this.router.navigate([], {relativeTo:this.route,queryParams:{player:id},queryParamsHandling:"merge",replaceUrl:true});
  }
  save() {
    this.draft.assessed_on=this.service.dateString(this.draftDate);
    const error=this.service.validate(this.draft);this.formError.set(error);if(error||this.saving())return;
    this.saving.set(true);
    this.service.save(this.draft,this.editingId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:profile=>{this.saving.set(false);this.formVisible.set(false);this.changeCategory(profile.category);this.changeSearch("");this.selectProfile(profile.id);this.service.refresh();this.success.set("Profil enregistré. La comparaison tient compte des qualités renseignées.");},
      error:error=>{this.saving.set(false);this.formError.set(this.service.errorMessage(error));}
    });
  }
}
