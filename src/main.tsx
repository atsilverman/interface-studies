import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { StudyPage } from "./App";
import { StudioProvider } from "./lib/studio";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/defcon" replace />} />
            <Route path="/:slug" element={<StudyPage />} />
          </Route>
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  </StrictMode>,
);
