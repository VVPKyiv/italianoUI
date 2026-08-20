import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

const names: Record<string, string> = {
  translate_to_italian: "переклад італійською",
  translate_to_ukrainian: "переклад українською",
  listen_and_choose: "аудіювання",
  speak_word: "вимова слова",
  build_sentence: "складання речення",
  speak_sentence: "вимова речення",
  match_pair: "пошук пари",
};

export function MixedResultPage() {
  const { sessionId = "" } = useParams();
  const result = useQuery({ queryKey: ["mixed-result", sessionId], queryFn: () => api.mixedResult(sessionId) });
  if (result.isError) return <div className="state-page">{result.error.message}</div>;
  if (!result.data) return <div className="state-page">Рахуємо результат…</div>;
  return <div className="mixed-result shell">
    <span className="luxury-kicker"><i /> LEZIONE COMPLETATA</span>
    <h1>Урок <em>завершено.</em></h1>
    <div className="sentence-result-score"><strong>{result.data.accuracy}%</strong><span>{result.data.correct} з {result.data.total} правильно</span></div>
    <section className="mixed-breakdown"><small>РІЗНІ НАВИЧКИ</small><h2>Як пройшли формати</h2>{Object.entries(result.data.by_type).map(([type, [correct, total]]) => <article key={type}><span>{names[type] ?? type}</span><b>{correct} / {total}</b></article>)}</section>
    <Link className="launch-button" to="/training/setup/mixed"><span>Новий змішаний урок</span><b>→</b></Link>
  </div>;
}
