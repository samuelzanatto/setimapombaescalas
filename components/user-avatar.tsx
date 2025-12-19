"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  user: {
    full_name: string;
    avatar_url?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-sm",
  xl: "w-16 h-16 text-lg",
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = sizeClasses[size];

  if (user.avatar_url) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden shrink-0",
          sizeClass,
          className
        )}
      >
        <Image
          src={user.avatar_url}
          alt={user.full_name}
          width={size === "xl" ? 64 : size === "lg" ? 40 : size === "md" ? 32 : 24}
          height={size === "xl" ? 64 : size === "lg" ? 40 : size === "md" ? 32 : 24}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-navy flex items-center justify-center shrink-0",
        sizeClass,
        className
      )}
    >
      <span className="text-neve font-semibold">{initials}</span>
    </div>
  );
}
