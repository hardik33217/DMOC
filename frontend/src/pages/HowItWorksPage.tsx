import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Define the Decision",
    description: "Start by clearly stating what you're deciding. Add context, set a deadline, and frame the question precisely. A well-defined decision is half-solved.",
    details: [
      "Enter a clear title and description",
      "Choose a category (career, finance, education, etc.)",
      "Write the decision question in your own words",
      "Optional: set a deadline for when you need to decide",
    ],
    icon: CheckCircleIcon,
  },
  {
    number: "02",
    title: "Add Alternatives",
    description: "List every option you're considering. Give each a title and description. You can reorder, duplicate, or remove alternatives as your thinking evolves.",
    details: [
      "Create 2+ alternatives (e.g., Job A, Job B, Stay)",
      "Add descriptions for context",
      "Reorder by preference or likelihood",
      "Duplicate to create variations",
    ],
    icon: CheckCircleIcon,
  },
  {
    number: "03",
    title: "Define Outcomes & Probabilities",
    description: "For each alternative, map out what could happen. Assign probabilities, monetary values, utility scores, and risk levels. Be honest about uncertainties.",
    details: [
      "Add multiple outcomes per alternative",
      "Set probabilities (they'll normalize to 100%)",
      "Estimate monetary payoff or cost",
      "Add utility scores (0-100) for non-monetary value",
      "Tag risk level: low, medium, high, critical",
    ],
    icon: CheckCircleIcon,
  },
  {
    number: "04",
    title: "Set Criteria & Weights",
    description: "Define what matters to you. Add criteria like cost, time, risk, growth, flexibility. Assign weights (0-100) and choose whether to maximize or minimize each.",
    details: [
      "Add criteria relevant to your decision",
      "Set weight for each (relative importance)",
      "Choose direction: maximize (more is better) or minimize (less is better)",
      "Use simple mode for equal weights",
    ],
    icon: CheckCircleIcon,
  },
  {
    number: "05",
    title: "Simulate & Compare",
    description: "Run the calculation engine. See weighted scores, expected monetary value, expected utility. Create scenarios to test assumptions. Run sensitivity analysis to find what matters most.",
    details: [
      "Weighted scoring across criteria",
      "Expected monetary value (EMV)",
      "Expected utility with probability weighting",
      "Best/worst case analysis",
      "Monte Carlo simulation (advanced)",
      "Sensitivity analysis: which inputs change the recommendation?",
    ],
    icon: CheckCircleIcon,
  },
];

const calculationMethods = [
  {
    name: "Weighted Scoring",
    description: "Normalize each criterion to a common scale, apply your weights, and sum for a total score per alternative. Best for multi-criteria decisions.",
    when: "When you have qualitative and quantitative factors to balance",
  },
  {
    name: "Expected Monetary Value (EMV)",
    description: "Sum of (probability × monetary payoff) for each outcome. Shows the average financial outcome if you repeated the decision many times.",
    when: "When outcomes have clear financial impacts",
  },
  {
    name: "Expected Utility",
    description: "Probability-weighted utility scores. Captures value beyond money — satisfaction, learning, peace of mind.",
    when: "When non-monetary factors are important",
  },
  {
    name: "Monte Carlo Simulation",
    description: "Run thousands of simulations with randomized inputs within your specified ranges. See the distribution of possible results, not just averages.",
    when: "When you want to understand risk distributions and tail outcomes",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="sticky top-0 z-40 border-b border-surface-light-border bg-surface-light/80 backdrop-blur-sm dark:border-surface-dark-border dark:bg-surface-dark/80">
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="text-xl font-heading font-black bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">DMOC</Link>
          <div className="hidden md:flex items-center gap-x-8">
            <Link to="/how-it-works" className="text-sm font-medium text-brand-600 dark:text-brand-400" aria-current="page">How It Works</Link>
            <Link to="/use-cases" className="text-sm font-medium text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark">Use Cases</Link>
          </div>
          <div className="flex items-center gap-x-4">
            <Link to="/login" className="hidden sm:block btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="section pt-20 lg:pt-32" aria-labelledby="hero-heading">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 id="hero-heading" className="heading-1 text-balance mb-6">
                  How DMOC Works
                </h1>
                <p className="body-lg text-balance">
                  A structured, guided process that takes you from a vague dilemma to a clear, explainable recommendation.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="steps-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="steps-heading" className="heading-2 mb-4">The 5-Step Decision Workflow</h2>
            </div>
            <div className="space-y-8 max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className="text-4xl font-bold text-brand-100 dark:text-brand-900/30">{step.number}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 mx-auto mt-2 dark:bg-brand-900/30 dark:text-brand-400">
                      <step.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="heading-3 mb-2">{step.title}</h3>
                    <p className="body mb-4">{step.description}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex gap-2 text-sm text-text-light-muted dark:text-text-dark-muted">
                          <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-500 mt-0.5" aria-hidden="true" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="methods-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="methods-heading" className="heading-2 mb-4">Calculation Methods</h2>
              <p className="body-lg">Choose the method that fits your decision. Use multiple methods to cross-validate.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {calculationMethods.map((method, index) => (
                <motion.article
                  key={method.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <h3 className="heading-4 mb-2">{method.name}</h3>
                  <p className="body mb-4">{method.description}</p>
                  <div className="p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                    <p className="text-sm font-medium text-text-light dark:text-text-dark mb-1">Best when:</p>
                    <p className="text-sm text-text-light-muted dark:text-text-dark-muted">{method.when}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="features-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="features-heading" className="heading-2 mb-4">Advanced Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { title: "Scenario Lab", desc: "Duplicate decisions into scenarios. Change probabilities, weights, payoffs. Compare side-by-side." },
                { title: "Sensitivity Analysis", desc: "Automatically find which assumptions flip the recommendation. Know what to research further." },
                { title: "3D Decision Tree", desc: "Interactive visualization with nodes for decisions, alternatives, and outcomes. Rotate, zoom, inspect." },
                { title: "Excel Import/Export", desc: "Download templates, fill in spreadsheets, import with validation. Export results for sharing." },
                { title: "Shareable Reports", desc: "Generate printable HTML/PDF reports. Share read-only views with expiring links." },
                { title: "Audit Trail", desc: "Track every change to your decisions. Full history for accountability and learning." },
              ].map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <h3 className="heading-4 mb-2">{feature.title}</h3>
                  <p className="body">{feature.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="cta-heading">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="cta-heading" className="heading-2 mb-4">Try it yourself</h2>
              <p className="body-lg mb-8">Create your first decision in minutes. Free tier includes 5 decisions with full features.</p>
              <Link to="/register" className="btn-primary btn-lg inline-flex">
                Start Your First Decision <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-light-border bg-surface-light dark:border-surface-dark-border dark:bg-surface-dark py-12">
        <div className="container text-center text-sm text-text-light-muted dark:text-text-dark-muted">
          © 2024 DMOC (Decision Marketing Operating System). All rights reserved.
        </div>
      </footer>
    </div>
  );
}