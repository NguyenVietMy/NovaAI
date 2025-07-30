"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

export default function MyAccountModal() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      {/* Change Password */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <form className="space-y-3">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled>
            Change Password
          </Button>
        </form>
      </section>

      {/* Manage Billing/Plan */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Manage Billing / Plan</h2>
        <Button asChild variant="outline" className="w-full">
          <a href="#" tabIndex={-1} aria-disabled="true">
            Manage Billing (Coming Soon)
          </a>
        </Button>
      </section>

      {/* Analytics*/}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Analytics</h2>
        <Button
          onClick={() => router.push("/analytics")}
          className="w-full"
          variant="outline"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </section>

      {/* Dark Mode Toggle */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Dark Mode</h2>
        <div className="flex items-center gap-4">
          <Switch checked={darkMode} onCheckedChange={setDarkMode} disabled />
          <span className="text-gray-600">(Coming Soon)</span>
        </div>
      </section>
    </div>
  );
}
