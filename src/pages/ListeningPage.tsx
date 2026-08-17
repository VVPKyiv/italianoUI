import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ListeningCheck } from "../types";

type AudioState = "ready" | "playing" | "played" | "error";
const speedKey = "italiano:listening-speed";

function initialSpeed(): number {
  const value = Number(localStorage.getItem(speedKey));
  return [0.75, 0.9, 1].includes(value) ? value : 0.9;
}

export function ListeningPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState("");
  const [check, setCheck] = useState<ListeningCheck | null>(null);
  const [audioState, setAudioState] = useState<AudioState>("ready");
  const [speed, setSpeed] = useState(initialSpeed);
  const sessionQuery = useQuery({
    queryKey: ["listening-session", sessionId],
    queryFn: () => api.getListeningSession(sessionId),
  });
  const session = sessionQuery.data;
  const card = session?.current_card;

  useEffect(() => {
    setSelected("");
    setCheck(null);
    setAudioState("ready");
    audioRef.current?.pause();
  }, [card?.id]);

  const verify = useMutation({
    mutationFn: () => api.checkListening(sessionId, card!.id, selected),
    onSuccess: setCheck,
  });

  const advance = useMutation({
    mutationFn: () => api.advanceListening(sessionId),
    onSuccess: (next) => {
      client.setQueryData(["listening-session", sessionId], next);
      if (next.status === "completed") navigate(`/listening/${sessionId}/result`);
    },
  });

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      setAudioState("error");
    }
  };

  const changeSpeed = (value: number) => {
    setSpeed(value);
    localStorage.setItem(speedKey, String(value));
    if (audioRef.current) audioRef.current.playbackRate = value;
  };

  if (sessionQuery.isPending) return <div className="state-page">Готуємо аудіо…</div>;
  if (!session || !card) return <div className="state-page">Вправу не знайдено</div>;

  const progress = (session.current_card_index / session.total_cards) * 100;
  const instruction = "Оберіть правильний український переклад";
  const statusText = audioState === "playing"
    ? "Відтворюється…"
    : audioState === "played" ? "Прослухано — можна повторити" : audioState === "error"
      ? "Не вдалося відтворити аудіо" : "Готово до прослуховування";

  return (
    <div className="listening-training shell">
      <header className="sentence-head">
        <button className="ghost" aria-label="Завершити вправу" onClick={() => navigate("/")}>×</button>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <b>{session.current_card_index + 1}<small> / {session.total_cards}</small></b>
      </header>

      <section className={`listening-card ${check ? (check.is_correct ? "correct" : "incorrect") : ""}`}>
        <span className="luxury-kicker"><i /> ASCOLTA E SCEGLI</span>
        <p className="listening-instruction">{instruction}</p>

        <div className={`audio-stage ${audioState}`}>
          <audio
            ref={audioRef}
            src={card.audio_url}
            preload="auto"
            onPlay={() => setAudioState("playing")}
            onEnded={() => setAudioState("played")}
            onError={() => setAudioState("error")}
          />
          <button className="audio-play" onClick={play} aria-label={audioState === "playing" ? "Відтворити спочатку" : "Прослухати слово"}>
            <span>{audioState === "playing" ? "↻" : "▶"}</span>
            <i /><i /><i /><i /><i />
          </button>
          <strong>{statusText}</strong>
          <small>Слово не показується до перевірки відповіді</small>
        </div>

        <div className="listening-controls">
          <span>Швидкість</span>
          <div>{[0.75, 0.9, 1].map((value) => (
            <button key={value} className={speed === value ? "active" : ""} onClick={() => changeSpeed(value)}>{value}×</button>
          ))}</div>
          <button className="replay-link" onClick={play}>↻ Прослухати ще раз</button>
        </div>

        <div className="listening-options" aria-label="Варіанти відповіді">
          {card.options.map((option, index) => {
            const isCorrect = check?.correct_answer === option;
            const isWrong = Boolean(check && selected === option && !check.is_correct);
            return (
              <button
                key={option}
                className={`${selected === option ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                disabled={Boolean(check)}
                onClick={() => setSelected(option)}
              >
                <span>{String.fromCharCode(65 + index)}</span><b>{option}</b><i>{isCorrect ? "✓" : isWrong ? "×" : ""}</i>
              </button>
            );
          })}
        </div>

        {check && (
          <div className={`listening-feedback ${check.is_correct ? "correct" : "incorrect"}`} aria-live="polite">
            <strong>{check.feedback_uk}</strong>
            <p><b>{check.italian_text}</b><span>— {check.ukrainian_text}</span></p>
            <small>Вивченість цього слова на слух: {Math.round(check.mastery_score)}%</small>
          </div>
        )}
      </section>

      <div className="sentence-actions listening-actions">
        {!check ? (
          <button className="launch-button" disabled={!selected || verify.isPending} onClick={() => verify.mutate()}>
            <span>{verify.isPending ? "Перевіряємо…" : "Перевірити"}</span><b>✓</b>
          </button>
        ) : (
          <button className="launch-button" disabled={advance.isPending} onClick={() => advance.mutate()}>
            <span>{advance.isPending ? "Завантажуємо…" : "Наступне слово"}</span><b>→</b>
          </button>
        )}
      </div>
    </div>
  );
}
