import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  BuildingStorefrontIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useBusiness } from "../context/BusinessContext";

const BUSINESS_MODELS = [
  { id: "pharmacy", name: "Pharmacy / Medical Store", desc: "Prescriptions, OTC medicine, NPPA price ceiling checks, batch/expiry", icon: "💊" },
  { id: "grocery", name: "Grocery & Convenience", desc: "FMCG, packaged foods, snacks, dairy, Open Food Facts integration", icon: "🛒" },
  { id: "quick_commerce", name: "Quick Commerce / Dark Store", desc: "High velocity inventory, short lead times, hyper-local delivery", icon: "⚡" },
  { id: "retail", name: "Physical Retail / Store", desc: "General merchandise, apparel, electronics, footfall demand", icon: "🏬" },
  { id: "wholesale", name: "Wholesale & Distribution", desc: "Bulk packs, MOQ thresholds, distributor tier pricing, credit terms", icon: "📦" },
  { id: "restaurant", name: "Restaurant & Cafe", desc: "Perishable ingredients, daily prep, weekend surges, spoilage risk", icon: "🍽️" },
  { id: "ecommerce", name: "E-Commerce / D2C", desc: "Online fulfillment, shipping fees, return rates, platform margins", icon: "🌐" },
  { id: "service", name: "Service Business", desc: "Equipment capital purchases, hourly capacity, contractor rates", icon: "💼" },
  { id: "startup", name: "Startup / Entrepreneur", desc: "Business planning, financial runway, CAC/LTV, hiring decisions", icon: "🚀" },
];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  pharmacy: ["Analgesics & Pain", "Antibiotics", "Gastrointestinal", "Vitamins & Supplements", "Diabetes Care", "First Aid", "Personal Care"],
  grocery: ["Snacks & Beverages", "Dairy & Bread", "Staples & Grains", "Personal Care", "Cleaning & Household", "Instant Foods"],
  quick_commerce: ["Snacks & Munchies", "Beverages", "Dairy & Eggs", "Fresh Fruits & Veg", "Emergency Pharmacy"],
  retail: ["Apparel & Fashion", "Electronics", "Home & Kitchen", "Stationery", "Footwear"],
  wholesale: ["Bulk Staples", "Packaged FMCG", "Industrial Supplies", "Packaging Materials"],
  restaurant: ["Dairy & Cheeses", "Poultry & Meat", "Produce & Vegetables", "Baking Supplies", "Beverages"],
  ecommerce: ["D2C Apparel", "Beauty & Cosmetics", "Consumer Electronics", "Accessories"],
  service: ["Professional Tools", "Hardware", "Office Equipment", "Software Licenses"],
  startup: ["Software Subscriptions", "Hardware & Laptops", "Marketing Assets", "Contractor Services"],
};

