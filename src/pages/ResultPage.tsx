import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { TrainingResultWord } from "../types";

type ResultTableProps = {
  title: string;
  eyebrow: string;
  tone: "success" | "review";
  words: TrainingResultWord[];
  playing: string | null;
  onPlay: (word: TrainingResultWord, key: string) => void;
};

function ResultTable({ title, eyebrow, tone, words, playing, onPlay }: ResultTableProps) {
  return (
    <section className={`result-word-table ${tone}`}>
      <header>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <strong>{words.length}</strong>
      </header>
      <div className="result-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Українською</th>
              <th>Італійською</th>
              <th><span className="visually-hidden">Прослухати</span></th>
            </tr>
          </thead>
          <tbody>
            {words.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>{tone === "success" ? "Поки немає правильних відповідей" : "Усі слова виконано успішно"}</td>
              </tr>
            ) : words.map((word, index) => {
              const key = `${tone}-${word.ukrainian}-${word.italian}-${index}`;
              const isPlaying = playing === key;
              return (
                <tr key={key}>
                  <td>{word.ukrainian}</td>
                  <td lang="it"><b>{word.italian}</b></td>
                  <td>
                    <button
                      className={`result-audio-button ${isPlaying ? "playing" : ""}`}
                      type="button"
                      disabled={!word.audio_url}
                      aria-label={word.audio_url ? `Прослухати ${word.italian}` : `Аудіо для ${word.italian} недоступне`}
                      title={word.audio_url ? "Прослухати вимову" : "Аудіо ще не згенеровано"}
                      onClick={() => onPlay(word, key)}
                    >
                      <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ResultPage() {
  const { sessionId = "" } = useParams();
  const query = useQuery({ queryKey: ["result", sessionId], queryFn: () => api.result(sessionId) });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const play = (word: TrainingResultWord, key: string) => {
    if (!word.audio_url) return;
    audioRef.current?.pause();
    if (playing === key) {
      audioRef.current = null;
      setPlaying(null);
      return;
    }
    const audio = new Audio(word.audio_url);
    audioRef.current = audio;
    setPlaying(key);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    void audio.play().catch(() => setPlaying(null));
  };

  if (query.isLoading) return <div className="state-page">Рахуємо результат…</div>;
  if (!query.data) return <div className="state-page"><h1>Результат недоступний</h1><Link className="primary" to="/">На головну</Link></div>;
  const result = query.data;

  return (
    <div className="result shell">
      <section className="result-hero">
        <div className="score-ring" style={{ "--score": `${result.accuracy}%` } as CSSProperties}>
          <strong>{result.accuracy}%</strong>
          <small>точність</small>
        </div>
        <div>
          <span className="eyebrow">ТРЕНУВАННЯ ЗАВЕРШЕНО</span>
          <h1>{result.accuracy >= 80 ? "Ottimo lavoro!" : "Добрий початок."}</h1>
          <p>Прослухайте слова ще раз і закріпіть правильну італійську вимову.</p>
        </div>
      </section>

      <div className="result-stats">
        <article><span>✓</span><strong>{result.correct}</strong><small>правильно</small></article>
        <article><span>×</span><strong>{result.incorrect}</strong><small>потребують повторення</small></article>
        <article><span>Σ</span><strong>{result.total}</strong><small>усього слів</small></article>
      </div>

      <div className="result-tables">
        <ResultTable
          title="Успішні слова"
          eyebrow="ВИВЧЕНО УСПІШНО"
          tone="success"
          words={result.successful}
          playing={playing}
          onPlay={play}
        />
        <ResultTable
          title="Потрібно повторити"
          eyebrow="ЗВЕРНІТЬ УВАГУ"
          tone="review"
          words={result.unsuccessful}
          playing={playing}
          onPlay={play}
        />
      </div>

      <div className="result-actions"><Link className="primary" to="/">Нове тренування <span>→</span></Link></div>
    </div>
  );
}
