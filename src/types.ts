export type LearnerProfile = {
  id: string;
  nickname: string;
  created_at: string;
};

export type TrainingCard = {
  id: string;
  ukrainian_prompt: string;
  status: "pending" | "active" | "correct" | "timed_out" | "revealed";
  started_at: string | null;
  expires_at: string | null;
  mastery_score: number;
  stability_days: number;
};

export type TrainingSession = {
  id: string;
  status: "created" | "in_progress" | "completed";
  current_card_index: number;
  total_cards: number;
  current_card: TrainingCard | null;
};

export type TrainingTopic = {
  category: string;
  cefr_level: "A0" | "A1" | "A2";
  word_count: number;
  reviewed_count: number;
  mastered_count: number;
  mastery_percent: number;
};

export type AttemptResult = {
  transcription: string;
  normalized_transcription: string;
  is_correct: boolean;
  matched_answer: string | null;
  fuzzy_match: boolean;
  card_status: string;
  mastery_score: number;
  stability_days: number;
  daily_decay_percent: number;
  matcher_score: number;
  recognition_model: string;
  audio_duration_seconds: number;
  speech_duration_seconds: number;
  rms_dbfs: number;
  average_log_probability: number | null;
  no_speech_probability: number | null;
  inference_ms: number;
};

export type TrainingResultWord = {
  ukrainian: string;
  italian: string;
  audio_url: string | null;
};

export type TrainingResult = {
  session_id: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  successful: TrainingResultWord[];
  unsuccessful: TrainingResultWord[];
  mistakes: TrainingResultWord[];
};

export type VocabularyWord = {
  id: string;
  ukrainian_text: string;
  italian_text: string;
  accepted_answers: string[];
  is_active: boolean;
  audio_regeneration_requested: boolean;
  cefr_level: "A0" | "A1" | "A2";
  category: string;
  part_of_speech: string;
  mastery_score: number;
  review_priority: number;
  stability_days: number;
  daily_decay_percent: number;
  successful_reviews: number;
  failed_reviews: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
};

export type VoiceProfile = {
  identifier: string;
  label: string;
};

export type VocabularyAudio = {
  word_id: string;
  audio_url: string;
  provider: "xtts" | "piper" | string;
  model: string;
  speaker_identifier: string;
  generation_settings: Record<string, unknown>;
  audio_hash: string;
  duration_seconds: number;
  created_at: string;
};

export type SentenceCard = {
  id: string;
  exercise_id: string;
  prompt_uk: string;
  token_pool: string[];
  status: "pending" | "active" | "correct" | "incorrect";
  audio_url: string;
};

export type SentenceSession = {
  id: string;
  status: "in_progress" | "completed";
  current_card_index: number;
  total_cards: number;
  current_card: SentenceCard | null;
};

export type SentenceCheck = {
  is_correct: boolean;
  correct_tokens: string[];
  explanation_uk: string;
  feedback_uk: string;
};

export type SentenceResult = {
  total: number;
  correct: number;
  accuracy: number;
};

export type ListeningCard = {
  id: string;
  exercise_type: "ukrainian_translation" | "italian_word";
  audio_url: string;
  options: string[];
  status: "pending" | "active" | "correct" | "incorrect";
};

export type ListeningSession = {
  id: string;
  status: "in_progress" | "completed";
  current_card_index: number;
  total_cards: number;
  current_card: ListeningCard | null;
};

export type ListeningCheck = {
  is_correct: boolean;
  selected_answer: string;
  correct_answer: string;
  italian_text: string;
  ukrainian_text: string;
  feedback_uk: string;
  mastery_score: number;
};

export type ListeningResult = {
  total: number;
  correct: number;
  accuracy: number;
  mistakes: {
    italian_text: string;
    ukrainian_text: string;
    selected_answer: string;
  }[];
};

export type MixedCardType =
  | "translate_to_italian"
  | "translate_to_ukrainian"
  | "listen_and_choose"
  | "speak_word"
  | "build_sentence"
  | "speak_sentence"
  | "match_pair";

export type MixedCard = {
  id: string;
  exercise_type: MixedCardType;
  prompt_uk: string;
  prompt_it: string;
  options: string[];
  token_pool: string[];
  audio_url: string | null;
  status: "pending" | "active" | "correct" | "incorrect" | "revealed";
};

export type MixedSession = {
  id: string;
  status: "in_progress" | "completed";
  current_card_index: number;
  total_cards: number;
  current_card: MixedCard | null;
};

export type MixedCheck = {
  is_correct: boolean;
  correct_answer: string;
  explanation_uk: string;
  transcription: string | null;
};

export type MixedResult = {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  by_type: Record<string, [number, number]>;
};

export type ReadingTopic = {
  category: string;
  cefr_level: "A0" | "A1" | "A2";
  text_count: number;
  completed_count: number;
};

export type ReadingStats = {
  total_texts: number;
  completed_texts: number;
  total_completions: number;
  average_best_score: number;
  a0_texts: number;
  a1_texts: number;
  a2_texts: number;
};

