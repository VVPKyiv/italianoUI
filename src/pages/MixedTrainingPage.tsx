import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useVoiceAttempt } from "../hooks/useVoiceAttempt";
import type { MixedCheck, MixedCardType } from "../types";

const labels: Record<MixedCardType, { eyebrow: string; instruction: string }> = {
  translate_to_italian: { eyebrow: "TRADUCI", instruction: "Оберіть правильний варіант італійською." },
  translate_to_ukrainian: { eyebrow: "TRADUCI", instruction: "Оберіть правильний український переклад." },
  listen_and_choose: { eyebrow: "ASCOLTA", instruction: "Прослухайте слово та оберіть його переклад." },
  speak_word: { eyebrow: "PARLA", instruction: "Скажіть це слово італійською." },
  build_sentence: { eyebrow: "COSTRUISCI", instruction: "Складіть речення. Не всі слова потрібно використати." },
  speak_sentence: { eyebrow: "PARLA IN FRASE", instruction: "Скажіть речення італійською повністю." },
  match_pair: { eyebrow: "ABBINA", instruction: "Знайдіть італійську пару для українського слова." },
};

export function MixedTrainingPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [check, setCheck] = useState<MixedCheck | null>(null);
  const [audioError, setAudioError] = useState("");
  const sessionQuery = useQuery({
    queryKey: ["mixed-session", sessionId],
    queryFn: () => api.getMixedSession(sessionId),
  });
  const session = sessionQuery.data;
  const card = session?.current_card;

  useEffect(() => {
    if (session?.status === "completed") {
      navigate(`/mixed/${sessionId}/result`, { replace: true });
    }
  }, [navigate, session?.status, sessionId]);

  useEffect(() => {
    setSelected("");
    setTokens([]);
    setCheck(null);
    setAudioError("");
    audioRef.current?.pause();
  }, [card?.id]);

  const submitSpeech = useMutation({
    mutationFn: (audio: Blob) => api.submitMixedSpeech(sessionId, card!.id, audio),
    onSuccess: setCheck,
  });
  const voice = useVoiceAttempt(async (audio) => {
    await submitSpeech.mutateAsync(audio);
  });
  const verify = useMutation({
    mutationFn: () => api.checkMixed(
      sessionId,
      card!.id,
      card!.exercise_type === "build_sentence"
        ? tokens.map((index) => card!.token_pool[index]).join(" ")
        : selected,
    ),
    onSuccess: setCheck,
  });
  const reveal = useMutation({
    mutationFn: () => api.revealMixed(sessionId, card!.id),
    onSuccess: setCheck,
  });
  const advance = useMutation({
    mutationFn: () => api.advanceMixed(sessionId),
    onSuccess: (next) => {
      client.setQueryData(["mixed-session", sessionId], next);
      if (next.status === "completed") navigate(`/mixed/${sessionId}/result`);
    },
  });

  if (sessionQuery.isPending) return <div className="state-page">Готуємо змішаний урок…</div>;
  if (sessionQuery.isError) return <div className="state-page">{sessionQuery.error.message}</div>;
  if (session?.status === "completed") return <div className="state-page">Відкриваємо результат…</div>;
  if (!session || !card) return <div className="state-page">Урок не знайдено</div>;

  const isSpeaking = card.exercise_type === "speak_word" || card.exercise_type === "speak_sentence";
  const isSentence = card.exercise_type === "build_sentence";
  const prompt = card.prompt_uk || card.prompt_it;
  const config = labels[card.exercise_type];
  const progress = (session.current_card_index / session.total_cards) * 100;
  const selectedSet = new Set(tokens);
  const canCheck = isSentence ? tokens.length > 0 : selected.length > 0;
  const microphoneBusy = ["requesting", "ready", "recording", "processing"].includes(voice.microphone);
  const mutationBusy = verify.isPending || reveal.isPending || submitSpeech.isPending || advance.isPending;

  const playAudio = async () => {
    if (!audioRef.current || !card.audio_url) return;
    setAudioError("");
    audioRef.current.currentTime = 0;
    try {
      await audioRef.current.play();
    } catch {
      setAudioError("Не вдалося відтворити озвучення.");
    }
  };

  const startSpeech = async () => {
    if (voice.microphone === "recording") {
      voice.stop();
      return;
    }
    const enabled = await voice.enable();
    if (enabled && !(await voice.record())) voice.disable();
  };

  return (
    <div className="mixed-training shell">
      <header className="sentence-head">
        <button className="ghost" aria-label="Вийти з уроку" onClick={() => navigate("/")}>×</button>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <b>{session.current_card_index + 1}<small> / {session.total_cards}</small></b>
      </header>

      <section className={`mixed-card ${check ? (check.is_correct ? "correct" : "incorrect") : ""}`}>
        <span className="luxury-kicker"><i /> {config.eyebrow}</span>
        <p className="mixed-instruction">{config.instruction}</p>
        {card.audio_url && <audio ref={audioRef} src={card.audio_url} preload="auto" onError={() => setAudioError("Озвучення поки недоступне.")} />}

        {card.exercise_type === "listen_and_choose" && (
          <button className="mixed-listen" onClick={playAudio}><span>▶</span> Прослухати слово</button>
        )}
        {prompt && <h1 className={isSpeaking || isSentence ? "mixed-ukrainian-prompt" : ""}>{prompt}</h1>}

        {isSentence && <>
          <div className="sentence-answer mixed-answer">
            {tokens.length === 0 && <span>Натискайте слова нижче…</span>}
            {tokens.map((index) => <button key={index} disabled={Boolean(check)} onClick={() => setTokens((items) => items.filter((item) => item !== index))}>{card.token_pool[index]}</button>)}
          </div>
          <div className="sentence-pool">
            {card.token_pool.map((token, index) => <button key={`${token}-${index}`} disabled={selectedSet.has(index) || Boolean(check)} onClick={() => setTokens((items) => [...items, index])}>{token}</button>)}
          </div>
        </>}

        {!isSentence && !isSpeaking && (
          <div className="mixed-options" aria-label="Варіанти відповіді">
            {card.options.map((option, index) => <button
              key={`${option}-${index}`}
              className={`${selected === option ? "selected" : ""} ${check?.correct_answer === option ? "correct" : ""} ${check && selected === option && !check.is_correct ? "wrong" : ""}`}
              disabled={Boolean(check)}
              onClick={() => setSelected(option)}
            ><span>{String.fromCharCode(65 + index)}</span><b>{option}</b><i>{check?.correct_answer === option ? "✓" : check && selected === option ? "×" : ""}</i></button>)}
          </div>
        )}

        {isSpeaking && <div className="mixed-voice-panel">
          <div className="voice-meter"><i style={{ width: `${Math.round(voice.level * 100)}%` }} /></div>
          <p>{voice.microphone === "recording" ? "Слухаю… натисніть ще раз, коли завершите" : voice.microphone === "processing" ? "Розпізнаю відповідь…" : voice.microphone === "blocked" ? "Дозвольте доступ до мікрофона в браузері й спробуйте ще раз" : "Натисніть «Почати говорити» — мікрофон увімкнеться сам"}</p>
          <button
            className={`record-button ${voice.microphone === "recording" ? "recording" : ""}`}
            disabled={voice.microphone === "requesting" || voice.microphone === "processing" || mutationBusy}
            onClick={() => void startSpeech()}
          >{voice.microphone === "recording" ? "Завершити запис" : voice.microphone === "requesting" ? "Підключаємо…" : "Почати говорити"}</button>
          {submitSpeech.isError && <small className="mixed-error">{submitSpeech.error.message}</small>}
        </div>}

        {audioError && <small className="mixed-error">{audioError}</small>}
        {verify.isError && <small className="mixed-error">{verify.error.message}</small>}
        {reveal.isError && <small className="mixed-error">{reveal.error.message}</small>}
        {advance.isError && <small className="mixed-error">{advance.error.message}</small>}
        {check && <div className={`mixed-feedback ${check.is_correct ? "correct" : "incorrect"}`}>
          <strong>{check.is_correct ? "Правильно! Ottimo." : "Майже — правильна відповідь нижче."}</strong>
          <p>Правильно: <b>{check.correct_answer}</b></p>
          {check.transcription && <small>Ви сказали: «{check.transcription}»</small>}
          <small>{check.explanation_uk}</small>
          {card.audio_url && <button className="sentence-audio-button" onClick={playAudio}><span>▶</span> Прослухати</button>}
        </div>}
      </section>

      <div className="mixed-actions">
        {!check && !isSpeaking && <button className="launch-button" disabled={!canCheck || mutationBusy} onClick={() => verify.mutate()}><span>{verify.isPending ? "Перевіряємо…" : "Перевірити"}</span><b>✓</b></button>}
        {!check && <button className="reveal-button" disabled={mutationBusy || microphoneBusy} onClick={() => reveal.mutate()}>Показати відповідь</button>}
        {check && <button className="launch-button" disabled={advance.isPending} onClick={() => advance.mutate()}><span>{advance.isPending ? "Завантажуємо…" : session.current_card_index + 1 === session.total_cards ? "Побачити результат" : "Наступна картка"}</span><b>→</b></button>}
      </div>
    </div>
  );
}
