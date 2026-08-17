export type TopicPresentation = {
  title: string;
  italian: string;
  description: string;
  mark: string;
  accent: "red" | "green" | "ivory";
};

export const topicPresentation: Record<string, TopicPresentation> = {
  greetings: { title: "Привітання", italian: "Saluti", description: "Вітання, прощання й ввічливість", mark: "CI", accent: "red" },
  introductions: { title: "Знайомство", italian: "Presentarsi", description: "Ім’я, походження та як справи", mark: "PR", accent: "green" },
  "language-help": { title: "Допомога з мовою", italian: "Aiuto", description: "Перепитати й попросити повільніше", mark: "AI", accent: "ivory" },
  numbers: { title: "Числа", italian: "Numeri", description: "Від нуля до ста", mark: "01", accent: "ivory" },
  "time-calendar": { title: "Час і календар", italian: "Tempo", description: "Дні, місяці та години", mark: "24", accent: "green" },
  "people-family": { title: "Люди й родина", italian: "Famiglia", description: "Близькі та знайомі", mark: "FM", accent: "red" },
  "personal-info": { title: "Особисті дані", italian: "Dati personali", description: "Ім’я, адреса й національність", mark: "ID", accent: "ivory" },
  home: { title: "Дім", italian: "Casa", description: "Кімнати й речі довкола", mark: "CA", accent: "green" },
  "food-drink": { title: "Їжа й напої", italian: "Cibo", description: "Кафе, продукти й смаки", mark: "CB", accent: "ivory" },
  "city-places": { title: "Місця в місті", italian: "In città", description: "Заклади та міський простір", mark: "CT", accent: "red" },
  "transport-travel": { title: "Транспорт і подорожі", italian: "Viaggio", description: "Дорога, квитки та багаж", mark: "VG", accent: "green" },
  "study-language": { title: "Навчання й мова", italian: "Studiare", description: "Уроки, книжки та італійська", mark: "ST", accent: "green" },
  "work-professions": { title: "Робота й професії", italian: "Lavoro", description: "Офіс, колеги та фахи", mark: "LV", accent: "red" },
  body: { title: "Частини тіла", italian: "Il corpo", description: "Тіло від голови до стоп", mark: "CR", accent: "ivory" },
  health: { title: "Здоров’я", italian: "Salute", description: "Лікар, симптоми та лікування", mark: "SL", accent: "green" },
  "weather-seasons": { title: "Погода й пори року", italian: "Meteo", description: "Сонце, дощ, літо та зима", mark: "MT", accent: "red" },
  "nature-animals": { title: "Природа й тварини", italian: "Natura", description: "Ландшафти, рослини та тварини", mark: "NT", accent: "green" },
  "clothes-accessories": { title: "Одяг і аксесуари", italian: "Vestiti", description: "Гардероб, взуття та деталі", mark: "VS", accent: "red" },
  "core-actions": { title: "Основні дії", italian: "Azioni", description: "Найуживаніші дієслова", mark: "AZ", accent: "ivory" },
  descriptions: { title: "Описи", italian: "Qualità", description: "Ознаки, стани й враження", mark: "QL", accent: "green" },
  "daily-communication": { title: "Щоденне спілкування", italian: "Ogni giorno", description: "Практичні фрази на щодень", mark: "OG", accent: "red" },
};

export function presentationFor(category: string): TopicPresentation {
  return topicPresentation[category] ?? {
    title: category.replaceAll("-", " "),
    italian: "Vocabolario",
    description: "Тематична добірка слів",
    mark: category.slice(0, 2).toUpperCase(),
    accent: "ivory",
  };
}
