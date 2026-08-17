import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function MatchingResultPage() {
  const { sessionId = "" } = useParams();
  const result = useQuery({ queryKey: ["matching-result", sessionId], queryFn: () => api.matchingResult(sessionId) });
  if (!result.data) return <div className="matching-state shell">Підраховуємо результат…</div>;
  return <div className="matching-result shell"><span className="luxury-kicker"><i /> ABBINAMENTO COMPLETATO</span><h1>Сім пар <em>зібрано.</em></h1><div className="matching-result-score"><strong>{result.data.accuracy}%</strong><span>{result.data.attempts} спроб · {result.data.mistakes} помилок · {result.data.duration_seconds} с</span></div><section><h2>Слова цієї гри</h2>{result.data.pairs.map((pair) => <button key={pair.italian_text} onClick={() => void new Audio(pair.audio_url).play()}><b>{pair.italian_text}</b><span>{pair.ukrainian_text}</span><i>♪</i></button>)}</section><Link className="launch-button" to="/training/setup/matching"><span>Зіграти ще раз</span><b>→</b></Link></div>;
}
