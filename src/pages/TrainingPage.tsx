import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useVoiceAttempt } from "../hooks/useVoiceAttempt";

type Phase = "permission" | "listening" | "checking" | "retry" | "correct" | "timeout";

export function TrainingPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [phase, setPhase] = useState<Phase>("permission");
  const [transcription, setTranscription] = useState("");
  const [seconds, setSeconds] = useState(10);
  const busy = useRef(false);
  const sessionQuery = useQuery({ queryKey: ["session", sessionId], queryFn: () => api.getSession(sessionId) });
  const session = sessionQuery.data;
  const card = session?.current_card;

  const advance = useCallback(async () => {
    const next = await api.startSession(sessionId);
    client.setQueryData(["session", sessionId], next);
    setTranscription("");
    if (next.status === "completed") navigate(`/training/${sessionId}/result`, { replace: true });
    else setPhase("listening");
  }, [client, navigate, sessionId]);

  const onAudio = useCallback(async (blob: Blob) => {
    if (!card || busy.current || phase === "correct" || phase === "timeout") return;
    busy.current = true;
    setPhase("checking");
    try {
      const result = await api.submitAttempt(sessionId, card.id, blob);
      setTranscription(result.transcription || "Нічого не розпізнано");
      if (result.is_correct) {
        setPhase("correct");
        window.setTimeout(() => void advance(), 900);
      } else setPhase("retry");
    } catch (error) {
      setTranscription(error instanceof Error ? error.message : "Не вдалося перевірити аудіо");
      setPhase("retry");
    } finally { busy.current = false; }
  }, [advance, card, phase, sessionId]);
  const voice = useVoiceAttempt(onAudio);

  const begin = async () => {
    if (!await voice.enable()) return;
    const started = await api.startSession(sessionId);
    client.setQueryData(["session", sessionId], started);
    setPhase("listening");
  };

  const timeout = useMutation({ mutationFn: async () => {
    if (!card) return;
    setPhase("timeout");
    const response = await api.timeout(sessionId, card.id);
    setTranscription(`Правильна відповідь: ${response.correct_answer}`);
    const audio = new Audio(response.audio_url);
    audio.onended = () => void advance();
    audio.onerror = () => window.setTimeout(() => void advance(), 900);
    await audio.play().catch(() => window.setTimeout(() => void advance(), 900));
  }});

  useEffect(() => {
    if (!card?.expires_at || phase === "permission" || phase === "correct" || phase === "timeout") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(card.expires_at!).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && !timeout.isPending) timeout.mutate();
    };
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [card?.expires_at, phase, timeout.isPending]);

  useEffect(() => {
    if (phase === "listening" && voice.microphone === "ready") void voice.record();
  }, [card?.id, phase, voice.microphone, voice.record]);

  if (sessionQuery.isLoading) return <div className="state-page">Готуємо сесію…</div>;
  if (sessionQuery.error || !session) return <div className="state-page"><h1>Сесію не знайдено</h1><button className="primary" onClick={() => navigate("/")}>На головну</button></div>;
  if (phase === "permission") return <div className="permission shell"><span className="mic-large">●</span><span className="eyebrow">ПЕРЕД ПОЧАТКОМ</span><h1>Дозволь доступ до мікрофона</h1><p>Ми записуємо лише короткі спроби та надсилаємо їх на ваш локальний сервер.</p><button className="primary" onClick={begin}>Увімкнути мікрофон</button>{voice.microphone === "blocked" && <p className="error">Доступ заблоковано в налаштуваннях браузера.</p>}</div>;

  const progress = (session.current_card_index / session.total_cards) * 100;
  return <div className={`training shell phase-${phase}`}><div className="training-head"><button className="ghost" onClick={() => navigate("/")}>×</button><div className="progress"><i style={{ width: `${progress}%` }} /></div><b>{session.current_card_index + 1}<small> / {session.total_cards}</small></b></div><section className="word-card"><div className="timer" style={{ "--timer": `${seconds / 10 * 100}%` } as CSSProperties}><strong>{seconds}</strong><small>сек</small></div><span className="eyebrow">СКАЖИ ІТАЛІЙСЬКОЮ</span><h1>{card?.ukrainian_prompt}</h1><div className={`listen-status ${voice.microphone}`}><i />{phase === "checking" ? "Перевіряємо…" : phase === "correct" ? "Правильно!" : phase === "retry" ? "Спробуй ще раз" : phase === "timeout" ? "Час вийшов" : "Слухаю…"}</div>{transcription && <div className="transcription"><small>Розпізнано</small><b>{transcription}</b></div>}</section><div className="training-actions"><button className="record-button" disabled={busy.current || phase === "correct" || phase === "timeout"} onClick={() => voice.record()}><span>●</span> Записати ще раз</button><p>Можна повторювати спроби до завершення таймера</p></div></div>;
}
