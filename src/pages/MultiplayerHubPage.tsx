import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api/client";
import { JoinRoomForm } from "../components/JoinRoomForm";
import { PageHeading } from "../components/PageHeading";
import { loadSharedRoom, saveSharedRoom, sharedRoomInvitationUrl } from "../features/multiplayer/roomStorage";

export function MultiplayerHubPage() {
  const [params, setParams] = useSearchParams();
  const joining = params.get("mode") === "join" || Boolean(params.get("code"));
  const [stored, setStored] = useState(loadSharedRoom);
  const existing = useQuery({
    queryKey: ["multiplayer-room", stored?.id],
    queryFn: () => api.getSharedCardRoom(stored!.id),
    enabled: Boolean(stored),
    retry: false,
  });
  const create = useMutation({
    mutationFn: api.createSharedCardRoom,
    onSuccess: (room) => {
      saveSharedRoom(room);
      setStored({ id: room.id, code: room.code });
    },
  });
  const room = create.data ?? (existing.data?.is_player ? undefined : existing.data);
  const switchMode = (join: boolean) => {
    const next = new URLSearchParams(params);
    next.delete("code");
    if (join) next.set("mode", "join");
    else next.delete("mode");
    setParams(next, { replace: true });
  };

  return <div className="together-hub shell">
    <PageHeading title="Тренування разом" description="Спільні картки для двох гравців. Ведучий показує слово, гравці керують грою."
      aside={existing.data?.is_player && <Link className="ui-button secondary" to={`/together?code=${existing.data.code}`}>Повернутися до гри<span aria-hidden="true">→</span></Link>} />
    <div className="ui-segmented" role="group" aria-label="Спосіб входу в гру">
      <button aria-pressed={!joining} onClick={() => switchMode(false)}>Створити кімнату</button>
      <button aria-pressed={joining} onClick={() => switchMode(true)}>Приєднатися</button>
    </div>
    <div className="together-workspace">
      <section className="ui-panel room-panel" aria-label={joining ? "Приєднатися до кімнати" : "Кімната ведучого"}>
        <div className="section-heading"><h2>{joining ? "Маєш запрошення?" : room ? "Твоя кімната" : "Запроси двох гравців"}</h2><span className="ui-badge">Спільні картки</span></div>
        {joining ? <JoinRoomForm invitation={params.get("code") ?? ""} /> : room ? <>
          <div className="room-invitation">
            <div className="room-qr"><QRCodeSVG value={sharedRoomInvitationUrl(room.join_url)} size={148} level="M" bgColor="#ffffff" fgColor="#101a15" marginSize={3} /></div>
            <div className="room-code-copy"><span>Код кімнати</span><strong>{room.code}</strong><span>{room.players_count} з 2 гравців</span><p>Гравці можуть відсканувати QR-код або ввести код у вкладці «Приєднатися».</p></div>
          </div>
          <Link className="ui-button" to={`/together?code=${room.code}`}>{room.is_player ? "Повернутися до гри" : "Відкрити гру"}<span aria-hidden="true">→</span></Link>
        </> : <div className="room-create">
          <span className="room-create-icon" aria-hidden="true">02</span>
          <p>Відкрий кімнату на цьому пристрої. Поділися QR-кодом або кодом із двома гравцями.</p>
          <button className="ui-button" disabled={create.isPending || existing.isFetching} onClick={() => create.mutate()}>{create.isPending ? "Створюємо…" : existing.isFetching ? "Шукаємо кімнату…" : "Створити кімнату"}<span aria-hidden="true">→</span></button>
          {create.isError && <p className="ui-error" role="alert">{create.error.message}</p>}
        </div>}
      </section>
      <aside className="ui-panel together-guide">
        <h2>Як грати</h2>
        <ol><li><span>1</span><div><strong>Відкрий кімнату</strong><p>Пристрій ведучого показує картки й не займає місце гравця.</p></div></li><li><span>2</span><div><strong>Запроси гравців</strong><p>Два телефони приєднуються за QR-кодом або кодом кімнати.</p></div></li><li><span>3</span><div><strong>Навчайтеся разом</strong><p>Слухайте слова, відкривайте переклад і переходьте далі.</p></div></li></ol>
        <p className="together-guide-note">Дії гравців синхронізуються на всіх екранах.</p>
      </aside>
    </div>
    <details className="upcoming-formats"><summary>Що з’явиться далі</summary><p>Командний кросворд · Змагання на швидкість · Знайди пару разом</p></details>
  </div>;
}
