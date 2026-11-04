import { useState } from "react";
import { submitReview, type Review, type ReviewStats } from "../lib/api";
import { useStore } from "../state/store";
import { C, primaryBtn, Seeds, Sheet, SheetHeader } from "./Common";
import { IconCheck, IconStar } from "./Icons";

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: "Puede mejorar", emoji: "🙁" },
  2: { text: "Regular", emoji: "😐" },
  3: { text: "Buena app", emoji: "🙂" },
  4: { text: "¡Muy buena!", emoji: "😋" },
  5: { text: "¡Me encanta FRESCA!", emoji: "🌟" },
};

const SUGGESTED_TAGS = [
  "🥑 IA de escaneo",
  "🍲 Recetas de rescate",
  "🔔 Avisos a tiempo",
  "🌿 Fácil de usar",
  "💰 Ahorro de comida",
  "🎨 Diseño hermoso",
];

interface ReviewSheetProps {
  onClose: () => void;
  onSuccess?: (review: Review, stats?: ReviewStats) => void;
}

export function ReviewSheet({ onClose, onSuccess }: ReviewSheetProps) {
  const profile = useStore((s) => s.profile);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState<string>(profile.name || "Cocinero/a FRESCA");
  const [comment, setComment] = useState<string>("");
  const [tags, setTags] = useState<string[]>(["🥑 IA de escaneo", "🍲 Recetas de rescate"]);
  const [sending, setSending] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const activeRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[activeRating] || RATING_LABELS[5];

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError("");
    setSending(true);

    try {
      const res = await submitReview({
        rating,
        comment: comment.trim(),
        tags,
        userName: name.trim() || profile.name || "Cocinero/a FRESCA",
        userId: profile.userId || localStorage.getItem("fresca:uid") || undefined,
      });

      if (res.ok) {
        localStorage.setItem("fresca:my_review", JSON.stringify(res.review));
        setSubmitted(true);
        if (onSuccess) onSuccess(res.review, res.stats);
      } else {
        setError("No pudimos guardar tu reseña. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      console.error("[fresca] Error enviando reseña:", err);
      // Fallback local en caso de que esté sin conexión
      const offlineReview: Review = {
        id: `rev_local_${Date.now()}`,
        userId: profile.userId,
        userName: name.trim() || "Cocinero/a FRESCA",
        rating,
        comment: comment.trim(),
        tags,
        createdAt: Date.now(),
      };
      localStorage.setItem("fresca:my_review", JSON.stringify(offlineReview));
      setSubmitted(true);
      if (onSuccess) onSuccess(offlineReview);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet label="Dejar una reseña de FRESCA" onClose={onClose}>
      <SheetHeader title={submitted ? "¡Gracias!" : "Valora FRESCA"} onClose={onClose} />

      {submitted ? (
        <div style={{ position: "relative", textAlign: "center", padding: "20px 8px 10px" }}>
          <Seeds n={22} spread={140} />
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EAF1E6 0%, #D2E7CB 100%)",
              color: C.hoja,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 20px rgba(47,107,58,0.2)",
            }}
          >
            <IconCheck size={36} strokeWidth={3} />
          </div>

          <h3 className="bric" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: C.tinta }}>
            ¡Reseña guardada con éxito!
          </h3>
          <p style={{ fontSize: 15, color: C.media, lineHeight: 1.5, maxWidth: 320, margin: "0 auto 16px" }}>
            Tu valoración con <b>{rating} estrellas</b> ha quedado guardada en la base de datos de FRESCA. ¡Gracias por ayudarnos a crecer y no desperdiciar comida!
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              marginBottom: 24,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <IconStar key={star} size={28} filled={star <= rating} />
            ))}
          </div>

          <button
            className="press"
            onClick={onClose}
            style={primaryBtn(52, { maxWidth: 280, margin: "0 auto" })}
          >
            Listo
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {/* Selector interactivo de estrellas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 12px",
              background: "#FFFFFF",
              borderRadius: 22,
              border: "1px solid #EEE6D8",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: C.suave, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ¿Qué tal ha sido tu experiencia?
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    className="star-btn"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`${star} estrellas`}
                  >
                    <IconStar
                      size={36}
                      filled={filled}
                      strokeWidth={1.8}
                      color="#E9B530"
                    />
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 14px",
                borderRadius: 16,
                background: "rgba(233,181,48,0.15)",
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 16 }}>{ratingInfo.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#8E6000" }}>
                {ratingInfo.text} ({activeRating} de 5)
              </span>
            </div>
          </div>

          {/* Tags / Aspectos destacados */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.suave, marginBottom: 8 }}>
              ¿Qué es lo que más te gusta de FRESCA?
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`tag-pill ${isSelected ? "active" : ""}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label htmlFor="review-comment" style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.suave, marginBottom: 6 }}>
              Tu comentario u opinión (opcional)
            </label>
            <textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Cuéntanos qué te ha parecido la app, qué recetas has preparado o qué te gustaría ver en FRESCA..."
              style={{
                width: "100%",
                borderRadius: 16,
                border: "1px solid #EEE6D8",
                background: "#FFFFFF",
                padding: "12px 14px",
                fontSize: 15,
                lineHeight: 1.4,
                color: C.tinta,
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ textAlign: "right", fontSize: 12, color: C.suave, marginTop: 4 }}>
              {comment.length}/500 caracteres
            </div>
          </div>

          {/* Nombre público */}
          <div>
            <label htmlFor="review-name" style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.suave, marginBottom: 6 }}>
              Nombre público que aparecerá en la reseña
            </label>
            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Tu nombre o apodo"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 24,
                border: "1px solid #EEE6D8",
                background: "#FFFFFF",
                padding: "0 16px",
                fontSize: 15,
                fontWeight: 600,
                color: C.tinta,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(168,51,31,0.1)", color: C.peligro, fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={sending}
            className="press"
            style={primaryBtn(56, {
              opacity: sending ? 0.7 : 1,
              marginTop: 4,
            })}
          >
            {sending ? (
              <span>Guardando en la base de datos...</span>
            ) : (
              <>
                <IconStar size={20} filled color="#FFFFFF" />
                <span>Enviar mi reseña ({rating} ★)</span>
              </>
            )}
          </button>
        </form>
      )}
    </Sheet>
  );
}
