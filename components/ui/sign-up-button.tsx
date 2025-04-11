import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { SignUpButton as ClerkSignUpButton } from "@clerk/nextjs";

export function SignUpButtonCustom() {
  return (
    <ClerkSignUpButton>
      <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
        <Button
          className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-9 w-9 flex items-center justify-center"
          aria-label="Create account"
        >
          <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 px-6">
          Sign up
        </Button>
      </div>
    </ClerkSignUpButton>
  );
}
