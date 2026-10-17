import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  status: string;
  isExisting: boolean;
  country: string;
  city?: string | null;
  serviceArea?: string | null;
  categories?: string | null;
  currency: string;
  currencySymbol: string;
  taxName: string;
  taxRate: number;
  units?: string | null;
  monthlyRevenue?: number | null;
  monthlyCost?: number | null;
  learningMode: boolean;
  enterpriseMode: boolean;
  isSample: boolean;
  hasExistingData?: boolean;
  role?: string;
  counts?: {
    products: number;
    suppliers: number;
    decisions: number;
    reports: number;
  };
}

interface BusinessContextType {
  businesses: BusinessProfile[];
  currentBusiness: BusinessProfile | null;
  loading: boolean;
  switchBusiness: (id: string) => void;
  createBusiness: (data: Partial<BusinessProfile>) => Promise<BusinessProfile>;
  updateBusiness: (id: string, data: Partial<BusinessProfile>) => Promise<BusinessProfile>;
  seedSampleData: (id: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/businesses");
      if (res.data.success && Array.isArray(res.data.data)) {
        const list: BusinessProfile[] = res.data.data;
        setBusinesses(list);

        if (list.length === 0) {
          setShowOnboarding(true);
          setCurrentBusiness(null);
        } else {
          // Check saved business ID in localStorage
          const savedId = localStorage.getItem("decisionos_active_business_id");
          const matched = list.find((b) => b.id === savedId) || list[0];
          setCurrentBusiness(matched);
          localStorage.setItem("decisionos_active_business_id", matched.id);
        }
      }
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const switchBusiness = (id: string) => {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setCurrentBusiness(found);
      localStorage.setItem("decisionos_active_business_id", found.id);
    }
  };

  const createBusiness = async (data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    const res = await api.post("/businesses", data);
    const newBiz: BusinessProfile = res.data.data;
    setBusinesses((prev) => [newBiz, ...prev]);
    setCurrentBusiness(newBiz);
    localStorage.setItem("decisionos_active_business_id", newBiz.id);
    setShowOnboarding(false);
    return newBiz;
  };

  const updateBusiness = async (id: string, data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    const res = await api.patch(`/businesses/${id}`, data);
    const updated: BusinessProfile = res.data.data;
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    if (currentBusiness?.id === id) {
      setCurrentBusiness((prev) => (prev ? { ...prev, ...updated } : updated));
    }
    return updated;
  };

  const seedSampleData = async (id: string): Promise<void> => {
    await api.post(`/businesses/${id}/seed-sample`);
    await fetchBusinesses();
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusiness,
        loading,
        switchBusiness,
        createBusiness,
        updateBusiness,
        seedSampleData,
        refreshBusinesses: fetchBusinesses,
        showOnboarding,
        setShowOnboarding,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return ctx;
}
