import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { SignInButton as ClerkSignInButton } from "@clerk/nextjs";

export function SignInButtonCustom() {
  return (
    <ClerkSignInButton>
      <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
        <Button
          className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-9 w-9 flex items-center justify-center"
          aria-label="QR code"
        >
          <QrCode size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 px-6">
          Sign in
        </Button>
      </div>
    </ClerkSignInButton>
  );
}
