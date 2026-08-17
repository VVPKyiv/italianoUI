import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

type Side = "left" | "right";

export function MatchingPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [feedback, setFeedback] = useState("Оберіть по одній картці з кожного боку");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const session = useQuery({ queryKey: ["matching-session", sessionId], queryFn: () => api.getMatchingSession(sessionId) });
  const check = useMutation({
    mutationFn: ({ italian, ukrainian }: { italian: string; ukrainian: string }) => api.checkMatching(sessionId, italian, ukrainian),
    onSuccess: async (result) => {
      setFeedback(result.feedback_uk);
      if (result.is_correct) {
        if (result.audio_url) {
          audioRef.current?.pause();
          audioRef.current = new Audio(result.audio_url);
          void audioRef.current.play().catch(() => setFeedback("Пара знайдена. Натисніть динамік, щоб послухати слово."));
        }
        await client.invalidateQueries({ queryKey: ["matching-session", sessionId] });
        setLeft(null); setRight(null);
      } else {
        setWrong(true);
        window.setTimeout(() => { setWrong(false); setLeft(null); setRight(null); }, 650);
      }
    },
  });

  useEffect(() => {
    if (left && right && !check.isPending && !wrong) check.mutate({ italian: left, ukrainian: right });
  }, [left, right]);

  const choose = (side: Side, id: string, matched: boolean) => {
    if (matched || check.isPending || wrong) return;
    if (side === "left") setLeft((current) => current === id ? null : id);
    else setRight((current) => current === id ? null : id);
  };
  const replay = (url?: string | null) => { if (url) void new Audio(url).play(); };

  if (session.isPending) return <div className="matching-state shell">Готуємо 7 пар…</div>;
  if (!session.data || session.isError) return <div className="matching-state shell">Не вдалося відкрити гру. <Link to="/training/setup/matching">Повернутися</Link></div>;
  const data = session.data;
  return (
    <div className="matching-page shell">
      <header className="matching-head">
        <Link to="/training/setup/matching">← Вийти</Link>
        <div><small>ABBINA LE PAROLE</small><h1>Знайдіть <em>пари</em></h1></div>
        <div className="matching-score"><strong>{data.matched_count}/{data.total_pairs}</strong><span>знайдено · {data.attempts_count} спроб</span></div>
      </header>
      <div className="matching-progress"><i style={{ width: `${data.matched_count / data.total_pairs * 100}%` }} /></div>
      <section className={`matching-board ${wrong ? "wrong" : ""}`}>
        <div className="matching-column"><h2>Italiano</h2>{data.left_cards.map((card) => <button key={card.id} className={`${left === card.id ? "selected" : ""} ${card.status === "matched" ? "matched" : ""}`} onClick={() => choose("left", card.id, card.status === "matched")}><span>{card.text}</span>{card.status === "matched" && <b onClick={(event) => { event.stopPropagation(); replay(card.audio_url); }} aria-label="Прослухати">♪</b>}</button>)}</div>
        <div className="matching-center" aria-hidden="true">↔</div>
        <div className="matching-column ukrainian"><h2>Українська</h2>{data.right_cards.map((card) => <button key={card.id} className={`${right === card.id ? "selected" : ""} ${card.status === "matched" ? "matched" : ""}`} onClick={() => choose("right", card.id, card.status === "matched")}><span>{card.text}</span>{card.status === "matched" && <b>✓</b>}</button>)}</div>
      </section>
      <footer className={`matching-feedback ${wrong ? "incorrect" : ""}`} aria-live="polite"><span>{wrong ? "×" : data.status === "completed" ? "✓" : "i"}</span><p>{data.status === "completed" ? "Усі сім пар знайдено — чудова робота!" : feedback}</p>{data.status === "completed" && <button onClick={() => navigate(`/matching/${sessionId}/result`)}>Результат →</button>}</footer>
    </div>
  );
}
