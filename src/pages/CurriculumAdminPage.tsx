import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { CurriculumRevision, CurriculumUnit } from "../types";

export function CurriculumAdminPage() {
  const client = useQueryClient();
  const [key, setKey] = useState(() => sessionStorage.getItem("italiano-admin-key") ?? "");
  const [draftKey, setDraftKey] = useState(key);
  const [selected, setSelected] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [position, setPosition] = useState(0);
  const [version, setVersion] = useState(0);
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [available, setAvailable] = useState(true);
  const [intervals, setIntervals] = useState("1, 7, 30");
  const [body, setBody] = useState('{\n  "steps": [],\n  "review_steps": []\n}');
  const [message, setMessage] = useState("");
  const [materialPrompt, setMaterialPrompt] = useState("");
  const [materialText, setMaterialText] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [unit, setUnit] = useState<CurriculumUnit>({ id: "", title: "", level: "", position: 0, is_active: true });
  const catalog = useQuery({ queryKey: ["curriculum-admin", key], queryFn: () => api.curriculumAdmin(key), enabled: Boolean(key), retry: false });
  const refresh = () => { void client.invalidateQueries({ queryKey: ["curriculum-admin"] }); void client.invalidateQueries({ queryKey: ["curriculum"] }); };
  const load = (revision: CurriculumRevision) => {
    const value = revision.definition;
    setSelected(value.id); setLessonId(value.id); setUnitId(revision.unit_id); setPosition(revision.position);
    setVersion(value.version); setPublished(Boolean(revision.published_at)); setTitle(value.title); setGoal(value.goal);
    setPrerequisites(value.prerequisites.join("\n")); setAvailable(value.available);
    setIntervals(value.review_intervals_days.join(", "));
    setBody(JSON.stringify({ objectives: value.objectives ?? [], steps: value.steps, review_steps: value.review_steps }, null, 2)); setMessage("");
    setSavedFingerprint(JSON.stringify([revision.unit_id, revision.position, value.title, value.goal, value.prerequisites.join("\n"), value.available, JSON.stringify({ objectives: value.objectives ?? [], steps: value.steps, review_steps: value.review_steps }, null, 2), value.review_intervals_days.join(", ")]));
  };
  const reset = () => {
    setSelected(""); setLessonId(""); setVersion(0); setPublished(false); setTitle(""); setGoal(""); setPrerequisites("");
    setUnitId(catalog.data?.units[0]?.id ?? ""); setPosition(catalog.data?.lessons.length ?? 0); setAvailable(true);
    setIntervals("1, 7, 30");
    setBody('{\n  "steps": [],\n  "review_steps": []\n}'); setMessage("");
  };
  const saveUnit = useMutation({ mutationFn: () => api.saveCurriculumUnit(key, unit), onSuccess: () => { refresh(); setMessage("Блок збережено."); } });
  const save = useMutation({
    mutationFn: () => {
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed.steps) || !Array.isArray(parsed.review_steps)) throw new Error("Потрібні масиви steps і review_steps.");
      return api.saveCurriculumDraft(key, lessonId, unitId, position, version, {
        id: lessonId, version, title, goal, prerequisites: prerequisites.split("\n").map((item) => item.trim()).filter(Boolean),
        available, objectives: parsed.objectives ?? [], steps: parsed.steps, review_steps: parsed.review_steps, review_intervals_days: intervals.split(",").map((item) => Number(item.trim())),
      });
    },
    onSuccess: (revision) => { load(revision); refresh(); setMessage(`Чернетку версії ${revision.definition.version} збережено. Учні її ще не бачать.`); },
  });
  const publish = useMutation({ mutationFn: () => api.publishCurriculum(key, selected, version), onSuccess: (revision) => { load(revision); refresh(); setMessage("Версію опубліковано. Нові сесії використовуватимуть її."); } });
  const material = useMutation({ mutationFn: () => api.createCurriculumMaterial(key, materialPrompt, materialText), onSuccess: (value) => { setMaterialId(value.id); setMessage(`Матеріал створено. ID для audio_exercise_id: ${value.id}`); } });
  const materialAudio = useMutation({ mutationFn: () => api.generateCurriculumMaterialAudio(key, materialId), onSuccess: (value) => setMessage(`Аудіо готове: ${value.duration_seconds.toFixed(2)} с. Матеріал можна додати до уроку.`) });
  const dirty = savedFingerprint !== JSON.stringify([unitId, position, title, goal, prerequisites, available, body, intervals]);
  const busy = save.isPending || publish.isPending || saveUnit.isPending || material.isPending || materialAudio.isPending;
  const error = catalog.error ?? save.error ?? publish.error ?? saveUnit.error ?? material.error ?? materialAudio.error;
  if (!key) return <div className="admin-lock shell"><h1>Керування навчанням</h1><form onSubmit={(event) => { event.preventDefault(); sessionStorage.setItem("italiano-admin-key", draftKey); setKey(draftKey); }}><input type="password" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="X-Admin-Api-Key" /><button className="primary">Увійти</button></form></div>;
  return <div className="admin shell curriculum-editor">
    <div className="admin-title"><div><h1>Навчальні блоки та уроки</h1><p>Зберігайте чернетки та публікуйте перевірений матеріал. Розпочаті сесії залишаються на своїй версії.</p><Link to="/admin/words">Керування словником →</Link></div><button className="ghost" onClick={() => { sessionStorage.removeItem("italiano-admin-key"); setKey(""); }}>Вийти</button></div>
    {error && <p role="alert" className="mixed-error">{error.message}</p>}{message && <p role="status">{message}</p>}
    <section className="admin-panel"><h2>Блоки</h2><div className="curriculum-unit-list">{catalog.data?.units.map((item) => <button key={item.id} className="secondary" onClick={() => setUnit(item)}>{item.title} · {item.level}</button>)}</div>
      <form className="word-form" onSubmit={(event) => { event.preventDefault(); saveUnit.mutate(); }}>
        <label>ID блоку<input required pattern="[a-z0-9][a-z0-9-]*" maxLength={100} value={unit.id} onChange={(event) => setUnit({ ...unit, id: event.target.value })} /></label>
        <label>Назва<input required value={unit.title} onChange={(event) => setUnit({ ...unit, title: event.target.value })} /></label>
        <label>Рівень<input required value={unit.level} onChange={(event) => setUnit({ ...unit, level: event.target.value })} /></label>
        <label>Порядок<input type="number" min={0} value={unit.position} onChange={(event) => setUnit({ ...unit, position: Number(event.target.value) })} /></label>
        <label><input type="checkbox" checked={unit.is_active} onChange={(event) => setUnit({ ...unit, is_active: event.target.checked })} /> Показувати учням</label>
        <button className="primary" disabled={busy}>Зберегти блок</button>
      </form>
    </section>
    <section className="admin-panel"><h2>Уроки</h2><div className="curriculum-unit-list">{catalog.data?.lessons.map((item) => <button className="secondary" key={item.definition.id} disabled={busy} onClick={() => load(item)}>{item.definition.title} · v{item.definition.version} · {item.published_at ? "опубліковано" : "чернетка"}</button>)}<button className="primary" disabled={busy} onClick={reset}>Новий урок</button></div>
      <form className="word-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <label>ID уроку<input required disabled={Boolean(selected)} maxLength={100} value={lessonId} onChange={(event) => setLessonId(event.target.value)} /></label>
        <label>Блок<select required value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Оберіть блок</option>{catalog.data?.units.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Порядок<input type="number" min={0} value={position} onChange={(event) => setPosition(Number(event.target.value))} /></label>
        <label>Назва<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Навчальна мета<input required value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
        <label>Повторення через кількість днів (через кому)<input required value={intervals} onChange={(event) => setIntervals(event.target.value)} /></label>
        <label>Передумови: ID уроків, кожен з нового рядка<textarea value={prerequisites} onChange={(event) => setPrerequisites(event.target.value)} /></label>
        <label><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /> Доступний після публікації</label>
        <label>Кроки та повторення (JSON)<textarea className="curriculum-json" value={body} spellCheck={false} onChange={(event) => setBody(event.target.value)} /></label>
        <p>Типи: explain, choose, build, produce, listen, read. Для read додайте reading_text; для listen — audio_exercise_id та audio_transcript. objectives задає ID, label, constructions, skills (listening, speaking, writing, reading) та vocabulary_intent (receptive, productive, both). Кожне завдання посилається на цілі через objective_ids. Заявлені навички перевіряються під час публікації.</p>
        <button className="primary" disabled={busy}>{save.isPending ? "Зберігаємо…" : "Зберегти нову чернетку"}</button>
      </form>
      {selected && <><button className="secondary" disabled={busy || published || dirty} onClick={() => publish.mutate()}>{published ? `Версія ${version} опублікована` : `Перевірити й опублікувати версію ${version}`}</button>{dirty && <p>Збережіть зміни як нову чернетку перед публікацією.</p>}</>}
    </section>
    <section className="admin-panel"><h2>Аудіорепліка</h2><p>Створіть новий матеріал, згенеруйте аудіо та використайте його ID у кроці або діалозі.</p>
      <form className="word-form" onSubmit={(event) => { event.preventDefault(); material.mutate(); }}><label>Українською<input required value={materialPrompt} onChange={(event) => setMaterialPrompt(event.target.value)} /></label><label>Італійською<input required value={materialText} onChange={(event) => setMaterialText(event.target.value)} /></label><button className="primary" disabled={busy}>Створити матеріал</button></form>
      {materialId && <><p>ID: <code>{materialId}</code></p><button className="secondary" disabled={busy} onClick={() => materialAudio.mutate()}>{materialAudio.isPending ? "Генеруємо аудіо…" : "Згенерувати аудіо"}</button></>}
    </section>
  </div>;
}
