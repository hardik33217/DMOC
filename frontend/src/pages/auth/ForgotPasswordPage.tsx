import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../utils/api";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      toast.success("If an account exists, a reset link will be sent");
      navigate("/login");
    } catch (error: unknown) {
      toast.error("Failed to send reset email");
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
          <h2 className="heading-2">Forgot password?</h2>
          <p className="mt-2 body">Enter your email and we'll send you a reset link</p>
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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </motion.form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-center text-sm text-text-light-muted dark:text-text-dark-muted">
          Remember your password? <Link to="/login" className="link font-medium">Sign in</Link>
        </motion.p>
      </div>
    </div>
  );
}