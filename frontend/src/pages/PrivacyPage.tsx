import { Link } from "react-router-dom";
import { ArrowLeftIcon, ShieldCheckIcon, LockClosedIcon, DocumentCheckIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-500 mb-6">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="heading-1 text-text-light dark:text-text-dark">Privacy Policy</h1>
              <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">
                Last updated: October 2024 • Effective immediately
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8 space-y-6 text-sm text-text-light-muted dark:text-text-dark-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5 text-brand-500" /> 1. Overview & Commitment
            </h2>
            <p>
              At DMOC (Decision Marketing Operating System), your privacy and decision confidentiality are fundamental. Decisions reflect personal, career, financial, and strategic deliberations that deserve the highest standard of protection. We never sell your personal information or decision models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark flex items-center gap-2">
              <DocumentCheckIcon className="w-5 h-5 text-brand-500" /> 2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-text-light dark:text-text-dark">Account Information:</strong> Name, email address, password hash (salted using Argon2id).</li>
              <li><strong className="text-text-light dark:text-text-dark">Decision Models:</strong> Decision titles, descriptions, alternatives, criteria, weights, outcome probabilities, and scenario inputs you enter.</li>
              <li><strong className="text-text-light dark:text-text-dark">Technical & Session Data:</strong> Browser type, timestamps, and audit logs of model alterations to secure your session.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark flex items-center gap-2">
              <EyeSlashIcon className="w-5 h-5 text-brand-500" /> 3. How We Use & Protect Your Data
            </h2>
            <p>
              Your decision data is strictly utilized to compute simulations (Monte Carlo runs, Expected Monetary Value, and sensitivity analyses) and render interactive decision trees. All transmissions use TLS 1.3 encryption, and data in storage is protected behind role-based authentication and secure session tokens.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark">4. Sharing & Collaboration</h2>
            <p>
              Decisions are completely private by default. When you choose to share a decision via DMOC Share Links, only recipients possessing the signed link or authenticated permissions can view the snapshot. You may revoke shared links or set automatic expiration at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark">5. Your Rights & Data Export</h2>
            <p>
              You hold complete ownership of your decision data. You may download all models, criteria, and simulation histories at any time via Excel (.xlsx) export or delete your account and associated records permanently through Settings.
            </p>
          </section>

          <div className="pt-6 border-t border-surface-light-border dark:border-surface-dark-border text-xs">
            For inquiries regarding privacy practices, contact privacy@dmoc.ai.
          </div>
        </div>
      </div>
    </div>
  );
}
