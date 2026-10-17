import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../utils/api";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: data.password });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error: unknown) {
      toast.error("Failed to reset password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="heading-2 mb-2">Invalid Reset Link</h2>
            <p className="body mb-6">This password reset link is missing a token. Please request a new one.</p>
            <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <Link to="/" className="inline-block mb-8 text-center group">
            <span className="text-3xl font-heading font-black bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent block">
              DMOC
            </span>
            <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted tracking-tight">
              Decision Marketing Operating System
            </span>
          </Link>
          <h2 className="heading-2">Reset your password</h2>
          <p className="mt-2 body">Enter your new password below</p>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div>
            <label htmlFor="password" className="label">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password")}
                className={`input pr-12 ${errors.password ? "input-error" : ""}`}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-text-light-muted" /> : <EyeIcon className="h-5 w-5 text-text-light-muted" />}
              </button>
            </div>
            {errors.password && <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}

            <div className="mt-3 space-y-1.5" role="group" aria-label="Password requirements">
              {passwordRequirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-sm">
                  <CheckCircleIcon
                    className={`h-4 w-4 shrink-0 ${req.test(watchedPassword) ? "text-green-500" : "text-surface-light-border dark:text-surface-dark-border"}`}
                    aria-hidden="true"
                  />
                  <span className={req.test(watchedPassword) ? "text-green-600 dark:text-green-400" : "text-text-light-muted dark:text-text-dark-muted"}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Confirm new password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`input ${errors.confirmPassword ? "input-error" : ""}`}
              placeholder="••••••••"
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
            />
            {errors.confirmPassword && <p id="confirm-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </motion.form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-center text-sm text-text-light-muted dark:text-text-dark-muted">
          <Link to="/login" className="link font-medium">Back to sign in</Link>
        </motion.p>
      </div>
    </div>
  );
}