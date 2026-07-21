import type { AttemptResult, TrainingResult, TrainingSession, VocabularyWord } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Помилка сервера" }));
    throw new Error(body.detail ?? body.error ?? "Помилка сервера");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const json = (method: string, body?: unknown, key?: string): RequestInit => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(key ? { "X-Admin-Api-Key": key } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  createSession: (wordsCount: number) =>
    request<TrainingSession>("/api/v1/training/sessions", json("POST", { words_count: wordsCount })),
  getSession: (id: string) => request<TrainingSession>(`/api/v1/training/sessions/${id}`),
  startSession: (id: string) => request<TrainingSession>(`/api/v1/training/sessions/${id}/start`, { method: "POST" }),
  submitAttempt: (sessionId: string, cardId: string, audio: Blob) => {
    const form = new FormData();
    form.append("audio", audio, "attempt.webm");
    return request<AttemptResult>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/speech-attempt`, { method: "POST", body: form });
  },
  timeout: (sessionId: string, cardId: string) =>
    request<{ correct_answer: string; audio_url: string }>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/timeout`, { method: "POST" }),
  result: (id: string) => request<TrainingResult>(`/api/v1/training/sessions/${id}/result`),
  words: (key: string) => request<VocabularyWord[]>("/api/v1/vocabulary/words", { headers: { "X-Admin-Api-Key": key } }),
  createWord: (key: string, value: Omit<VocabularyWord, "id" | "is_active">) => request<VocabularyWord>("/api/v1/vocabulary/words", json("POST", value, key)),
  patchWord: (key: string, id: string, value: Partial<VocabularyWord>) => request<VocabularyWord>(`/api/v1/vocabulary/words/${id}`, json("PATCH", value, key)),
  bulkWords: (key: string, words: unknown[]) => request("/api/v1/vocabulary/words/bulk", json("POST", { words }, key)),
};
