import type { SharedCardRoom } from "../../types";

const roomStorageKey = "italiano:shared-card-room";
const invitationStorageKey = "italiano:multiplayer-invitation";

export type StoredSharedRoom = { id: string; code: string };

export function saveSharedRoom(room: SharedCardRoom): void {
  localStorage.setItem(roomStorageKey, JSON.stringify({ id: room.id, code: room.code }));
  if (room.is_player) rememberInvitation(room.code);
}

export function loadSharedRoom(): StoredSharedRoom | null {
  const stored = localStorage.getItem(roomStorageKey);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StoredSharedRoom;
  } catch {
    localStorage.removeItem(roomStorageKey);
    return null;
  }
}

export function clearSharedRoom(): void {
  localStorage.removeItem(roomStorageKey);
}

export function rememberInvitation(code: string): void {
  localStorage.setItem(invitationStorageKey, code.toUpperCase());
}

export function loadInvitation(): string {
  return localStorage.getItem(invitationStorageKey) ?? "";
}
