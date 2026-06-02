import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tabCardProps } from "@/lib/types";

const TabCard = ({ title, description, icon, color, href }: tabCardProps) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5  transition active:scale-[0.98] p-4"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-zinc-500" />
    </Link>
  );
};

export default TabCard;
