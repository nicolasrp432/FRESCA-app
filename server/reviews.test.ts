import { describe, expect, it } from "vitest";
import app from "./app";

describe("API de Reseñas y Calificaciones", () => {
  it("GET /api/reviews retorna la lista inicial y estadísticas correctas", async () => {
    const res = await app.request("/api/reviews");
    expect(res.status).toBe(200);

    const data = (await res.json()) as any;
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.reviews)).toBe(true);
    expect(data.reviews.length).toBeGreaterThan(0);
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBe(data.reviews.length);
    expect(data.stats.average).toBeGreaterThanOrEqual(1);
    expect(data.stats.average).toBeLessThanOrEqual(5);
    expect(data.stats.distribution).toBeDefined();
  });

  it("POST /api/reviews rechaza calificaciones inválidas (menores a 1 o mayores a 5)", async () => {
    const resUnder = await app.request("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 0, comment: "Malo" }),
    });
    expect(resUnder.status).toBe(400);

    const resOver = await app.request("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 6, comment: "Excelente" }),
    });
    expect(resOver.status).toBe(400);

    const resMissing = await app.request("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "Sin estrellas" }),
    });
    expect(resMissing.status).toBe(400);
  });

  it("POST /api/reviews guarda una nueva reseña con estrellas y la persiste en la base de datos", async () => {
    const payload = {
      rating: 5,
      comment: "¡Excelente aplicación para evitar botar plátanos y aguacates!",
      tags: ["🥑 IA de escaneo", "🍲 Recetas de rescate"],
      userName: "Nicolás Test",
      userId: "cf_usr_test_123",
    };

    const res = await app.request("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ok).toBe(true);
    expect(data.review).toBeDefined();
    expect(data.review.id).toMatch(/^rev_/);
    expect(data.review.rating).toBe(5);
    expect(data.review.userName).toBe("Nicolás Test");
    expect(data.review.comment).toBe(payload.comment);
    expect(data.review.tags).toEqual(payload.tags);
    expect(data.review.createdAt).toBeDefined();

    // Comprobar que al consultar GET /api/reviews la nueva reseña aparece primero
    const listRes = await app.request("/api/reviews");
    const listData = (await listRes.json()) as any;
    const found = listData.reviews.find((r: any) => r.id === data.review.id);
    expect(found).toBeDefined();
    expect(found.rating).toBe(5);
    expect(found.userName).toBe("Nicolás Test");
  });

  it("DELETE /api/reviews/:id permite eliminar una reseña creada", async () => {
    const postRes = await app.request("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, comment: "Para borrar", userName: "Temporal" }),
    });
    const postData = (await postRes.json()) as any;
    const reviewId = postData.review.id;

    const delRes = await app.request(`/api/reviews/${reviewId}`, { method: "DELETE" });
    expect(delRes.status).toBe(200);

    const listRes = await app.request("/api/reviews");
    const listData = (await listRes.json()) as any;
    const found = listData.reviews.find((r: any) => r.id === reviewId);
    expect(found).toBeUndefined();
  });
});
