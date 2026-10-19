export function SpeechRetryNotice() {
  return <div className="speech-retry-notice" role="alert">
    <strong><span aria-hidden="true">↻</span> Запис не вдалося надійно розпізнати</strong>
    <p>Розпізнавач зациклив повторення фрагмента. Цю відповідь не оцінювали — вона не впливає на результат вправи.</p>
    <p>Натисни кнопку мікрофона й запиши фразу ще раз після сигналу.</p>
  </div>;
}
