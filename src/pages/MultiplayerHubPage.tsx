import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api/client";
import { loadInvitation, saveSharedRoom } from "../features/multiplayer/roomStorage";

type MultiplayerCardProps = {
  accent: "red" | "green" | "gold";
  badge: string;
  description: string;
  eyebrow: string;
  icon: string;
  title: string;
  to?: string;
  action?: string;
};

function MultiplayerCard({ accent, action, badge, description, eyebrow, icon, title, to }: MultiplayerCardProps) {
  const content = <>
    <div className="multiplayer-card-top"><small>{eyebrow}</small><span>{badge}</span></div>
    <i className="multiplayer-card-icon">{icon}</i>
    <h2>{title}</h2>
    <p>{description}</p>
    <b>{to ? action ?? "Відкрити кімнату" : "Незабаром"}<i>{to ? "→" : "·"}</i></b>
  </>;
  return to
    ? <Link className={`multiplayer-card ${accent} active`} to={to}>{content}</Link>
    : <article className={`multiplayer-card ${accent} planned`}>{content}</article>;
}

export function MultiplayerHubPage() {
  const invitation = loadInvitation();
  const roomQuery = useQuery({
    queryKey: ["persistent-multiplayer-room"],
    queryFn: api.createSharedCardRoom,
    staleTime: 30_000,
  });
  const room = roomQuery.data;

  useEffect(() => {
    if (room) saveSharedRoom(room);
  }, [room]);

  return <div className="multiplayer-hub">
    <div className="shell multiplayer-shell">
      <header className="multiplayer-hero">
        <div><span className="luxury-kicker"><i /> ALLENARSI INSIEME</span><h1>Навчайтесь <em>разом.</em></h1><p>Mac створює кімнату й показує QR. Два пристрої підключаються, а всі дії синхронізуються наживо.</p></div>
        <aside className="multiplayer-room-pass">
          {room ? <><div><QRCodeSVG value={room.join_url} size={112} level="M" bgColor="transparent" fgColor="#f5f0e7" /></div><section><small>ПОСТІЙНА КІМНАТА</small><strong>{room.code}</strong><span>{room.players_count}/2 гравців підключено</span><Link to={`/together?code=${room.code}`}>Відкрити екран <i>→</i></Link></section></> : <p>{roomQuery.isError ? "Не вдалося завантажити кімнату" : "Готуємо постійну кімнату…"}</p>}
        </aside>
      </header>

      {invitation.length === 6 && <section className="multiplayer-return">
        <div><small>INVITO SALVATO</small><h2>У тебе є активне запрошення</h2><p>Код <strong>{invitation}</strong> залишився після сканування QR. Можна повернутися до спільної гри.</p></div>
        <Link to={`/join?code=${invitation}`}><span>Доєднатись</span><i>→</i></Link>
      </section>}

      <section className="multiplayer-catalog">
        <header><div><small>GIOCHI CONDIVISI</small><h2>Мультиплеєрні тренування</h2></div><span><i /> 1 гра доступна</span></header>
        <div className="multiplayer-grid">
          <MultiplayerCard accent="red" action="Відкрити кімнату" badge="Доступно" eyebrow="CARTE CONDIVISE" icon="Aa" title="Спільні картки" description="Одна італійська картка на всіх екранах. Слухайте слово, відкривайте переклад і рухайтесь далі разом." to={room ? `/together?code=${room.code}` : "/together?host=1"} />
          <MultiplayerCard accent="green" badge="У розробці" eyebrow="CRUCIVERBA" icon="⌗" title="Командний кросворд" description="Заповнюйте одну сітку разом: кожна правильна літера одразу з’являється на всіх пристроях." />
          <MultiplayerCard accent="gold" badge="У планах" eyebrow="SFIDA" icon="⚡" title="Хто швидше?" description="Обирайте правильний переклад наввипередки та заробляйте очки за швидкість і точність." />
          <MultiplayerCard accent="green" badge="У планах" eyebrow="ABBINA" icon="↔" title="Знайди пару разом" description="Розподіліть картки між двома екранами й спільно знаходьте відповідні італійські та українські слова." />
        </div>
      </section>

      <section className="multiplayer-join-callout"><div><small>SEI STATO INVITATO?</small><h2>Маєш код від іншого ведучого?</h2><p>Перейди на окремий екран входу. Там можна приєднатися до кімнати або продовжити навчання самостійно.</p></div><Link to="/join">Ввести код <i>→</i></Link></section>
    </div>
  </div>;
}
