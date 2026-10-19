const recordingTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];

/** Safari can record AAC/MP4 even when WebM is unavailable. */
export function createAudioRecorder(stream: MediaStream): MediaRecorder {
  for (const mimeType of recordingTypes) {
    if (!MediaRecorder.isTypeSupported(mimeType)) continue;
    try { return new MediaRecorder(stream, { mimeType }); } catch { /* Try the next supported container. */ }
  }
  // Let the browser select its native format when explicit codec options fail.
  return new MediaRecorder(stream);
}

export function audioFilename(audio: Blob, stem: string): string {
  const type = audio.type.toLowerCase().split(";", 1)[0].trim();
  const extension = ({ "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav" } as Record<string, string>)[type] ?? "webm";
  return `${stem}.${extension}`;
}

export function microphoneErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Дозвольте доступ до мікрофона в налаштуваннях цього сайту в браузері та спробуйте ще раз.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Мікрофон не знайдено. Перевірте підключення й спробуйте ще раз.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Мікрофон зайнятий або недоступний. Завершіть дзвінок чи інший запис і спробуйте ще раз.";
  return "Не вдалося почати запис. Спробуйте ще раз або оберіть письмову відповідь.";
}
