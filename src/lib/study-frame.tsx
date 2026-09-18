import { createContext, useContext, type ReactNode } from "react";

type StudyFrameValue = {
  title: string;
};

const StudyFrameContext = createContext<StudyFrameValue | null>(null);

export function StudyFrameProvider({ title, children }: { title: string; children: ReactNode }) {
  return <StudyFrameContext.Provider value={{ title }}>{children}</StudyFrameContext.Provider>;
}

export function useStudyFrame() {
  return useContext(StudyFrameContext);
}
