const readingArtwork: Record<string, string> = {
  "people-family": "/reading-worlds/story-v2/family.webp",
  "daily-communication": "/reading-worlds/story-v2/conversation.webp",
  home: "/reading-worlds/story-v2/home.webp",
  "food-drink": "/reading-worlds/story-v2/food.webp",
  "transport-travel": "/reading-worlds/story-v2/transport.webp",
  "weather-seasons": "/reading-worlds/windmill.webp",
  "study-language": "/reading-worlds/story-v2/study.webp",
  "city-places": "/lesson-worlds/city.webp",
  health: "/reading-worlds/story-v2/health.webp",
  "education-courses": "/reading-worlds/story-v2/education.webp",
  "travel-situations": "/reading-worlds/story-v2/travel.webp",
  "environment-city-life": "/reading-worlds/garden.webp",
  "shopping-finance": "/reading-worlds/story-v2/shopping.webp",
  workplace: "/reading-worlds/story-v2/work.webp",
  "documents-public-services": "/reading-worlds/story-v2/documents.webp",
  "housing-life": "/reading-worlds/story-v2/home.webp",
  "phone-internet": "/reading-worlds/story-v2/study.webp",
  "money-bills": "/reading-worlds/story-v2/documents.webp",
  "everyday-services": "/reading-worlds/story-v2/work.webp",
  "school-family": "/reading-worlds/story-v2/education.webp",
  "neighbors-building": "/reading-worlds/story-v2/home.webp",
  "daily-mobility": "/reading-worlds/story-v2/transport.webp",
  "job-search": "/reading-worlds/story-v2/work.webp",
};

export function artworkForReading(category: string): string {
  return readingArtwork[category] ?? "/reading-worlds/academy.webp";
}
