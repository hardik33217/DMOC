import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || (error instanceof Error ? error.message : "Registration failed");
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
          <h2 className="heading-2">Create your account</h2>
          <p className="mt-2 body">Start making better decisions today</p>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              className={`input ${errors.name ? "input-error" : ""}`}
              placeholder="Alex Morgan"
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.name.message}</p>}
          </div>

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
            <label htmlFor="confirmPassword" className="label">Confirm password</label>
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </motion.form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-center text-sm text-text-light-muted dark:text-text-dark-muted">
          Already have an account? <Link to="/login" className="link font-medium">Sign in</Link>
        </motion.p>
      </div>
    </div>
  );
}