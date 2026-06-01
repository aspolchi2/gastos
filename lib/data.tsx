import { BanknoteArrowDown, BanknoteArrowUp, PiggyBank } from "lucide-react";
import { tabCardProps } from "./types";

export const registrar: tabCardProps[] = [
  {
    title: "Gasto",
    description: "Fijos y variables.",
    icon: <BanknoteArrowDown />,
    color: "#FCA5A5",
    href: "/registrar/gasto",
  },
  {
    title: "Ingreso",
    description: "Sueldo, extras y más.",
    icon: <BanknoteArrowUp />,
    color: "#86EFAC",
    href: "/registrar/ingreso",
  },
  {
    title: "Ahorro",
    description: "Metas y reservas.",
    icon: <PiggyBank />,
    color: "#93C5FD",
    href: "/registrar/ahorro",
  },
];
