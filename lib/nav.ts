import type { LucideIcon } from "lucide-react";
import { Search, PlusCircle, MapPinned, HeartHandshake, BookOpen } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/annonces/nouvelle", label: "Déposer une annonce", short: "Déposer", icon: PlusCircle, primary: true },
  { href: "/annonces", label: "Voir les annonces", short: "Annonces", icon: Search },
  { href: "/carte", label: "Carte", short: "Carte", icon: MapPinned },
  { href: "/conseils", label: "Conseils", short: "Conseils", icon: BookOpen },
  { href: "/annonces?statut=RETROUVE", label: "Retrouvés", short: "Retrouvés", icon: HeartHandshake },
];