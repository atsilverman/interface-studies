import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Shell } from "./components/Shell";
import { LibraryLoading, StudyPage } from "./App";
import { pickHomeSlug, readLastSlug } from "./lib/last-slug";
import { StudioProvider, useStudio } from "./lib/studio";
import "./index.css";

function HomeRedirect() {
  const [params] = useSearchParams();
  const { items, userStudies, syncReady } = useStudio();
  if (!syncReady) return <LibraryLoading />;
  const search = params.toString();
  const slug = pickHomeSlug(readLastSlug(), items, userStudies);
  return <Navigate to={search ? `/${slug}?${search}` : `/${slug}`} replace />;
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
