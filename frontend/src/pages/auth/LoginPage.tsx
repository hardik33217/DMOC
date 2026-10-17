import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || (error instanceof Error ? error.message : "Login failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="heading-2">Welcome back</h2>
          <p className="mt-2 body">Sign in to your account to continue</p>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="you@example.com"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-surface-light-border text-brand-600 focus:ring-brand-500" />
              <span className="text-sm text-text-light-muted dark:text-text-dark-muted">Remember me</span>
            </label>
            <Link to="/forgot-password" className="link text-sm">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </motion.form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-center text-sm text-text-light-muted dark:text-text-dark-muted">
          Don't have an account? <Link to="/register" className="link font-medium">Sign up for free</Link>
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="text-center text-xs text-text-light-muted dark:text-text-dark-muted">
          <p>Demo: demo@decisionos.com / Password123!</p>
        </motion.div>
      </div>
    </div>
  );
}