'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle, Building2, Users, BedDouble,
  ShieldAlert, MapPin, ChevronDown, ChevronRight,
} from 'lucide-react';
import { getMedicalDeserts, getRegionalSummary, type RegionalSummary } from '@/lib/api';
import { LoadingSpinner, ErrorState, SeverityBadge } from '@/components/ui';
import MetricCard from '@/components/MetricCard';
import { formatNumber } from '@/lib/constants';

const GhanaMap = dynamic(() => import('@/components/GhanaMap'), { ssr: false });

// Mock deserts
const MOCK_DESERTS: RegionalSummary[] = [
  { address_stateOrRegion: 'Upper West', total_facilities: 15, total_hospitals: 1, total_clinics: 8, total_pharmacies: 3, total_dentists: 0, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 95, total_doctors: 12, facilities_with_doctors: 8, facilities_with_beds: 4, avg_completeness_score: 0.28, facilities_with_contact: 9, facilities_accepting_volunteers: 2, facilities_with_procedures: 4, facilities_with_equipment: 3, facilities_with_capability: 5, unique_specialties_count: 4, top_5_specialties: ['General Medicine'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 10, private_facilities: 5, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Savannah', total_facilities: 8, total_hospitals: 1, total_clinics: 4, total_pharmacies: 1, total_dentists: 0, total_doctor_offices: 0, total_ngos: 2, total_bed_capacity: 45, total_doctors: 6, facilities_with_doctors: 4, facilities_with_beds: 2, avg_completeness_score: 0.22, facilities_with_contact: 5, facilities_accepting_volunteers: 1, facilities_with_procedures: 2, facilities_with_equipment: 1, facilities_with_capability: 2, unique_specialties_count: 3, top_5_specialties: ['General Medicine'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 6, private_facilities: 2, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'North East', total_facilities: 10, total_hospitals: 1, total_clinics: 5, total_pharmacies: 2, total_dentists: 0, total_doctor_offices: 0, total_ngos: 2, total_bed_capacity: 55, total_doctors: 8, facilities_with_doctors: 5, facilities_with_beds: 3, avg_completeness_score: 0.25, facilities_with_contact: 6, facilities_accepting_volunteers: 1, facilities_with_procedures: 3, facilities_with_equipment: 2, facilities_with_capability: 3, unique_specialties_count: 3, top_5_specialties: ['General Medicine'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 7, private_facilities: 3, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Upper East', total_facilities: 22, total_hospitals: 2, total_clinics: 12, total_pharmacies: 4, total_dentists: 1, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 150, total_doctors: 25, facilities_with_doctors: 12, facilities_with_beds: 6, avg_completeness_score: 0.32, facilities_with_contact: 14, facilities_accepting_volunteers: 3, facilities_with_procedures: 6, facilities_with_equipment: 5, facilities_with_capability: 7, unique_specialties_count: 5, top_5_specialties: ['General Medicine', 'Pediatrics'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 15, private_facilities: 7, is_medical_desert: true, desert_severity: 'high', desert_reasons: ['Insufficient doctors', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Oti', total_facilities: 18, total_hospitals: 2, total_clinics: 9, total_pharmacies: 3, total_dentists: 1, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 120, total_doctors: 18, facilities_with_doctors: 10, facilities_with_beds: 5, avg_completeness_score: 0.35, facilities_with_contact: 12, facilities_accepting_volunteers: 2, facilities_with_procedures: 5, facilities_with_equipment: 4, facilities_with_capability: 6, unique_specialties_count: 6, top_5_specialties: ['General Medicine', 'Pediatrics'], has_emergency_care: false, has_maternal_care: true, has_pediatric_care: false, public_facilities: 12, private_facilities: 6, is_medical_desert: true, desert_severity: 'high', desert_reasons: ['Insufficient doctors', 'No emergency care'] },
  { address_stateOrRegion: 'Northern', total_facilities: 38, total_hospitals: 4, total_clinics: 18, total_pharmacies: 8, total_dentists: 2, total_doctor_offices: 2, total_ngos: 4, total_bed_capacity: 280, total_doctors: 45, facilities_with_doctors: 20, facilities_with_beds: 10, avg_completeness_score: 0.38, facilities_with_contact: 22, facilities_accepting_volunteers: 5, facilities_with_procedures: 10, facilities_with_equipment: 8, facilities_with_capability: 12, unique_specialties_count: 8, top_5_specialties: ['General Medicine', 'Pediatrics'], has_emergency_care: false, has_maternal_care: true, has_pediatric_care: false, public_facilities: 25, private_facilities: 13, is_medical_desert: true, desert_severity: 'moderate', desert_reasons: ['No emergency care'] },
];

const ALL_MOCK_REGIONS: RegionalSummary[] = [
  ...MOCK_DESERTS,
  { address_stateOrRegion: 'Greater Accra', total_facilities: 245, total_hospitals: 35, total_clinics: 120, total_pharmacies: 45, total_dentists: 20, total_doctor_offices: 15, total_ngos: 10, total_bed_capacity: 3200, total_doctors: 890, facilities_with_doctors: 180, facilities_with_beds: 95, avg_completeness_score: 0.72, facilities_with_contact: 200, facilities_accepting_volunteers: 30, facilities_with_procedures: 85, facilities_with_equipment: 70, facilities_with_capability: 90, unique_specialties_count: 45, top_5_specialties: [], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 95, private_facilities: 150, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Ashanti', total_facilities: 178, total_hospitals: 28, total_clinics: 85, total_pharmacies: 32, total_dentists: 12, total_doctor_offices: 11, total_ngos: 10, total_bed_capacity: 2100, total_doctors: 520, facilities_with_doctors: 130, facilities_with_beds: 70, avg_completeness_score: 0.65, facilities_with_contact: 140, facilities_accepting_volunteers: 25, facilities_with_procedures: 60, facilities_with_equipment: 55, facilities_with_capability: 65, unique_specialties_count: 35, top_5_specialties: [], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 80, private_facilities: 98, is_medical_desert: false, desert_reasons: [] },
];

export default function DesertsPage() {
  const [deserts, setDeserts] = useState<RegionalSummary[]>([]);
  const [allRegions, setAllRegions] = useState<RegionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [desertData, regionalData] = await Promise.all([
        getMedicalDeserts(severityFilter || undefined),
        getRegionalSummary(),
      ]);
      setDeserts(desertData.items?.length > 0 ? desertData.items : MOCK_DESERTS);
      setAllRegions(regionalData.items?.length > 0 ? regionalData.items : ALL_MOCK_REGIONS);
    } catch {
      const filtered = severityFilter
        ? MOCK_DESERTS.filter((d) => d.desert_severity === severityFilter)
        : MOCK_DESERTS;
      setDeserts(filtered);
      setAllRegions(ALL_MOCK_REGIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [severityFilter]);

  if (loading) return <LoadingSpinner text="Loading medical desert data…" />;

  const critical = deserts.filter((d) => d.desert_severity === 'critical').length;
  const high = deserts.filter((d) => d.desert_severity === 'high').length;
  const moderate = deserts.filter((d) => d.desert_severity === 'moderate').length;
  const totalAffectedFacilities = deserts.reduce((s, d) => s + d.total_facilities, 0);
  const totalAffectedDoctors = deserts.reduce((s, d) => s + d.total_doctors, 0);

  return (
    <div className="page-enter" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <AlertTriangle size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: 'var(--accent)' }} />
            Medical Deserts
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.9375rem' }}>
            Identifying and visualizing underserved areas in Ghana&apos;s healthcare infrastructure
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="stagger-children">
          <MetricCard icon={<ShieldAlert size={22} />} title="Medical Deserts" value={deserts.length} subtitle={`${critical} critical, ${high} high, ${moderate} moderate`} color="#EF4444" />
          <MetricCard icon={<Building2 size={22} />} title="Affected Facilities" value={totalAffectedFacilities} subtitle="In underserved regions" color="#F59E0B" />
          <MetricCard icon={<Users size={22} />} title="Doctors in Deserts" value={totalAffectedDoctors} subtitle="Need reinforcement" color="#8B5CF6" />
          <MetricCard icon={<BedDouble size={22} />} title="Bed Deficit" value={deserts.reduce((s, d) => s + d.total_bed_capacity, 0)} subtitle="Below national average" color="#06B6D4" />
        </div>

        {/* Map + List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Map */}
          <div className="card animate-fadeInUp" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--error)' }} />
                Desert Severity Map
              </h2>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="severity-dot severity-dot-critical" /> Critical
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="severity-dot severity-dot-high" /> High
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="severity-dot severity-dot-moderate" /> Moderate
                </span>
              </div>
            </div>
            <GhanaMap regions={allRegions} mode="desert" height={480} />
          </div>

          {/* Desert List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Filter */}
            <div className="card" style={{ padding: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Filter by Severity
              </label>
              <select
                className="input select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="moderate">🟡 Moderate</option>
              </select>
            </div>

            {/* Desert Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 480, overflowY: 'auto' }}>
              {deserts.map((d) => (
                <div
                  key={d.address_stateOrRegion}
                  className="card card-interactive"
                  style={{ padding: '1rem', cursor: 'pointer' }}
                  onClick={() => setExpandedRegion(expandedRegion === d.address_stateOrRegion ? null : d.address_stateOrRegion)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{d.address_stateOrRegion}</span>
                        <SeverityBadge severity={d.desert_severity} />
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {d.total_facilities} facilities · {d.total_doctors} doctors · {d.total_bed_capacity} beds
                      </div>
                    </div>
                    {expandedRegion === d.address_stateOrRegion ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {expandedRegion === d.address_stateOrRegion && (
                    <div className="animate-fadeIn" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Issues Identified:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                          {d.desert_reasons.map((reason) => (
                            <span key={reason} className="badge badge-error">{reason}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Missing Services:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                          {!d.has_emergency_care && <span className="badge badge-error">Emergency Care</span>}
                          {!d.has_maternal_care && <span className="badge badge-warning">Maternal Care</span>}
                          {!d.has_pediatric_care && <span className="badge badge-info">Pediatric Care</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong>Recommendations:</strong> Increase facility density, deploy mobile health units,
                        establish telemedicine connections with major hospitals, and prioritize emergency care infrastructure.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assessment Criteria */}
        <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            🔬 Desert Assessment Criteria
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { 
                severity: 'Critical', color: '#EF4444', 
                criteria: ['Fewer than 5 total facilities', 'Fewer than 10 total doctors', 'Total lack of inpatient bed capacity'] 
              },
              { 
                severity: 'High', color: '#F97316', 
                criteria: ['Fewer than 10 total facilities', 'Fewer than 20 total doctors', 'Missing both emergency & maternal care'] 
              },
              { 
                severity: 'Moderate', color: '#EAB308', 
                criteria: ['Low bed capacity (under 50 beds)', 'Missing either emergency or maternal care services'] 
              },
            ].map((item) => (
              <div key={item.severity} style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                borderLeft: `3px solid ${item.color}`,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: item.color, fontSize: '0.9375rem' }}>{item.severity}</div>
                <ul style={{ 
                  fontSize: '0.8125rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.5, 
                  margin: 0, 
                  paddingLeft: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem'
                }}>
                  {item.criteria.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
