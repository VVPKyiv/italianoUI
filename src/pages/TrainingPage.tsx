import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useVoiceAttempt } from "../hooks/useVoiceAttempt";
import type { AttemptResult } from "../types";

type Phase =
  | "permission"
  | "preparing"
  | "listening"
  | "checking"
  | "retry"
  | "correct"
  | "revealed"
  | "timeout";

export function TrainingPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [phase, setPhase] = useState<Phase>("permission");
  const phaseRef = useRef<Phase>("permission");
  const [transcription, setTranscription] = useState("");
  const [attemptError, setAttemptError] = useState(false);
  const [masteryScore, setMasteryScore] = useState(0);
  const [diagnostics, setDiagnostics] = useState<AttemptResult | null>(null);
  const busy = useRef(false);
  const starting = useRef(false);
  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.getSession(sessionId),
  });
  const session = sessionQuery.data;
  const card = session?.current_card;

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const advance = useCallback(async () => {
    const next = await api.startSession(sessionId);
    client.setQueryData(["session", sessionId], next);
    setTranscription("");
    setAttemptError(false);
    setDiagnostics(null);
    if (next.status === "completed") {
      navigate(`/training/${sessionId}/result`, { replace: true });
    } else {
      changePhase("preparing");
    }
  }, [changePhase, client, navigate, sessionId]);

  const onAudio = useCallback(
    async (blob: Blob) => {
      if (!card || busy.current || phaseRef.current !== "listening") return;
      busy.current = true;
      changePhase("checking");
      try {
        const result = await api.submitAttempt(sessionId, card.id, blob);
        setDiagnostics(result);
        setTranscription(result.transcription || "Нічого не розпізнано");
        setMasteryScore(result.mastery_score);
        if (result.is_correct) {
          setAttemptError(false);
          changePhase("correct");
          if (!result.note) window.setTimeout(() => void advance(), 1_050);
        } else {
          setAttemptError(false);
          changePhase("retry");
        }
      } catch (error) {
        setAttemptError(true);
        setTranscription(
          error instanceof Error ? error.message : "Не вдалося перевірити аудіо",
        );
        changePhase("retry");
      } finally {
        busy.current = false;
      }
    },
    [advance, card, changePhase, sessionId],
  );

  const voice = useVoiceAttempt(onAudio);

  const startTraining = useCallback(async () => {
    if (starting.current) return;
    starting.current = true;
    try {
      const started = await api.startSession(sessionId);
      client.setQueryData(["session", sessionId], started);
      if (started.status === "completed") {
        navigate(`/training/${sessionId}/result`, { replace: true });
      } else {
        changePhase("preparing");
      }
    } finally {
      starting.current = false;
    }
  }, [changePhase, client, navigate, sessionId]);

  const begin = async () => {
    if (!(await voice.enable())) return;
    voice.disable();
    await startTraining();
  };

  const reveal = useMutation({
    mutationFn: async () => {
      if (!card) return;
      voice.cancel();
      changePhase("revealed");
      const response = await api.reveal(sessionId, card.id);
      setMasteryScore(response.mastery_score);
      setAttemptError(false);
      setTranscription(response.correct_answer);
      if (response.audio_url) {
        await new Audio(response.audio_url).play().catch(() => undefined);
      }
    },
    onError: (error) => {
      setTranscription(error instanceof Error ? error.message : "Не вдалося показати відповідь");
      changePhase("retry");
    },
  });

  useEffect(() => {
    if (card) setMasteryScore(card.mastery_score);
  }, [card?.id, card?.mastery_score]);

  useEffect(() => {
    if (
      phase === "permission" &&
      voice.permission === "granted" &&
      session
    ) {
      void startTraining();
    }
  }, [phase, session, startTraining, voice.permission]);

  const startManualRecording = async () => {
    if (!card || busy.current || phase === "checking" || phase === "correct") return;
    setTranscription("");
    setAttemptError(false);
    setDiagnostics(null);
    const enabled = await voice.enable();
    if (!enabled) {
      setTranscription("Не вдалося увімкнути мікрофон. Перевірте доступ у браузері.");
      setAttemptError(true);
      changePhase("retry");
      return;
    }
    try {
      const updated = await api.beginAttempt(sessionId, card.id);
      client.setQueryData(["session", sessionId], updated);
      const started = await voice.record();
      if (started) changePhase("listening");
      else { setAttemptError(true); changePhase("retry"); }
    } catch (error) {
      voice.disable();
      setAttemptError(true);
      setTranscription(error instanceof Error ? error.message : "Не вдалося почати запис");
      changePhase("retry");
    }
  };

  if (sessionQuery.isLoading) return <div className="state-page">Готуємо сесію…</div>;
  if (sessionQuery.error || !session) {
    return (
      <div className="state-page">
        <h1>Сесію не знайдено</h1>
        <button className="primary" onClick={() => navigate("/")}>На головну</button>
      </div>
    );
  }
  if (phase === "permission") {
    const checkingPermission = voice.permission === "unknown";
    const reconnecting = voice.permission === "granted";
    return (
      <div className="permission shell">
        <span className={`mic-large ${voice.microphone}`}>●</span>
        <span className="eyebrow">ПЕРЕД ПОЧАТКОМ</span>
        <h1>{checkingPermission
          ? "Перевіряємо доступ…"
          : reconnecting || voice.microphone === "requesting"
            ? "Підключаємо мікрофон…"
            : "Дозволь доступ до мікрофона"}</h1>
        <p>{reconnecting
          ? "Дозвіл уже збережено. Мікрофон залишатиметься вимкненим, доки ви не натиснете кнопку."
          : "Після дозволу мікрофон вмикатиметься лише вручну для кожної відповіді."}</p>
        {!checkingPermission && !reconnecting && (
          <button className="primary" disabled={voice.microphone === "requesting"} onClick={begin}>
            {voice.microphone === "requesting" ? "Зачекайте…" : "Увімкнути мікрофон"}
          </button>
        )}
        {voice.error && <p className="error" role="alert">{voice.error}</p>}
      </div>
    );
  }

  const progress = (session.current_card_index / session.total_cards) * 100;
  const isRecording = voice.microphone === "recording";
  const status = phase === "preparing"
    ? "Подумайте над словом — мікрофон вимкнено"
    : phase === "checking"
      ? "Розпізнаю вашу відповідь…"
      : phase === "correct"
        ? "Правильно!"
        : phase === "revealed"
          ? "Запам’ятайте правильну відповідь"
        : phase === "retry"
          ? attemptError
            ? "Запис завершено, але перевірка не вдалася"
            : "Не зовсім. Спробуйте ще раз"
          : phase === "timeout"
            ? "Час вийшов"
            : isRecording
              ? "Говоріть — я вас слухаю"
              : "Готовий до ручного запису";
  const recordingSeconds = Math.max(
    0,
    Math.ceil((voice.maxRecordingMs - voice.recordedMs) / 1_000),
  );
  const timerPercent = Math.max(
    0,
    Math.min(100, ((voice.maxRecordingMs - voice.recordedMs) / voice.maxRecordingMs) * 100),
  );

  return (
    <div className={`training shell phase-${phase} mic-${voice.microphone}`}>
      <div className="training-head">
        <button className="ghost" aria-label="Завершити тренування" onClick={() => navigate("/")}>×</button>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <b>{session.current_card_index + 1}<small> / {session.total_cards}</small></b>
      </div>
      <section className="word-card">
        {(isRecording || phase === "checking") && (
          <div
            className="timer"
            style={{ "--timer": `${timerPercent}%` } as CSSProperties}
            aria-label={phase === "checking" ? "Перевіряємо відповідь" : `${recordingSeconds} секунд запису залишилося`}
          >
            <strong>{phase === "checking" ? "…" : recordingSeconds}</strong>
            <small>{phase === "checking" ? "аналіз" : "сек"}</small>
          </div>
        )}
        <span className="eyebrow">СКАЖИ ІТАЛІЙСЬКОЮ</span>
        <h1>{card?.ukrainian_prompt}</h1>
        <div className={`mastery-meter ${phase === "correct" ? "increased" : ""}`}>
          <div><span>Засвоєння слова</span><strong>{Math.round(masteryScore)}%</strong></div>
          <i><b style={{ width: `${Math.max(0, Math.min(100, masteryScore))}%` }} /></i>
          <small>
            {masteryScore < 35
              ? "Високий пріоритет для повторення"
              : masteryScore < 70
                ? "Слово закріплюється"
                : "Добре засвоєно"}
          </small>
        </div>
        <div className={`listen-status ${phase} ${voice.microphone}`} aria-live="polite">
          <i />
          {status}
        </div>
        <div className={`attempt-voice-panel ${isRecording ? "active" : ""}`}>
          <div className="voice-bars" aria-hidden="true">
            {Array.from({ length: 13 }, (_, index) => (
              <i
                key={index}
                style={{
                  height: `${8 + Math.max(0.08, voice.level) * (12 + (index % 5) * 8)}px`,
                }}
              />
            ))}
          </div>
          <span>
            {isRecording
              ? `Запис ${(voice.recordedMs / 1_000).toFixed(1)} / ${(voice.maxRecordingMs / 1_000).toFixed(0)} с`
              : phase === "checking"
                ? "Запис завершено, перевіряємо"
                : phase === "preparing"
                  ? "Натисніть кнопку, коли будете готові"
                  : phase === "retry"
                    ? "Попередній запис завершено — натисніть, щоб повторити"
                    : "Мікрофон вимкнено"}
          </span>
        </div>
        {(transcription || voice.error) && (
          <div className="transcription" aria-live="polite">
            <small>{phase === "timeout" || phase === "revealed"
              ? "Правильна відповідь"
              : attemptError
                ? "Помилка перевірки"
                : "Розпізнано"}</small>
            <b>{voice.error || transcription}</b>
          </div>
        )}
        {diagnostics?.note && <p className="lesson-feedback-note"><b>Зараховано з рекомендацією.</b> {diagnostics.note}</p>}
        {diagnostics && (
          <div className="recognition-diagnostics" title={diagnostics.recognition_model}>
            <span>Запис <b>{diagnostics.audio_duration_seconds.toFixed(1)} с</b></span>
            <span>Голос <b>{diagnostics.speech_duration_seconds.toFixed(1)} с</b></span>
            <span>Аналіз <b>{(diagnostics.inference_ms / 1_000).toFixed(1)} с</b></span>
            <span>Збіг <b>{Math.round(diagnostics.matcher_score * 100)}%</b></span>
          </div>
        )}
      </section>
      <div className="training-actions">
        {phase === "revealed" || (phase === "correct" && diagnostics?.note) ? (
          <button className="primary next-button" onClick={() => void advance()}>
            Далі <span>→</span>
          </button>
        ) : (
          <>
            <div className="training-buttons">
              {isRecording ? (
                <button className="record-button recording" onClick={voice.stop}>
                  <span>■</span> Я вже сказав — перевірити
                </button>
              ) : (
                <button
                  className="record-button"
                  disabled={!["preparing", "retry"].includes(phase) || busy.current}
                  onClick={() => void startManualRecording()}
                >
                  <span>●</span> {phase === "retry" ? "Увімкнути й повторити" : "Увімкнути мікрофон"}
                </button>
              )}
              <button
                className="reveal-button"
                disabled={phase === "checking" || phase === "correct" || reveal.isPending}
                onClick={() => reveal.mutate()}
              >
                Показати відповідь
              </button>
            </div>
            <p>
              {isRecording
                ? "Говоріть природно. Можна завершити запис раніше."
                : phase === "checking"
                  ? "Не потрібно натискати кнопку — відповідь уже обробляється."
                  : "Можна думати скільки потрібно. Запис почнеться лише після натискання."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
