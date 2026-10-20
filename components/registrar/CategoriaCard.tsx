import { ChevronRight } from "lucide-react";
import { categoriaProps } from "@/lib/types";

type CategoriaCardProps = categoriaProps & {
  selected?: boolean;
  onSelect: (slug: string) => void;
};

const CategoriaCard = ({
  title,
  description,
  icon,
  color,
  slug,
  selected = false,
  onSelect,
}: CategoriaCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(slug)}
      aria-pressed={selected}
      className="pressable flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left active:bg-white/[0.07] aria-pressed:border-white/40 aria-pressed:bg-white/10"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-zinc-500" />
    </button>
  );
};

export default CategoriaCard;
