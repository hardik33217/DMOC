import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, BuildingOffice2Icon, PhoneIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../utils/api";
import { useBusiness } from "../../context/BusinessContext";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { currentBusiness } = useBusiness();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 15 Days");
  const [defaultLeadTimeDays, setDefaultLeadTimeDays] = useState<number>(3);

  const businessId = currentBusiness?.id;

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get("/suppliers", { params: { businessId } });
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });

  const createSupplierMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/suppliers", {
        businessId,
        name,
        contactPerson,
        phone,
        paymentTerms,
        defaultLeadTimeDays: Number(defaultLeadTimeDays),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsAddModalOpen(false);
      setName("");
      setContactPerson("");
      setPhone("");
    },
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Suppliers & Wholesale Terms</h1>
          <p className="body text-sm text-text-light-muted dark:text-text-dark-muted">
            Track lead times, payment credit terms, and quoted prices per supplier
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-sm text-text-light-muted dark:text-text-dark-muted animate-pulse">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-text-light-muted dark:text-text-dark-muted card rounded-2xl">
            No suppliers saved. Add your primary wholesale vendor to monitor delivery lead times!
          </div>
        ) : (
          suppliers.map((s: any) => (
            <div key={s.id} className="card p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-light dark:text-text-dark">{s.name}</h3>
                    {s.contactPerson && (
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted">{s.contactPerson}</p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-text-light-muted">
                  {s.paymentTerms || "Cash"}
                </span>
              </div>

              <div className="pt-2 border-t border-surface-light-border dark:border-surface-dark-border space-y-1.5 text-xs text-text-light-muted dark:text-text-dark-muted">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    <span>{s.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Lead Time: <strong>{s.defaultLeadTimeDays} days</strong></span>
                </div>
                <div className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 pt-1">
                  {s.quotes?.length || 0} Products Quoted
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-light-border dark:border-surface-dark-border">
              <h3 className="text-base font-bold text-text-light dark:text-text-dark">Add New Supplier</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metro FMCG, Apex Pharma"
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 15, COD"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  value={defaultLeadTimeDays}
                  onChange={(e) => setDefaultLeadTimeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim() || createSupplierMutation.isPending}
                onClick={() => createSupplierMutation.mutate()}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                {createSupplierMutation.isPending ? "Adding..." : "Save Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
