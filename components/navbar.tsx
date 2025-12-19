"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  isAdmin: boolean;
}

export function Navbar({ isAdmin }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      icon: Calendar,
      label: "Escalas",
      show: true,
    },
    {
      href: "/users",
      icon: Users,
      label: "Usuários",
      show: isAdmin,
    },
    {
      href: "/functions",
      icon: Briefcase,
      label: "Funções",
      show: isAdmin,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neve lg:bg-transparent border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-2 transition-colors",
                  isActive
                    ? "text-navy"
                    : "text-muted-foreground hover:text-navy"
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
                <span className={cn("text-xs mt-1", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