export default function BusinessOnboardingModal() {
  const { showOnboarding, setShowOnboarding, createBusiness, seedSampleData } = useBusiness();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form states (Questions 1 to 9)
  const [businessStage, setBusinessStage] = useState<"existing" | "planned">("existing");
  const [name, setName] = useState("");
  const [businessModel, setBusinessModel] = useState("grocery");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("Mumbai");
  const [serviceArea, setServiceArea] = useState("Local Ward / Metro");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Snacks & Beverages", "Dairy & Bread"]);
  const [currency, setCurrency] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [taxName, setTaxName] = useState("GST");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>("150000");
  const [monthlyCost, setMonthlyCost] = useState<string>("35000");
  const [hasExistingData, setHasExistingData] = useState<boolean>(true);
  const [learningMode, setLearningMode] = useState<boolean>(false);
  const [enterpriseMode, setEnterpriseMode] = useState<boolean>(false);
  const [autoSeedSample, setAutoSeedSample] = useState<boolean>(true);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleModelChange = (modelId: string) => {
    setBusinessModel(modelId);
    const suggested = CATEGORY_SUGGESTIONS[modelId] || ["General Products"];
    setSelectedCategories(suggested.slice(0, 3));
  };

  const handleFinish = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await createBusiness({
        name: name.trim(),
        type: businessModel,
        isExisting: businessStage === "existing",
        country,
        city,
        serviceArea,
        categories: JSON.stringify(selectedCategories),
        currency,
        currencySymbol,
        taxName,
        taxRate: Number(taxRate) || 0,
        units: JSON.stringify(["pcs", "packs", "boxes", "kg", "strips"]),
        monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : null,
        monthlyCost: monthlyCost ? Number(monthlyCost) : null,
        hasExistingData,
        learningMode,
        enterpriseMode,
      });

      if (autoSeedSample) {
        await seedSampleData(created.id);
      }
    } catch (err) {
      console.error("Onboarding failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition.Root show={showOnboarding} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-surface-light p-6 text-left shadow-2xl transition-all dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-surface-light-border dark:border-surface-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <BuildingStorefrontIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-bold text-text-light dark:text-text-dark">
                        Welcome to DMOC
                      </Dialog.Title>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                        Decision Marketing Operating System — Step {step} of 4
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="p-1 rounded-lg text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="grid grid-cols-4 gap-2 my-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all ${
                        s <= step ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Step 1: Model & Stage */}
                {step === 1 && (
                  <div className="space-y-4 py-2">
                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark">
                      1. What kind of business do you operate or plan to start?
                    </h3>

                    {/* Stage selector */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setBusinessStage("existing")}
                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                          businessStage === "existing"
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500"
                            : "border-surface-light-border dark:border-surface-dark-border text-text-light dark:text-text-dark"
                        }`}
                      >
                        🏪 Existing Operating Business
                      </button>
                      <button
                        type="button"
                        onClick={() => setBusinessStage("planned")}
                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                          businessStage === "planned"
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500"
                            : "border-surface-light-border dark:border-surface-dark-border text-text-light dark:text-text-dark"
                        }`}
                      >
                        🚀 Planned Business / Startup Idea
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {BUSINESS_MODELS.map((model) => (
                        <div
                          key={model.id}
                          onClick={() => handleModelChange(model.id)}
                          className={`cursor-pointer p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                            businessModel === model.id
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500"
                              : "border-surface-light-border dark:border-surface-dark-border hover:border-brand-300"
                          }`}
                        >
                          <div>
                            <div className="text-2xl mb-1">{model.icon}</div>
                            <div className="text-xs font-bold text-text-light dark:text-text-dark">{model.name}</div>
                            <div className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2 mt-0.5 leading-tight">
                              {model.desc}
                            </div>
                          </div>
                          {businessModel === model.id && (
                            <CheckCircleIcon className="h-4 w-4 text-brand-500 mt-2 self-end" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Modes toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-text-light dark:text-text-dark">
                        <input
                          type="checkbox"
                          checked={learningMode}
                          onChange={(e) => setLearningMode(e.target.checked)}
                          className="rounded text-brand-500 focus:ring-brand-500"
                        />
                        <AcademicCapIcon className="h-4 w-4 text-amber-500" />
                        <span>Student / Entrepreneur Learning Mode (shows educational tooltips & glossary)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2: Name & Geography */}
                {step === 2 && (
                  <div className="space-y-4 py-2">
                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark">
                      2. Business Identity & Location
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Apollo Chemist, Green Grocery Mart, QuickSnack DarkStore"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Service Area / Neighborhood
                        </label>
                        <input
                          type="text"
                          value={serviceArea}
                          onChange={(e) => setServiceArea(e.target.value)}
                          placeholder="e.g. Bandra West, 5km radius"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-2">
                        Main Product Categories (Select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(CATEGORY_SUGGESTIONS[businessModel] || []).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              selectedCategories.includes(cat)
                                ? "bg-brand-500 text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {selectedCategories.includes(cat) ? "✓ " : "+ "}
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Financial settings & Currency */}
                {step === 3 && (
                  <div className="space-y-4 py-2">
                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark">
                      3. Currency, Taxes & Financial Baselines
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            setCurrencySymbol(e.target.value === "INR" ? "₹" : e.target.value === "USD" ? "$" : "€");
                          }}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="AED">AED (د.إ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Tax Name
                        </label>
                        <input
                          type="text"
                          value={taxName}
                          onChange={(e) => setTaxName(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Default Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Enterprise Controls
                        </label>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-text-light dark:text-text-dark">
                          <input
                            type="checkbox"
                            checked={enterpriseMode}
                            onChange={(e) => setEnterpriseMode(e.target.checked)}
                            className="rounded text-brand-500 focus:ring-brand-500"
                          />
                          <span>Audit & Roles</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Approx Monthly Sales Revenue ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          value={monthlyRevenue}
                          onChange={(e) => setMonthlyRevenue(e.target.value)}
                          placeholder="e.g. 150000"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                          Fixed Monthly Operational Cost (Rent, Staff, Utilities) ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          value={monthlyCost}
                          onChange={(e) => setMonthlyCost(e.target.value)}
                          placeholder="e.g. 35000"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Existing Data & Sample Sandbox */}
                {step === 4 && (
                  <div className="space-y-4 py-2">
                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark">
                      4. Data Setup & Sample Workspace
                    </h3>

                    <div className="p-4 rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="hasData"
                          checked={hasExistingData}
                          onChange={(e) => setHasExistingData(e.target.checked)}
                          className="mt-1 rounded text-brand-500 focus:ring-brand-500"
                        />
                        <label htmlFor="hasData" className="text-xs text-text-light dark:text-text-dark cursor-pointer">
                          <span className="font-semibold block">I have existing product catalog or Excel sales data</span>
                          <span>You can import your Excel/CSV spreadsheets directly after setup.</span>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <input
                          type="checkbox"
                          id="autoSeed"
                          checked={autoSeedSample}
                          onChange={(e) => setAutoSeedSample(e.target.checked)}
                          className="mt-1 rounded text-brand-500 focus:ring-brand-500"
                        />
                        <label htmlFor="autoSeed" className="text-xs text-text-light dark:text-text-dark cursor-pointer">
                          <span className="font-semibold block flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                            <SparklesIcon className="h-4 w-4" />
                            Load Sample Benchmark Workspace
                          </span>
                          <span>
                            Seeds realistic products, suppliers, stock movements, and sales history (clearly marked as sample data) so you can test decision calculations immediately!
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-brand-50/60 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300">
                      <strong>Tagline:</strong> "Know the risk. Understand the opportunity. Decide with evidence."
                      <p className="mt-1 text-[11px] opacity-90">
                        DMOC never fabricates metrics. All outcomes distinguish observed facts from estimates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-light-border dark:border-surface-dark-border text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5"
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
                    </button>
                  ) : <div />}

                  {step < 4 ? (
                    <button
                      type="button"
                      disabled={step === 2 && !name.trim()}
                      onClick={() => setStep((s) => s + 1)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                      Continue <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting || !name.trim()}
                      onClick={handleFinish}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting ? "Configuring Workspace..." : "Launch Business Workspace"}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
