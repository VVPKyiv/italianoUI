import type { LessonSession } from "../types";

type Feedback = NonNullable<NonNullable<LessonSession["step"]>["feedback"]>;
const excerpt = (text: string, limit: number) => text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

export function LessonFeedback({ feedback, explanation }: { feedback: Feedback; explanation: string }) {
  const rawTranscription = feedback.original_transcription || (feedback.answer.length > 240 ? feedback.answer : null);
  const title = !feedback.is_correct ? "Відповідь не зараховано"
    : feedback.supported ? "Правильно — зараховано як практику з підказкою"
    : feedback.evidence_kind === "listening" ? "Правильно — зрозуміло на слух"
    : feedback.note ? "Зараховано — зміст передано правильно"
    : "Правильно — відповідь зараховано";
  return <div className={`mixed-feedback lesson-feedback ${feedback.is_correct ? "correct" : "incorrect"}`} role="status" aria-live="polite">
    <strong className="lesson-feedback-verdict"><span aria-hidden="true">{feedback.is_correct ? "✓" : "×"}</span>{title}</strong>
    {feedback.supported && feedback.is_correct && <p>Для самостійного результату потрібна відповідь без підказки.</p>}
    <p className="lesson-transcription">{feedback.mode === "spoken" ? "Розпізнано" : "Ваша відповідь"}: <span lang="it">{excerpt(feedback.answer, 240) || "—"}</span></p>
    {feedback.note && <div className="lesson-feedback-note"><strong>Про формулювання</strong><p>{feedback.note}</p></div>}
    {!feedback.is_correct && (feedback.differences ?? []).length > 0 && <div className="lesson-answer-differences">
      <strong>Відмінності від прийнятних формулювань</strong>
      <ul>{feedback.differences.map((difference, index) => <li key={index}>
        {difference.kind === "added" ? <>Доданий фрагмент: <mark lang="it">{excerpt(difference.actual, 160)}</mark></>
          : difference.kind === "missing" ? <>Пропущено: <mark lang="it">{excerpt(difference.expected, 160)}</mark></>
          : <>Замість <mark lang="it">{excerpt(difference.actual, 160)}</mark> очікується <b lang="it">{excerpt(difference.expected, 160)}</b></>}
      </li>)}</ul>
    </div>}
    {feedback.recognition_adjusted && <small>Враховано невелику похибку або повторення розпізнавача.</small>}
    {rawTranscription && <details className="lesson-raw-transcription"><summary>{feedback.mode === "spoken" ? "Повний текст розпізнавача" : "Повний текст відповіді"}</summary><p lang="it">{rawTranscription}</p></details>}
    <p>{feedback.mode === "choice" ? "Правильна відповідь" : feedback.is_correct ? "Приклад прийнятної відповіді" : "Приклад очікуваної відповіді"}: <b lang="it">{feedback.correct_answer}</b></p>
    {explanation && <details className="lesson-feedback-explanation"><summary>Пояснення</summary><p>{explanation}</p></details>}
  </div>;
}
