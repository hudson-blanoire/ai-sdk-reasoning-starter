"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export function UserAvatar() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          <User size={16} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-8 w-8">
      {user?.imageUrl ? (
        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
      ) : (
        <AvatarFallback>
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
