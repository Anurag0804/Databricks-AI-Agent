/**
 * API client for Ghana Healthcare Intelligence Platform
 * Communicates with the FastAPI backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only log actual server errors; suppress network errors (backend offline)
    // since all pages gracefully fall back to mock data
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// ===== TYPES =====

export interface Facility {
  unique_id: string;
  name: string;
  facilityTypeId?: string;
  operatorTypeId?: string;
  organization_type?: string;
  address_city?: string;
  address_stateOrRegion?: string;
  address_countryCode?: string;
  organizationDescription?: string;
  phone_numbers: string[];
  email: string[];
  website?: string;
  address_line1?: string;
  address_line2?: string;
  address_postalCode?: string;
  specialties: string[];
  procedure: string[];
  equipment: string[];
  capability: string[];
  capacity?: number;
  numberDoctors?: number;
  acceptsVolunteers?: boolean;
  operatingHours?: string;
  completeness_score?: number;
  has_contact_info?: boolean;
  has_any_contact?: boolean;
  has_procedures?: boolean;
  has_equipment?: boolean;
  has_capability?: boolean;
  has_specialties?: boolean;
  section_1_completeness?: number;
  section_2_completeness?: number;
  section_3_completeness?: number;
  section_4_completeness?: number;
  section_5_completeness?: number;
  ingestion_date?: string;
  last_updated?: string;
  is_active?: boolean;
  data_source?: string;
  source_id?: string;
  enriched_procedures?: string[];
  enriched_equipment?: string[];
  enriched_capabilities?: string[];
  enrichment_success?: boolean;
  enrichment_date?: string;
  latitude?: number;
  longitude?: number;
}

export interface FacilityListResponse {
  items: Facility[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RegionalSummary {
  address_stateOrRegion: string;
  total_facilities: number;
  total_hospitals: number;
  total_clinics: number;
  total_pharmacies: number;
  total_dentists: number;
  total_doctor_offices: number;
  total_ngos: number;
  total_bed_capacity: number;
  total_doctors: number;
  facilities_with_doctors: number;
  facilities_with_beds: number;
  avg_completeness_score?: number;
  facilities_with_contact: number;
  facilities_accepting_volunteers: number;
  facilities_with_procedures: number;
  facilities_with_equipment: number;
  facilities_with_capability: number;
  unique_specialties_count: number;
  top_5_specialties: string[];
  has_emergency_care: boolean;
  has_maternal_care: boolean;
  has_pediatric_care: boolean;
  public_facilities: number;
  private_facilities: number;
  is_medical_desert?: boolean;
  desert_severity?: string;
  desert_reasons: string[];
  last_updated?: string;
}

export interface RegionalListResponse {
  items: RegionalSummary[];
  total: number;
  national_aggregates?: Record<string, number | string>;
}

export interface RAGQueryRequest {
  question: string;
  top_k?: number;
  filters?: Record<string, string | number>;
  similarity_threshold?: number;
}

export interface RAGSource {
  name: string;
  unique_id: string;
  similarity_score: number;
  facility_type?: string;
  region?: string;
  city?: string;
  description?: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources: RAGSource[];
  retrieval_time: number;
  generation_time: number;
  num_sources: number;
  success: boolean;
  question: string;
  model?: string;
}

export interface FacilityFilters {
  page?: number;
  page_size?: number;
  region?: string;
  city?: string;
  facility_type?: string;
  operator_type?: string;
  has_doctors?: boolean;
  has_beds?: boolean;
  min_completeness?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ===== API FUNCTIONS =====

// Health check
export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

// --- Facilities ---
export async function getFacilities(filters: FacilityFilters = {}): Promise<FacilityListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get(`/facilities?${params.toString()}`);
  return data;
}

export async function getFacility(id: string): Promise<Facility> {
  const { data } = await api.get(`/facilities/${id}`);
  return data;
}

export async function searchFacilities(
  q: string,
  page = 1,
  page_size = 20,
  region?: string
): Promise<FacilityListResponse> {
  const params = new URLSearchParams({ q, page: String(page), page_size: String(page_size) });
  if (region) params.append('region', region);
  const { data } = await api.get(`/facilities/search/text?${params.toString()}`);
  return data;
}

// --- Regional ---
export async function getRegionalSummary(
  sort_by = 'total_facilities',
  sort_order = 'desc'
): Promise<RegionalListResponse> {
  const { data } = await api.get(`/regional/summary?sort_by=${sort_by}&sort_order=${sort_order}`);
  return data;
}

export async function getRegionDetail(region: string): Promise<RegionalSummary> {
  const { data } = await api.get(`/regional/${encodeURIComponent(region)}`);
  return data;
}

export async function compareRegions(regions: string[]): Promise<RegionalSummary[]> {
  const params = regions.map((r) => `regions=${encodeURIComponent(r)}`).join('&');
  const { data } = await api.get(`/regional/comparison/multi?${params}`);
  return data;
}

export async function getTopPerformersCapacity(limit = 10): Promise<RegionalListResponse> {
  const { data } = await api.get(`/regional/top-performers/capacity?limit=${limit}`);
  return data;
}

export async function getTopPerformersCoverage(limit = 10): Promise<RegionalListResponse> {
  const { data } = await api.get(`/regional/top-performers/coverage?limit=${limit}`);
  return data;
}

export async function getMedicalDeserts(severity?: string): Promise<RegionalListResponse> {
  const params = severity ? `?severity=${severity}` : '';
  const { data } = await api.get(`/regional/medical-deserts/list${params}`);
  return data;
}

// --- RAG ---
export async function queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse> {
  const { data } = await api.post('/rag/query', request);
  return data;
}

export default api;
