import { Navigate, useParams } from "react-router-dom";
import { Generated } from "./interfaces/Generated";
import { Queued } from "./interfaces/Queued";
import { builtinBySlug, builtinForSlug } from "./lib/catalog";
import { StudyFrameProvider } from "./lib/study-frame";
import { useStudio } from "./lib/studio";

export function StudyPage() {
  const { slug } = useParams();
  const { userStudies, job, items, builtinBuilds } = useStudio();
  const built = builtinForSlug(slug, userStudies);
  const user = userStudies.find((item) => item.slug === slug);
  const overlay = slug ? builtinBuilds[slug] : undefined;
  const source = user?.source ?? overlay?.source;
  const title = user?.title ?? (slug ? builtinBySlug(slug)?.title : undefined);

  if (source) {
    return (
      <StudyFrameProvider title={title ?? "Study"}>
        <Generated key={`${slug}-${source.length}`} source={source} />
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
  if (user || job?.slug === slug) return <Queued />;
  return <Navigate to={`/${items[0]?.slug ?? "defcon"}`} replace />;
}
