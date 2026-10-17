import { Link } from "react-router-dom";
import { ArrowLeftIcon, ScaleIcon, CheckBadgeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-500 mb-6">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
              <ScaleIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="heading-1 text-text-light dark:text-text-dark">Terms of Service</h1>
              <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">
                Last updated: October 2024 • Governing terms of DMOC (Decision Marketing Operating System)
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8 space-y-6 text-sm text-text-light-muted dark:text-text-dark-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark flex items-center gap-2">
              <CheckBadgeIcon className="w-5 h-5 text-brand-500" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using DMOC ("the Service"), you agree to be bound by these Terms of Service. If you are using DMOC on behalf of an enterprise or organization, you confirm that you possess the requisite authority to bind that entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" /> 2. Nature of Analytical Simulations
            </h2>
            <p>
              DMOC provides mathematical modeling tools, including Expected Monetary Value (EMV), weighted scoring, and Monte Carlo stochastic simulations.
            </p>
            <p className="p-3.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border text-xs italic">
              <strong>Disclaimer:</strong> DMOC outputs represent mathematical estimates based on user-supplied assumptions, weights, and probability distributions. Outputs do not constitute legal, financial, investment, medical, or professional advice. You remain solely responsible for real-world decisions enacted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark">3. User Responsibilities & Account Security</h2>
            <p>
              You agree to safeguard your authentication credentials and provide accurate information. You must not attempt to disrupt the platform, inject malicious code into spreadsheet imports, or circumvent access restrictions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark">4. Intellectual Property & User Content</h2>
            <p>
              You retain all ownership, copyrights, and intellectual rights to the decision models, scenarios, and inputs you build. DMOC retains ownership of the underlying analytical algorithms, platform interface, and proprietary software.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="heading-3 text-text-light dark:text-text-dark">5. Modifications and Termination</h2>
            <p>
              We reserve the right to refine platform features or discontinue elements with reasonable notice. You may terminate your account at any time without penalty.
            </p>
          </section>

          <div className="pt-6 border-t border-surface-light-border dark:border-surface-dark-border text-xs">
            For legal inquiries regarding terms, contact legal@dmoc.ai.
          </div>
        </div>
      </div>
    </div>
  );
}
