'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3, Building2, Users, BedDouble, Stethoscope,
  TrendingUp, ArrowUpDown, Shield,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { getRegionalSummary, compareRegions, type RegionalSummary, type RegionalListResponse } from '@/lib/api';
import { LoadingSpinner, ErrorState, SeverityBadge } from '@/components/ui';
import MetricCard from '@/components/MetricCard';
import { GHANA_REGIONS, CHART_COLORS, formatPercent, formatNumber } from '@/lib/constants';

// Mock data (same as dashboard — all 16 regions)
const MOCK_REGIONS: RegionalSummary[] = [
  { address_stateOrRegion: 'Greater Accra', total_facilities: 245, total_hospitals: 35, total_clinics: 120, total_pharmacies: 45, total_dentists: 20, total_doctor_offices: 15, total_ngos: 10, total_bed_capacity: 3200, total_doctors: 890, facilities_with_doctors: 180, facilities_with_beds: 95, avg_completeness_score: 0.72, facilities_with_contact: 200, facilities_accepting_volunteers: 30, facilities_with_procedures: 85, facilities_with_equipment: 70, facilities_with_capability: 90, unique_specialties_count: 45, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'Cardiology'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 95, private_facilities: 150, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Ashanti', total_facilities: 178, total_hospitals: 28, total_clinics: 85, total_pharmacies: 32, total_dentists: 12, total_doctor_offices: 11, total_ngos: 10, total_bed_capacity: 2100, total_doctors: 520, facilities_with_doctors: 130, facilities_with_beds: 70, avg_completeness_score: 0.65, facilities_with_contact: 140, facilities_accepting_volunteers: 25, facilities_with_procedures: 60, facilities_with_equipment: 55, facilities_with_capability: 65, unique_specialties_count: 35, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'Ophthalmology'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 80, private_facilities: 98, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Western', total_facilities: 89, total_hospitals: 12, total_clinics: 42, total_pharmacies: 18, total_dentists: 6, total_doctor_offices: 5, total_ngos: 6, total_bed_capacity: 850, total_doctors: 180, facilities_with_doctors: 55, facilities_with_beds: 30, avg_completeness_score: 0.55, facilities_with_contact: 65, facilities_accepting_volunteers: 12, facilities_with_procedures: 28, facilities_with_equipment: 22, facilities_with_capability: 30, unique_specialties_count: 20, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Dentistry', 'Pharmacy'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 45, private_facilities: 44, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Eastern', total_facilities: 76, total_hospitals: 10, total_clinics: 35, total_pharmacies: 15, total_dentists: 5, total_doctor_offices: 4, total_ngos: 7, total_bed_capacity: 720, total_doctors: 140, facilities_with_doctors: 45, facilities_with_beds: 25, avg_completeness_score: 0.52, facilities_with_contact: 55, facilities_accepting_volunteers: 10, facilities_with_procedures: 22, facilities_with_equipment: 18, facilities_with_capability: 25, unique_specialties_count: 18, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'ENT'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 40, private_facilities: 36, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Central', total_facilities: 65, total_hospitals: 8, total_clinics: 30, total_pharmacies: 12, total_dentists: 4, total_doctor_offices: 3, total_ngos: 8, total_bed_capacity: 580, total_doctors: 110, facilities_with_doctors: 38, facilities_with_beds: 20, avg_completeness_score: 0.48, facilities_with_contact: 45, facilities_accepting_volunteers: 8, facilities_with_procedures: 18, facilities_with_equipment: 15, facilities_with_capability: 20, unique_specialties_count: 15, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Pharmacy', 'Dentistry'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 35, private_facilities: 30, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Volta', total_facilities: 52, total_hospitals: 6, total_clinics: 25, total_pharmacies: 10, total_dentists: 3, total_doctor_offices: 3, total_ngos: 5, total_bed_capacity: 420, total_doctors: 80, facilities_with_doctors: 30, facilities_with_beds: 15, avg_completeness_score: 0.45, facilities_with_contact: 35, facilities_accepting_volunteers: 6, facilities_with_procedures: 14, facilities_with_equipment: 12, facilities_with_capability: 15, unique_specialties_count: 12, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Surgery', 'Pharmacy'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 30, private_facilities: 22, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Northern', total_facilities: 38, total_hospitals: 4, total_clinics: 18, total_pharmacies: 8, total_dentists: 2, total_doctor_offices: 2, total_ngos: 4, total_bed_capacity: 280, total_doctors: 45, facilities_with_doctors: 20, facilities_with_beds: 10, avg_completeness_score: 0.38, facilities_with_contact: 22, facilities_accepting_volunteers: 5, facilities_with_procedures: 10, facilities_with_equipment: 8, facilities_with_capability: 12, unique_specialties_count: 8, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Pharmacy', 'Dentistry'], has_emergency_care: false, has_maternal_care: true, has_pediatric_care: false, public_facilities: 25, private_facilities: 13, is_medical_desert: true, desert_severity: 'moderate', desert_reasons: ['Low facility count', 'Insufficient doctors'] },
  { address_stateOrRegion: 'Upper East', total_facilities: 22, total_hospitals: 2, total_clinics: 12, total_pharmacies: 4, total_dentists: 1, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 150, total_doctors: 25, facilities_with_doctors: 12, facilities_with_beds: 6, avg_completeness_score: 0.32, facilities_with_contact: 14, facilities_accepting_volunteers: 3, facilities_with_procedures: 6, facilities_with_equipment: 5, facilities_with_capability: 7, unique_specialties_count: 5, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 15, private_facilities: 7, is_medical_desert: true, desert_severity: 'high', desert_reasons: ['Low facility count', 'Insufficient doctors', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Upper West', total_facilities: 15, total_hospitals: 1, total_clinics: 8, total_pharmacies: 3, total_dentists: 0, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 95, total_doctors: 12, facilities_with_doctors: 8, facilities_with_beds: 4, avg_completeness_score: 0.28, facilities_with_contact: 9, facilities_accepting_volunteers: 2, facilities_with_procedures: 4, facilities_with_equipment: 3, facilities_with_capability: 5, unique_specialties_count: 4, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 10, private_facilities: 5, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Brong Ahafo', total_facilities: 68, total_hospitals: 9, total_clinics: 32, total_pharmacies: 13, total_dentists: 4, total_doctor_offices: 4, total_ngos: 6, total_bed_capacity: 620, total_doctors: 120, facilities_with_doctors: 40, facilities_with_beds: 22, avg_completeness_score: 0.5, facilities_with_contact: 48, facilities_accepting_volunteers: 9, facilities_with_procedures: 20, facilities_with_equipment: 16, facilities_with_capability: 22, unique_specialties_count: 16, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'Pharmacy'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 38, private_facilities: 30, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Savannah', total_facilities: 8, total_hospitals: 1, total_clinics: 4, total_pharmacies: 1, total_dentists: 0, total_doctor_offices: 0, total_ngos: 2, total_bed_capacity: 45, total_doctors: 6, facilities_with_doctors: 4, facilities_with_beds: 2, avg_completeness_score: 0.22, facilities_with_contact: 5, facilities_accepting_volunteers: 1, facilities_with_procedures: 2, facilities_with_equipment: 1, facilities_with_capability: 2, unique_specialties_count: 3, top_5_specialties: ['General Medicine', 'Obstetrics'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 6, private_facilities: 2, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'North East', total_facilities: 10, total_hospitals: 1, total_clinics: 5, total_pharmacies: 2, total_dentists: 0, total_doctor_offices: 0, total_ngos: 2, total_bed_capacity: 55, total_doctors: 8, facilities_with_doctors: 5, facilities_with_beds: 3, avg_completeness_score: 0.25, facilities_with_contact: 6, facilities_accepting_volunteers: 1, facilities_with_procedures: 3, facilities_with_equipment: 2, facilities_with_capability: 3, unique_specialties_count: 3, top_5_specialties: ['General Medicine', 'Pediatrics'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 7, private_facilities: 3, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'Low bed capacity', 'No emergency care', 'No maternal care'] },
  { address_stateOrRegion: 'Oti', total_facilities: 18, total_hospitals: 2, total_clinics: 9, total_pharmacies: 3, total_dentists: 1, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 120, total_doctors: 18, facilities_with_doctors: 10, facilities_with_beds: 5, avg_completeness_score: 0.35, facilities_with_contact: 12, facilities_accepting_volunteers: 2, facilities_with_procedures: 5, facilities_with_equipment: 4, facilities_with_capability: 6, unique_specialties_count: 6, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics'], has_emergency_care: false, has_maternal_care: true, has_pediatric_care: false, public_facilities: 12, private_facilities: 6, is_medical_desert: true, desert_severity: 'high', desert_reasons: ['Low facility count', 'Insufficient doctors', 'No emergency care'] },
  { address_stateOrRegion: 'Ahafo', total_facilities: 25, total_hospitals: 3, total_clinics: 12, total_pharmacies: 5, total_dentists: 1, total_doctor_offices: 2, total_ngos: 2, total_bed_capacity: 180, total_doctors: 30, facilities_with_doctors: 15, facilities_with_beds: 8, avg_completeness_score: 0.4, facilities_with_contact: 18, facilities_accepting_volunteers: 3, facilities_with_procedures: 8, facilities_with_equipment: 6, facilities_with_capability: 9, unique_specialties_count: 8, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Surgery'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 15, private_facilities: 10, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Bono East', total_facilities: 32, total_hospitals: 4, total_clinics: 15, total_pharmacies: 6, total_dentists: 2, total_doctor_offices: 2, total_ngos: 3, total_bed_capacity: 250, total_doctors: 42, facilities_with_doctors: 20, facilities_with_beds: 10, avg_completeness_score: 0.42, facilities_with_contact: 22, facilities_accepting_volunteers: 4, facilities_with_procedures: 10, facilities_with_equipment: 8, facilities_with_capability: 12, unique_specialties_count: 10, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Surgery', 'Pharmacy'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 20, private_facilities: 12, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Western North', total_facilities: 28, total_hospitals: 3, total_clinics: 13, total_pharmacies: 5, total_dentists: 2, total_doctor_offices: 2, total_ngos: 3, total_bed_capacity: 200, total_doctors: 35, facilities_with_doctors: 16, facilities_with_beds: 8, avg_completeness_score: 0.4, facilities_with_contact: 19, facilities_accepting_volunteers: 3, facilities_with_procedures: 8, facilities_with_equipment: 6, facilities_with_capability: 9, unique_specialties_count: 9, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Pharmacy'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 16, private_facilities: 12, is_medical_desert: false, desert_reasons: [] },
];

function RegionalContent() {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region');
  const [regions, setRegions] = useState<RegionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<RegionalSummary[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRegionalSummary();
      setRegions(data.items?.length > 0 ? data.items : MOCK_REGIONS);
    } catch {
      setRegions(MOCK_REGIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleCompare = (region: string) => {
    setCompareList((prev) => {
      if (prev.includes(region)) return prev.filter((r) => r !== region);
      if (prev.length >= 5) return prev;
      return [...prev, region];
    });
  };

  useEffect(() => {
    if (compareList.length >= 2) {
      setComparisonData(regions.filter((r) => compareList.includes(r.address_stateOrRegion)));
    } else {
      setComparisonData([]);
    }
  }, [compareList, regions]);

  if (loading) return <LoadingSpinner text="Loading regional analytics…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const totalFacilities = regions.reduce((s, r) => s + r.total_facilities, 0);
  const totalDoctors = regions.reduce((s, r) => s + r.total_doctors, 0);
  const totalBeds = regions.reduce((s, r) => s + r.total_bed_capacity, 0);
  const avgScore = regions.reduce((s, r) => s + (r.avg_completeness_score || 0), 0) / regions.length;

  const barData = [...regions].sort((a, b) => b.total_facilities - a.total_facilities);
  const scatterData = regions.map((r) => ({
    name: r.address_stateOrRegion,
    doctors: r.total_doctors,
    beds: r.total_bed_capacity,
    facilities: r.total_facilities,
  }));

  const radarLabelMap: Record<string, string> = {
    total_facilities: 'Facilities',
    total_doctors: 'Doctors',
    total_bed_capacity: 'Bed Capacity',
    unique_specialties_count: 'Unique Specialties Count',
    facilities_with_procedures: 'Facilities with Procedures',
  };

  const radarData = comparisonData.length >= 2
    ? ['total_facilities', 'total_doctors', 'total_bed_capacity', 'unique_specialties_count', 'facilities_with_procedures'].map((key) => {
        const maxVal = Math.max(...regions.map((r) => (r as unknown as Record<string, number>)[key] || 0), 1);
        const item: Record<string, string | number> = { metric: radarLabelMap[key] || key };
        comparisonData.forEach((r) => {
          item[r.address_stateOrRegion] = Math.round(((r as unknown as Record<string, number>)[key] || 0) / maxVal * 100);
        });
        return item;
      })
    : [];

  // Custom scatter tooltip
  const ScatterTooltipContent = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; doctors: number; beds: number } }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{d.name}</div>
        <div style={{ color: 'var(--text-secondary)' }}>Doctors: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(d.doctors)}</span></div>
        <div style={{ color: 'var(--text-secondary)' }}>Beds: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(d.beds)}</span></div>
      </div>
    );
  };

  return (
    <div className="page-enter" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <BarChart3 size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: 'var(--primary-light)' }} />
            Regional Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.9375rem' }}>
            Compare and analyze healthcare performance across Ghana&apos;s {regions.length} regions
          </p>
        </div>

        {/* Summary Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="stagger-children">
          <MetricCard icon={<Building2 size={22} />} title="Total Facilities" value={totalFacilities} color="#3B82F6" />
          <MetricCard icon={<Users size={22} />} title="Total Doctors" value={totalDoctors} color="#10B981" />
          <MetricCard icon={<BedDouble size={22} />} title="Total Beds" value={totalBeds} color="#8B5CF6" />
          <MetricCard icon={<Shield size={22} />} title="Average Quality" value={formatPercent(avgScore)} color="#F59E0B" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Horizontal Bar Chart */}
          <div className="card animate-fadeInUp">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Facilities by Region
            </h2>
            <ResponsiveContainer width="100%" height={520}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis type="category" dataKey="address_stateOrRegion" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                <Bar dataKey="total_facilities" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Facilities" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Plot */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Doctors vs Beds by Region
            </h2>
            <ResponsiveContainer width="100%" height={520}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" dataKey="doctors" name="Doctors" scale="sqrt" domain={[0, 'auto']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} label={{ value: 'Doctors', position: 'insideBottom', offset: -15, fill: 'var(--text-tertiary)', fontSize: 12 }} />
                <YAxis type="number" dataKey="beds" name="Beds" scale="sqrt" domain={[0, 'auto']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} label={{ value: 'Beds', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-tertiary)', fontSize: 12 }} />
                <Tooltip content={<ScatterTooltipContent />} />
                <Scatter name="Regions" data={scatterData} fill="#10B981">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} r={Math.max(6, Math.min(18, entry.facilities / 15))} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* Scatter legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '0.75rem', justifyContent: 'center' }}>
              {scatterData.map((entry, i) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Tool */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} color="var(--primary-light)" />
            Compare Regions
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>(Select 2-5 regions)</span>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            {regions.map((r) => {
              const selected = compareList.includes(r.address_stateOrRegion);
              return (
                <button
                  key={r.address_stateOrRegion}
                  className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleCompare(r.address_stateOrRegion)}
                >
                  {r.address_stateOrRegion}
                </button>
              );
            })}
          </div>

          {comparisonData.length >= 2 && (
            <div className="animate-fadeIn">
              {/* Comparison Table */}
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {comparisonData.map((r) => (
                        <th key={r.address_stateOrRegion}>{r.address_stateOrRegion}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Facilities', key: 'total_facilities' },
                      { label: 'Hospitals', key: 'total_hospitals' },
                      { label: 'Doctors', key: 'total_doctors' },
                      { label: 'Bed Capacity', key: 'total_bed_capacity' },
                      { label: 'Average Quality', key: 'avg_completeness_score', format: 'percent' },
                      { label: 'Emergency Care', key: 'has_emergency_care', format: 'bool' },
                      { label: 'Maternal Care', key: 'has_maternal_care', format: 'bool' },
                      { label: 'Specialties', key: 'unique_specialties_count' },
                    ].map((metric) => (
                      <tr key={metric.label}>
                        <td style={{ fontWeight: 600 }}>{metric.label}</td>
                        {comparisonData.map((r) => {
                          const val = (r as unknown as Record<string, unknown>)[metric.key];
                          let display: string;
                          if (metric.format === 'percent') display = formatPercent(val as number);
                          else if (metric.format === 'bool') display = val ? '✅ Yes' : '❌ No';
                          else display = formatNumber(val as number);
                          return <td key={r.address_stateOrRegion} style={{ fontWeight: 500 }}>{display}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Radar Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-primary)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={0} tick={({ x, y, payload }: { x: number; y: number; payload: { value: number } }) => (
                    <text x={x} y={y + 12} fill="var(--text-tertiary)" fontSize={10} textAnchor="middle" dominantBaseline="central" transform="">{payload.value}</text>
                  )} />
                  {comparisonData.map((r, i) => (
                    <Radar
                      key={r.address_stateOrRegion}
                      name={r.address_stateOrRegion}
                      dataKey={r.address_stateOrRegion}
                      stroke={CHART_COLORS[i]}
                      fill={CHART_COLORS[i]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Regional Rankings Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>All Regions Summary</h2>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Facilities</th>
                  <th>Doctors</th>
                  <th>Beds</th>
                  <th>Quality</th>
                  <th>Emergency</th>
                  <th>Maternal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.address_stateOrRegion}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{r.address_stateOrRegion}</td>
                    <td style={{ fontWeight: 500 }}>{formatNumber(r.total_facilities)}</td>
                    <td style={{ fontWeight: 500 }}>{formatNumber(r.total_doctors)}</td>
                    <td style={{ fontWeight: 500 }}>{formatNumber(r.total_bed_capacity)}</td>
                    <td style={{ fontWeight: 500 }}>{formatPercent(r.avg_completeness_score)}</td>
                    <td>{r.has_emergency_care ? '✅' : '❌'}</td>
                    <td>{r.has_maternal_care ? '✅' : '❌'}</td>
                    <td>{r.is_medical_desert ? <SeverityBadge severity={r.desert_severity} /> : <span className="badge badge-success">✓ Adequate</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Need to import Cell for ScatterChart
import { Cell } from 'recharts';

export default function RegionalPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading regional analytics…" />}>
      <RegionalContent />
    </Suspense>
  );
}
