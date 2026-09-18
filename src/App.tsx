import { Navigate, useParams } from "react-router-dom";
import { Queued } from "./interfaces/Queued";
import { builtins } from "./lib/catalog";
import { useStudio } from "./lib/studio";

export function StudyPage() {
  const { slug } = useParams();
  const { userStudies, job, items } = useStudio();
  const built = builtins.find((item) => item.slug === slug);

  if (built) return <built.Component />;
  if (userStudies.some((item) => item.slug === slug) || job?.slug === slug) return <Queued />;
  return <Navigate to={`/${items[0]?.slug ?? "defcon"}`} replace />;
}
