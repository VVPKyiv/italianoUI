import type { CurriculumCatalog, ProgressActivityDay, ProgressSnapshot } from "../../types";

export type CourseSummary = CurriculumCatalog["summary"] | undefined;

export function activitySummary(days: ProgressActivityDay[]) {
  const attempts = days.reduce((sum, day) => sum + day.attempts, 0);
  const correct = days.reduce((sum, day) => sum + day.correct, 0);
  return { attempts, minutes: days.reduce((sum, day) => sum + day.minutes, 0),
    accuracy: attempts ? Math.round(correct / attempts * 100) : null };
}

export function progressMilestones(data: ProgressSnapshot, course: CourseSummary) {
  const recall = data.evidence.dimensions.filter((item) => ["spoken_recall", "written_recall"].includes(item.kind));
  // Modes can contain the same word, so do not sum their word counts.
  const independent = Math.max(0, ...recall.map((item) => item.independent_words));
  const confirmed = Math.max(0, ...recall.map((item) => item.confirmed_words));
  return [
    { id: "first", mark: "✦", title: "Перший крок", detail: "Завершити перший урок у маршруті.",
      value: course?.completed_lessons ?? null, target: 1, unit: "уроків" },
    { id: "words", mark: "Aa", title: "Шукач слів", detail: "Спробувати 50 різних слів у словниковій практиці.",
      value: data.overview.reviewed_words, target: 50, unit: "слів" },
    { id: "reading", mark: "▤", title: "Між рядками", detail: "Завершити п’ять різних текстів для читання.",
      value: data.reading.completed_texts, target: 5, unit: "текстів" },
    { id: "rhythm", mark: "♨", title: "Власний ритм", detail: "Досягти серії з трьох навчальних днів. Уже здобутий рубіж залишається з тобою.",
      value: data.overview.longest_streak, target: 3, unit: "днів поспіль" },
    { id: "recall", mark: "◇", title: "Без підказок", detail: "Самостійно відтворити хоча б одне слово усно або письмово, чи пройти урок самостійно.",
      value: Math.max(independent, course?.independent_lessons ?? 0), target: 1, unit: "самостійних результатів" },
    { id: "memory", mark: "∞", title: "Крізь час", detail: "Підтвердити самостійне пригадування слова або результат уроку після запланованої паузи.",
      value: Math.max(confirmed, course?.confirmed_lessons ?? 0), target: 1, unit: "підтверджень після паузи" },
  ].map((item) => ({ ...item, earned: item.value !== null && item.value >= item.target }));
}
