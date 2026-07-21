export type TrainingCard = {
  id: string;
  ukrainian_prompt: string;
  status: "pending" | "active" | "correct" | "timed_out";
  started_at: string | null;
  expires_at: string | null;
};

export type TrainingSession = {
  id: string;
  status: "created" | "in_progress" | "completed";
  current_card_index: number;
  total_cards: number;
  current_card: TrainingCard | null;
};

export type AttemptResult = {
  transcription: string;
  normalized_transcription: string;
  is_correct: boolean;
  matched_answer: string | null;
  fuzzy_match: boolean;
  card_status: string;
};

export type TrainingResult = {
  session_id: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  mistakes: { ukrainian: string; italian: string }[];
};

export type VocabularyWord = {
  id: string;
  ukrainian_text: string;
  italian_text: string;
  accepted_answers: string[];
  is_active: boolean;
};
