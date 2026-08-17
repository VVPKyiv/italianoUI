import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api, DEFAULT_PROFILE_ID, getActiveProfileId, setActiveProfileId } from "./api/client";
import { AdminPage } from "./pages/AdminPage";
import { CrosswordPage } from "./pages/CrosswordPage";
import { CrosswordResultPage } from "./pages/CrosswordResultPage";
import { TrainingSetupPage } from "./pages/HomePage";
import { ListeningPage } from "./pages/ListeningPage";
import { ListeningResultPage } from "./pages/ListeningResultPage";
import { JoinPage } from "./pages/JoinPage";
import { MatchingPage } from "./pages/MatchingPage";
import { MatchingResultPage } from "./pages/MatchingResultPage";
import { MultiplayerHubPage } from "./pages/MultiplayerHubPage";
import { ResultPage } from "./pages/ResultPage";
import { ReadingLibraryPage } from "./pages/ReadingLibraryPage";
import { ReadingPage } from "./pages/ReadingPage";
import { ReadingResultPage } from "./pages/ReadingResultPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SentenceBuilderPage } from "./pages/SentenceBuilderPage";
import { SentenceResultPage } from "./pages/SentenceResultPage";
import { SharedCardGamePage } from "./pages/SharedCardGamePage";
import { TrainingHubPage } from "./pages/TrainingHubPage";
import { TrainingPage } from "./pages/TrainingPage";
import { VocabularyCatalogPage } from "./pages/VocabularyCatalogPage";

function ProfileMenu() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [activeId, setActiveId] = useState(getActiveProfileId());
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: api.profiles });
  const active = profiles.data?.find((profile) => profile.id === activeId)
    ?? profiles.data?.find((profile) => profile.id === DEFAULT_PROFILE_ID);

  useEffect(() => {
    if (!profiles.data?.length || profiles.data.some((profile) => profile.id === activeId)) return;
    setActiveProfileId(DEFAULT_PROFILE_ID);
    setActiveId(DEFAULT_PROFILE_ID);
  }, [activeId, profiles.data]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const activate = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setActiveProfileId(id);
    setActiveId(id);
    setOpen(false);
    queryClient.clear();
    navigate("/");
  };

  const create = useMutation({
    mutationFn: api.createProfile,
    onSuccess: (profile) => {
      setNickname("");
      setActiveProfileId(profile.id);
      setActiveId(profile.id);
      setOpen(false);
      queryClient.clear();
      navigate("/");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = nickname.trim();
    if (value.length >= 2) create.mutate(value);
  };

  return <div className="profile-menu" ref={menuRef}>
    <button className="profile-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span>{(active?.nickname ?? "A").slice(0, 1).toUpperCase()}</span>
      <span><small>Профіль</small><b>{active?.nickname ?? "Alfredo"}</b></span>
      <i>⌄</i>
    </button>
    {open && <div className="profile-popover">
      <header><small>PROFILI</small><strong>Хто сьогодні навчається?</strong></header>
      <div className="profile-list">
        {profiles.data?.map((profile) => <button key={profile.id} className={profile.id === activeId ? "active" : ""} onClick={() => activate(profile.id)}>
          <span>{profile.nickname.slice(0, 1).toUpperCase()}</span><b>{profile.nickname}</b><i>{profile.id === activeId ? "✓" : "→"}</i>
        </button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="new-profile">Новий профіль</label>
        <div><input id="new-profile" value={nickname} maxLength={30} minLength={2} onChange={(event) => setNickname(event.target.value)} placeholder="Введіть нікнейм" /><button disabled={create.isPending || nickname.trim().length < 2}>+</button></div>
        {create.isError && <p>{create.error.message}</p>}
      </form>
    </div>}
  </div>;
}

function Layout() {
  return <><header className="topbar"><Link to="/" className="brand"><span>IU</span><b>Italiano <em>UA</em></b><small>parla. impara. ricorda.</small></Link><nav aria-label="Головна навігація"><NavLink end to="/">Тренування</NavLink><NavLink to="/multiplayer">Мультиплеєр</NavLink><NavLink to="/join">Доєднатись</NavLink><NavLink to="/reading">Читання</NavLink><NavLink to="/vocabulary">Усі слова</NavLink><NavLink to="/progress">Прогрес</NavLink></nav><ProfileMenu /></header><main><Routes><Route path="/" element={<TrainingHubPage />} /><Route path="/training" element={<TrainingHubPage />} /><Route path="/multiplayer" element={<MultiplayerHubPage />} /><Route path="/join" element={<JoinPage />} /><Route path="/together" element={<SharedCardGamePage />} /><Route path="/vocabulary" element={<VocabularyCatalogPage />} /><Route path="/progress" element={<ProgressPage />} /><Route path="/training/setup/:mode" element={<TrainingSetupPage />} /><Route path="/training/:sessionId" element={<TrainingPage />} /><Route path="/training/:sessionId/result" element={<ResultPage />} /><Route path="/sentences/:sessionId" element={<SentenceBuilderPage />} /><Route path="/sentences/:sessionId/result" element={<SentenceResultPage />} /><Route path="/listening/:sessionId" element={<ListeningPage />} /><Route path="/listening/:sessionId/result" element={<ListeningResultPage />} /><Route path="/matching/:sessionId" element={<MatchingPage />} /><Route path="/matching/:sessionId/result" element={<MatchingResultPage />} /><Route path="/crossword/:sessionId" element={<CrosswordPage />} /><Route path="/crossword/:sessionId/result" element={<CrosswordResultPage />} /><Route path="/reading" element={<ReadingLibraryPage />} /><Route path="/reading/:sessionId" element={<ReadingPage />} /><Route path="/reading/:sessionId/result" element={<ReadingResultPage />} /><Route path="/admin/words" element={<AdminPage />} /></Routes></main></>;
}

export function App() { return <Layout />; }
