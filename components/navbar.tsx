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
    <nav className="fixed bottom-0 left-0 right-0 bg-transparent border-border z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto">
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
                  "flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
                )}
              >
                <Icon className="h-6 w-6" fontWeight="bold" />
                <span className="text-xs font-black mt-2">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
