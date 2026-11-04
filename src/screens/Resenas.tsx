import { useEffect, useMemo, useState } from "react";
import { fetchReviews, type Review, type ReviewStats } from "../lib/api";
import { BackButton, C, Toast } from "../ui/Common";
import { IconStar } from "../ui/Icons";
import { ReviewSheet } from "../ui/ReviewSheet";

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Hace ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `Hace ${diffDay} ${diffDay === 1 ? "día" : "días"}`;
  return new Date(timestamp).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function Resenas() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "with_comment">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [myReview, setMyReview] = useState<Review | null>(null);

  useEffect(() => {
    // Cargar reseña guardada localmente si existe
    try {
      const saved = localStorage.getItem("fresca:my_review");
      if (saved) setMyReview(JSON.parse(saved));
    } catch {
      // ignorar
    }

    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchReviews();
      if (data.ok) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (e) {
      console.warn("[fresca] Error cargando reseñas:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = (newReview: Review, updatedStats?: ReviewStats) => {
    setMyReview(newReview);
    setSheetOpen(false);
    setToast("¡Reseña guardada con éxito en la base de datos!");
    setReviews((prev) => [newReview, ...prev.filter((r) => r.id !== newReview.id)]);
    if (updatedStats) {
      setStats(updatedStats);
    } else {
      loadReviews();
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filter === "5") return r.rating === 5;
      if (filter === "4") return r.rating === 4;
      if (filter === "with_comment") return Boolean(r.comment && r.comment.trim());
      return true;
    });
  }, [reviews, filter]);

  const totalReviews = stats?.total || reviews.length || 0;
  const avgRating = stats?.average || (totalReviews > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / totalReviews).toFixed(1) : "5.0");

  return (
    <div className="screen" style={{ background: "#FBF7EF" }}>
      {toast && <Toast text={toast} onDone={() => setToast("")} />}

      <div className="scroll" style={{ paddingBottom: 60 }}>
        <div className="zoomable">
          {/* Header con botón atrás */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 0" }}>
            <BackButton to="/perfil" label="Volver a Perfil" />
            <button
              className="press"
              onClick={() => setSheetOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 20,
                background: C.hoja,
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(47,107,58,0.25)",
              }}
            >
              <IconStar size={16} filled color="#FFFFFF" />
              {myReview ? "Editar mi reseña" : "Dejar una reseña"}
            </button>
          </div>

          <div style={{ padding: "12px 20px 0" }}>
            <h1 className="bric" style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Reseñas y opiniones
            </h1>
            <p style={{ fontSize: 15, color: C.suave, marginTop: 4 }}>
              Lo que dice la comunidad que rescata comida con FRESCA.
            </p>
          </div>

          {/* Tarjeta de puntuación promedio y desglose */}
          <div
            style={{
              margin: "18px 20px 0",
              borderRadius: 24,
              background: "#FFFFFF",
              border: "1px solid #EEE6D8",
              padding: "20px 18px",
              boxShadow: "0 6px 18px rgba(70,45,20,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                <span className="bric" style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: C.tinta }}>
                  {avgRating}
                </span>
                <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar key={s} size={18} filled color="#E9B530" />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: C.suave, marginTop: 4, fontWeight: 600 }}>
                  {totalReviews} {totalReviews === 1 ? "opinión" : "opiniones"}
                </span>
              </div>

              {/* Barras de distribución de 5 a 1 estrellas */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats?.distribution?.[star] || reviews.filter((r) => r.rating === star).length;
                  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: C.suave }}>
                      <span style={{ width: 14, textAlign: "right" }}>{star}</span>
                      <IconStar size={12} filled color="#E9B530" />
                      <div className="rating-bar-track">
                        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ width: 28, textAlign: "right", fontSize: 11 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Banner de persistencia en base de datos */}
            <div
              style={{
                marginTop: 18,
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(47,107,58,0.08)",
                border: "1px solid rgba(47,107,58,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F6B3A", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.hoja, fontWeight: 600, lineHeight: 1.3 }}>
                Las reseñas quedan guardadas en la base de datos de FRESCA (Cloudflare Edge KV y Supabase).
              </span>
            </div>
          </div>

          {/* Mi reseña destacada (si existe) */}
          {myReview && (
            <div style={{ margin: "20px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.tinta, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Tu reseña guardada
                </span>
                <button
                  className="press"
                  onClick={() => setSheetOpen(true)}
                  style={{ fontSize: 13, fontWeight: 700, color: C.hoja, background: "none", border: "none", cursor: "pointer" }}
                >
                  Editar
                </button>
              </div>
              <div
                style={{
                  borderRadius: 20,
                  background: "linear-gradient(145deg, #FFFFFF 0%, #F5FBEF 100%)",
                  border: `2px solid ${C.hoja}`,
                  padding: 16,
                  boxShadow: "0 6px 16px rgba(47,107,58,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: C.hoja,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {myReview.userName ? myReview.userName.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.tinta }}>
                        {myReview.userName} (Tú)
                      </div>
                      <div style={{ fontSize: 11, color: C.hoja, fontWeight: 700 }}>
                        ✓ Guardada en base de datos
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <IconStar key={s} size={16} filled={s <= myReview.rating} color="#E9B530" />
                    ))}
                  </div>
                </div>

                {myReview.tags && myReview.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {myReview.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 12,
                          background: "rgba(47,107,58,0.12)",
                          color: C.hoja,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {myReview.comment ? (
                  <p style={{ fontSize: 14, color: C.media, lineHeight: 1.45, margin: 0 }}>
                    "{myReview.comment}"
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: C.suave, fontStyle: "italic", margin: 0 }}>
                    Sin comentario de texto.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Filtros de reseñas */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 20px 8px", overflowX: "auto" }}>
            <button
              onClick={() => setFilter("all")}
              className={`tag-pill ${filter === "all" ? "active" : ""}`}
            >
              Todas ({reviews.length})
            </button>
            <button
              onClick={() => setFilter("5")}
              className={`tag-pill ${filter === "5" ? "active" : ""}`}
            >
              ⭐ 5 estrellas
            </button>
            <button
              onClick={() => setFilter("4")}
              className={`tag-pill ${filter === "4" ? "active" : ""}`}
            >
              ⭐ 4 estrellas
            </button>
            <button
              onClick={() => setFilter("with_comment")}
              className={`tag-pill ${filter === "with_comment" ? "active" : ""}`}
            >
              Con comentarios
            </button>
          </div>

          {/* Lista de reseñas de la comunidad */}
          <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.suave }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Cargando reseñas...</span>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div
                style={{
                  borderRadius: 20,
                  background: "#FFFFFF",
                  border: "1px solid #EEE6D8",
                  padding: "36px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <h3 className="bric" style={{ fontSize: 20, fontWeight: 800, color: C.tinta, marginBottom: 4 }}>
                  Aún no hay reseñas en este filtro
                </h3>
                <p style={{ fontSize: 14, color: C.suave, marginBottom: 16 }}>
                  Sé el primero en dejar una opinión con estrellas.
                </p>
                <button
                  className="press"
                  onClick={() => setSheetOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 20px",
                    borderRadius: 22,
                    background: C.hoja,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <IconStar size={16} filled color="#FFFFFF" />
                  Escribir reseña
                </button>
              </div>
            ) : (
              filteredReviews.map((r) => (
                <article key={r.id} className="review-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: C.plato,
                          color: C.tinta,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        {r.userName ? r.userName.charAt(0).toUpperCase() : "F"}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.tinta }}>
                          {r.userName}
                        </div>
                        <div style={{ fontSize: 12, color: C.suave }}>
                          {formatRelativeTime(r.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconStar
                          key={star}
                          size={16}
                          filled={star <= r.rating}
                          color="#E9B530"
                        />
                      ))}
                    </div>
                  </div>

                  {r.tags && r.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: C.bandeja,
                            color: C.media,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.comment && (
                    <p style={{ fontSize: 14, color: C.media, lineHeight: 1.48, margin: 0 }}>
                      "{r.comment}"
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal / Sheet interactivo para dejar una reseña */}
      {sheetOpen && (
        <ReviewSheet
          onClose={() => setSheetOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
