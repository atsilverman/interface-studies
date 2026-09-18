import { groupNav } from "../lib/catalog";
import { useStudio } from "../lib/studio";
import { StudyRow } from "./StudyRow";

export function LibraryNav() {
  const { items } = useStudio();
  const groups = groupNav(items);

  return (
    <nav>
      {groups.map((group) => (
        <div key={group.category} className="mb-6">
          <p className="mb-1 text-[10px] font-medium tracking-[0.14em] text-zinc-400 uppercase">
            {group.category}
          </p>
          {group.items.map((item) => (
            <StudyRow key={item.slug} item={item} />
          ))}
        </div>
      ))}
    </nav>
  );
}
