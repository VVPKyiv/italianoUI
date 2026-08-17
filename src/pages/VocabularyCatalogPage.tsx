import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

export function VocabularyCatalogPage() {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["public-vocabulary-catalog"], queryFn: api.publicWords });
  const words = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("uk-UA");
    const source = query.data ?? [];
    if (!needle) return source;
    return source.filter((word) =>
      word.italian_text.toLocaleLowerCase("it-IT").includes(needle)
      || word.ukrainian_text.toLocaleLowerCase("uk-UA").includes(needle),
    );
  }, [query.data, search]);
  const flaggedCount = (query.data ?? []).filter((word) => word.audio_regeneration_requested).length;

  const refresh = async () => {
    setRefreshing(true);
    localStorage.removeItem("italiano:vocabulary-catalog");
    if ("caches" in window) {
      const names = await window.caches.keys();
      await Promise.all(names.filter((name) => name.includes("italiano")).map((name) => window.caches.delete(name)));
    }
    client.removeQueries({ queryKey: ["public-vocabulary-catalog"] });
    await client.fetchQuery({ queryKey: ["public-vocabulary-catalog"], queryFn: api.publicWords });
    setRefreshing(false);
  };

  const play = (wordId: string) => {
    audioRef.current?.pause();
    const audio = new Audio(`/api/v1/speech/words/${wordId}/audio?fresh=${Date.now()}`);
    audioRef.current = audio;
    setPlayingId(wordId);
    setAudioError("");
    audio.addEventListener("ended", () => setPlayingId(null), { once: true });
    audio.addEventListener("error", () => {
      setPlayingId(null);
      setAudioError("Для цього слова аудіо поки недоступне.");
    }, { once: true });
    void audio.play().catch(() => {
      setPlayingId(null);
      setAudioError("Браузер не дозволив відтворити аудіо.");
    });
  };

  const markForRegeneration = async (wordId: string, requested: boolean) => {
    setSavingIds((current) => new Set(current).add(wordId));
    try {
      const updated = await api.setAudioRegenerationRequested(wordId, requested);
      client.setQueryData(["public-vocabulary-catalog"], (current: typeof query.data) =>
        current?.map((word) => word.id === wordId ? updated : word),
      );
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(wordId);
        return next;
      });
    }
  };

  return <div className="vocabulary-catalog shell">
    <header className="catalog-heading">
      <div className="catalog-title"><span className="luxury-kicker"><i /> DIZIONARIO A0–A1</span><h1>Усі <em>слова.</em></h1><p>Ваш італійсько-український словник із живою вимовою.</p></div>
      <div className="catalog-metrics">
        <div className="catalog-count"><strong>{query.data?.length ?? "—"}</strong><span>слів у каталозі</span></div>
        <div className={`catalog-flag-count ${flaggedCount ? "active" : ""}`}><strong>{flaggedCount}</strong><span>чекають на нове аудіо</span></div>
        <div className="catalog-flag-stripe" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </header>
    <section className="catalog-toolbar">
      <label><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca · дзеркало або specchio" autoComplete="off" /></label>
      <button onClick={() => void refresh()} disabled={refreshing}><i>↻</i>{refreshing ? "Оновлюємо…" : "Оновити каталог"}</button>
    </section>
    <div className="catalog-summary"><span><i /> Показано <b>{words.length}</b> із {query.data?.length ?? 0}{audioError && <em>{audioError}</em>}</span>{search && <button onClick={() => setSearch("")}>Очистити пошук ×</button>}</div>
    {query.isPending && <div className="catalog-state">Завантажуємо словник…</div>}
    {query.isError && <div className="catalog-state error">Не вдалося завантажити слова.</div>}
    {!query.isPending && !words.length && <div className="catalog-state">За цим запитом слів не знайдено.</div>}
    {!!words.length && <div className="catalog-table" role="table" aria-label="Італійсько-український словник">
      <div className="catalog-row catalog-table-head" role="row"><span>Italiano</span><span>Українська</span><span>Тема</span><span>Рівень</span><span>Аудіо</span><span>Перегенерувати</span></div>
      {words.map((word) => <article className={`catalog-row ${word.audio_regeneration_requested ? "flagged" : ""}`} role="row" key={word.id}><strong>{word.italian_text}</strong><span>{word.ukrainian_text}</span><small>{presentationFor(word.category).title}</small><b>{word.cefr_level}</b><button className={playingId === word.id ? "playing" : ""} onClick={() => play(word.id)} aria-label={`Прослухати ${word.italian_text}`}>{playingId === word.id ? "◼" : "♪"}</button><label className="regeneration-check"><input type="checkbox" checked={word.audio_regeneration_requested} disabled={savingIds.has(word.id)} onChange={(event) => void markForRegeneration(word.id, event.target.checked)} aria-label={`Позначити ${word.italian_text} для перегенерації`} /><i>✓</i></label></article>)}
    </div>}
  </div>;
}
