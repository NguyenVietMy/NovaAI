"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth_actions/authActions";

export default function MyAccountModal() {
  const [darkMode, setDarkMode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage("");
    setIsPasswordSuccess(false);

    try {
      const formData = new FormData();
      formData.append("currentPassword", passwordData.currentPassword);
      formData.append("newPassword", passwordData.newPassword);
      formData.append("confirmPassword", passwordData.confirmPassword);

      const result = await changePasswordAction(formData);

      if (result.success) {
        setPasswordMessage(result.message);
        setIsPasswordSuccess(true);
        // Clear form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordMessage(result.message);
        setIsPasswordSuccess(false);
      }
    } catch (error) {
      setPasswordMessage("An unexpected error occurred. Please try again.");
      setIsPasswordSuccess(false);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      {/* Change Password */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        {passwordMessage && (
          <div
            className={`p-3 rounded-md mb-3 ${
              isPasswordSuccess
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {passwordMessage}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={
              isChangingPassword ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
          >
            {isChangingPassword ? "Changing Password..." : "Change Password"}
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
