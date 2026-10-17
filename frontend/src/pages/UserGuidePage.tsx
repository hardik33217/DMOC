import { Link } from "react-router-dom";
import { ArrowLeftIcon, CheckCircleIcon, ArrowRightIcon, PlayIcon, ChartBarIcon, LightBulbIcon, DocumentTextIcon, MagnifyingGlassIcon, ArrowPathIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export default function UserGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="btn-ghost">
          <ArrowLeftIcon className="h-5 w-5" /> Back
        </Link>
        <div>
          <h1 className="heading-1">User Guide</h1>
          <p className="body mt-1">Learn how to use DMOC effectively</p>
        </div>
      </div>

      <nav className="card p-4 sticky top-24 print:hidden" aria-label="Table of Contents">
        <h2 className="heading-5 mb-3">Contents</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#getting-started" className="text-brand-600 hover:underline">Getting Started</a></li>
          <li><a href="#creating-decisions" className="text-brand-600 hover:underline">Creating Decisions</a></li>
          <li><a href="#scenario-lab" className="text-brand-600 hover:underline">Scenario Lab & Simulation</a></li>
          <li><a href="#understanding-results" className="text-brand-600 hover:underline">Understanding Results</a></li>
          <li><a href="#sensitivity-analysis" className="text-brand-600 hover:underline">Sensitivity Analysis</a></li>
          <li><a href="#scenario-comparison" className="text-brand-600 hover:underline">Scenario Comparison</a></li>
          <li><a href="#reports-export" className="text-brand-600 hover:underline">Reports & Export</a></li>
          <li><a href="#tips" className="text-brand-600 hover:underline">Tips & Best Practices</a></li>
        </ul>
      </nav>

      <section id="getting-started" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><CheckCircleIcon className="h-6 w-6 text-green-600" /> Getting Started</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">1. Create an Account</h3>
            <p className="body">Visit the homepage and click "Get Started" or "Sign Up". Enter your email, password, and name. You'll receive a verification email.</p>
          </div>
          <div>
            <h3 className="heading-4 mb-2">2. Login</h3>
            <p className="body">Use your email and password. The demo account is: <code className="bg-surface-light-hover dark:bg-surface-dark-hover px-2 py-1 rounded font-mono text-sm">demo@decisionos.com</code> / <code className="bg-surface-light-hover dark:bg-surface-dark-hover px-2 py-1 rounded font-mono text-sm">Password123!</code></p>
          </div>
          <div>
            <h3 className="heading-4 mb-2">3. Dashboard Overview</h3>
            <p className="body">After login, you'll see your dashboard with recent decisions, statistics, and quick actions. Click "New Decision" to start.</p>
          </div>
        </div>
      </section>

      <section id="creating-decisions" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><ChartBarIcon className="h-6 w-6 text-brand-600" /> Creating Decisions</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">Decision Wizard (4 Steps)</h3>
            <ol className="list-decimal list-inside space-y-2 body">
              <li><strong>Define Decision:</strong> Title, description, category, and the core question you're trying to answer</li>
              <li><strong>Alternatives:</strong> Add the options you're choosing between (e.g., "Job A", "Job B", "Stay")</li>
              <li><strong>Criteria:</strong> Define evaluation factors with weights (e.g., "Salary: 30%", "Work-Life Balance: 25%")</li>
              <li><strong>Outcomes:</strong> For each alternative, add possible outcomes with probabilities and payoffs</li>
            </ol>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Key Concepts</h3>
            <ul className="list-disc list-inside space-y-2 body">
              <li><strong>Alternatives:</strong> The choices you're evaluating</li>
              <li><strong>Criteria:</strong> Dimensions for comparison (weight = importance)</li>
              <li><strong>Outcomes:</strong> Possible results for each alternative (probability + monetary payoff/utility)</li>
              <li><strong>Scenarios:</strong> "What-if" variations of your assumptions</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="scenario-lab" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><PlayIcon className="h-6 w-6 text-purple-600" /> Scenario Lab & Simulation</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">Running a Simulation</h3>
            <ol className="list-decimal list-inside space-y-2 body">
              <li>Open a decision → Click "Scenario Lab" in the sidebar</li>
              <li>Select a scenario (start with "Baseline")</li>
              <li>Click "Run Simulation" button</li>
              <li>Choose algorithm:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Weighted Scoring:</strong> Multi-criteria decision analysis (default)</li>
                  <li><strong>Monte Carlo:</strong> Probabilistic simulation with confidence intervals</li>
                  <li><strong>Expected Monetary Value (EMV):</strong> Pure financial analysis</li>
                  <li><strong>Expected Utility:</strong> Utility-based scoring</li>
                </ul>
              </li>
              <li>Click "Run Simulation" — results appear in a modal</li>
            </ol>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Creating Scenarios</h3>
            <p className="body mb-2">Click "New Scenario" to create variations:</p>
            <ul className="list-disc list-inside space-y-1 body">
              <li>Name it (e.g., "Optimistic", "Pessimistic", "Market Crash")</li>
              <li>Click the scenario → "Edit" to modify probabilities, payoffs, or criterion scores</li>
              <li>Use "Duplicate" to create variations quickly</li>
              <li>"Reset" reverts to baseline assumptions</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="understanding-results" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><DocumentTextIcon className="h-6 w-6 text-blue-600" /> Understanding Results</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">Results Modal (Click "View Full Report" for details)</h3>
            <ul className="list-disc list-inside space-y-2 body">
              <li><strong>Recommendation Box:</strong> Plain-language explanation of the top choice and why</li>
              <li><strong>Results Cards:</strong> Each alternative shows Rank, Weighted Score, EMV, Utility, and Range</li>
              <li><strong>Criterion Breakdown:</strong> How each criterion contributed (raw → normalized → weighted)</li>
              <li><strong>Outcomes Table:</strong> All outcomes with probabilities, payoffs, utilities, and risk levels</li>
            </ul>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Full Report Page</h3>
            <p className="body mb-2">Click "View Full Report" or visit <code className="bg-surface-light-hover dark:bg-surface-dark-hover px-2 py-1 rounded font-mono text-sm">/decisions/:decisionId/simulations/runs/:runId</code></p>
            <ul className="list-disc list-inside space-y-1 body">
              <li>Printable/exportable detailed report</li>
              <li>Complete criterion score tables</li>
              <li>Full outcome analysis per alternative</li>
              <li>Run metadata (algorithm, timestamps)</li>
            </ul>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Key Metrics Explained</h3>
            <dl className="space-y-2 body">
              <dt className="font-medium">Weighted Score</dt><dd className="ml-4">Normalized criterion scores × weights, summed (0-1, higher = better)</dd>
              <dt className="font-medium">EMV (Expected Monetary Value)</dt><dd className="ml-4">Σ(probability × monetary payoff) for each alternative</dd>
              <dt className="font-medium">Expected Utility</dt><dd className="ml-4">Σ(probability × utility score) for each alternative</dd>
              <dt className="font-medium">Range (Best/Worst Case)</dt><dd className="ml-4">Monte Carlo 95th/5th percentiles or min/max payoffs</dd>
              <dt className="font-medium">Risk Metrics</dt><dd className="ml-4">Count of high/medium/low risk outcomes + average risk score</dd>
            </dl>
          </div>
        </div>
      </section>

      <section id="sensitivity-analysis" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><MagnifyingGlassIcon className="h-6 w-6 text-orange-600" /> Sensitivity Analysis</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">What It Does</h3>
            <p className="body mb-2">Automatically finds which assumption changes would flip the recommendation.</p>
            <p className="body">Click "Sensitivity Analysis" in Quick Actions (requires a completed baseline simulation).</p>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Interpreting Results</h3>
            <ul className="list-disc list-inside space-y-2 body">
              <li><strong>Parameter:</strong> What was tested (criterion weight, outcome probability, payoff)</li>
              <li><strong>Baseline Value:</strong> Current assumption</li>
              <li><strong>Threshold Value:</strong> The value at which the top recommendation changes</li>
              <li><strong>Description:</strong> Plain explanation of the impact</li>
            </ul>
            <p className="body mt-2 text-text-light-muted dark:text-text-dark-muted">If no results appear, your recommendation is stable — no single parameter flip changes it.</p>
          </div>
        </div>
      </section>

      <section id="scenario-comparison" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><ArrowPathIcon className="h-6 w-6 text-teal-600" /> Scenario Comparison</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">How to Compare</h3>
            <ol className="list-decimal list-inside space-y-2 body">
              <li>Check checkboxes next to scenarios (minimum 2)</li>
              <li>Click "Compare Selected" → "Run Comparison"</li>
              <li>View side-by-side results showing how each scenario changes the ranking</li>
            </ol>
          </div>
          <div>
            <h3 className="heading-4 mb-2">"Duplicate Baseline" Quick Action</h3>
            <p className="body">Automatically selects the baseline + up to 4 other scenarios for instant comparison.</p>
          </div>
        </div>
      </section>

      <section id="reports-export" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><DocumentDuplicateIcon className="h-6 w-6 text-indigo-600" /> Reports & Export</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="heading-4 mb-2">Excel Export</h3>
            <p className="body mb-2">From Reports page or Simulation Run Detail page:</p>
            <ul className="list-disc list-inside space-y-1 body">
              <li>Click "Export Excel" — downloads .xlsx with all data</li>
              <li>Includes: Decision, alternatives, criteria, outcomes, scenarios, simulation results</li>
              <li>Uses the standard DMOC template format</li>
            </ul>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Print / PDF</h3>
            <p className="body mb-2">On Simulation Run Detail page:</p>
            <ul className="list-disc list-inside space-y-1 body">
              <li>Click "Print" → browser print dialog → "Save as PDF"</li>
              <li>Formatted for clean printing with page breaks</li>
            </ul>
          </div>
          <div>
            <h3 className="heading-4 mb-2">Import from Excel</h3>
            <p className="body mb-2">From Dashboard → "Import Excel":</p>
            <ul className="list-disc list-inside space-y-1 body">
              <li>Download template first</li>
              <li>Fill in your data</li>
              <li>Upload → preview → confirm import</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="tips" className="space-y-4">
        <h2 className="heading-2 flex items-center gap-2"><LightBulbIcon className="h-6 w-6 text-yellow-600" /> Tips & Best Practices</h2>
        <div className="card p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Probabilities</h4>
              <p className="text-sm body">Outcome probabilities for each alternative should sum to ~1.0. The engine normalizes them automatically.</p>
            </div>
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Criterion Weights</h4>
              <p className="text-sm body">Weights are relative. 30/25/20/15/10 = 30%, 25%, 20%, 15%, 10%. Don't worry about summing to 100.</p>
            </div>
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Monte Carlo Iterations</h4>
              <p className="text-sm body">10,000 is default. Increase for more precision (slower). 1,000 is fine for quick checks.</p>
            </div>
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Scenario Inputs</h4>
              <p className="text-sm body">Modify probabilities, payoffs, or criterion scores in scenarios. The simulation uses scenario values over baseline.</p>
            </div>
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Sensitivity = No Results?</h4>
              <p className="text-sm body">If sensitivity analysis shows nothing, your decision is robust. Try creating more diverse scenarios.</p>
            </div>
            <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-600" /> Sharing</h4>
              <p className="text-sm body">Use "Share" on a decision to generate a read-only link for stakeholders.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card p-6 text-center print:hidden">
        <h3 className="heading-4 mb-2">Need Help?</h3>
        <p className="body mb-4">Check the <Link to="/how-it-works" className="text-brand-600 hover:underline">How It Works</Link> page or <Link to="/use-cases" className="text-brand-600 hover:underline">Use Cases</Link> for more examples.</p>
        <Link to="/decisions/new" className="btn-primary inline-flex">
          <ArrowRightIcon className="h-5 w-5" /> Create Your First Decision
        </Link>
      </div>
    </div>
  );
}