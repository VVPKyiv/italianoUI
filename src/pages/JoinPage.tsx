import { Navigate, useSearchParams } from "react-router-dom";

// Keep QR invitations and existing bookmarks working in the unified section.
export function JoinPage() {
  const [params] = useSearchParams();
  const target = new URLSearchParams(params);
  target.set("mode", "join");
  return <Navigate replace to={`/multiplayer?${target}`} />;
}
