import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tabCardProps } from "@/lib/types";

type Props = Pick<tabCardProps, "title" | "description" | "icon" | "color" | "href"> & {
  /** Dato corto alineado a la derecha, antes del chevron. */
  aside?: React.ReactNode;
};

const TabCard = ({ title, description, icon, color, href, aside }: Props) => {
  return (
    <Link
      href={href}
      className="pressable flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 active:bg-white/[0.07]"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 truncate text-sm text-zinc-400">{description}</p>
      </div>
      {aside}
      <ChevronRight className="size-5 shrink-0 text-zinc-500" />
    </Link>
  );
};

export default TabCard;
