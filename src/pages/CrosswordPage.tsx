import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { CrosswordCell, CrosswordClue } from "../types";

const cellKey = (cell: Pick<CrosswordCell, "row" | "column">) => `${cell.row}:${cell.column}`;

export function CrosswordPage() {
  const { sessionId = "" } = useParams();
  const queryClient = useQueryClient();
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const resultBlock = useRef<HTMLElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [correctCells, setCorrectCells] = useState(new Set<string>());
  const [incorrectCells, setIncorrectCells] = useState(new Set<string>());
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Заповніть слова й натисніть «Перевірити».");
  const session = useQuery({
    queryKey: ["crossword-session", sessionId],
    queryFn: () => api.getCrosswordSession(sessionId),
  });
  const result = useQuery({
    queryKey: ["crossword-result", sessionId],
    queryFn: () => api.crosswordResult(sessionId),
    enabled: session.data?.status === "completed",
  });

  useEffect(() => {
    if (!session.data) return;
    setValues((current) => {
      const restored = Object.fromEntries(
        session.data.cells.filter((cell) => cell.value).map((cell) => [cellKey(cell), cell.value]),
      );
      return session.data.status === "completed" ? restored : { ...restored, ...current };
    });
    setActiveEntry((current) => current ?? session.data.clues.find((clue) => clue.status === "open")?.id ?? null);
  }, [session.data]);

  useEffect(() => () => audio.current?.pause(), []);

  useEffect(() => {
    if (session.data?.status !== "completed") return;
    window.requestAnimationFrame(() => resultBlock.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [session.data?.status]);

  const check = useMutation({
    mutationFn: () => api.checkCrossword(sessionId, values),
    onSuccess: async (result) => {
      setCorrectCells(new Set(result.correct_cells));
      setIncorrectCells(new Set(result.incorrect_cells));
      setFeedback(result.feedback_uk);
      await queryClient.invalidateQueries({ queryKey: ["crossword-session", sessionId] });
    },
    onError: (error) => setFeedback(error.message),
  });
  const finish = useMutation({
    mutationFn: () => api.finishCrossword(sessionId),
    onSuccess: async (finishedSession) => {
      queryClient.setQueryData(["crossword-session", sessionId], finishedSession);
      setIncorrectCells(new Set());
      setFeedback("Кросворд завершено. Нижче відкрито правильні відповіді та результат.");
      await queryClient.invalidateQueries({ queryKey: ["crossword-result", sessionId] });
    },
    onError: (error) => setFeedback(error.message),
  });

  const data = session.data;
  const activeClue = data?.clues.find((clue) => clue.id === activeEntry) ?? null;

  const entryCells = (entryId: string): CrosswordCell[] => {
    const clue = data?.clues.find((item) => item.id === entryId);
    if (!data || !clue) return [];
    return data.cells
      .filter((cell) => cell.entry_ids.includes(entryId))
      .sort((left, right) => clue.direction === "across"
        ? left.column - right.column
        : left.row - right.row);
  };

  const selectEntry = (clue: CrosswordClue) => {
    setActiveEntry(clue.id);
    const target = entryCells(clue.id).find((cell) => !values[cellKey(cell)]) ?? entryCells(clue.id)[0];
    if (target) window.requestAnimationFrame(() => inputs.current.get(cellKey(target))?.focus());
  };

  const selectCell = (cell: CrosswordCell) => {
    if (!cell.entry_ids.includes(activeEntry ?? "")) setActiveEntry(cell.entry_ids[0] ?? null);
  };

  const move = (entryId: string | null, key: string, offset: number) => {
    if (!entryId) return;
    const sequence = entryCells(entryId);
    const index = sequence.findIndex((cell) => cellKey(cell) === key);
    const target = sequence[index + offset];
    if (target) inputs.current.get(cellKey(target))?.focus();
  };

  const updateCell = (cell: CrosswordCell, raw: string) => {
    const key = cellKey(cell);
    const letter = [...raw.normalize("NFC")].find((character) => /\p{L}/u.test(character)) ?? "";
    setValues((current) => ({ ...current, [key]: letter.toLocaleLowerCase("it") }));
    setIncorrectCells((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    if (letter) move(activeEntry ?? cell.entry_ids[0] ?? null, key, 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, cell: CrosswordCell) => {
    const key = cellKey(cell);
    if (event.key === "Backspace" && !values[key]) {
      event.preventDefault();
      move(activeEntry ?? cell.entry_ids[0] ?? null, key, -1);
    }
    const delta = event.key === "ArrowLeft" ? [0, -1]
      : event.key === "ArrowRight" ? [0, 1]
        : event.key === "ArrowUp" ? [-1, 0]
          : event.key === "ArrowDown" ? [1, 0] : null;
    if (delta) {
      event.preventDefault();
      inputs.current.get(`${cell.row + delta[0]}:${cell.column + delta[1]}`)?.focus();
    }
  };

  const playWord = (entryId: string, audioUrl: string) => {
    audio.current?.pause();
    const player = new Audio(audioUrl);
    audio.current = player;
    setPlayingWord(entryId);
    player.onended = () => setPlayingWord(null);
    player.onerror = () => {
      setPlayingWord(null);
      setFeedback("Не вдалося відтворити озвучення слова.");
    };
    void player.play().catch(() => setPlayingWord(null));
  };

  if (session.isPending) return <div className="crossword-state shell">Будуємо кросворд…</div>;
  if (!data || session.isError) return <div className="crossword-state shell">Не вдалося відкрити кросворд. <Link to="/training/setup/crossword">Повернутися</Link></div>;

  const style = { "--crossword-columns": data.width, "--crossword-rows": data.height } as CSSProperties;
  const directions = (["across", "down"] as const);
  return (
    <div className="crossword-page shell">
      <header className="crossword-head">
        <Link to="/training/setup/crossword">← Вийти</Link>
        <div><small>PAROLE INCROCIATE</small><h1>Кросворд <em>italiano.</em></h1></div>
        <div className="crossword-score"><strong>{data.solved_count}/{data.total_words}</strong><span>слів розгадано</span></div>
      </header>
      <div className="crossword-progress"><i style={{ width: `${data.solved_count / data.total_words * 100}%` }} /></div>

      <div className="crossword-workspace">
        <section className="crossword-board-panel" aria-label="Сітка кросворду">
          <div className="crossword-board-scroll">
            <div className="crossword-board" style={style}>
              {data.cells.map((cell) => {
                const key = cellKey(cell);
                const active = cell.entry_ids.includes(activeEntry ?? "");
                const solved = cell.entry_ids.some((id) => data.clues.find((clue) => clue.id === id)?.status === "solved");
                return <label
                  key={key}
                  className={`crossword-cell ${active ? "active" : ""} ${correctCells.has(key) || solved ? "correct" : ""} ${data.status === "completed" && !solved ? "revealed" : ""} ${incorrectCells.has(key) ? "incorrect" : ""}`}
                  style={{ gridRow: cell.row + 1, gridColumn: cell.column + 1 }}
                >
                  {cell.number && <small>{cell.number}</small>}
                  <input
                    ref={(node) => { if (node) inputs.current.set(key, node); else inputs.current.delete(key); }}
                    aria-label={`Клітинка ${cell.row + 1}, ${cell.column + 1}`}
                    autoCapitalize="none"
                    autoComplete="off"
                    disabled={solved || data.status === "completed"}
                    inputMode="text"
                    maxLength={2}
                    spellCheck={false}
                    value={values[key] ?? ""}
                    onChange={(event) => updateCell(cell, event.target.value)}
                    onFocus={() => selectCell(cell)}
                    onKeyDown={(event) => onKeyDown(event, cell)}
                  />
                </label>;
              })}
            </div>
          </div>
          <footer className="crossword-board-footer">
            <div className="crossword-board-context">
              <span>{activeClue ? <><b>{activeClue.number}.</b> {activeClue.clue_uk} <small>· {activeClue.length} літер</small></> : "Оберіть підказку"}</span>
              <small>Акценти можна не вводити · {data.attempts_count} перевірок слів</small>
            </div>
            <p className={incorrectCells.size ? "has-errors" : ""} aria-live="polite"><i>{incorrectCells.size ? "!" : data.status === "completed" ? "✓" : "i"}</i><span>{feedback}</span></p>
            {data.status === "completed"
              ? <Link className="launch-button" to="/training/setup/crossword"><span>Новий кросворд</span><b>→</b></Link>
              : <div className="crossword-action-buttons">
                  <button className="crossword-finish" disabled={finish.isPending || check.isPending} onClick={() => {
                    if (window.confirm(`Завершити кросворд? Розгадано ${data.solved_count} із ${data.total_words} слів.`)) finish.mutate();
                  }}>{finish.isPending ? "Завершуємо…" : "Завершити"}</button>
                  <button className="launch-button" disabled={check.isPending || finish.isPending || !Object.values(values).some(Boolean)} onClick={() => check.mutate()}><span>{check.isPending ? "Перевіряємо…" : "Перевірити"}</span><b>✓</b></button>
                </div>}
          </footer>
        </section>

        <aside className="crossword-clues">
          {directions.map((direction) => <section key={direction}>
            <header><small>{direction === "across" ? "ORIZZONTALE" : "VERTICALE"}</small><h2>{direction === "across" ? "По горизонталі" : "По вертикалі"}</h2></header>
            <div>{data.clues.filter((clue) => clue.direction === direction).map((clue) => {
              const revealed = clue.status === "solved" || data.status === "completed";
              return <button
                key={clue.id}
                className={`${activeEntry === clue.id ? "active" : ""} ${clue.status === "solved" ? "solved" : ""} ${revealed ? "revealed" : ""}`}
                onClick={() => revealed ? playWord(clue.id, clue.audio_url) : selectEntry(clue)}
              >
                <b>{clue.number}</b>
                <span><strong>{clue.clue_uk}</strong>{revealed ? <small className="crossword-clue-answer">{clue.italian_text}<em>· {clue.length} літер</em></small> : <small>{clue.length} літер</small>}</span>
                <i>{revealed ? (playingWord === clue.id ? "◼" : "♪") : "→"}</i>
              </button>;
            })}</div>
          </section>)}
        </aside>
      </div>

      {data.status === "completed" && <section className="crossword-inline-result" ref={resultBlock}>
        {result.isPending && <p>Підраховуємо результат…</p>}
        {result.data && <>
          <header>
            <div><small>RISULTATO FINALE</small><h2>Сесію <em>завершено.</em></h2><p>Сітку заповнено правильними відповідями. Натисніть на динамік біля слова, щоб почути італійську вимову.</p></div>
            <strong>{result.data.accuracy}%<small>точність</small></strong>
          </header>
          <div className="crossword-result-stats"><div><b>{result.data.solved_words}/{result.data.total_words}</b><span>розгадано</span></div><div><b>{result.data.attempts}</b><span>перевірок</span></div><div><b>{result.data.mistakes}</b><span>помилок</span></div><div><b>{result.data.duration_seconds} с</b><span>час</span></div></div>
        </>}
      </section>}
    </div>
  );
}
