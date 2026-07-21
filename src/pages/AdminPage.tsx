import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "../api/client";

export function AdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem("italiano-admin-key") ?? "");
  const [draftKey, setDraftKey] = useState(key);
  const [ukrainian, setUkrainian] = useState("");
  const [italian, setItalian] = useState("");
  const [answers, setAnswers] = useState("");
  const [bulk, setBulk] = useState('[\n  { "ukrainian_text": "кава", "italian_text": "caffè", "accepted_answers": ["il caffè"] }\n]');
  const [bulkMessage, setBulkMessage] = useState("");
  const client = useQueryClient();
  const words = useQuery({ queryKey: ["words", key], queryFn: () => api.words(key), enabled: Boolean(key), retry: false });
  const refresh = () => client.invalidateQueries({ queryKey: ["words", key] });
  const create = useMutation({ mutationFn: () => api.createWord(key, { ukrainian_text: ukrainian, italian_text: italian, accepted_answers: answers.split(",").map((v) => v.trim()).filter(Boolean) }), onSuccess: () => { setUkrainian(""); setItalian(""); setAnswers(""); void refresh(); } });
  const deactivate = useMutation({ mutationFn: (id: string) => api.patchWord(key, id, { is_active: false }), onSuccess: refresh });
  const activate = useMutation({ mutationFn: (id: string) => api.patchWord(key, id, { is_active: true }), onSuccess: refresh });

  const unlock = (event: FormEvent) => { event.preventDefault(); sessionStorage.setItem("italiano-admin-key", draftKey); setKey(draftKey); };
  const importBulk = async () => {
    try { const parsed = JSON.parse(bulk); if (!Array.isArray(parsed)) throw new Error("Очікується JSON-масив"); await api.bulkWords(key, parsed); setBulkMessage("Імпорт завершено. Перевір список нижче."); void refresh(); }
    catch (error) { setBulkMessage(error instanceof Error ? error.message : "Некоректний JSON"); }
  };

  if (!key) return <div className="admin-lock shell"><span className="lock-icon">⌁</span><span className="eyebrow">КЕРУВАННЯ КОНТЕНТОМ</span><h1>Адміністративний доступ</h1><p>Ключ зберігається лише у sessionStorage цієї вкладки.</p><form onSubmit={unlock}><input type="password" value={draftKey} onChange={(e) => setDraftKey(e.target.value)} placeholder="X-Admin-Api-Key" autoFocus /><button className="primary">Увійти</button></form></div>;

  return <div className="admin shell"><div className="admin-title"><div><span className="eyebrow">КЕРУВАННЯ КОНТЕНТОМ</span><h1>Словник</h1><p>Тут знаходяться реальні слова, з яких backend формує тренування.</p></div><button className="ghost danger" onClick={() => { sessionStorage.removeItem("italiano-admin-key"); setKey(""); }}>Вийти</button></div>{words.error && <div className="notice error">{words.error.message}</div>}<div className="admin-grid"><section className="admin-panel"><h2>Додати слово</h2><form className="word-form" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><label>Українською<input required value={ukrainian} onChange={(e) => setUkrainian(e.target.value)} placeholder="місто" /></label><label>Італійською<input required value={italian} onChange={(e) => setItalian(e.target.value)} placeholder="città" /></label><label>Допустимі варіанти<input value={answers} onChange={(e) => setAnswers(e.target.value)} placeholder="la città, una città" /><small>Через кому</small></label><button className="primary" disabled={create.isPending}>Зберегти слово</button>{create.error && <p className="error">{create.error.message}</p>}</form></section><section className="admin-panel"><h2>Bulk import</h2><textarea value={bulk} onChange={(e) => setBulk(e.target.value)} spellCheck={false} /><button className="secondary" onClick={importBulk}>Імпортувати JSON</button>{bulkMessage && <p className="form-message">{bulkMessage}</p>}</section></div><section className="word-table"><div className="table-head"><h2>Усі слова</h2><span>{words.data?.length ?? 0} записів</span></div>{words.isLoading ? <div className="table-empty">Завантаження…</div> : words.data?.map((word) => <article key={word.id} className={!word.is_active ? "inactive" : ""}><div><b>{word.ukrainian_text}</b><span>{word.italian_text}</span></div><p>{word.accepted_answers.join(" · ")}</p><span className={`status ${word.is_active ? "on" : "off"}`}>{word.is_active ? "Активне" : "Вимкнене"}</span><button className="table-action" onClick={() => word.is_active ? deactivate.mutate(word.id) : activate.mutate(word.id)}>{word.is_active ? "Деактивувати" : "Активувати"}</button></article>)}</section></div>;
}
