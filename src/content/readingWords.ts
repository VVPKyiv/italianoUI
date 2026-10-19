export function normalizeReadingWord(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("it").replaceAll("’", "'")
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").replace(/\s+/g, " ");
}

export type ReadingFragment = { text: string; word?: string; translation?: string };

/** Keep punctuation and spacing intact; prefer contextual phrases to isolated words. */
export function readingFragments(sentence: string, glossary: Map<string, string>): ReadingFragment[] {
  const words = [...sentence.matchAll(/[\p{L}]+(?:['’][\p{L}]+)*/gu)];
  const fragments: ReadingFragment[] = [];
  const maxLength = Math.max(1, ...[...glossary.keys()].map((word) => word.split(" ").length));
  let cursor = 0;
  for (let index = 0; index < words.length; index += 1) {
    const start = words[index].index!;
    if (start > cursor) fragments.push({ text: sentence.slice(cursor, start) });
    let length = 1;
    let end = start + words[index][0].length;
    let word = normalizeReadingWord(words[index][0]);
    for (let size = Math.min(maxLength, words.length - index); size > 1; size -= 1) {
      const last = words[index + size - 1];
      const candidateEnd = last.index! + last[0].length;
      const candidate = normalizeReadingWord(sentence.slice(start, candidateEnd));
      if (glossary.has(candidate)) {
        length = size;
        end = candidateEnd;
        word = candidate;
        break;
      }
    }
    fragments.push({ text: sentence.slice(start, end), word, translation: glossary.get(word) });
    cursor = end;
    index += length - 1;
  }
  if (cursor < sentence.length) fragments.push({ text: sentence.slice(cursor) });
  return fragments;
}
