import { useState } from "react";

type Props = {
  audioUrl: string | null;
  transcript: string | null;
  completed: boolean;
  answered: boolean;
  busy: boolean;
  onCompleted: () => Promise<void>;
  onReveal: () => void;
};

export function LessonListeningPrompt({ audioUrl, transcript, completed, answered, busy, onCompleted, onReveal }: Props) {
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const recordCompletion = async () => {
    if (completed || answered || saving) return;
    setSaving(true); setSaveFailed(false);
    try { await onCompleted(); } catch { setSaveFailed(true); } finally { setSaving(false); }
  };
  return <section className="lesson-listening" aria-label="Аудіозапитання">
    <div className="lesson-listening-title"><span aria-hidden="true">◖</span><strong>Слухаємо і розуміємо</strong></div>
    {audioUrl && <audio controls preload="none" src={audioUrl} onEnded={() => void recordCompletion()} onPlaying={() => setFailed(false)} onError={() => setFailed(true)} aria-label="Прослухати аудіозапитання" />}
    <p role="status">{answered ? "Відповідь збережено. Аудіо можна прослухати ще раз." : saving ? "Зберігаємо прослуховування…" : transcript && !answered ? "Текст відкрито як підказку. Можна відповісти з підтримкою." : completed ? "Прослухано. Оберіть відповідь нижче." : "Прослухайте запис до кінця, потім оберіть відповідь."}</p>
    {(failed || !audioUrl) && !answered && <p className="mixed-error" role="alert">Аудіо недоступне. Можна відкрити текст і продовжити як практику з підтримкою.</p>}
    {saveFailed && <div role="alert"><p>Не вдалося зберегти прослуховування.</p><button disabled={busy || saving} onClick={() => void recordCompletion()}>Спробувати зберегти ще раз</button></div>}
    {transcript ? <div className="lesson-listening-transcript"><small>{answered ? "Текст аудіо" : "Транскрипт · підказка"}</small><p lang="it">{transcript}</p></div>
      : !answered && <button className="lesson-transcript-reveal" disabled={busy || saving} onClick={onReveal}>Показати текст · підказка</button>}
  </section>;
}
