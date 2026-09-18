import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Generated } from "./interfaces/Generated";
import { Queued } from "./interfaces/Queued";
import { StageCard } from "./components/StageCard";
import { builtinBySlug, builtinForSlug } from "./lib/catalog";
import { rememberSlug } from "./lib/last-slug";
import { StudyFrameProvider } from "./lib/study-frame";
import { useStudio } from "./lib/studio";

export function LibraryLoading({ title }: { title?: string }) {
  return (
    <StageCard title={title ?? "Library"} meta="Studio">
      <div className="px-5 py-5">
        <p className="text-[14px] tracking-tight text-zinc-400">Loading library…</p>
      </div>
    </StageCard>
  );
}

export function StudyPage() {
  const { slug } = useParams();
  const { userStudies, job, builtinBuilds, syncReady } = useStudio();
  const built = builtinForSlug(slug, userStudies);
  const user = userStudies.find((item) => item.slug === slug);
  const overlay = slug ? builtinBuilds[slug] : undefined;
  const source = user?.source ?? overlay?.source;
  const title = user?.title ?? (slug ? builtinBySlug(slug)?.title : undefined);
  const queued = Boolean(user || (slug && job?.slug === slug));

  useEffect(() => {
    if (slug && queued) rememberSlug(slug);
  }, [queued, slug]);

  if (source) {
    return (
      <StudyFrameProvider title={title ?? "Study"}>
        <Generated key={`${slug}-${user?.updatedAt ?? source.length}`} source={source} />
      </StudyFrameProvider>
    );
  }

  if (built) {
    const study = <built.Component key={slug} />;
    if (user) {
      return <StudyFrameProvider title={user.title}>{study}</StudyFrameProvider>;
    }
    return study;
  }
  if (queued) return <Queued />;
  if (!syncReady) return <LibraryLoading title={title} />;
  return (
    <StageCard title={title ?? slug ?? "Study"} meta="Studio">
      <div className="px-5 py-5">
        <p className="text-[14px] leading-relaxed tracking-tight text-zinc-700">This study is not in the library.</p>
      </div>
    </StageCard>
  );
}
