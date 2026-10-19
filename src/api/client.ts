import type { AttemptResult, CrosswordCheck, CrosswordResult, CrosswordSession, LearnerProfile, ListeningCheck, ListeningResult, ListeningSession, MatchingCheck, MatchingResult, MatchingSession, MixedCheck, MixedResult, MixedSession, ProgressSnapshot, ReadingAnswer, ReadingResult, ReadingSession, ReadingStats, ReadingTopic, SentenceCheck, SentenceResult, SentenceSession, SharedCardRoom, TrainingResult, TrainingSession, TrainingTopic, VocabularyAudio, VocabularyWord, VoiceProfile } from "../types";

import type { CurriculumCatalog, LessonSession, CurriculumAdminCatalog, CurriculumRevision, CurriculumUnit } from "../types";
import { audioFilename } from "../audio/recording";
import { PROFILE_CHANGED, LEARNING_UPDATED } from "../features/daily-practice/events";

export const DEFAULT_PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const profileStorageKey = "italiano:active-profile";
const clientStorageKey = "italiano:client-id";
let activeProfileId = localStorage.getItem(profileStorageKey) || DEFAULT_PROFILE_ID;
const storedClientId = localStorage.getItem(clientStorageKey);
const clientId = storedClientId ?? (
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
);
if (!storedClientId) {
  localStorage.setItem(clientStorageKey, clientId);
}

export function setActiveProfileId(profileId: string): void {
  activeProfileId = profileId;
  localStorage.setItem(profileStorageKey, profileId);
  window.dispatchEvent(new Event(PROFILE_CHANGED));
}

export function getActiveProfileId(): string {
  return activeProfileId;
}

export function getClientId(): string {
  return clientId;
}

