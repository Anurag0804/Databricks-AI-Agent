/**
 * Application constants and configuration
 */

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Brong Ahafo',
  'Western North',
  'Ahafo',
  'Bono East',
  'Oti',
  'North East',
  'Savannah',
] as const;

export const FACILITY_TYPES = [
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'clinic', label: 'Clinic', icon: '🩺' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'dentist', label: 'Dentist', icon: '🦷' },
  { value: 'doctor', label: 'Doctor Office', icon: '👨‍⚕️' },
  { value: 'health_post', label: 'Health Post', icon: '🏠' },
  { value: 'maternity_home', label: 'Maternity Home', icon: '👶' },
] as const;

export const OPERATOR_TYPES = [
  { value: 'public', label: 'Government/Public' },
  { value: 'private', label: 'Private' },
  { value: 'ngo', label: 'NGO' },
  { value: 'faith_based', label: 'Faith-Based' },
] as const;

export const QUALITY_TIERS = {
  excellent: { label: 'Excellent', color: '#22C55E', min: 0.8 },
  good: { label: 'Good', color: '#3B82F6', min: 0.6 },
  fair: { label: 'Fair', color: '#EAB308', min: 0.4 },
  poor: { label: 'Poor', color: '#EF4444', min: 0 },
} as const;

export const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  high: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  moderate: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.3)' },
  low: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' },
} as const;

export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#A855F7', '#F43F5E', '#22D3EE', '#FBBF24', '#4ADE80',
  '#C084FC',
] as const;

export const RAG_EXAMPLE_QUERIES = [
  "Which hospitals in Accra have ICU facilities?",
  "Show me medical deserts in Northern Region",
  "What's the average completeness score in Ashanti?",
  "List facilities with more than 50 beds",
  "Find clinics that offer maternal care services",
  "Which regions have no emergency services?",
  "Compare healthcare in Greater Accra vs Northern",
  "What facilities accept volunteers?",
] as const;

export const GHANA_CENTER: [number, number] = [7.9465, -1.0232];
export const GHANA_BOUNDS: [[number, number], [number, number]] = [[4.5, -3.3], [11.2, 1.2]];

// Map region names to approximate lat/lng for map rendering
export const REGION_COORDINATES: Record<string, [number, number]> = {
  'Greater Accra': [5.6037, -0.1870],
  'Ashanti': [6.7470, -1.5209],
  'Western': [5.3960, -1.9740],
  'Eastern': [6.2372, -0.4503],
  'Central': [5.5000, -1.0000],
  'Volta': [6.6000, 0.4500],
  'Northern': [9.4000, -1.0000],
  'Upper East': [10.7000, -1.0500],
  'Upper West': [10.2500, -2.1500],
  'Brong Ahafo': [7.9500, -1.7500],
  'Western North': [6.3000, -2.5000],
  'Ahafo': [7.0000, -2.3500],
  'Bono East': [7.7500, -1.1000],
  'Oti': [7.5000, 0.3000],
  'North East': [10.5000, -0.3500],
  'Savannah': [9.0000, -1.8000],
};

export function getQualityTier(score: number | null | undefined) {
  if (score === null || score === undefined) return { label: 'Unknown', color: '#64748B' };
  if (score >= 0.8) return QUALITY_TIERS.excellent;
  if (score >= 0.6) return QUALITY_TIERS.good;
  if (score >= 0.4) return QUALITY_TIERS.fair;
  return QUALITY_TIERS.poor;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString();
}
