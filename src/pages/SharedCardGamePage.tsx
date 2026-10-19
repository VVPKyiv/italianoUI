import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, getActiveProfileId, getClientId } from "../api/client";
import { clearSharedRoom, loadSharedRoom, saveSharedRoom, sharedRoomInvitationUrl } from "../features/multiplayer/roomStorage";
import type { SharedCardRoom } from "../types";

type ConnectionState = "connecting" | "online" | "offline";

function socketUrl(roomId: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const profile = encodeURIComponent(getActiveProfileId());
  const client = encodeURIComponent(getClientId());
  return `${protocol}//${window.location.host}/api/v1/multiplayer/rooms/${roomId}/ws?profile_id=${profile}&client_id=${client}`;
}

export function SharedCardGamePage() {
  const initialCode = new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? "";
  const [room, setRoom] = useState<SharedCardRoom | null>(null);
  const [restoring, setRestoring] = useState(() => Boolean(initialCode && loadSharedRoom()?.code === initialCode));
  const [connection, setConnection] = useState<ConnectionState>("offline");
  const [playing, setPlaying] = useState(false);
  const reconnectTimer = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const enterRoom = (value: SharedCardRoom) => {
    setRoom(value);
    saveSharedRoom(value);
    window.history.replaceState(null, "", `/together?code=${value.code}`);
  };

  const create = useMutation({ mutationFn: api.createSharedCardRoom, onSuccess: enterRoom });
  const reveal = useMutation({
    mutationFn: () => api.revealSharedCard(room!.id),
    onSuccess: setRoom,
  });
  const next = useMutation({
    mutationFn: () => api.nextSharedCard(room!.id),
    onSuccess: setRoom,
  });

  useEffect(() => {
    const stored = loadSharedRoom();
    if (!stored || !initialCode) return;
    if (stored.code !== initialCode) return;
    let cancelled = false;
    void api.getSharedCardRoom(stored.id).then((value) => { if (!cancelled) enterRoom(value); })
      .catch(() => { if (!cancelled) clearSharedRoom(); })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!room?.id) return;
    let disposed = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (disposed) return;
      setConnection("connecting");
      socket = new WebSocket(socketUrl(room.id));
      socket.onopen = () => setConnection("online");
      socket.onmessage = (event) => {
        const synchronized = JSON.parse(event.data) as SharedCardRoom;
        setRoom((current) => current
          ? { ...synchronized, is_player: current.is_player }
          : synchronized);
      };
      socket.onclose = () => {
        setConnection("offline");
        if (!disposed) reconnectTimer.current = window.setTimeout(connect, 1500);
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => {
      disposed = true;
      if (reconnectTimer.current !== null) window.clearTimeout(reconnectTimer.current);
      socket?.close();
    };
  }, [room?.id]);

  useEffect(() => () => audio.current?.pause(), []);

  const play = () => {
    if (!room) return;
    audio.current?.pause();
    const player = new Audio(room.card.audio_url);
    audio.current = player;
    setPlaying(true);
    player.onended = () => setPlaying(false);
    player.onerror = () => setPlaying(false);
    void player.play().catch(() => setPlaying(false));
  };

  const pending = create.isPending;
  const error = create.error ?? reveal.error ?? next.error;

  if (restoring && !room) return <div className="shared-game-page shell"><p role="status">Відкриваємо кімнату…</p></div>;

  if (!room) return <div className="shared-game-page shell">
    <header className="shared-game-heading"><Link to="/multiplayer">← Тренування разом</Link><span className="luxury-kicker"><i /> GIOCO PER DUE</span><h1>Одна картка. <em>Два гравці.</em></h1><p>Створи кімнату й запроси двох гравців за кодом.</p></header>
    <section className="shared-game-lobby">
      <article><small>CREA UNA STANZA</small><h2>Створити кімнату</h2><p>Цей пристрій показує картки. Два гравці приєднуються з телефонів.</p><button className="launch-button" disabled={pending} onClick={() => create.mutate()}><span>{create.isPending ? "Створюємо…" : "Створити кімнату"}</span><b>→</b></button></article>
      <article className="shared-join-link"><small>HAI UN INVITO?</small><h2>Ти гравець?</h2><p>Введи код кімнати або скористайся QR-запрошенням.</p><Link className="launch-button" to="/join"><span>Приєднатися</span><b>→</b></Link></article>
    </section>
    {error && <p className="shared-game-error">{error.message}</p>}
  </div>;

  return <div className="shared-game-page shared-room shell">
    <header className="shared-room-bar">
      <Link to="/multiplayer">← Вийти</Link>
      <div><small>КОД КІМНАТИ</small><button onClick={() => void navigator.clipboard?.writeText(room.code)}>{room.code}<i>копіювати</i></button></div>
      <span className={`shared-connection ${connection}`}><i />{connection === "online" ? "синхронізовано" : connection === "connecting" ? "підключення…" : "немає зв’язку"}</span>
      <strong>{room.players_count}/2 <small>гравці</small></strong>
    </header>

    {!room.is_player && <section className="shared-room-invite">
      <div className="shared-room-qr"><QRCodeSVG value={sharedRoomInvitationUrl(room.join_url)} size={166} level="M" bgColor="transparent" fgColor="#f5f0e7" /></div>
      <div><small>ЗАПРОШЕННЯ</small><h2>Запроси двох гравців</h2><p>Відскануй QR-код телефоном або введи код у розділі «Разом».</p><a href={sharedRoomInvitationUrl(room.join_url)}>{sharedRoomInvitationUrl(room.join_url)}</a></div>
    </section>}

    <section className={`shared-word-card ${room.revealed ? "revealed" : ""}`}>
      <div className="italian-stripe" aria-hidden="true"><i /><i /><i /></div>
      <header><span>{room.card.cefr_level} · {room.card.category}</span><small>{room.current_index + 1} / {room.cards_count}</small></header>
      <div className="shared-word-copy"><small>PAROLA ITALIANA</small><h1>{room.card.italian_text}</h1>{room.revealed ? <p>{room.card.ukrainian_text}</p> : <p className="hidden-translation">Спробуй пригадати переклад</p>}</div>
      <button className="shared-audio" onClick={play} aria-label={`Прослухати ${room.card.italian_text}`}>{playing ? "◼" : "♪"}<span>{playing ? "Звучить…" : "Прослухати"}</span></button>
    </section>

    <footer className="shared-game-actions">
      <p><i>i</i><span>{room.is_player ? "Натискання на будь-якому пристрої одразу змінює всі екрани." : room.players_count < 2 ? "Очікуємо гравців. Керуйте карткою з підключеного телефона." : "Обидва гравці підключені. Ведучий показує перебіг гри."}</span></p>
      {room.is_player && <div><button className="shared-reveal" disabled={room.revealed || reveal.isPending || next.isPending} onClick={() => reveal.mutate()}>{room.revealed ? "Переклад відкрито" : reveal.isPending ? "Відкриваємо…" : "Показати переклад"}</button><button className="launch-button" disabled={next.isPending || reveal.isPending} onClick={() => next.mutate()}><span>{next.isPending ? "Змінюємо…" : "Наступне слово"}</span><b>→</b></button></div>}
    </footer>
    {error && <p className="shared-game-error">{error.message}</p>}
  </div>;
}
