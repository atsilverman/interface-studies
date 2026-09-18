import { useParams } from "react-router-dom";
import { StageCard } from "../components/StageCard";
import { useStudio } from "../lib/studio";

export function Queued() {
  const { slug } = useParams();
  const { userStudies, job } = useStudio();
  const study = userStudies.find((item) => item.slug === slug);
  const building = job?.slug === slug;

  if (!study) return null;

  const waiting = Boolean(study.remixOfTitle) && study.directions.length === 0 && !building;
  const badge = building ? "Running" : study.remixOfTitle ? "Remix" : "Draft";

  return (
    <StageCard
      wide
      title={study.title}
      meta={study.category}
      badge={badge}
      badgeTone={building ? "live" : "default"}
      footer={
        waiting
          ? "Clone filed. Prompt a change — the original stays put."
          : study.remixOfTitle
            ? `Remix of ${study.remixOfTitle}. Stay on this design language unless you ask otherwise.`
            : "Stub in the catalog. I’ll build the real study from this prompt."
      }
    >
      <div className="px-5 py-5">
        {study.remixOfTitle ? (
          <p className="mb-4 text-[12px] tracking-tight text-zinc-400">From {study.remixOfTitle}</p>
        ) : null}
        <p className="mb-2 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">Brief</p>
        <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">{study.basePrompt}</p>
        {study.directions.map((note, index) => (
          <div key={`${index}-${note}`} className="mt-4">
            <p className="mb-2 text-[11px] tracking-[0.14em] text-zinc-400 uppercase">
              {study.directions.length > 1 ? `Remix ${index + 1}` : "Remix"}
            </p>
            <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">{note}</p>
          </div>
        ))}
      </div>
    </StageCard>
  );
}
