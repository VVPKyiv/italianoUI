import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ReadingAnswer } from "../types";
import { normalizeReadingWord, readingFragments } from "../content/readingWords";
import { useWordPronunciation } from "../hooks/useWordPronunciation";

type WordTip = { word: string; label: string; translation: string };
const readingSpeedKey = "italiano:reading-speed";

function initialSpeed(): number {
  const value = Number(localStorage.getItem(readingSpeedKey));
  return [0.8, 0.9, 1].includes(value) ? value : 0.9;
}

export function ReadingPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const wordAudio = useWordPronunciation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRun = useRef(0);
  const speedRef = useRef(initialSpeed());
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answer, setAnswer] = useState<ReadingAnswer | null>(null);
  const [wordTip, setWordTip] = useState<WordTip | null>(null);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [speed, setSpeed] = useState(speedRef.current);
  const sessionQuery = useQuery({
    queryKey: ["reading-session", sessionId],
    queryFn: () => api.getReadingSession(sessionId),
  });
  const session = sessionQuery.data;

  useEffect(() => {
    setSelectedAnswer("");
    setAnswer(null);
    setWordTip(null);
    wordAudio.stop();
  }, [sessionId, session?.current_question?.id, wordAudio.stop]);

  useEffect(() => () => {
    playbackRun.current += 1;
    audioRef.current?.pause();
  }, []);

  const verify = useMutation({
    mutationFn: () => api.answerReadingQuestion(sessionId, session!.current_question!.id, selectedAnswer),
    onSuccess: (value) => setAnswer(value),
  });
  const advance = useMutation({
    mutationFn: () => api.advanceReading(sessionId),
    onSuccess: (next) => {
      client.setQueryData(["reading-session", sessionId], next);
      if (next.status === "completed") navigate(`/reading/${sessionId}/result`);
    },
  });

  const stopAudio = () => {
    playbackRun.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setActiveSentence(null);
  };

  const playText = async () => {
    if (!session) return;
    wordAudio.stop();
    if (isPlaying) {
      stopAudio();
      return;
    }
    const run = ++playbackRun.current;
    void api.trackReadingInteraction(sessionId, "audio_play").catch(() => undefined);
    setAudioError("");
    setIsPlaying(true);
    for (let index = 0; index < session.sentence_audio_urls.length; index += 1) {
      if (playbackRun.current !== run) return;
      setActiveSentence(index);
      const audio = new Audio(session.sentence_audio_urls[index]);
      audioRef.current = audio;
      audio.playbackRate = speedRef.current;
      try {
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onpause = () => resolve();
          audio.onerror = () => reject(new Error("audio"));
          audio.play().catch(reject);
        });
      } catch {
        if (playbackRun.current === run) setAudioError("Озвучення цього тексту ще готується.");
        break;
      }
    }
    if (playbackRun.current === run) {
      setIsPlaying(false);
      setActiveSentence(null);
      audioRef.current = null;
    }
  };

  const changeSpeed = (value: number) => {
    setSpeed(value);
    speedRef.current = value;
    localStorage.setItem(readingSpeedKey, String(value));
    if (audioRef.current) audioRef.current.playbackRate = value;
  };

  if (sessionQuery.isPending) return <div className="state-page">Відкриваємо текст…</div>;
  if (!session || !session.current_question) return <div className="state-page">Текст не знайдено</div>;

  const questionProgress = ((session.current_question_index + (answer ? 1 : 0)) / session.total_questions) * 100;
  const glossary = new Map(Object.entries(session.glossary).map(([word, translation]) => [normalizeReadingWord(word), translation]));

  const clearWord = () => { wordAudio.stop(); setWordTip(null); };
  const playWord = () => {
    if (!wordTip) return;
    if (wordAudio.state === "playing" || wordAudio.state === "loading") { wordAudio.stop(); return; }
    stopAudio();
    void wordAudio.play(wordTip.word, speed);
    void api.trackReadingInteraction(sessionId, "audio_play", { word: wordTip.word }).catch(() => undefined);
  };

  return (
    <div className="reading-session shell">
      <header className="reading-session-head">
        <button className="ghost" aria-label="Закрити читання" onClick={() => navigate("/reading")}>×</button>
        <div className="progress"><i style={{ width: `${questionProgress}%` }} /></div>
        <b>{session.current_question_index + 1}<small> / {session.total_questions}</small></b>
      </header>

      <div className="reading-workspace">
        <article className="reading-text-card">
          <header>
            <div><small>{session.cefr_level} · LETTURA</small><h1>{session.title_it}</h1><p>{session.title_uk}</p></div>
            <button className={`reading-play ${isPlaying ? "playing" : ""}`} onClick={playText} aria-label={isPlaying ? "Зупинити текст" : "Слухати текст"}>
              <span>{isPlaying ? "■" : "▶"}</span><b>{isPlaying ? "Зупинити" : "Слухати текст"}</b>
            </button>
          </header>

          <div className="reading-speed"><span>Темп</span>{[0.8, 0.9, 1].map((value) => (
            <button key={value} className={speed === value ? "active" : ""} onClick={() => changeSpeed(value)}>{value}×</button>
          ))}</div>
          {audioError && <p className="reading-audio-error">{audioError}</p>}

          <div className="reading-copy" lang="it" onClick={clearWord}>
            {session.sentences.map((sentence, sentenceIndex) => (
              <p
                key={sentence}
                className={`${activeSentence === sentenceIndex ? "speaking" : ""} ${answer?.evidence_sentence_index === sentenceIndex ? "evidence" : ""}`}
              >
                {readingFragments(sentence, glossary).map(({ text: token, word, translation }, tokenIndex) => {
                  return translation ? (
                    <button
                      key={`${token}-${tokenIndex}`}
                      className={`reading-word ${wordTip?.word === word ? "selected" : ""}`}
                      aria-pressed={wordTip?.word === word}
                      aria-label={`Переклад: ${token}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        wordAudio.stop();
                        setWordTip({ word: word!, label: token, translation });
                        void api.trackReadingInteraction(sessionId, "glossary_lookup", { word }).catch(() => undefined);
                      }}
                    >{token}</button>
                  ) : <span key={`${token}-${tokenIndex}`}>{token}</span>;
                })}
              </p>
            ))}
          </div>
          <div className={`word-translation ${wordTip ? "visible" : ""}`}>
            <div className="word-translation-copy" aria-live="polite" aria-atomic="true">
              {wordTip ? <><b lang="it">{wordTip.label}</b><span>{wordTip.translation}</span></> : <span className="word-translation-hint">Торкніться підкресленого слова — переклад з’явиться тут.</span>}
              {wordAudio.state === "error" && <small role="alert">Не вдалося озвучити. Спробуйте ще раз.</small>}
            </div>
            {wordTip && <>
              <button className="word-pronounce" onClick={playWord} aria-label={`${wordAudio.state === "loading" || wordAudio.state === "playing" ? "Зупинити вимову" : "Прослухати"}: ${wordTip.label}`}>
                <span aria-hidden="true">{wordAudio.state === "playing" || wordAudio.state === "loading" ? "■" : "▶"}</span>
                {wordAudio.state === "loading" ? "Готуємо…" : wordAudio.state === "playing" ? "Зупинити" : "Вимова"}
              </button>
              <button className="word-translation-close" aria-label="Закрити переклад" onClick={clearWord}>×</button>
            </>}
          </div>
        </article>

        <section className={`reading-question-card ${answer ? (answer.is_correct ? "correct" : "incorrect") : ""}`}>
          <span className="luxury-kicker"><i /> COMPRENSIONE</span>
          <small>ПИТАННЯ {session.current_question_index + 1} З {session.total_questions}</small>
          <h2>{session.current_question.prompt_it}</h2>
          <p>{session.current_question.prompt_uk}</p>
          <div className="reading-options">
            {session.current_question.options.map((option, index) => {
              const correct = answer?.correct_answer === option;
              const wrong = Boolean(answer && selectedAnswer === option && !answer.is_correct);
              return (
                <button key={option} disabled={Boolean(answer)} className={`${selectedAnswer === option ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => setSelectedAnswer(option)}>
                  <span>{String.fromCharCode(65 + index)}</span><b>{option}</b><i>{correct ? "✓" : wrong ? "×" : ""}</i>
                </button>
              );
            })}
          </div>

          {answer && (
            <div className={`reading-feedback ${answer.is_correct ? "correct" : "incorrect"}`} aria-live="polite">
              <strong>{answer.is_correct ? "Perfetto! Ви правильно зрозуміли текст." : "Не зовсім. Подивімося на підказку в тексті."}</strong>
              <p>{answer.explanation_uk}</p>
              <small>ПРАВИЛЬНА ЧАСТИНА ТЕКСТУ</small>
              <blockquote>{session.sentences[answer.evidence_sentence_index]}</blockquote>
            </div>
          )}

          <footer>
            {!answer ? (
              <button className="launch-button" disabled={!selectedAnswer || verify.isPending} onClick={() => verify.mutate()}>
                <span>{verify.isPending ? "Перевіряємо…" : "Перевірити"}</span><b>✓</b>
              </button>
            ) : (
              <button className="launch-button" disabled={advance.isPending} onClick={() => advance.mutate()}>
                <span>{session.current_question_index + 1 === session.total_questions ? "Завершити" : "Наступне питання"}</span><b>→</b>
              </button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}
