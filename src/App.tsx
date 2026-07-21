import { Link, Route, Routes } from "react-router-dom";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { ResultPage } from "./pages/ResultPage";
import { TrainingPage } from "./pages/TrainingPage";

function Layout() {
  return <><header className="topbar"><Link to="/" className="brand"><span>IT</span><b>Italiano</b><small>parla. impara. ricorda.</small></Link><nav><Link to="/">Тренування</Link><Link to="/admin/words">Словник</Link></nav></header><main><Routes><Route path="/" element={<HomePage />} /><Route path="/training" element={<HomePage />} /><Route path="/training/:sessionId" element={<TrainingPage />} /><Route path="/training/:sessionId/result" element={<ResultPage />} /><Route path="/admin/words" element={<AdminPage />} /></Routes></main></>;
}

export function App() { return <Layout />; }
