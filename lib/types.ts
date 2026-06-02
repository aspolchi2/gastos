export type RegistroTipo = "gasto" | "ingreso" | "ahorro";

export type categoriaProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  slug: string;
};

export type tabCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  variables?: categoriaProps[];
  fijos?: categoriaProps[];
};
