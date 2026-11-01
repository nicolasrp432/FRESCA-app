import { beforeEach, describe, expect, it } from "vitest";
import { actions, getState } from "./store";
import { RECIPES } from "../data/recipes";

describe("store", () => {
  beforeEach(() => actions.wipe());
  it("agrega, usa y bota con historial", () => {
    actions.addItems([{ kind: "banano", qty: 3 }, { kind: "fresa", qty: 1, stage: 2 }]);
    const [b, f] = getState().items;
    actions.useItem(b.id, 1);
    expect(getState().items[0].qty).toBe(2);
    actions.tossItem(f.id, "danio");
    expect(getState().items[1].status).toBe("tossed");
    expect(getState().events.map((e) => e.type)).toEqual(["rescued", "tossed"]);
  });
  it("cocinar consume lo que pide la receta, lo más maduro primero", () => {
    actions.addItems([{ kind: "banano", qty: 1, stage: 0 }]);
    actions.addItems([{ kind: "banano", qty: 2, stage: 2 }]);
    const r = actions.cookRecipe(RECIPES.find((x) => x.id === "batido-banano")!);
    expect(r.grams).toBe(240);
    const open = getState().items.filter((i) => i.status === "open");
    expect(open).toHaveLength(1);
    expect(open[0].stage).toBe(0);
  });
});
