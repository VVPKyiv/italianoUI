import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { SentenceCheck } from "../types";

export function SentenceBuilderPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [check, setCheck] = useState<SentenceCheck | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef("");
  const sessionQuery = useQuery({
    queryKey: ["sentence-session", sessionId],
    queryFn: () => api.getSentenceSession(sessionId),
  });
  const session = sessionQuery.data;
  const card = session?.current_card;

  useEffect(() => {
    audioRef.current?.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    audioRef.current = null;
    objectUrlRef.current = "";
    setSelected([]);
    setCheck(null);
    setIsPlaying(false);
    setAudioError("");
  }, [card?.id]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const verify = useMutation({
    mutationFn: () => api.checkSentence(
      sessionId,
      card!.id,
      selected.map((index) => card!.token_pool[index]),
    ),
    onSuccess: setCheck,
  });

  const advance = useMutation({
    mutationFn: () => api.advanceSentence(sessionId),
    onSuccess: (next) => {
      client.setQueryData(["sentence-session", sessionId], next);
      if (next.status === "completed") navigate(`/sentences/${sessionId}/result`);
    },
  });

  const playSentence = async () => {
    if (!card) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    setAudioError("");
    try {
      const blob = await api.previewSentenceAudio(card.exercise_id);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      objectUrlRef.current = objectUrl;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setAudioError("Не вдалося відтворити озвучення.");
      };
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      setIsPlaying(false);
      setAudioError(error instanceof Error ? error.message : "Озвучення недоступне");
    }
  };

  if (sessionQuery.isPending) return <div className="state-page">Готуємо речення…</div>;
  if (!session || !card) return <div className="state-page">Вправу не знайдено</div>;

  const progress = (session.current_card_index / session.total_cards) * 100;
  const selectedSet = new Set(selected);

  return (
    <div className="sentence-training shell">
      <header className="sentence-head">
        <button className="ghost" aria-label="Завершити вправу" onClick={() => navigate("/")}>×</button>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <b>{session.current_card_index + 1}<small> / {session.total_cards}</small></b>
      </header>

      <section className={`sentence-card ${check ? (check.is_correct ? "correct" : "incorrect") : ""}`}>
        <span className="luxury-kicker"><i /> COSTRUISCI LA FRASE</span>
        <p className="sentence-instruction">Складіть італійське речення. Зайві слова використовувати не потрібно.</p>
        <h1>{card.prompt_uk}</h1>

        <div className="sentence-answer" aria-label="Складене речення">
          {selected.length === 0 && <span>Натискайте слова нижче…</span>}
          {selected.map((index) => (
            <button key={index} disabled={Boolean(check)} onClick={() => setSelected((items) => items.filter((item) => item !== index))}>
              {card.token_pool[index]}
            </button>
          ))}
        </div>

        <div className="sentence-pool" aria-label="Запропоновані слова">
          {card.token_pool.map((token, index) => (
            <button
              key={`${token}-${index}`}
              disabled={selectedSet.has(index) || Boolean(check)}
              onClick={() => setSelected((items) => [...items, index])}
            >
              {token}
            </button>
          ))}
        </div>

        {check && (
          <div className={`sentence-feedback ${check.is_correct ? "correct" : "incorrect"}`} aria-live="polite">
            <strong>{check.feedback_uk}</strong>
            {!check.is_correct && <p>Правильно: <b>{check.correct_tokens.join(" ")}</b></p>}
            <small>{check.explanation_uk}</small>
            <button className={`sentence-audio-button ${isPlaying ? "playing" : ""}`} onClick={playSentence}>
              <span>{isPlaying ? "■" : "▶"}</span>
              {isPlaying ? "Зупинити" : "Прослухати правильне речення"}
            </button>
            {audioError && <em className="sentence-audio-error">{audioError}</em>}
          </div>
        )}
      </section>

      <div className="sentence-actions">
        {!check ? (
          <button className="launch-button" disabled={!selected.length || verify.isPending} onClick={() => verify.mutate()}>
            <span>{verify.isPending ? "Перевіряємо…" : "Перевірити"}</span><b>✓</b>
          </button>
        ) : (
          <button className="launch-button" disabled={advance.isPending} onClick={() => advance.mutate()}>
            <span>{advance.isPending ? "Завантажуємо…" : "Наступне речення"}</span><b>→</b>
          </button>
        )}
      </div>
    </div>
  );
}
