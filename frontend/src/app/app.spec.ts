import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { App } from "./app";
import { filterSquad, squadOverview } from "./players/players.utils";
import { fr, ratingTier, signed } from "./shared/utils/football";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe("football utils", () => {
  it("formats numbers the French way", () => {
    expect(fr(6.92, 2)).toBe("6,92");
    expect(signed(12.5, 1)).toBe("+12,5");
    expect(signed(-3)).toBe("−3");
    expect(fr(null)).toBe("—");
  });

  it("maps ratings to FM-like tiers", () => {
    expect(ratingTier(82)).toBe("elite");
    expect(ratingTier(64)).toBe("fair");
    expect(ratingTier(41)).toBe("poor");
    expect(ratingTier(null)).toBe("none");
  });

  it("filters and summarises the squad", () => {
    const base = { kind: "DFCO", club: "DFCO", position: "CB", goalkeeper: false, age: 24, height: 180, weight: 75, foot: "Droit",
      overall: 60, ratings: {}, availability: "", health: 80, fatigue: 30, satisfaction: 60, return_date: null, fc27: true,
      fc27_url: null, weekly_load: 2000, load_change: 0, acwr: 1, load_zone: "optimale" } as const;
    const players = [
      { ...base, id: "1", name: "Élie Durand", role: "Défenseur", status: "Disponible", alerts: [] },
      { ...base, id: "2", name: "Marc Petit", role: "Milieu", status: "Blessé",
        alerts: [{ level: "danger", title: "Retour", description: "", action: "", section: "physical" }] },
    ] as never[];
    expect(filterSquad(players, "elie", null, "all").length).toBe(1);
    expect(filterSquad(players, "", null, "recovery").length).toBe(1);
    expect(squadOverview(players).available).toBe(1);
  });
});
