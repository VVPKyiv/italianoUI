import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./styles/typography.css";
import "./styles/global.css";
import "./styles/mixed.css";
import "./styles/learning.css";
import "./styles/interface.css";
import "./styles/journey.css";
import "./styles/reading-worlds.css";
import "./styles/reading-session.css";
import "./styles/progress-observatory.css";
import "./styles/daily-companion.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><App /></BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
