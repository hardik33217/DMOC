import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { DecisionCategory, CriterionDirection, RiskLevel, DecisionWithRelations } from "@decisionos/shared";

const stepSchemas = {
  1: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional(),
    category: z.enum(["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]),
    question: z.string().min(1, "Question is required").max(1000),
    deadline: z.string().optional(),
  }),
  2: z.object({
    alternatives: z.array(z.object({
      title: z.string().min(1, "Title required").max(200),
      description: z.string().max(2000).optional(),
    })).min(2, "At least 2 alternatives required"),
  }),
  3: z.object({
    outcomes: z.array(z.object({
      alternativeId: z.string(),
      title: z.string().min(1, "Title required").max(200),
      description: z.string().max(2000).optional(),
      probability: z.number().min(0).max(1),
      monetaryPayoff: z.number().optional(),
      utilityScore: z.number().min(0).max(100).optional(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
    })).optional(),
  }),
  4: z.object({
    criteria: z.array(z.object({
      name: z.string().min(1, "Name required").max(100),
      description: z.string().max(1000).optional(),
      weight: z.number().min(0).max(100),
      direction: z.enum(["maximize", "minimize"]),
    })).optional(),
  }),
};

type Step1Data = z.infer<typeof stepSchemas[1]>;
type Step2Data = z.infer<typeof stepSchemas[2]>;
type Step3Data = z.infer<typeof stepSchemas[3]>;
type Step4Data = z.infer<typeof stepSchemas[4]>;

const steps = [
  { num: 1, title: "Define", desc: "What are you deciding?" },
  { num: 2, title: "Alternatives", desc: "What are your options?" },
  { num: 3, title: "Outcomes", desc: "What could happen?" },
  { num: 4, title: "Criteria", desc: "What matters most?" },
  { num: 5, title: "Review", desc: "Check and simulate" },
];

const categories: { value: DecisionCategory; label: string }[] = [
  { value: "career", label: "Career" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "project", label: "Project" },
  { value: "resource_allocation", label: "Resource Allocation" },
  { value: "other", label: "Other" },
];

const riskLevels: { value: RiskLevel; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

export default function DecisionWizardPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const navigate = useNavigate();
  const isEditing = !!id;
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [loading, setLoading] = useState(false);
  const [existingDecision, setExistingDecision] = useState<DecisionWithRelations | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors }, reset } = useForm<Step1Data & Step2Data & Step3Data & Step4Data>({
    resolver: zodResolver(stepSchemas[currentStep as keyof typeof stepSchemas]),
    defaultValues: {
      category: "other",
      alternatives: [{ title: "", description: "" }, { title: "", description: "" }],
      outcomes: [],
      criteria: [],
    },
  });

  const { fields: altFields, append: appendAlt, remove: removeAlt } = useFieldArray({ control, name: "alternatives" });
  const { append: appendOutcome, remove: removeOutcome } = useFieldArray({ control, name: "outcomes" });
  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion } = useFieldArray({ control, name: "criteria" });

  const alternatives = watch("alternatives") || [];
  const outcomes = watch("outcomes") || [];
  const criteria = watch("criteria") || [];

  useEffect(() => {
    if (isEditing && id) {
      loadDecision();
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [id, isEditing, templateId]);

  const loadTemplate = async (tmplId: string) => {
    try {
      const response = await api.get("/decisions/templates");
      const templates = response.data.data;
      const tmpl = templates.find((t: any) => t.id === tmplId);
      if (tmpl && tmpl.decision) {
        reset({
          title: tmpl.decision.title,
          description: tmpl.decision.description || "",
          category: tmpl.category,
          question: tmpl.decision.question,
          deadline: "",
          alternatives: tmpl.decision.alternatives.map((a: any) => ({ title: a.title, description: a.description || "" })),
          criteria: tmpl.decision.criteria.map((c: any) => ({ name: c.name, description: "", weight: c.weight, direction: c.direction })),
          outcomes: (tmpl.decision.outcomes || []).map((o: any) => ({
            alternativeId: o.alternativeTitle || tmpl.decision.alternatives[0]?.title || "",
            title: o.title,
            description: "",
            probability: o.probability,
            monetaryPayoff: o.monetaryPayoff,
            utilityScore: o.utilityScore,
            riskLevel: o.riskLevel,
          })),
        });
        toast.success(`Loaded template: ${tmpl.name}`);
      }
    } catch {
      toast.error("Failed to load template");
    }
  };

  const loadDecision = async () => {
    try {
      const response = await api.get(`/decisions/${id}`);
      const decision = response.data.data;
      setExistingDecision(decision);
      const idToTitleMap = new Map((decision.alternatives || []).map((a: { id: string; title: string }) => [a.id, a.title]));
      reset({
        title: decision.title,
        description: decision.description,
        category: decision.category,
        question: decision.question,
        deadline: decision.deadline ? new Date(decision.deadline).toISOString().split("T")[0] : "",
        alternatives: decision.alternatives?.map((a: { title: string; description: string | null }) => ({ title: a.title, description: a.description || "" })) || [],
        outcomes: decision.outcomes?.map((o: { alternativeId: string; title: string; description: string | null; probability: number; monetaryPayoff: number | null; utilityScore: number | null; riskLevel: RiskLevel }) => ({ alternativeId: idToTitleMap.get(o.alternativeId) || o.alternativeId, title: o.title, description: o.description || "", probability: o.probability, monetaryPayoff: o.monetaryPayoff ?? undefined, utilityScore: o.utilityScore ?? undefined, riskLevel: o.riskLevel })) || [],
        criteria: decision.criteria?.map((c: { name: string; description: string | null; weight: number; direction: CriterionDirection }) => ({ name: c.name, description: c.description || "", weight: c.weight, direction: c.direction })) || [],
      });
    } catch {
      toast.error("Failed to load decision");
      navigate("/decisions");
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const schema = stepSchemas[step as keyof typeof stepSchemas];
    if (!schema) return true;
    const data = watch();
    const result = schema.safeParse(data);
    if (!result.success) {
      result.error.errors.forEach(e => {
        const path = e.path.join(".");
        if (path) { (errors as Record<string, unknown>)[path] = { message: e.message }; }
      });
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (await validateStep(currentStep)) {
      setDirection("forward");
      setCurrentStep(s => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    setDirection("backward");
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  const onSubmit = async () => {
    if (!(await validateStep(4))) { setCurrentStep(4); return; }
    setLoading(true);
    try {
      const data = watch();
      const decisionData = {
        title: data.title,
        description: data.description,
        category: data.category,
        question: data.question,
        deadline: data.deadline || null,
        status: "active" as const,
      };

      let decisionId = id;
      if (isEditing && id) {
        await api.patch(`/decisions/${id}`, decisionData);
      } else {
        const response = await api.post("/decisions", decisionData);
        decisionId = response.data.data.id;
      }

      if (!decisionId) throw new Error("No decision ID");

      const altMap = new Map<string, string>();
      for (let i = 0; i < data.alternatives.length; i++) {
        const alt = data.alternatives[i];
        if (!alt) continue;
        let altId: string;
        if (isEditing && existingDecision?.alternatives?.[i]?.id) {
          altId = existingDecision.alternatives[i].id;
          await api.patch(`/decisions/${decisionId}/alternatives/${altId}`, { title: alt.title, description: alt.description, order: i });
        } else {
          const response = await api.post(`/decisions/${decisionId}/alternatives`, { title: alt.title, description: alt.description, order: i });
          altId = response.data.data.id;
        }
        altMap.set(alt.title, altId);
      }

      for (let i = 0; i < (data.criteria?.length || 0); i++) {
        const crit = data.criteria?.[i];
        if (!crit) continue;
        if (isEditing && existingDecision?.criteria?.[i]?.id) {
          await api.patch(`/decisions/${decisionId}/criteria/${existingDecision.criteria[i].id}`, { ...crit, order: i });
        } else {
          await api.post(`/decisions/${decisionId}/criteria`, { ...crit, order: i });
        }
      }

      for (const outcome of data.outcomes || []) {
        const altId = altMap.get(alternatives.find(a => a.title === outcome.alternativeId)?.title || "");
        if (altId) {
          await api.post(`/decisions/${decisionId}/outcomes`, { ...outcome, alternativeId: altId });
        }
      }

      await api.post(`/decisions/${decisionId}/scenarios`, { name: "Baseline", description: "Original assumptions", isBaseline: true });

      toast.success(isEditing ? "Decision updated" : "Decision created");
      navigate(`/decisions/${decisionId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save decision");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="label">Decision Title</label>
            <input id="title" {...register("title")} className={`input ${errors.title ? "input-error" : ""}`} placeholder="e.g., Which job offer should I accept?" />
            {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="question" className="label">The Decision Question</label>
            <textarea id="question" {...register("question")} rows={3} className={`input ${errors.question ? "input-error" : ""}`} placeholder="What exactly are you trying to decide?" />
            {errors.question && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.question.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="label">Description (optional)</label>
            <textarea id="description" {...register("description")} rows={3} className="input" placeholder="Context, background, constraints..." />
          </div>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" {...register("category")} className="input">
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="deadline" className="label">Deadline (optional)</label>
            <input id="deadline" type="date" {...register("deadline")} className="input" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6">
          <p className="body">Add all the options you're considering. You need at least 2.</p>
          <div className="space-y-4">
            {altFields.map((field, index) => (
              <motion.div key={field.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-4 flex gap-4">
                <span className="text-lg font-bold text-text-light-muted dark:text-text-dark-muted shrink-0">{index + 1}</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="label">Alternative Title</label>
                    <input {...register(`alternatives.${index}.title`)} className={`input ${errors.alternatives?.[index]?.title ? "input-error" : ""}`} placeholder="e.g., Job Offer A" />
                  </div>
                  <div>
                    <label className="label">Description (optional)</label>
                    <textarea {...register(`alternatives.${index}.description`)} rows={2} className="input" placeholder="Key details..." />
                  </div>
                </div>
                {altFields.length > 2 && (
                  <button type="button" onClick={() => removeAlt(index)} className="btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 self-start" aria-label="Remove alternative">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          {altFields.length < 10 && (
            <button type="button" onClick={() => appendAlt({ title: "", description: "" })} className="btn-secondary w-full">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Alternative
            </button>
          )}
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <p className="body">For each alternative, define possible outcomes with probabilities. Probabilities will be normalized to 100% per alternative.</p>
          {alternatives.length === 0 ? (
            <p className="text-text-light-muted dark:text-text-dark-muted">Add alternatives first in Step 2.</p>
          ) : (
            <div className="space-y-4">
              {alternatives.map((alt: { title: string }, altIndex: number) => (
                <>
                  <div key={altIndex} className="card p-4">
                    <h4 className="font-medium text-text-light dark:text-text-dark mb-3">{alt.title} Outcomes</h4>
                    <div className="space-y-3">
                      {outcomes.filter(o => o.alternativeId === alt.title).map((outcome, oIndex) => (
                        <motion.div key={oIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3 p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                          <input {...register(`outcomes.${outcomes.indexOf(outcome)}.title`)} className="input flex-1" placeholder="Outcome title (e.g., Promotion)" />
                          <input {...register(`outcomes.${outcomes.indexOf(outcome)}.probability`)} type="number" step="0.01" min="0" max="1" className="input w-24" placeholder="Prob." value={outcome.probability} onChange={e => { const arr = [...outcomes]; arr[outcomes.indexOf(outcome)] = { ...outcome, probability: parseFloat(e.target.value) || 0 }; setValue("outcomes", arr); }} />
                          <input {...register(`outcomes.${outcomes.indexOf(outcome)}.monetaryPayoff`)} type="number" step="1000" className="input w-32" placeholder="Payoff ($)" value={outcome.monetaryPayoff} onChange={e => { const arr = [...outcomes]; arr[outcomes.indexOf(outcome)] = { ...outcome, monetaryPayoff: parseFloat(e.target.value) || undefined }; setValue("outcomes", arr); }} />
                          <select {...register(`outcomes.${outcomes.indexOf(outcome)}.riskLevel`)} className="input w-28" value={outcome.riskLevel} onChange={e => { const arr = [...outcomes]; arr[outcomes.indexOf(outcome)] = { ...outcome, riskLevel: e.target.value as RiskLevel }; setValue("outcomes", arr); }}>
                            {riskLevels.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <button type="button" onClick={() => removeOutcome(outcomes.indexOf(outcome))} className="btn-ghost text-red-600 p-2" aria-label="Remove outcome"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </motion.div>
                      ))}
                    </div>
                    <button type="button" onClick={() => appendOutcome({ alternativeId: alt.title, title: "", probability: 0, riskLevel: "low" })} className="btn-secondary btn-sm mt-2">+ Add Outcome</button>
                  </div>
                </>
              ))}
            </div>
          )}
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <p className="body">Define what matters for this decision. Set weights (0-100) and whether higher or lower is better.</p>
          <div className="space-y-4">
            {criteriaFields.map((field, index) => (
              <motion.div key={field.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="label">Criterion Name</label>
                  <input {...register(`criteria.${index}.name`)} className={`input ${errors.criteria?.[index]?.name ? "input-error" : ""}`} placeholder="e.g., Total Compensation" />
                </div>
                <div className="flex-1">
                  <label className="label">Weight (0-100)</label>
                  <input {...register(`criteria.${index}.weight`, { valueAsNumber: true })} type="number" min="0" max="100" className={`input ${errors.criteria?.[index]?.weight ? "input-error" : ""}`} placeholder="30" />
                </div>
                <div className="flex-1">
                  <label className="label">Direction</label>
                  <select {...register(`criteria.${index}.direction`)} className="input">
                    <option value="maximize">Maximize (higher is better)</option>
                    <option value="minimize">Minimize (lower is better)</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeCriterion(index)} className="btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 self-end" aria-label="Remove criterion"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </motion.div>
            ))}
          </div>
          <button type="button" onClick={() => appendCriterion({ name: "", weight: 1, direction: "maximize" })} className="btn-secondary w-full">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Criterion
          </button>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <p className="body">Review your decision setup before running simulations.</p>
          <div className="card p-6 space-y-4">
            <h3 className="heading-4">Summary</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-text-light-muted dark:text-text-dark-muted">Title</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{watch("title") || "—"}</dd>
              <dt className="text-text-light-muted dark:text-text-dark-muted">Question</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{watch("question") || "—"}</dd>
              <dt className="text-text-light-muted dark:text-text-dark-muted">Category</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{categories.find(c => c.value === watch("category"))?.label || "—"}</dd>
              <dt className="text-text-light-muted dark:text-text-dark-muted">Alternatives</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{alternatives.length}</dd>
              <dt className="text-text-light-muted dark:text-text-dark-muted">Criteria</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{criteria.length}</dd>
              <dt className="text-text-light-muted dark:text-text-dark-muted">Outcomes</dt>
              <dd className="font-medium text-text-light dark:text-text-dark">{outcomes.length}</dd>
            </dl>
            <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
              <h4 className="font-medium mb-2">Warnings</h4>
              <ul className="space-y-1 text-sm text-text-light-muted dark:text-text-dark-muted">
                {alternatives.length < 2 && <li>• At least 2 alternatives recommended</li>}
                {criteria.length === 0 && <li>• No criteria defined — weighted scoring will not run</li>}
                {outcomes.length === 0 && <li>• No outcomes defined — EMV/utility calculations will not run</li>}
                {outcomes.some(o => o.probability === 0) && <li>• Some outcomes have 0 probability</li>}
                {criteria.some(c => c.weight === 0) && <li>• Some criteria have 0 weight</li>}
              </ul>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/decisions" className="btn-ghost"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back</Link>
        <h1 className="heading-3">{isEditing ? "Edit Decision" : "Create Decision"}</h1>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {steps.map((step, index) => (
          <motion.div key={step.num} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${currentStep > step.num ? "bg-brand-600 text-white" : currentStep === step.num ? "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400" : "bg-surface-light-border text-text-light-muted dark:bg-surface-dark-border dark:text-text-dark-muted"}`}>
              {currentStep > step.num ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : step.num}
            </div>
            {index < steps.length - 1 && <div className={`h-0.5 w-16 ${currentStep > step.num + 1 ? "bg-brand-600" : "bg-surface-light-border dark:bg-surface-dark-border"}`} />}
          </motion.div>
        ))}
      </div>

      <div className="md:hidden mb-6">
        <select value={currentStep} onChange={e => { const next = parseInt(e.target.value); if (next < currentStep) setDirection("backward"); else setDirection("forward"); setCurrentStep(next); }} className="input">
          {steps.map(s => <option key={s.num} value={s.num}>Step {s.num}: {s.title}</option>)}
        </select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction === "forward" ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === "forward" ? -50 : 50 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8 space-y-6">
            {renderStep()}
            <div className="flex justify-between pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary">Back</button>
              )}
              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="btn-primary">Next</button>
              ) : (
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Saving..." : isEditing ? "Update Decision" : "Create Decision"}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}