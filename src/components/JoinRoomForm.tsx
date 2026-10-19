import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { loadInvitation, rememberInvitation, saveSharedRoom } from "../features/multiplayer/roomStorage";

export function normalizedRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

export function JoinRoomForm({ invitation = "" }: { invitation?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(() => normalizedRoomCode(invitation || loadInvitation()));
  useEffect(() => {
    const value = normalizedRoomCode(invitation);
    if (value.length === 6) {
      setCode(value);
      rememberInvitation(value);
    }
  }, [invitation]);
  const join = useMutation({
    mutationFn: api.joinSharedCardRoom,
    onSuccess: (room) => {
      saveSharedRoom(room);
      navigate(`/together?code=${room.code}`);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length === 6 && !join.isPending) join.mutate(code);
  };
  return <form className="join-room-form" onSubmit={submit}>
    <label htmlFor="room-code">Код кімнати</label>
    <p id="room-code-help">Введи 6 символів із запрошення або відскануй QR-код ведучого.</p>
    <input id="room-code" value={code} onChange={(event) => { setCode(normalizedRoomCode(event.target.value)); join.reset(); }}
      placeholder="ROMA27" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={6}
      aria-describedby={join.isError ? "room-code-help room-code-error" : "room-code-help"} aria-invalid={join.isError || undefined} />
    <button className="ui-button" disabled={code.length !== 6 || join.isPending} type="submit">{join.isPending ? "Приєднуємо…" : "Приєднатися"}<span aria-hidden="true">→</span></button>
    {join.isError && <p className="ui-error" role="alert" id="room-code-error">{join.error.message}</p>}
  </form>;
}
