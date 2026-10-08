import { computed, inject, Injectable, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, catchError, combineLatest, debounceTime, map, of, startWith, switchMap } from "rxjs";
import { z } from "zod";
import { AsyncHttpClient } from "../shared/services/async-http-client";
import { ErrorWrapper } from "../shared/errors/error-wrapper";
import { LoadState } from "../players/players.model";
import { Category, Comparison, ComparisonSchema, Criteria, FIELD_METRICS, KEEPER_METRICS, POSITIONS, Profile, ProfileInput, ProfileSchema } from "./development.model";

@Injectable({providedIn:"root"})
export class DevelopmentService {
  private readonly http = inject(AsyncHttpClient);
  private readonly reload = new BehaviorSubject<void>(undefined);
  readonly targetId = signal<string | null>(null);
  readonly criteria = signal<Criteria>({reference_category:"pro", strict_position:false, same_foot:false, min_age:null, max_age:null});
  readonly referenceIds = signal<string[]>([]);
  readonly profiles = toSignal(this.reload.pipe(switchMap(() => this.http.get<unknown>("/development/profiles/").pipe(
    map(raw => ({data:z.array(ProfileSchema).parse(raw), loading:false, error:null} as LoadState<Profile[]>)),
    startWith({data:null, loading:true, error:null} as LoadState<Profile[]>),
    catchError(error => of({data:null, loading:false, error:this.errorMessage(error)} as LoadState<Profile[]>))
  ))), {initialValue:{data:null, loading:true, error:null} as LoadState<Profile[]>});
  readonly selected = computed(() => this.profiles().data?.find(p => p.id === this.targetId()) ?? null);
  readonly comparison = toSignal(combineLatest([toObservable(this.targetId), toObservable(this.criteria), toObservable(this.referenceIds), this.reload]).pipe(
    debounceTime(150), switchMap(([id, criteria, refs]) => !id ? of({data:null, loading:false, error:null} as LoadState<Comparison>)
      : this.http.post<unknown>({endpoint:"/development/compare/", json:{target_id:id, ...criteria, reference_ids:refs.length ? refs : null}}).pipe(
        map(raw => ({data:ComparisonSchema.parse(raw), loading:false, error:null} as LoadState<Comparison>)),
        startWith({data:null, loading:true, error:null} as LoadState<Comparison>),
        catchError(error => of({data:null, loading:false, error:this.errorMessage(error)} as LoadState<Comparison>))
      ))), {initialValue:{data:null, loading:false, error:null} as LoadState<Comparison>});
  select(id:string) { this.referenceIds.set([]); this.targetId.set(id); }
  changeCriteria(patch:Partial<Criteria>) {this.referenceIds.set([]); this.criteria.update(c=>({...c,...patch}));}
  refresh() { this.reload.next(); }
  errorMessage(error:unknown) {return error instanceof ErrorWrapper ? error.userSafeDescription : "Impossible de charger les profils. Vérifiez le serveur et réessayez.";}
  categoryLabel(category:Category) {return {youth:"Formation",pro:"Collectif pro",prospect:"Prospect"}[category];}
  positionLabel(position:string) {return POSITIONS.find(p=>p.value===position)?.label ?? position;}
  metrics(position:string) {return position === "GK" ? KEEPER_METRICS : FIELD_METRICS;}
  filtered(profiles:Profile[], category:Category, search:string) {
    const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    return profiles.filter(p=>p.category===category && normalize(p.name).includes(normalize(search)));
  }
  input(profile?:Profile):ProfileInput {
    return profile ? {name:profile.name, category:profile.category === "prospect" ? "prospect" : "youth", age:profile.age,
      position:profile.position, foot:profile.foot, height:profile.height, weight:profile.weight, ratings:{...profile.ratings},
      observations:profile.observations, minutes:profile.minutes, assessed_on:profile.assessed_on, note:profile.note}
      : {name:"", category:"youth", age:17, position:"CM", foot:null, height:null, weight:null,
        ratings:Object.fromEntries(FIELD_METRICS.map(m=>[m.key,null])), observations:0, minutes:null, assessed_on:null, note:""};
  }
  validate(input:ProfileInput):string | null {
    if(input.name.trim().length<2) return "Renseignez le nom du joueur (deux caractères minimum).";
    if(!Number.isInteger(input.age)||input.age<12||input.age>45) return "Renseignez un âge compris entre 12 et 45 ans.";
    if(input.height!==null&&(!Number.isInteger(input.height)||input.height<120||input.height>230)) return "La taille doit être un entier compris entre 120 et 230 cm.";
    if(input.weight!==null&&(input.weight<25||input.weight>150)) return "Le poids doit être compris entre 25 et 150 kg.";
    if(!Number.isInteger(input.observations)||input.observations<0||input.observations>500) return "Renseignez un nombre d’observations entier entre 0 et 500.";
    if(input.minutes!==null&&(!Number.isInteger(input.minutes)||input.minutes<0||input.minutes>20000)) return "Le temps de jeu doit être un entier entre 0 et 20 000 minutes.";
    if(Object.values(input.ratings).some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>100))) return "Chaque qualité doit être un entier entre 0 et 100, ou rester vide.";
    if(input.assessed_on&&input.assessed_on>new Date().toISOString().slice(0,10)) return "La date d’observation ne peut pas être future.";
    return null;
  }
  dateString(value:Date|null) {return value?`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`:null;}
  save(input:ProfileInput,id:string|null) {
    const options={endpoint:id?`/development/profiles/${encodeURIComponent(id)}`:"/development/profiles/",json:{...input, assessed_on:input.assessed_on || null}};
    return (id?this.http.put<unknown>(options):this.http.post<unknown>(options)).pipe(map(raw=>ProfileSchema.parse(raw)));
  }
  chart(comparison:Comparison) {
    const measured=comparison.metrics.filter(m=>m.value!==null && m.benchmark!==null);
    return {labels:measured.map(m=>m.label), datasets:[
      {label:comparison.target.name,data:measured.map(m=>m.value),borderColor:"#ef6c7a",backgroundColor:"#ef6c7a33",pointBackgroundColor:"#ef6c7a",borderWidth:2},
      {label:"Moyenne des références",data:measured.map(m=>m.benchmark),borderColor:"#88bea6",backgroundColor:"#88bea61a",pointBackgroundColor:"#88bea6",borderWidth:2},
    ]};
  }
  comparableCount(comparison:Comparison) {return comparison.metrics.filter(m=>m.value!==null&&m.benchmark!==null).length;}
  readonly chartOptions={responsive:true,maintainAspectRatio:false,animation:false as const,plugins:{legend:{labels:{color:"#d5cacd",font:{size:11},usePointStyle:true}}},
    scales:{r:{min:0,max:100,ticks:{stepSize:25,color:"#8a8085",backdropColor:"transparent"},grid:{color:"#ffffff16"},angleLines:{color:"#ffffff16"},pointLabels:{color:"#e1d6d8",font:{size:12}}}}};
}
