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
      className="relative flex items-center gap-2 w-full justify-between px-4 "
    >
      <p>{name}</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex rounded-full ring-offset-2 ring-offset-[#030711] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Image
          src={image}
          alt={name}
          width={36}
          height={36}
          className="rounded-full"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-lg"
        >
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
