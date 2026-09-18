import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Shell } from "./components/Shell";
import { StudyPage } from "./App";
import { StudioProvider } from "./lib/studio";
import "./index.css";

function HomeRedirect() {
  const [params] = useSearchParams();
  const search = params.toString();
  return <Navigate to={search ? `/defcon?${search}` : "/defcon"} replace />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/:slug" element={<StudyPage />} />
          </Route>
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  </StrictMode>,
);
