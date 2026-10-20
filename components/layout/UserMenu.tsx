"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

type UserMenuProps = {
  image: string;
  name: string;
};

export default function UserMenu({ image, name }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Cuenta"
        className="pressable flex rounded-full ring-offset-2 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Image
          src={image}
          alt={name}
          width={32}
          height={32}
          className="rounded-full"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-in fade-in-0 zoom-in-95 overflow-hidden rounded-xl border border-white/10 bg-popover py-1 shadow-lg duration-150"
        >
          <p className="truncate border-b border-white/10 px-4 py-2.5 text-sm text-zinc-400">
            {name}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
