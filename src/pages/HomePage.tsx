import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function HomePage() {
  const [count, setCount] = useState(10);
  const navigate = useNavigate();
  const create = useMutation({ mutationFn: () => api.createSession(count), onSuccess: (session) => navigate(`/training/${session.id}`) });

  return <div className="home shell"><section className="hero"><div className="hero-copy"><span className="eyebrow">ГОЛОСОВІ ТРЕНУВАННЯ · ITALIANO</span><h1>Слово побачив.<br /><em>Вимовив.</em> Запам’ятав.</h1><p>Короткі десятисекундні картки допомагають перевести італійські слова з пасивного словника в живу мову.</p><div className="training-config"><span>Слів у тренуванні</span><div className="segment">{[5, 10, 20].map((value) => <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}</div><button className="primary" disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Створюємо сесію…" : "Почати тренування"}<span>→</span></button>{create.error && <p className="error">{create.error.message}</p>}</div></div><div className="hero-art"><div className="orbit"><span className="bubble uk">місто</span><i className="mic">●</i><span className="bubble it">città</span></div><div className="sound-lines">⌁ ⌁ ⌁</div></div></section><section className="how"><div><span>01</span><h3>Дивишся</h3><p>Українське слово з’являється на картці.</p></div><div><span>02</span><h3>Говориш</h3><p>Вимовляєш переклад італійською.</p></div><div><span>03</span><h3>Закріплюєш</h3><p>Отримуєш реальний результат після сесії.</p></div></section><section className="privacy-note"><b>Локальне розпізнавання</b><p>Аудіо обробляється вашим власним сервером Whisper і не надсилається стороннім платним сервісам.</p></section></div>;
}
