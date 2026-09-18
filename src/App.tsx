import { Navigate, useParams } from "react-router-dom";
import { Queued } from "./interfaces/Queued";
import { builtinForSlug } from "./lib/catalog";
import { StudyFrameProvider } from "./lib/study-frame";
import { useStudio } from "./lib/studio";

export function StudyPage() {
  const { slug } = useParams();
  const { userStudies, job, items } = useStudio();
  const built = builtinForSlug(slug, userStudies);
  const user = userStudies.find((item) => item.slug === slug);

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
