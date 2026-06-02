import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  PiggyBank,
  Utensils,
  HardHat,
  Car,
  Leaf,
  Pizza,
  Gamepad2,
  ShoppingBag,
  Cat,
  Shirt,
  DollarSign,
  Bus,
  Stethoscope,
  Landmark,
  Dumbbell,
  Percent,
  Layers,
  Shield,
  Lightbulb,
  CreditCard,
  Wallet,
  Home,
} from "lucide-react";
import { categoriaProps, tabCardProps } from "./types";

const VARIABLE = "#7DD3FC";
const FIJO = "#FDBA74";
const ORIGEN = "#86EFAC";

export const origenes: categoriaProps[] = [
  {
    title: "Sueldos",
    description: "Se descuenta de los ingresos del mes",
    icon: <Wallet />,
    color: ORIGEN,
    slug: "sueldos",
  },
  {
    title: "Ahorro casa",
    description: "Se descuenta del ahorro para la casa",
    icon: <Home />,
    color: ORIGEN,
    slug: "ahorro-casa",
  },
  {
    title: "Ahorro general",
    description: "Se descuenta del ahorro general",
    icon: <PiggyBank />,
    color: ORIGEN,
    slug: "ahorro-general",
  },
];

export const gastosVariables: categoriaProps[] = [
  {
    title: "Alimentación",
    description: "Supermercado, carnicería, panadería, etc",
    icon: <Utensils />,
    color: VARIABLE,
    slug: "alimentacion",
  },
  {
    title: "Arreglos casa",
    description: "Pintura, herramientas, mano de obra, etc",
    icon: <HardHat />,
    color: VARIABLE,
    slug: "arreglos-casa",
  },
  {
    title: "Arreglos auto",
    description: "Mantenimiento general, mecánico, mejoras",
    icon: <Car />,
    color: VARIABLE,
    slug: "arreglos-auto",
  },
  {
    title: "Belleza",
    description: "Peluquería, tratamientos, perfumería general",
    icon: <Leaf />,
    color: VARIABLE,
    slug: "belleza",
  },
  {
    title: "Delivery",
    description: "Incluye take away, carritos, comida preparada.",
    icon: <Pizza />,
    color: VARIABLE,
    slug: "delivery",
  },
  {
    title: "Entretenimiento",
    description: "Juegos, cine, salidas a cenar, juntadas, etc",
    icon: <Gamepad2 />,
    color: VARIABLE,
    slug: "entretenimiento",
  },
  {
    title: "Extras",
    description: "Kiosco, regalos, baterías, cables, varios",
    icon: <ShoppingBag />,
    color: VARIABLE,
    slug: "extras",
  },
  {
    title: "Gatas",
    description: "Piedritas, comida, veterinaria, juguetes",
    icon: <Cat />,
    color: VARIABLE,
    slug: "gatas",
  },
  {
    title: "Indumentaria",
    description: "Ropa y calzado en general",
    icon: <Shirt />,
    color: VARIABLE,
    slug: "indumentaria",
  },
  {
    title: "Préstamos dados",
    description: "Plata que prestamos",
    icon: <DollarSign />,
    color: VARIABLE,
    slug: "prestamos-dados",
  },
  {
    title: "Transporte",
    description: "Uber, colectivo, taxi, nafta",
    icon: <Bus />,
    color: VARIABLE,
    slug: "transporte",
  },
  {
    title: "Salud",
    description: "Consultas, medicamentos, masajes, etc",
    icon: <Stethoscope />,
    color: VARIABLE,
    slug: "salud",
  },
];

export const gastosFijos: categoriaProps[] = [
  {
    title: "Cuota hipotecario",
    description: "La cuota del préstamo hipotecario de la casa",
    icon: <Landmark />,
    color: FIJO,
    slug: "cuota-hipotecario",
  },
  {
    title: "Ejercicio",
    description: "Cuota del gimnasio o actividad deportiva",
    icon: <Dumbbell />,
    color: FIJO,
    slug: "ejercicio",
  },
  {
    title: "Impuestos",
    description: "Tasa municipal, ARBA, patente, ganancias, etc",
    icon: <Percent />,
    color: FIJO,
    slug: "impuestos",
  },
  {
    title: "Pago de deudas",
    description: "Otros préstamos, préstamos familiares",
    icon: <Layers />,
    color: FIJO,
    slug: "pago-de-deudas",
  },
  {
    title: "Seguros",
    description: "Auto, hogar, vida",
    icon: <Shield />,
    color: FIJO,
    slug: "seguros",
  },
  {
    title: "Servicios",
    description: "Agua, luz, gas, limpieza, internet, celular, etc",
    icon: <Lightbulb />,
    color: FIJO,
    slug: "servicios",
  },
  {
    title: "Tarjetas",
    description: "Pago de las tarjetas de crédito",
    icon: <CreditCard />,
    color: FIJO,
    slug: "tarjetas",
  },
];

export const registrar: tabCardProps[] = [
  {
    title: "Gasto",
    description: "Fijos y variables.",
    icon: <BanknoteArrowDown />,
    color: "#FCA5A5",
    href: "/registrar/gasto",
    variables: gastosVariables,
    fijos: gastosFijos,
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
