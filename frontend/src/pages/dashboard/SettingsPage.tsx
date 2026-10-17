import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  theme: z.enum(["light", "dark", "system"]),
  emailNotifications: z.boolean().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm"),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "data" | "danger">("profile");

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", theme: theme, emailNotifications: true },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateUser({ name: data.name, theme: data.theme });
      setTheme(data.theme);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handlePasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await api.post("/users/change-password", { currentPassword: data.currentPassword, newPassword: data.newPassword, confirmPassword: data.confirmPassword });
      toast.success("Password changed");
      passwordForm.reset();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get("/import-export/export-all", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dmoc-export-${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Data exported");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account and all decisions. This cannot be undone. Type 'DELETE' to confirm.")) return;
    const input = prompt("Type DELETE to confirm:");
    if (input !== "DELETE") return;
    try {
      await api.delete("/users/account", { data: { password: "DELETE" } });
      await logout();
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "data", label: "Data", icon: "📊" },
    { id: "danger", label: "Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Settings</h1>
          <p className="body mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-light-border dark:border-surface-dark-border">
          <nav className="flex -mb-px" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-600 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {activeTab === "profile" && (
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div>
                    <h2 className="heading-4 mb-4">Profile</h2>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="label">Display Name</label>
                        <input id="name" {...profileForm.register("name")} className={`input ${profileForm.formState.errors.name ? "input-error" : ""}`} />
                        {profileForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input type="email" value={user?.email} disabled className="input bg-surface-light-hover dark:bg-surface-dark-hover cursor-not-allowed" />
                        <p className="mt-1 text-sm text-text-light-muted dark:text-text-dark-muted">Email cannot be changed. Contact support if needed.</p>
                      </div>
                      <div>
                        <label className="label">Theme</label>
                        <select {...profileForm.register("theme")} className="input">
                          <option value="system">System (auto)</option>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="notifications" {...profileForm.register("emailNotifications")} className="h-4 w-4 rounded border-surface-light-border text-brand-600 focus:ring-brand-500" />
                        <label htmlFor="notifications" className="text-text-light dark:text-text-dark">Email notifications</label>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border flex justify-end">
                    <button type="submit" className="btn-primary">Save Changes</button>
                  </div>
                </form>
              )}

              {activeTab === "security" && (
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                  <div>
                    <h2 className="heading-4 mb-4">Change Password</h2>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="label">Current Password</label>
                        <input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} className={`input ${passwordForm.formState.errors.currentPassword ? "input-error" : ""}`} />
                        {passwordForm.formState.errors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>}
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="label">New Password</label>
                        <input id="newPassword" type="password" {...passwordForm.register("newPassword")} className={`input ${passwordForm.formState.errors.newPassword ? "input-error" : ""}`} />
                        {passwordForm.formState.errors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>}
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                        <input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} className={`input ${passwordForm.formState.errors.confirmPassword ? "input-error" : ""}`} />
                        {passwordForm.formState.errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border flex justify-end">
                    <button type="submit" className="btn-primary">Change Password</button>
                  </div>
                </form>
              )}

              {activeTab === "data" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="heading-4 mb-4">Export Data</h2>
                    <p className="body mb-4">Download all your decisions, alternatives, criteria, outcomes, and scenarios as an Excel file.</p>
                    <button onClick={handleExportData} className="btn-primary">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export All Data (Excel)
                    </button>
                  </div>
                  <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                    <h2 className="heading-4 mb-4">Import Data</h2>
                    <p className="body mb-4">Import decisions from an Excel file using the standard template.</p>
                    <a href="/import-export/template" className="btn-secondary" download>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download Template
                    </a>
                  </div>
                </div>
              )}

              {activeTab === "danger" && (
                <div className="space-y-6">
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <h2 className="heading-4 text-red-700 dark:text-red-400 mb-2">Delete Account</h2>
                    <p className="body text-red-600 dark:text-red-400">
                      Permanently delete your account and all associated data. This action is irreversible.
                      All your decisions, scenarios, and history will be permanently removed.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                    <button onClick={handleDeleteAccount} className="btn-danger">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}