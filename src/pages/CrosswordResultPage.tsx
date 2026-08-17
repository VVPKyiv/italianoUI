import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function CrosswordResultPage() {
  const { sessionId = "" } = useParams();
  const result = useQuery({
    queryKey: ["crossword-result", sessionId],
    queryFn: () => api.crosswordResult(sessionId),
  });
  if (result.isPending) return <div className="crossword-state shell">Підраховуємо результат…</div>;
  if (!result.data) return <div className="crossword-state shell">Результат поки недоступний.</div>;
  const data = result.data;
  const fullySolved = data.solved_words === data.total_words;
  return <div className="crossword-result shell">
    <span className="luxury-kicker"><i /> {fullySolved ? "CRUCIVERBA COMPLETATO" : "SESSIONE COMPLETATA"}</span>
    <header><div><h1>{fullySolved ? "Кросворд" : "Сесію"} <em>{fullySolved ? "розгадано." : "завершено."}</em></h1><p>{fullySolved ? "Італійські слова закріплено через активне пригадування й написання." : `Ви розгадали ${data.solved_words} із ${data.total_words} слів. Нерозгадані відповіді можна переглянути нижче.`}</p></div><strong>{data.accuracy}%<small>точність</small></strong></header>
    <section className="crossword-result-stats"><div><b>{data.solved_words}/{data.total_words}</b><span>слів</span></div><div><b>{data.attempts}</b><span>перевірок</span></div><div><b>{data.mistakes}</b><span>помилок</span></div><div><b>{data.duration_seconds} с</b><span>час</span></div></section>
    <section className="crossword-result-words"><header><small>LE RISPOSTE</small><h2>Слова кросворду</h2></header>{data.words.map((word, index) => <article className={word.is_solved ? "solved" : "unsolved"} key={`${word.italian_text}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b><strong>{word.italian_text}</strong><span>{word.ukrainian_text}</span><small>{word.is_solved ? (word.attempts_count === 1 ? "з першої спроби" : `${word.attempts_count} спроби`) : "не розгадано"}</small></article>)}</section>
    <div className="crossword-result-actions"><Link to="/">До тренувань</Link><Link className="launch-button" to="/training/setup/crossword"><span>Новий кросворд</span><b>→</b></Link></div>
  </div>;
}
