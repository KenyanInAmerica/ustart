export const GRADUATION_TIMELINE_OPTIONS = [
  { value: "less_than_6_months", label: "Less than 6 months" },
  { value: "6_months_to_1_year", label: "6 months – 1 year" },
  { value: "1_to_2_years", label: "1 – 2 years" },
  { value: "2_to_3_years", label: "2 – 3 years" },
  { value: "3_to_4_years", label: "3 – 4 years" },
  { value: "4_plus_years", label: "4+ years" },
] as const;

export type GraduationTimeline =
  (typeof GRADUATION_TIMELINE_OPTIONS)[number]["value"];

export const MAIN_CONCERN_OPTIONS = [
  { value: "banking_credit", label: "Banking & Credit" },
  { value: "ssn", label: "Social Security Number (SSN)" },
  { value: "housing", label: "Housing & Accommodation" },
  { value: "transportation", label: "Transportation" },
  { value: "health_insurance", label: "Health Insurance" },
  { value: "tax_finance", label: "Tax & Finance" },
  { value: "campus_life", label: "Campus Life" },
  { value: "community_social", label: "Community & Social" },
  { value: "other", label: "Other" },
] as const;