export class ApiError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestProfileId = activeProfileId;
  const headers = new Headers(init?.headers);
  headers.set("X-Profile-Id", requestProfileId);
  headers.set("X-Client-Id", clientId);
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Помилка сервера" }));
    const detail = typeof body.detail === "string" ? body.detail : Array.isArray(body.detail)
      ? body.detail.map((item: { msg?: string }) => item.msg ?? "Некоректне значення").join("; ")
      : "Помилка сервера";
    const knownErrors: Record<string, string> = {
      AudioTooShort: "Запис надто короткий. Дочекайтеся напису «Говоріть» і повторіть слово.",
      AudioTooQuiet: "Голос майже не чути. Говоріть трохи голосніше або ближче до мікрофона.",
      AudioTooDistorted: "Звук перевантажений. Відійдіть трохи далі від мікрофона.",
      NoSpeechDetected: "Не почув чіткого слова. Спробуйте ще раз після сигналу.",
      SpeechRecognitionFailed: detail,
      SpeechRecognitionUnstable: detail,
      UnsupportedAudioFormat: detail,
    };
    throw new ApiError(knownErrors[body.error] ?? detail, String(body.error ?? "UnknownError"));
  }
  const result = response.status === 204 ? (undefined as T) : await response.json();
  if (init?.method && !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())) {
    window.dispatchEvent(new CustomEvent(LEARNING_UPDATED, { detail: { profileId: requestProfileId } }));
  }
  return result;
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
  createCurriculumMaterial: (key: string, prompt: string, italian: string) => request<{ id: string }>("/api/v1/admin/curriculum/materials", json("POST", { prompt_uk: prompt, correct_tokens: italian.trim().replace(/[.!?]+$/, "").split(/\s+/), category: "curriculum", explanation_uk: "" }, key)),
  generateCurriculumMaterialAudio: (key: string, id: string) => request<{ duration_seconds: number }>(`/api/v1/sentence-builder/exercises/${id}/audio/regenerate`, json("POST", {}, key)),
  curriculumAdmin: (key: string) => request<CurriculumAdminCatalog>("/api/v1/admin/curriculum", json("GET", undefined, key)),
  saveCurriculumUnit: (key: string, unit: CurriculumUnit) => request<void>("/api/v1/admin/curriculum/units", json("PUT", unit, key)),
  saveCurriculumDraft: (key: string, lessonId: string, unitId: string, position: number, expectedVersion: number, definition: CurriculumRevision["definition"]) =>
    request<CurriculumRevision>(`/api/v1/admin/curriculum/lessons/${encodeURIComponent(lessonId)}/drafts`, json("POST", { unit_id: unitId, position, expected_version: expectedVersion, definition }, key)),
  publishCurriculum: (key: string, id: string, version: number) => request<CurriculumRevision>(`/api/v1/admin/curriculum/lessons/${encodeURIComponent(id)}/versions/${version}/publish`, json("POST", undefined, key)),
  curriculumInsights: () => request<import("../types").CurriculumInsights>("/api/v1/curriculum/insights"),
  curriculum: () => request<CurriculumCatalog>("/api/v1/curriculum"),
  createLesson: (lessonId: string, mode: "lesson" | "review" = "lesson") =>
    request<LessonSession>(`/api/v1/curriculum/lessons/${lessonId}/sessions`, json("POST", { mode })),
  lessonSession: (id: string) => request<LessonSession>(`/api/v1/curriculum/sessions/${id}`),
  answerLesson: (id: string, stepId: string, requestId: string, answer: string, mode: "written" | "choice" | "tokens") =>
    request<LessonSession>(`/api/v1/curriculum/sessions/${id}/steps/${stepId}/answer`, json("POST", { request_id: requestId, answer, mode })),
  completeLessonAudio: (id: string, stepId: string) =>
    request<LessonSession>(`/api/v1/curriculum/sessions/${id}/steps/${stepId}/audio-completed`, json("POST", {})),
  hintLesson: (id: string, stepId: string, level: number) =>
    request<LessonSession>(`/api/v1/curriculum/sessions/${id}/steps/${stepId}/hint`, json("POST", { level })),
  advanceLesson: (id: string, stepId: string) =>
    request<LessonSession>(`/api/v1/curriculum/sessions/${id}/advance`, json("POST", { step_id: stepId })),
  speakLesson: (id: string, stepId: string, requestId: string, audio: Blob) => {
    const form = new FormData();
    form.append("audio", audio, audioFilename(audio, "lesson"));
    form.append("request_id", requestId);
    return request<LessonSession>(`/api/v1/curriculum/sessions/${id}/steps/${stepId}/speech`, { method: "POST", body: form });
  },
  profiles: () => request<LearnerProfile[]>("/api/v1/profiles"),
  createProfile: (nickname: string) =>
    request<LearnerProfile>("/api/v1/profiles", json("POST", { nickname })),
  progress: () => request<ProgressSnapshot>("/api/v1/progress"),
  dailyGoal: () => request<import("../types").DailyPracticeGoal>("/api/v1/progress/daily-goal"),
  trackReadingInteraction: (sessionId: string, eventType: "glossary_lookup" | "audio_play", details: { word?: string; sentence_index?: number } = {}) =>
    request<void>("/api/v1/analytics/reading-interactions", json("POST", {
      session_id: sessionId,
      event_type: eventType,
      ...details,
    })),
  topics: () => request<TrainingTopic[]>("/api/v1/training/topics"),
  publicWords: () => request<VocabularyWord[]>("/api/v1/vocabulary/catalog", { cache: "no-store" }),
  setAudioRegenerationRequested: (wordId: string, requested: boolean) =>
    request<VocabularyWord>(`/api/v1/vocabulary/catalog/${wordId}/regeneration-request`, json("PUT", { requested })),
  createSession: (wordsCount: number, categories: string[], cefrLevels: string[]) =>
    request<TrainingSession>("/api/v1/training/sessions", json("POST", {
      words_count: wordsCount,
      categories,
      cefr_levels: cefrLevels,
    })),
  getSession: (id: string) => request<TrainingSession>(`/api/v1/training/sessions/${id}`),
  startSession: (id: string) => request<TrainingSession>(`/api/v1/training/sessions/${id}/start`, { method: "POST" }),
  beginAttempt: (sessionId: string, cardId: string) =>
    request<TrainingSession>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/listen`, { method: "POST" }),
  submitAttempt: (sessionId: string, cardId: string, audio: Blob) => {
    const form = new FormData();
    form.append("audio", audio, audioFilename(audio, "attempt"));
    return request<AttemptResult>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/speech-attempt`, { method: "POST", body: form });
  },
  timeout: (sessionId: string, cardId: string) =>
    request<{ correct_answer: string; audio_url: string | null; mastery_score: number }>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/timeout`, { method: "POST" }),
  reveal: (sessionId: string, cardId: string) =>
    request<{ correct_answer: string; audio_url: string | null; mastery_score: number }>(`/api/v1/training/sessions/${sessionId}/cards/${cardId}/reveal`, { method: "POST" }),
  result: (id: string) => request<TrainingResult>(`/api/v1/training/sessions/${id}/result`),
  sentenceTopics: () => request<Record<string, number>>("/api/v1/sentence-builder/topics"),
  createSentenceSession: (count: number, categories: string[]) =>
    request<SentenceSession>("/api/v1/sentence-builder/sessions", json("POST", { count, categories })),
  getSentenceSession: (id: string) =>
    request<SentenceSession>(`/api/v1/sentence-builder/sessions/${id}`),
  checkSentence: (sessionId: string, cardId: string, tokens: string[]) =>
    request<SentenceCheck>(`/api/v1/sentence-builder/sessions/${sessionId}/cards/${cardId}/check`, json("POST", { tokens })),
  advanceSentence: (id: string) =>
    request<SentenceSession>(`/api/v1/sentence-builder/sessions/${id}/advance`, { method: "POST" }),
  sentenceResult: (id: string) =>
    request<SentenceResult>(`/api/v1/sentence-builder/sessions/${id}/result`),
  previewSentenceAudio: async (exerciseId: string) => {
    const response = await fetch(`/api/v1/sentence-builder/exercises/${exerciseId}/audio/preview`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: "Озвучення ще не згенеровано" }));
      throw new Error(body.detail ?? "Не вдалося завантажити озвучення речення");
    }
    return response.blob();
  },
  listeningTopics: () => request<Record<string, number>>("/api/v1/listening-training/topics"),
  createListeningSession: (count: number, categories: string[]) =>
    request<ListeningSession>("/api/v1/listening-training/sessions", json("POST", { count, categories })),
  getListeningSession: (id: string) =>
    request<ListeningSession>(`/api/v1/listening-training/sessions/${id}`),
  checkListening: (sessionId: string, cardId: string, selectedAnswer: string) =>
    request<ListeningCheck>(`/api/v1/listening-training/sessions/${sessionId}/cards/${cardId}/check`, json("POST", { selected_answer: selectedAnswer })),
  advanceListening: (id: string) =>
    request<ListeningSession>(`/api/v1/listening-training/sessions/${id}/advance`, { method: "POST" }),
  listeningResult: (id: string) =>
    request<ListeningResult>(`/api/v1/listening-training/sessions/${id}/result`),
  createMixedSession: (categories: string[]) =>
    request<MixedSession>("/api/v1/mixed-training/sessions", json("POST", { categories, count: 10 })),
  getMixedSession: (id: string) =>
    request<MixedSession>(`/api/v1/mixed-training/sessions/${id}`),
  checkMixed: (sessionId: string, cardId: string, answer: string) =>
    request<MixedCheck>(`/api/v1/mixed-training/sessions/${sessionId}/cards/${cardId}/check`, json("POST", { answer })),
  submitMixedSpeech: (sessionId: string, cardId: string, audio: Blob) => {
    const form = new FormData();
    form.append("audio", audio, audioFilename(audio, "attempt"));
    return request<MixedCheck>(`/api/v1/mixed-training/sessions/${sessionId}/cards/${cardId}/speech`, { method: "POST", body: form });
  },
  revealMixed: (sessionId: string, cardId: string) =>
    request<MixedCheck>(`/api/v1/mixed-training/sessions/${sessionId}/cards/${cardId}/reveal`, { method: "POST" }),
  advanceMixed: (id: string) =>
    request<MixedSession>(`/api/v1/mixed-training/sessions/${id}/advance`, { method: "POST" }),
  mixedResult: (id: string) => request<MixedResult>(`/api/v1/mixed-training/sessions/${id}/result`),
  matchingTopics: () => request<Record<string, number>>("/api/v1/matching-training/topics"),
  createMatchingSession: (categories: string[], cefrLevels: string[]) =>
    request<MatchingSession>("/api/v1/matching-training/sessions", json("POST", { categories, cefr_levels: cefrLevels })),
  getMatchingSession: (id: string) => request<MatchingSession>(`/api/v1/matching-training/sessions/${id}`),
  checkMatching: (id: string, italianCardId: string, ukrainianCardId: string) =>
    request<MatchingCheck>(`/api/v1/matching-training/sessions/${id}/check`, json("POST", { italian_card_id: italianCardId, ukrainian_card_id: ukrainianCardId })),
  matchingResult: (id: string) => request<MatchingResult>(`/api/v1/matching-training/sessions/${id}/result`),
  createSharedCardRoom: () =>
    request<SharedCardRoom>("/api/v1/multiplayer/rooms", { method: "POST" }),
  joinSharedCardRoom: (code: string) =>
    request<SharedCardRoom>("/api/v1/multiplayer/rooms/join", json("POST", { code })),
  getSharedCardRoom: (id: string) =>
    request<SharedCardRoom>(`/api/v1/multiplayer/rooms/${id}`),
  revealSharedCard: (id: string) =>
    request<SharedCardRoom>(`/api/v1/multiplayer/rooms/${id}/reveal`, { method: "POST" }),
  nextSharedCard: (id: string) =>
    request<SharedCardRoom>(`/api/v1/multiplayer/rooms/${id}/next`, { method: "POST" }),
  crosswordTopics: () => request<Record<string, number>>("/api/v1/crossword-training/topics"),
  createCrosswordSession: (wordCount: number, categories: string[], cefrLevels: string[]) =>
    request<CrosswordSession>("/api/v1/crossword-training/sessions", json("POST", {
      word_count: wordCount,
      categories,
      cefr_levels: cefrLevels,
    })),
  getCrosswordSession: (id: string) =>
    request<CrosswordSession>(`/api/v1/crossword-training/sessions/${id}`),
  checkCrossword: (id: string, values: Record<string, string>) =>
    request<CrosswordCheck>(`/api/v1/crossword-training/sessions/${id}/check`, json("POST", { values })),
  finishCrossword: (id: string) =>
    request<CrosswordSession>(`/api/v1/crossword-training/sessions/${id}/finish`, { method: "POST" }),
  crosswordResult: (id: string) =>
    request<CrosswordResult>(`/api/v1/crossword-training/sessions/${id}/result`),
  readingTopics: () => request<ReadingTopic[]>("/api/v1/reading/topics"),
  readingStats: () => request<ReadingStats>("/api/v1/reading/stats"),
  createReadingSession: (categories: string[], cefrLevels: string[]) =>
    request<ReadingSession>("/api/v1/reading/sessions", json("POST", {
      categories,
      cefr_levels: cefrLevels,
    })),
  getReadingSession: (id: string) =>
    request<ReadingSession>(`/api/v1/reading/sessions/${id}`),
  answerReadingQuestion: (sessionId: string, questionId: string, selectedAnswer: string) =>
    request<ReadingAnswer>(`/api/v1/reading/sessions/${sessionId}/questions/${questionId}/answer`, json("POST", { selected_answer: selectedAnswer })),
  advanceReading: (id: string) =>
    request<ReadingSession>(`/api/v1/reading/sessions/${id}/advance`, { method: "POST" }),
  readingResult: (id: string) =>
    request<ReadingResult>(`/api/v1/reading/sessions/${id}/result`),
  words: (key: string) => request<VocabularyWord[]>("/api/v1/vocabulary/words", { headers: { "X-Admin-Api-Key": key } }),
  createWord: (key: string, value: Pick<VocabularyWord, "ukrainian_text" | "italian_text" | "accepted_answers">) => request<VocabularyWord>("/api/v1/vocabulary/words", json("POST", value, key)),
  patchWord: (key: string, id: string, value: Partial<VocabularyWord>) => request<VocabularyWord>(`/api/v1/vocabulary/words/${id}`, json("PATCH", value, key)),
  bulkWords: (key: string, words: unknown[]) => request("/api/v1/vocabulary/words/bulk", json("POST", { words }, key)),
  voices: (key: string) => request<VoiceProfile[]>("/api/v1/speech/voices", { headers: { "X-Admin-Api-Key": key } }),
  regenerateAudio: (key: string, id: string, voiceId: string, speed: number) =>
    request<VocabularyAudio>(`/api/v1/vocabulary/words/${id}/audio/regenerate`, json("POST", { voice_id: voiceId, speed }, key)),
  regenerateRequestedAudio: (key: string) =>
    request<VocabularyAudio[]>("/api/v1/vocabulary/words/audio/regenerate-requested", json("POST", {}, key)),
  previewAudio: async (key: string, id: string) => {
    const response = await fetch(`/api/v1/vocabulary/words/${id}/audio/preview`, { headers: { "X-Admin-Api-Key": key } });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: "Аудіо ще не згенеровано" }));
      throw new Error(body.detail ?? "Не вдалося завантажити аудіо");
    }
    return response.blob();
  },
};
