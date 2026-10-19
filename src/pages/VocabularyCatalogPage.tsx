import { PageHeading } from "../components/PageHeading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

export function VocabularyCatalogPage() {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("italiano-admin-key") ?? "");
  const [draftAdminKey, setDraftAdminKey] = useState(adminKey);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationMessage, setRegenerationMessage] = useState("");
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

  const regenerateRequested = async (key = adminKey) => {
    if (!flaggedCount || regenerating) return;
    if (!key) {
      setShowAdminKey(true);
      setRegenerationMessage("Для генерації потрібен локальний admin API key.");
      return;
    }
    setRegenerating(true);
    setRegenerationMessage(`Генеруємо аудіо для ${flaggedCount} ${flaggedCount === 1 ? "слова" : "слів"}…`);
    try {
      const generated = await api.regenerateRequestedAudio(key);
      setRegenerationMessage(`Готово: оновлено ${generated.length} ${generated.length === 1 ? "слово" : "слів"}.`);
      setShowAdminKey(false);
      await client.invalidateQueries({ queryKey: ["public-vocabulary-catalog"] });
    } catch (error) {
      setRegenerationMessage(error instanceof Error ? error.message : "Не вдалося перегенерувати аудіо.");
    } finally {
      setRegenerating(false);
    }
  };

  const unlockAndRegenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draftAdminKey.trim();
    if (!value) return;
    sessionStorage.setItem("italiano-admin-key", value);
    setAdminKey(value);
    void regenerateRequested(value);
  };

  return <div className="vocabulary-catalog shell">
    <PageHeading title="Словник" description="Італійські слова, переклад і вимова." aside={
      <div className="summary-panel">
        <div><span>Слів у словнику</span><strong>{query.data?.length ?? "—"}</strong></div>
        <div><span>Аудіо до оновлення</span><strong>{flaggedCount}</strong></div>
      </div>
    } />
    <section className="catalog-toolbar">
      <label><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Пошук у словнику" placeholder="Знайти слово: дзеркало або specchio" autoComplete="off" /></label>
      <button className="catalog-refresh-button" onClick={() => void refresh()} disabled={refreshing}><i>↻</i>{refreshing ? "Оновлюємо…" : "Оновити"}</button>
      <button className="catalog-regenerate-button" onClick={() => void regenerateRequested()} disabled={!flaggedCount || regenerating}><i>◈</i>{regenerating ? "Генеруємо…" : `Оновити аудіо (${flaggedCount})`}</button>
    </section>
    {showAdminKey && <form className="catalog-admin-key" onSubmit={unlockAndRegenerate}>
      <label htmlFor="catalog-admin-key">Admin API key</label>
      <input id="catalog-admin-key" type="password" value={draftAdminKey} onChange={(event) => setDraftAdminKey(event.target.value)} autoComplete="current-password" autoFocus />
      <button type="submit" disabled={!draftAdminKey.trim()}>Запустити генерацію</button>
    </form>}
    {regenerationMessage && <div className={`catalog-regeneration-status ${regenerationMessage.startsWith("Готово") ? "success" : ""}`}>{regenerationMessage}</div>}
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
