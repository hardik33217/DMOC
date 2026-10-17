import { Link } from "react-router-dom";
import { ArrowRightIcon, SparklesIcon, ChartBarIcon, CubeIcon, ShieldCheckIcon, BoltIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const features = [
  { name: "Interactive Decision Trees", description: "Visualize your decisions as interactive 3D trees with alternatives, outcomes, and probabilities.", icon: CubeIcon },
  { name: "Scenario Simulation", description: "Create multiple scenarios, modify assumptions, and compare results side-by-side.", icon: ChartBarIcon },
  { name: "Sensitivity Analysis", description: "Discover which assumptions most affect your decision and test robustness.", icon: BoltIcon },
  { name: "Excel Import/Export", description: "Work with familiar spreadsheets. Import templates, validate data, export results.", icon: SparklesIcon },
  { name: "Weighted Scoring & EMV", description: "Multiple calculation methods: weighted scoring, expected monetary value, expected utility.", icon: ChartBarIcon },
  { name: "Secure & Private", description: "Your decisions are encrypted and private. Share only what you choose with expiring links.", icon: ShieldCheckIcon },
];

const useCases = [
  { title: "Career Decisions", description: "Compare job offers, evaluate career changes, plan promotions" },
  { title: "Education Planning", description: "Choose degrees, certifications, or self-study paths" },
  { title: "Financial Planning", description: "Investment choices, major purchases, retirement strategies" },
  { title: "Business Strategy", description: "Market entry, product development, partnership decisions" },
  { title: "Project Prioritization", description: "Rank initiatives by impact, effort, and strategic alignment" },
  { title: "Resource Allocation", description: "Distribute budget, time, and personnel across competing needs" },
];

const steps = [
  { number: "01", title: "Define", description: "State your decision question, set context, and add a deadline if needed." },
  { number: "02", title: "Explore", description: "Add alternatives, define criteria, and map possible outcomes with probabilities." },
  { number: "03", title: "Simulate", description: "Run calculations: weighted scoring, expected monetary value, or Monte Carlo." },
  { number: "04", title: "Compare", description: "Create scenarios, run sensitivity analysis, and see what changes the recommendation." },
  { number: "05", title: "Decide", description: "Review the explainable results, export reports, and make your choice with confidence." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark relative">
      <header className="sticky top-0 z-40 border-b border-surface-light-border bg-surface-light/80 backdrop-blur-sm dark:border-surface-dark-border dark:bg-surface-dark/80">
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="text-2xl font-heading font-black bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent" aria-label="DMOC Home">
            DMOC
          </Link>
          <div className="hidden md:flex items-center gap-x-8">
            <Link to="/how-it-works" className="text-sm font-medium text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark">How It Works</Link>
            <Link to="/use-cases" className="text-sm font-medium text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark">Use Cases</Link>
          </div>
          <div className="flex items-center gap-x-4">
            <Link to="/login" className="hidden sm:block btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden section pt-20 lg:pt-32" aria-labelledby="hero-heading">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 mb-6">
                  <SparklesIcon className="h-4 w-4" /> DMOC • Decision Marketing Operating System
                </span>
                <h1 id="hero-heading" className="heading-1 text-balance mb-6">
                  See the Future of a{" "}
                  <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                    Business Decision
                  </span>
                </h1>
                <p className="body-lg text-balance mb-10 max-w-2xl mx-auto">
                  DMOC (Decision Marketing Operating System) helps you make better business choices by modeling alternatives, sales velocities, outcomes, and uncertainties.
                  Visualize decision trees, run simulations, and understand what drives your recommendations.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/register" className="btn-primary btn-lg w-full sm:w-auto shadow-xl shadow-brand-500/25">
                    Start Free <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                  <Link to="/how-it-works" className="btn-secondary btn-lg w-full sm:w-auto">See How It Works</Link>
                </div>
                <p className="mt-6 text-sm text-text-light-muted dark:text-text-dark-muted">
                  No credit card required · Free tier includes 5 decisions · Export anytime
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="features-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="features-heading" className="heading-2 mb-4">Everything you need to decide with confidence</h2>
              <p className="body-lg">Powerful tools wrapped in an intuitive interface — no statistics degree required.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card card-3d p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 mb-4">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="heading-4 mb-2">{feature.name}</h3>
                  <p className="body">{feature.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="workflow-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="workflow-heading" className="heading-2 mb-4">How it works in 5 steps</h2>
              <p className="body-lg">A guided workflow that takes you from question to confident decision.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative card card-3d p-6"
                >
                  <span className="text-4xl font-bold text-brand-100 dark:text-brand-900/30 mb-4 block">{step.number}</span>
                  <h3 className="heading-4 mb-2">{step.title}</h3>
                  <p className="body">{step.description}</p>
                </motion.article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/how-it-works" className="btn-secondary">Learn More About the Process</Link>
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="use-cases-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="use-cases-heading" className="heading-2 mb-4">Decisions people make with DMOC</h2>
              <p className="body-lg">From store inventory to growth strategy — any decision with tradeoffs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <motion.article
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <h3 className="heading-4 mb-2">{useCase.title}</h3>
                  <p className="body">{useCase.description}</p>
                </motion.article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/use-cases" className="btn-secondary">View All Use Cases</Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="cta-heading">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="cta-heading" className="heading-2 mb-4">Ready to make better decisions?</h2>
              <p className="body-lg mb-8">Join businesses and leaders who use DMOC to think clearly, manage risks, and decide confidently.</p>
              <Link to="/register" className="btn-primary btn-lg inline-flex">
                Create Your First Decision <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <p className="mt-4 text-sm text-text-light-muted dark:text-text-dark-muted">
                Free forever for personal use · Upgrade for teams and advanced features
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-light-border bg-surface-light dark:border-surface-dark-border dark:bg-surface-dark py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-heading font-bold text-text-light dark:text-text-dark mb-2 text-lg">DMOC</h3>
              <p className="body-sm text-xs">Decision Marketing Operating System</p>
            </div>
            <nav>
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/how-it-works" className="link text-sm">How It Works</Link></li>
                <li><Link to="/use-cases" className="link text-sm">Use Cases</Link></li>
                <li><a href="/pricing" className="link text-sm">Pricing</a></li>
                <li><a href="/api-docs" className="link text-sm">API Docs</a></li>
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/docs" className="link text-sm">Documentation</a></li>
                <li><a href="/blog" className="link text-sm">Blog</a></li>
                <li><a href="/community" className="link text-sm">Community</a></li>
                <li><a href="/templates" className="link text-sm">Templates</a></li>
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="link text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="link text-sm">Terms of Service</Link></li>
                <li><a href="/security" className="link text-sm">Security</a></li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-surface-light-border dark:border-surface-dark-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-light-muted dark:text-text-dark-muted">
              © 2024 DMOC (Decision Marketing Operating System). All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark" aria-label="Twitter">Twitter</a>
              <a href="#" className="text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark" aria-label="GitHub">GitHub</a>
              <a href="#" className="text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}