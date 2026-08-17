import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function SentenceResultPage() {
  const { sessionId = "" } = useParams();
  const result = useQuery({ queryKey: ["sentence-result", sessionId], queryFn: () => api.sentenceResult(sessionId) });
  if (!result.data) return <div className="state-page">Рахуємо результат…</div>;
  return (
    <div className="sentence-result shell">
      <span className="luxury-kicker"><i /> SESSIONE COMPLETATA</span>
      <h1>Речення <em>складено.</em></h1>
      <div className="sentence-result-score"><strong>{result.data.accuracy}%</strong><span>{result.data.correct} з {result.data.total} правильно</span></div>
      <Link className="launch-button" to="/"><span>Обрати нове тренування</span><b>→</b></Link>
    </div>
  );
}
