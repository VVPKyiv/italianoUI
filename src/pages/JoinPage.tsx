import { useMutation } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { loadInvitation, rememberInvitation, saveSharedRoom } from "../features/multiplayer/roomStorage";

function normalizedCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

export function JoinPage() {
  const navigate = useNavigate();
  const queryCode = normalizedCode(new URLSearchParams(window.location.search).get("code") ?? "");
  const [code, setCode] = useState(queryCode || loadInvitation());
  const hasInvitation = code.length === 6;

  useEffect(() => {
    if (queryCode.length === 6) rememberInvitation(queryCode);
  }, [queryCode]);

  const join = useMutation({
    mutationFn: api.joinSharedCardRoom,
    onSuccess: (room) => {
      saveSharedRoom(room);
      navigate(`/together?code=${room.code}`);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (hasInvitation) join.mutate(code);
  };

  return <div className="join-portal shell">
    <header className="join-hero">
      <span className="luxury-kicker"><i /> BENVENUTO</span>
      <h1>Як хочеш <em>продовжити?</em></h1>
      <p>{queryCode ? "QR-код відкрив постійну кімнату. Можна грати разом або вибрати будь-яке самостійне тренування." : "Відкрий будь-яке тренування самостійно або введи код постійної кімнати."}</p>
      {hasInvitation && <div className="join-invite-chip"><span>ЗАПРОШЕННЯ</span><strong>{code}</strong><i>готове</i></div>}
    </header>

    <section className="join-choice-grid">
      <Link className="join-choice solo" to="/">
        <small>MODALITÀ PERSONALE</small>
        <span className="join-choice-icon">A</span>
        <h2>Вчитися самостійно</h2>
        <p>Відкрий усі звичайні тренування: вимову, кросворди, читання, речення та словник.</p>
        <b>До тренувань <i>→</i></b>
      </Link>

      <form className="join-choice together" onSubmit={submit}>
        <small>MODALITÀ INSIEME</small>
        <span className="join-choice-icon"><i>1</i><i>2</i></span>
        <h2>Грати разом</h2>
        <p>Використай код із QR-запрошення або введи інший код кімнати.</p>
        <label><span>Код кімнати</span><input value={code} onChange={(event) => setCode(normalizedCode(event.target.value))} placeholder="ROMA27" autoCapitalize="characters" maxLength={6} /></label>
        <button disabled={!hasInvitation || join.isPending}><span>{join.isPending ? "Підключаємо…" : "Увійти в гру"}</span><i>→</i></button>
      </form>
    </section>

    {join.isError && <p className="shared-game-error">{join.error.message}</p>}
    <footer className="join-footnote"><i>i</i><p>Запрошення залишиться на цьому пристрої. Можна спочатку потренуватися самому, а потім відкрити «Мультиплеєр» і повернутися до гри.</p></footer>
  </div>;
}
