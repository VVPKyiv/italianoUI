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
  "relationships-social": { title: "Стосунки й люди", italian: "Relazioni", description: "Дружба, довіра та спілкування", mark: "RL", accent: "red" },
  "housing-services": { title: "Житло й послуги", italian: "Servizi", description: "Оренда, несправності та побут", mark: "SV", accent: "green" },
  "housing-life": { title: "Житло й оренда", italian: "Abitare", description: "Огляд квартири, витрати й ремонт", mark: "CS", accent: "green" },
  "phone-internet": { title: "Телефон та інтернет", italian: "Connessione", description: "SIM-картка, тариф і допомога зі зв’язком", mark: "WI", accent: "ivory" },
  "money-bills": { title: "Рахунки й банк", italian: "Pagamenti", description: "Суми, строки оплати й квитанції", mark: "€", accent: "green" },
  "everyday-services": { title: "Побутові послуги", italian: "Servizi quotidiani", description: "Посилки, доставка, пральня й перукарня", mark: "SQ", accent: "red" },
  "school-family": { title: "Діти й школа", italian: "Scuola e famiglia", description: "Запис до школи, учителі й шкільний день", mark: "SF", accent: "green" },
  "neighbors-building": { title: "Сусіди й будинок", italian: "Vicinato", description: "Знайомство, спільні місця й добросусідство", mark: "VC", accent: "ivory" },
  "daily-mobility": { title: "Транспорт щодня", italian: "Spostarsi", description: "Проїзні, пересадки, затримки й загублені речі", mark: "TR", accent: "green" },
  "job-search": { title: "Пошук роботи", italian: "Cercare lavoro", description: "Вакансії, резюме, співбесіди й графік", mark: "CV", accent: "red" },
  "food-cooking": { title: "Кулінарія", italian: "Cucinare", description: "Рецепти, посуд і приготування", mark: "CU", accent: "ivory" },
  "travel-situations": { title: "Ситуації в подорожі", italian: "In viaggio", description: "Рейси, бронювання та проблеми", mark: "TR", accent: "green" },
  workplace: { title: "Робоче життя", italian: "Al lavoro", description: "Співбесіди, умови та обов’язки", mark: "WP", accent: "red" },
  "media-technology": { title: "Технології й медіа", italian: "Tecnologia", description: "Інтернет, файли та новини", mark: "TX", accent: "green" },
  "health-wellbeing": { title: "Самопочуття", italian: "Benessere", description: "Обстеження, відновлення та здоров’я", mark: "BE", accent: "ivory" },
  "opinions-emotions": { title: "Думки й емоції", italian: "Opinioni", description: "Погляди, аргументи та почуття", mark: "OP", accent: "red" },
  "shopping-finance": { title: "Покупки й гроші", italian: "Acquisti", description: "Оплата, повернення та особисті фінанси", mark: "€", accent: "green" },
  "documents-public-services": { title: "Документи й установи", italian: "Documenti", description: "Бланки, посвідчення та державні послуги", mark: "DC", accent: "ivory" },
  "education-courses": { title: "Курси й освіта", italian: "Istruzione", description: "Навчання, іспити та результати", mark: "ED", accent: "red" },
  "culture-leisure": { title: "Культура й дозвілля", italian: "Cultura", description: "Кіно, події, спорт і захоплення", mark: "CL", accent: "green" },
  "environment-city-life": { title: "Місто й довкілля", italian: "Ambiente", description: "Екологія, транспорт і міський простір", mark: "AM", accent: "green" },
  "appearance-character": { title: "Характер і зовнішність", italian: "Personalità", description: "Риси людини та порівняння", mark: "PS", accent: "red" },
  "a2-core-verbs": { title: "Ключові дієслова A2", italian: "Verbi", description: "Дії для живої повсякденної мови", mark: "V2", accent: "ivory" },
  "connectors-time": { title: "Зв’язки й час", italian: "Connettivi", description: "Логічні переходи та послідовність", mark: "→", accent: "red" },
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
