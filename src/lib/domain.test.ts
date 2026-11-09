import { describe, expect, it } from "vitest";
import { FOODS } from "../data/foods";
import { recipeById } from "../data/recipes";
import { DAY, buildNotices, buyLessTips, computeStats, currentStage, eventFor, levelFor, startOfWeek, type Item } from "./domain";

const T0 = new Date(2026, 10, 2, 9, 0).getTime(); // lunes 2 nov 2026
const item = (p: Partial<Item>): Item => ({ id: "x", kind: "banano", qty: 1, addedAt: T0, stage: 0, stageAt: T0, status: "open", ...p });

describe("madurez", () => {
  it("avanza según los días de cada fase", () => {
    const b = item({});
    expect(currentStage(b, T0)).toBe(0);
    expect(currentStage(b, T0 + 2.9 * DAY)).toBe(0);
    expect(currentStage(b, T0 + 3 * DAY)).toBe(1);
    expect(currentStage(b, T0 + 5 * DAY)).toBe(2);
    expect(currentStage(b, T0 + 30 * DAY)).toBe(3);
  });
  it("la fresa se pasa más rápido", () => {
    expect(currentStage(item({ kind: "fresa" }), T0 + 2 * DAY)).toBe(2);
  });
  it("la zanahoria aguanta más tiempo firme y avanza según sus días", () => {
    const z = item({ kind: "zanahoria" });
    expect(currentStage(z, T0)).toBe(0);
    expect(currentStage(z, T0 + 5.9 * DAY)).toBe(0);
    expect(currentStage(z, T0 + 6 * DAY)).toBe(1);
    expect(currentStage(z, T0 + 10 * DAY)).toBe(2);
    expect(currentStage(z, T0 + 13 * DAY)).toBe(3);
  });
  it("parte del último estado confirmado", () => {
    expect(currentStage(item({ stage: 2, stageAt: T0 }), T0 + DAY)).toBe(2);
  });
});

describe("estadísticas", () => {
  it("suma kg, pesos y nivel", () => {
    const evs = [eventFor("rescued", "papaya", 1, {}, T0), eventFor("rescued", "banano", 2, {}, T0 + DAY), eventFor("tossed", "fresa", 1, {}, T0 + DAY)];
    const s = computeStats(evs, T0 + 2 * DAY);
    expect(s.rescuedKg).toBeCloseTo(1.44);
    expect(s.pesos).toBe(6000);
    expect(s.levelName).toBe("Brote");
    expect(s.nextLevelName).toBe("Mata");
    expect(s.kgToNext).toBeCloseTo(1.56);
    expect(s.days[0].rescued).toBe(12);
    expect(s.days[1].tossed).toBe(3);
    expect(s.star?.kind).toBe("banano");
    expect(s.escape?.kind).toBe("fresa");
  });
  it("niveles", () => {
    expect(levelFor(0)).toBe(0);
    expect(levelFor(2.3)).toBe(1);
    expect(levelFor(10)).toBe(4);
  });
  it("la semana empieza el lunes", () => {
    expect(new Date(startOfWeek(T0 + 6 * DAY)).getDay()).toBe(1);
  });
});

describe("consejos y avisos", () => {
  it("aconseja comprar menos de lo que se bota", () => {
    const evs = [eventFor("tossed", "fresa", 1, {}, T0), eventFor("tossed", "fresa", 1, {}, T0 + DAY), eventFor("tossed", "mango", 1, {}, T0)];
    const tips = buyLessTips(evs, T0 + 2 * DAY);
    expect(tips[0].title).toBe("Botaste fresas 2 veces");
    expect(tips[0].tip).toBe("Mejor media libra.");
  });
  it("avisa lo que pide uso y las subidas de nivel", () => {
    const n = buildNotices([item({ qty: 2 })], [eventFor("rescued", "papaya", 1, {}, T0)], () => "Batido", T0 + 5.5 * DAY);
    expect(n.some((x) => x.title === "2 bananos piden uso")).toBe(true);
    expect(n.some((x) => x.title === "Tu matera sacó un brote")).toBe(true);
  });
  it("incluye zanahorias y sus recetas correspondientes", () => {
    expect(FOODS.zanahoria).toBeDefined();
    expect(FOODS.zanahoria.name).toBe("Zanahoria");
    expect(recipeById("crema-zanahoria")).toBeDefined();
    expect(recipeById("torta-zanahoria")).toBeDefined();
    expect(recipeById("jugo-zanahoria-limon")).toBeDefined();
  });
});
