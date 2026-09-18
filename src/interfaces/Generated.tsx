import { useMemo } from "react";
import { StageCard } from "../components/StageCard";
import { compileStudy, StudyBoundary } from "../lib/runtime";
import { useStudyFrame } from "../lib/study-frame";

export function Generated({ source }: { source: string }) {
  const frame = useStudyFrame();
  const compiled = useMemo(() => {
    try {
      return { Component: compileStudy(source), error: null as string | null };
    } catch (error) {
      return { Component: null, error: error instanceof Error ? error.message : "Could not compile this study." };
    }
  }, [source]);

  if (!compiled.Component) {
    return (
      <StageCard title={frame?.title ?? "Study"} meta="Studio" badge="Error" footer="The generated source failed to mount.">
        <div className="px-5 py-5">
          <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">{compiled.error}</p>
        </div>
      </StageCard>
    );
  }

  const Component = compiled.Component;
  return (
    <StudyBoundary
      fallback={
        <StageCard title={frame?.title ?? "Study"} meta="Studio" badge="Error" footer="This study threw while rendering.">
          <div className="px-5 py-5">
            <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">Reload or edit the brief.</p>
          </div>
        </StageCard>
      }
    >
      <Component />
    </StudyBoundary>
  );
}
