"use client";
import { useState } from "react";
import { UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "./ui/dialog";
import MyAccountModal from "./my-account-modal";

export default function UserProfile() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <UserCircle className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpen(true)}>
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <MyAccountModal />
        </DialogContent>
      </Dialog>
    </>
  );
}
