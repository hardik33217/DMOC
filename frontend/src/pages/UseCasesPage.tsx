import { Link } from "react-router-dom";
import { ArrowRightIcon, BriefcaseIcon, AcademicCapIcon, CurrencyDollarIcon, BuildingOfficeIcon, ChartBarIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const useCases = [
  {
    category: "Career Planning",
    icon: BriefcaseIcon,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    decisions: [
      "Compare job offers (salary, equity, growth, culture, location)",
      "Evaluate career change vs. staying put",
      "Decide on promotion path: management vs. individual contributor",
      "Choose between contract vs. full-time roles",
      "Plan sabbatical or career break timing",
    ],
    template: "Job Offer Comparison",
  },
  {
    category: "Education & Learning",
    icon: AcademicCapIcon,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    decisions: [
      "Master's degree vs. certification vs. self-study",
      "Which specialization or major to pursue",
      "Full-time vs. part-time vs. online programs",
      "ROI analysis: tuition cost vs. lifetime earnings increase",
      "Decide on PhD vs. industry experience",
    ],
    template: "Education Path Planning",
  },
  {
    category: "Personal Finance",
    icon: CurrencyDollarIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    decisions: [
      "Investment allocation: conservative vs. balanced vs. aggressive",
      "Buy vs. rent housing decision",
      "Early retirement (FIRE) feasibility",
      "Debt payoff strategy: avalanche vs. snowball",
      "Major purchase: car, home renovation, vacation",
      "Emergency fund sizing",
    ],
    template: "Investment Decision",
  },
  {
    category: "Business Strategy",
    icon: BuildingOfficeIcon,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    decisions: [
      "Market expansion: new geography vs. new segment",
      "Build vs. buy vs. partner for new capability",
      "Product portfolio prioritization",
      "Pricing strategy: penetration vs. premium",
      "Funding: bootstrap vs. angel vs. VC",
      "M&A target evaluation",
    ],
    template: "Business Strategy Choice",
  },
  {
    category: "Project & Product Management",
    icon: ChartBarIcon,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    decisions: [
      "Quarterly project prioritization (RICE, WSJF, custom)",
      "Feature prioritization with stakeholder input",
      "Technical debt vs. new features tradeoff",
      "Team capacity allocation across initiatives",
      "Release timing: scope vs. date vs. quality",
      "Vendor/tool selection",
    ],
    template: "Project Prioritization",
  },
  {
    category: "Resource Allocation",
    icon: CpuChipIcon,
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    decisions: [
      "Budget allocation across departments",
      "Hiring plan: which roles, when, seniority",
      "Cloud infrastructure: reserved vs. spot vs. on-demand",
      "Marketing spend across channels",
      "R&D portfolio balancing",
      "Office space: lease vs. remote vs. hybrid",
    ],
    template: "Resource Allocation",
  },
];

const templates = [
  {
    id: "job-offer",
    name: "Job Offer Comparison",
    category: "Career",
    description: "Compare 2-5 job offers across compensation, growth, culture, work-life balance, and location.",
    alternatives: ["Offer A", "Offer B", "Current Job", "Counter Offer"],
    criteria: ["Total Compensation", "Growth Potential", "Work-Life Balance", "Culture Fit", "Location"],
  },
  {
    id: "education-path",
    name: "Education Path Planning",
    category: "Education",
    description: "Evaluate degree programs, certifications, bootcamps, and self-directed learning paths.",
    alternatives: ["Master's Degree", "Professional Cert", "Bootcamp", "Self-Study"],
    criteria: ["Cost", "Time to Complete", "Career Impact", "Flexibility", "Networking"],
  },
  {
    id: "investment",
    name: "Investment Strategy",
    category: "Finance",
    description: "Choose asset allocation based on risk tolerance, time horizon, and financial goals.",
    alternatives: ["Conservative", "Balanced", "Growth", "Aggressive"],
    criteria: ["Expected Return", "Risk Level", "Liquidity", "Tax Efficiency"],
  },
  {
    id: "business-strategy",
    name: "Business Strategy",
    category: "Business",
    description: "Evaluate strategic options: market expansion, product development, partnerships, M&A.",
    alternatives: ["Market Expansion", "New Product", "Partnership", "Acquisition"],
    criteria: ["Revenue Potential", "Risk", "Resources", "Time to Market", "Competitive Advantage"],
  },
  {
    id: "project-priority",
    name: "Project Prioritization",
    category: "Project Mgmt",
    description: "Rank projects using custom criteria: impact, effort, strategic alignment, risk, dependencies.",
    alternatives: ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"],
    criteria: ["Business Impact", "Engineering Effort", "Strategic Alignment", "Risk", "Dependencies"],
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="sticky top-0 z-40 border-b border-surface-light-border bg-surface-light/80 backdrop-blur-sm dark:border-surface-dark-border dark:bg-surface-dark/80">
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="text-xl font-heading font-black bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">DMOC</Link>
          <div className="hidden md:flex items-center gap-x-8">
            <Link to="/how-it-works" className="text-sm font-medium text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark">How It Works</Link>
            <Link to="/use-cases" className="text-sm font-medium text-brand-600 dark:text-brand-400" aria-current="page">Use Cases</Link>
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
                  Decisions People Make with DMOC
                </h1>
                <p className="body-lg text-balance">
                  Any decision with tradeoffs, uncertainties, and multiple criteria.
                  From store inventory to growth strategy — DMOC adapts to your context.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="categories-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="categories-heading" className="heading-2 mb-4">By Category</h2>
              <p className="body-lg">Common decision types organized by life and work domains.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {useCases.map((useCase, index) => (
                <motion.article
                  key={useCase.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6 hover:shadow-soft-lg transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg {useCase.color} mb-4">
                    <useCase.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="heading-4 mb-3">{useCase.category}</h3>
                  <ul className="space-y-2 mb-6">
                    {useCase.decisions.map((decision, i) => (
                      <li key={i} className="flex gap-2 text-sm text-text-light-muted dark:text-text-dark-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 mt-2 shrink-0" aria-hidden="true" />
                        {decision}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="btn-secondary text-sm w-full text-center">
                    Try {useCase.template} Template
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="templates-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 id="templates-heading" className="heading-2 mb-4">Ready-to-Use Templates</h2>
              <p className="body-lg">Start with a pre-built structure. Customize alternatives, criteria, and outcomes to fit your situation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {templates.map((template, index) => (
                <motion.article
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="badge-primary mb-2 inline-block">{template.category}</span>
                      <h3 className="heading-4">{template.name}</h3>
                    </div>
                  </div>
                  <p className="body mb-4">{template.description}</p>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-text-light dark:text-text-dark mb-1">Alternatives:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.alternatives.map((alt) => (
                          <span key={alt} className="badge-neutral">{alt}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-light dark:text-text-dark mb-1">Criteria:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.criteria.map((crit) => (
                          <span key={crit} className="badge-neutral">{crit}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link to="/register" className="btn-primary w-full text-center">Use This Template</Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-surface-light-hover dark:bg-surface-dark/50" aria-labelledby="custom-heading">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="custom-heading" className="heading-2 mb-4">Your decision isn't listed?</h2>
              <p className="body-lg mb-8">DMOC is completely flexible. Create custom decisions with your own alternatives, criteria, outcomes, and scales. No templates required.</p>
              <Link to="/register" className="btn-primary btn-lg inline-flex">
                Create Custom Decision <ArrowRightIcon className="h-5 w-5" />
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