export type ReadingQuestion = {
  id: string;
  prompt_it: string;
  prompt_uk: string;
  options: string[];
};

export type ReadingSession = {
  id: string;
  status: "in_progress" | "completed";
  text_id: string;
  title_it: string;
  title_uk: string;
  cefr_level: "A0" | "A1" | "A2";
  category: string;
  sentences: string[];
  sentence_audio_urls: string[];
  glossary: Record<string, string>;
  current_question_index: number;
  total_questions: number;
  correct_answers: number;
  current_question: ReadingQuestion | null;
};

export type ReadingAnswer = {
  is_correct: boolean;
  correct_answer: string;
  explanation_uk: string;
  evidence_sentence_index: number;
};

export type ReadingResult = {
  session_id: string;
  title_it: string;
  title_uk: string;
  total: number;
  correct: number;
  accuracy: number;
  new_words: Record<string, string>;
  completion_count: number;
  best_score: number;
};

export type ProgressSkill = {
  key: "vocabulary" | "pronunciation" | "listening" | "sentences" | "reading";
  label: string;
  score: number;
  attempts: number;
  correct: number;
  route: string;
};

export type ProgressActivityDay = {
  date: string;
  attempts: number;
  correct: number;
  accuracy: number;
  minutes: number;
  sessions: number;
  qualified: boolean;
};

export type ProgressTopic = {
  category: string;
  word_count: number;
  reviewed_words: number;
  mastered_words: number;
  mastery: number;
  attempts: number;
  overall_score: number;
  skills: Record<"pronunciation" | "listening" | "sentences" | "reading", number>;
  last_activity_at: string | null;
};

export type ProgressSnapshot = {
  overview: {
    overall_score: number;
    total_words: number;
    reviewed_words: number;
    mastered_words: number;
    due_words: number;
    study_minutes: number;
    active_days: number;
    current_streak: number;
    longest_streak: number;
  };
  skills: ProgressSkill[];
  activity: ProgressActivityDay[];
  topics: ProgressTopic[];
  weak_words: {
    id: string;
    italian: string;
    ukrainian: string;
    category: string;
    cefr_level: string;
    mastery: number;
    successful_reviews: number;
    failed_reviews: number;
    last_reviewed_at: string | null;
  }[];
  reading: {
    total_texts: number;
    completed_texts: number;
    total_completions: number;
    accuracy: number;
    questions_answered: number;
    glossary_lookups: number;
    unique_words_opened: number;
    audio_plays: number;
  };
  recommendations: {
    title: string;
    description: string;
    route: string;
    accent: "red" | "green" | "gold";
    category?: string;
  }[];
};

export type MatchingCard = { id: string; text: string; status: "available" | "matched"; position: number; audio_url?: string | null };
export type MatchingSession = { id: string; status: "in_progress" | "completed"; matched_count: number; total_pairs: number; attempts_count: number; left_cards: MatchingCard[]; right_cards: MatchingCard[] };
export type MatchingCheck = { is_correct: boolean; matched_count: number; total_pairs: number; attempts_count: number; status: string; audio_url: string | null; feedback_uk: string };
export type MatchingResult = { total_pairs: number; attempts: number; mistakes: number; accuracy: number; duration_seconds: number; pairs: { italian_text: string; ukrainian_text: string; audio_url: string }[] };

export type SharedCardRoom = {
  id: string;
  code: string;
  players_count: number;
  current_index: number;
  cards_count: number;
  revealed: boolean;
  version: number;
  join_url: string;
  is_player: boolean;
  card: {
    word_id: string;
    italian_text: string;
    ukrainian_text: string | null;
    category: string;
    cefr_level: string;
    audio_url: string;
  };
};

export type CrosswordCell = {
  row: number;
  column: number;
  number: number | null;
  entry_ids: string[];
  value: string;
};

export type CrosswordClue = {
  id: string;
  number: number;
  direction: "across" | "down";
  clue_uk: string;
  length: number;
  status: "open" | "solved";
  attempts_count: number;
  italian_text: string;
  audio_url: string;
};

export type CrosswordSession = {
  id: string;
  status: "in_progress" | "completed";
  width: number;
  height: number;
  solved_count: number;
  total_words: number;
  attempts_count: number;
  cells: CrosswordCell[];
  clues: CrosswordClue[];
};

export type CrosswordCheck = {
  status: "in_progress" | "completed";
  solved_count: number;
  total_words: number;
  attempts_count: number;
  correct_cells: string[];
  incorrect_cells: string[];
  empty_cells: string[];
  solved_entry_ids: string[];
  feedback_uk: string;
};

export type CrosswordResult = {
  total_words: number;
  solved_words: number;
  attempts: number;
  mistakes: number;
  accuracy: number;
  duration_seconds: number;
  words: { italian_text: string; ukrainian_text: string; attempts_count: number; is_solved: boolean; audio_url: string }[];
};
