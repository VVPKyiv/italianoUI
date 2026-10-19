import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { LessonListeningPrompt } from "../components/LessonListeningPrompt";
import { LessonFeedback } from "../components/LessonFeedback";
import { SpeechRetryNotice } from "../components/SpeechRetryNotice";
import { useVoiceAttempt } from "../hooks/useVoiceAttempt";
import type { LessonSession } from "../types";
import { reviewDate } from "./LearningPage";

const phaseLabels = { learn: "Розбираємо приклад", practice: "Практикуємо", assessment: "Перевіряємо мету" };

export function LessonPage() {
  const { sessionId = "" } = useParams();
  const client = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const query = useQuery({ queryKey: ["lesson-session", sessionId], queryFn: () => api.lessonSession(sessionId) });
  const catalog = useQuery({ queryKey: ["curriculum"], queryFn: api.curriculum });
  const session = query.data;
  const step = session?.step;
  const save = (next: LessonSession) => {
    client.setQueryData(["lesson-session", sessionId], next);
    void client.invalidateQueries({ queryKey: ["progress"] });
    void client.invalidateQueries({ queryKey: ["training-topics"] });
    void client.invalidateQueries({ queryKey: ["vocabulary"] });
    if (next.completed) void client.invalidateQueries({ queryKey: ["curriculum"] });
  };
  // Retain a request ID across transport retries for the same submitted answer.
  const requestRef = useRef<{ key: string; id: string } | null>(null);
  const requestId = (key: string) => {
    if (requestRef.current?.key !== key) requestRef.current = { key, id: crypto.randomUUID() };
    return requestRef.current.id;
  };
  const check = useMutation({
    mutationFn: () => {
      const value = step!.kind === "build" ? tokens.map((index) => step!.tokens[index]).join(" ") : answer;
      const mode = ["choose", "listen", "read"].includes(step!.kind) ? "choice" : step!.kind === "build" ? "tokens" : "written";
      return api.answerLesson(sessionId, step!.id, requestId(`${step!.id}:${mode}:${value}`), value, mode);
    },
    onSuccess: save,
  });
  const hint = useMutation({ mutationFn: () => api.hintLesson(sessionId, step!.id, step!.support_level + 1), onSuccess: save });
  const audioCompleted = useMutation({ mutationFn: (stepId: string) => api.completeLessonAudio(sessionId, stepId), onSuccess: save });
  const advance = useMutation({ mutationFn: () => api.advanceLesson(sessionId, step!.id), onSuccess: save });
  const speech = useMutation({
    mutationFn: ({ blob, stepId }: { blob: Blob; stepId: string }) => api.speakLesson(sessionId, stepId, crypto.randomUUID(), blob),
    onSuccess: save,
  });
  const voice = useVoiceAttempt(async (blob) => {
    if (step) await speech.mutateAsync({ blob, stepId: step.id });
  }, "phrase");
  const cancelVoice = voice.cancel;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setAnswer(""); setTokens([]); setVoiceMode(false); setAudioError("");
    audioRef.current?.pause(); cancelVoice(); requestRef.current = null;
  }, [step?.id, cancelVoice]);
  useEffect(() => {
    check.reset(); hint.reset(); advance.reset(); speech.reset(); audioCompleted.reset();
    // Mutation errors belong to the previous step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);
  if (query.isPending) return <div className="state-page">Готуємо урок…</div>;
  if (query.isError || !session) return <div className="state-page"><p>{query.error?.message ?? "Урок не знайдено"}</p><Link to="/learn">До навчання</Link><button className="primary" onClick={() => void query.refetch()}>Оновити</button></div>;
  if (session.completed && session.result) {
    const result = session.result;
    const progress = catalog.data?.lessons.find((item) => item.id === session.lesson_id && item.version === session.version)?.progress;
    return <div className="learning-page lesson-result shell">
      <span className="luxury-kicker">{session.mode === "review" ? "RIPASSO" : "LEZIONE COMPLETATA"}</span>
      <h1>{result.independent_success ? "Мету виконано самостійно." : "Урок завершено — закріпимо ще."}</h1>
      <p className="lesson-goal">{session.goal}</p>
      <div className="learning-result-card"><p><strong>{result.independent_correct} / {result.assessment_total}</strong> контрольних відповідей без підказок</p>
        <p>Відповідей із підтримкою: {result.supported_answers}</p>
        <p>Спосіб відповіді: {result.written_answers > 0 ? "письмові відповіді" : ""}{result.written_answers > 0 && result.spoken_answers > 0 ? " та " : ""}{result.spoken_answers > 0 ? "усні відповіді" : ""}</p>
        {result.listening_answers > 0 && <p>Слухання без тексту: {result.listening_answers} відповідей.</p>}
        {progress?.next_review_at && <p>Наступне повторення: <strong>{reviewDate(progress.next_review_at)}</strong></p>}
        <p>{session.mode === "review" && result.independent_success ? "Ви пригадали фрази після паузи." : "Перевіримо пригадування після паузи. Завершення уроку збережено."}</p>
      </div>
      <Link className="primary" to="/learn">До навчального маршруту →</Link>
    </div>;
  }
  if (!step) return <div className="state-page">Крок уроку недоступний</div>;
  const recording = voice.microphone === "recording";
  const microphoneBusy = ["requesting", "ready", "recording", "processing"].includes(voice.microphone);
  const busy = check.isPending || hint.isPending || advance.isPending || speech.isPending || microphoneBusy || audioCompleted.isPending;
  const error = check.error ?? hint.error ?? advance.error ?? speech.error;
  const answered = Boolean(step.feedback);
  const canCheck = (step.kind !== "listen" || step.audio_completed || step.support_level > 0) && (step.kind === "build" ? tokens.length > 0 : answer.trim().length > 0);
  const record = async () => {
    if (recording) { voice.stop(); return; }
    if (await voice.enable()) await voice.record();
  };
  return <div className="mixed-training lesson-training shell">
    <header className="sentence-head"><Link className="ghost" to="/learn" aria-label="Зберегти та вийти з уроку">×</Link>
      <div className="progress"><i style={{ width: `${session.current_index / session.total_steps * 100}%` }} /></div>
      <b>{session.current_index + 1}<small> / {session.total_steps}</small></b>
    </header>
    <details className="lesson-context"><summary>{session.title}<span>Мета уроку ⌄</span></summary><p>{session.goal}</p></details>
    <section className="mixed-card lesson-card">
      <span className="luxury-kicker">{phaseLabels[step.phase]}{session.mode === "review" ? " · після паузи" : ""}</span>
      <h1>{step.prompt}</h1>
      {step.kind === "explain" && <div className="lesson-explanation"><p>{step.explanation}</p>
        {step.example && <blockquote lang="it">{step.example}</blockquote>}
        {(step.audio_url || step.dialogue.length > 0) && <audio ref={audioRef} preload="none" />}
        {step.audio_url && <>
          <button className="sentence-audio-button" onClick={() => { setAudioError(""); if (audioRef.current) audioRef.current.src = step.audio_url!; void audioRef.current?.play().catch(() => setAudioError("Озвучення прикладу поки недоступне. Можна продовжити з текстом.")); }}>▶ Прослухати приклад</button></>}
        {step.dialogue.length > 0 && <div className="lesson-dialogue" aria-label="Приклад діалогу">{step.dialogue.map((line, index) => <article key={index} className="lesson-dialogue-line">
          <div><small>{line.speaker}</small><p lang="it">{line.italian}</p><span>{line.ukrainian}</span></div>
          <button className="sentence-audio-button" disabled={!line.audio_url} aria-label={`Прослухати репліку ${index + 1}`} onClick={() => {
            setAudioError(""); if (audioRef.current && line.audio_url) { audioRef.current.pause(); audioRef.current.src = line.audio_url; void audioRef.current.play().catch(() => setAudioError("Не вдалося відтворити репліку. Спробуйте ще раз.")); }
          }}>▶</button>
        </article>)}</div>}
      </div>}
      {step.kind === "read" && <blockquote className="lesson-reading-text" lang="it" aria-label="Текст для читання">{step.reading_text}</blockquote>}
      {step.kind === "listen" && <LessonListeningPrompt key={step.id} audioUrl={step.audio_url} transcript={step.transcript} completed={step.audio_completed} answered={answered} busy={busy}
        onCompleted={async () => { await audioCompleted.mutateAsync(step.id); }} onReveal={() => hint.mutate()} />}
      {["choose", "listen", "read"].includes(step.kind) && <div className="mixed-options" role="group" aria-label="Варіанти відповіді">{step.options.map((option, index) => {
        const selected = (step.feedback?.answer ?? answer) === option;
        const correct = answered && step.feedback?.correct_answer === option;
        const wrong = answered && selected && !step.feedback?.is_correct;
        return <button key={option} className={[selected ? "selected" : "", correct ? "correct" : "", wrong ? "wrong" : ""].join(" ")} aria-pressed={selected} disabled={answered || busy} onClick={() => setAnswer(option)} lang="it">
          <span aria-hidden="true">{index + 1}</span><b>{option}</b><i aria-hidden="true">{correct ? "✓" : wrong ? "×" : ""}</i>
        </button>;
      })}</div>}
      {step.kind === "build" && <>
        <div className="sentence-answer mixed-answer" aria-label="Ваша відповідь">{tokens.length === 0 ? <span>Натискайте слова нижче…</span> : tokens.map((index) => <button key={index} disabled={answered || busy} onClick={() => setTokens((items) => items.filter((item) => item !== index))} lang="it">{step.tokens[index]}</button>)}</div>
        <div className="sentence-pool">{step.tokens.map((token, index) => <button key={index} disabled={tokens.includes(index) || answered || busy} onClick={() => setTokens((items) => [...items, index])} lang="it">{token}</button>)}</div>
      </>}
      {step.kind === "produce" && !answered && <div className="lesson-production">
        <div className="lesson-mode"><button aria-pressed={!voiceMode} disabled={busy} onClick={() => { voice.cancel(); setVoiceMode(false); }}>Написати</button><button aria-pressed={voiceMode} disabled={busy} onClick={() => setVoiceMode(true)}>Сказати</button></div>
        {voiceMode ? <div className="mixed-voice-panel"><p aria-live="polite">{recording ? "Говоріть одну фразу, потім завершіть запис" : voice.microphone === "processing" ? "Розпізнаємо фразу…" : "Дайте відповідь італійською"}</p>
          <button className="record-button" disabled={check.isPending || hint.isPending || speech.isPending || voice.microphone === "requesting" || voice.microphone === "processing"} onClick={() => void record()}>{recording ? "Завершити запис" : voice.microphone === "requesting" ? "Підключаємо…" : "Почати говорити"}</button>
          {recording && <><div className="voice-meter" aria-hidden="true"><i style={{ width: `${voice.level * 100}%` }} /></div><small>{(voice.recordedMs / 1000).toFixed(1)} с · можна натиснути «Завершити запис»</small></>}
          <small>Перевіряємо розпізнану фразу. Письмова відповідь також доступна.</small>
          {voice.error && !speech.error && <p role="alert">{voice.error}</p>}
        </div> : <form onSubmit={(event) => { event.preventDefault(); if (canCheck && !busy) check.mutate(); }}>
          <label htmlFor="lesson-answer">Ваша відповідь італійською</label>
          <textarea id="lesson-answer" lang="it" value={answer} maxLength={500} autoComplete="off" spellCheck={false} onChange={(event) => setAnswer(event.target.value)} disabled={busy} placeholder="Напишіть фразу…" />
        </form>}
      </div>}
      {step.hint && step.kind !== "listen" && <div className="lesson-hint" role="status"><strong>Підказка {step.support_level} / {step.hint_count}</strong><p>{step.hint}</p><small>Цю відповідь буде позначено як практику з підтримкою.</small></div>}
      {step.feedback && <LessonFeedback feedback={step.feedback} explanation={step.explanation} />}
      {audioError && <p className="mixed-error" role="alert">{audioError}</p>}
      {error && (error instanceof ApiError && error.code === "SpeechRecognitionUnstable"
        ? <SpeechRetryNotice /> : <p className="mixed-error" role="alert">{error.message}</p>)}
    </section>
    <div className="mixed-actions">
      {!answered && step.kind !== "explain" && step.kind !== "listen" && step.hint_count > 0 && <button className="reveal-button" disabled={busy || step.support_level >= step.hint_count} onClick={() => hint.mutate()}>{step.support_level === 0 ? "Підказка" : step.support_level === step.hint_count - 1 ? "Показати відповідь" : "Ще підказка"}</button>}
      {step.kind === "explain" || answered ? <button className="launch-button" disabled={busy} onClick={() => advance.mutate()}>{advance.isPending ? "Зберігаємо…" : session.current_index + 1 === session.total_steps ? "Побачити результат →" : "Далі →"}</button> : (!voiceMode || step.kind !== "produce") && <button className="launch-button" disabled={!canCheck || busy} onClick={() => check.mutate()}>{check.isPending ? "Перевіряємо…" : "Перевірити ✓"}</button>}
    </div>
  </div>;
}
