export const INDUSTRY_OPTIONS = [
  { value: "construction", label: "Construction & Engineering" },
  { value: "hotel", label: "Hotel & Hospitality" },
  { value: "restaurant", label: "Restaurant & Food Service" },
  { value: "retail", label: "E-commerce & Retail" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "dental", label: "Dental Clinic" },
  { value: "finance", label: "Banking & Finance" },
  { value: "tech", label: "Technology & Software" },
  { value: "real_estate", label: "Real Estate" },
  { value: "education", label: "Education & Training" },
  { value: "legal", label: "Legal Services" },
  { value: "beauty", label: "Salon & Beauty" },
  { value: "fitness", label: "Fitness & Wellness" },
  { value: "automotive", label: "Automotive" },
  { value: "logistics", label: "Logistics & Transport" },
  { value: "other", label: "Other" },
] as const

export type IndustryValue = typeof INDUSTRY_OPTIONS[number]["value"]
