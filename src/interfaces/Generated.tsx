import { useMemo } from "react";
import { StageCard } from "../components/StageCard";
import { compileStudy, StudyBoundary } from "../lib/runtime";
import { useStudyFrame } from "../lib/study-frame";

function ErrorWell({
  title,
  error,
  source,
  footer,
}: {
  title: string;
  error: string;
  source: string;
  footer: string;
}) {
  return (
    <StageCard title={title} meta="Studio" badge="Error" footer={footer}>
      <div className="px-5 py-5">
        <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">{error}</p>
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed tracking-tight text-zinc-500">
          {source}
        </pre>
      </div>
    </StageCard>
  );
}

export function Generated({ source }: { source: string }) {
  const frame = useStudyFrame();
  const title = frame?.title ?? "Study";
  const compiled = useMemo(() => {
    try {
      return { Component: compileStudy(source), error: null as string | null };
    } catch (error) {
      return { Component: null, error: error instanceof Error ? error.message : "Could not compile this study." };
    }
  }, [source]);

  if (!compiled.Component) {
    return <ErrorWell title={title} error={compiled.error ?? "Could not compile this study."} source={source} footer="The generated source failed to mount." />;
  }

  const Component = compiled.Component;
  return (
    <StudyBoundary
      key={source}
      fallback={(error) => (
        <ErrorWell title={title} error={error} source={source} footer="This study threw while rendering." />
      )}
    >
      <Component />
    </StudyBoundary>
  );
}
