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

// Mock data (same as dashboard)
const MOCK_REGIONS: RegionalSummary[] = [
  { address_stateOrRegion: 'Greater Accra', total_facilities: 245, total_hospitals: 35, total_clinics: 120, total_pharmacies: 45, total_dentists: 20, total_doctor_offices: 15, total_ngos: 10, total_bed_capacity: 3200, total_doctors: 890, facilities_with_doctors: 180, facilities_with_beds: 95, avg_completeness_score: 0.72, facilities_with_contact: 200, facilities_accepting_volunteers: 30, facilities_with_procedures: 85, facilities_with_equipment: 70, facilities_with_capability: 90, unique_specialties_count: 45, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'Cardiology'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 95, private_facilities: 150, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Ashanti', total_facilities: 178, total_hospitals: 28, total_clinics: 85, total_pharmacies: 32, total_dentists: 12, total_doctor_offices: 11, total_ngos: 10, total_bed_capacity: 2100, total_doctors: 520, facilities_with_doctors: 130, facilities_with_beds: 70, avg_completeness_score: 0.65, facilities_with_contact: 140, facilities_accepting_volunteers: 25, facilities_with_procedures: 60, facilities_with_equipment: 55, facilities_with_capability: 65, unique_specialties_count: 35, top_5_specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'Obstetrics', 'Ophthalmology'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: true, public_facilities: 80, private_facilities: 98, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Western', total_facilities: 89, total_hospitals: 12, total_clinics: 42, total_pharmacies: 18, total_dentists: 6, total_doctor_offices: 5, total_ngos: 6, total_bed_capacity: 850, total_doctors: 180, facilities_with_doctors: 55, facilities_with_beds: 30, avg_completeness_score: 0.55, facilities_with_contact: 65, facilities_accepting_volunteers: 12, facilities_with_procedures: 28, facilities_with_equipment: 22, facilities_with_capability: 30, unique_specialties_count: 20, top_5_specialties: ['General Medicine', 'Pediatrics', 'Obstetrics'], has_emergency_care: true, has_maternal_care: true, has_pediatric_care: false, public_facilities: 45, private_facilities: 44, is_medical_desert: false, desert_reasons: [] },
  { address_stateOrRegion: 'Northern', total_facilities: 38, total_hospitals: 4, total_clinics: 18, total_pharmacies: 8, total_dentists: 2, total_doctor_offices: 2, total_ngos: 4, total_bed_capacity: 280, total_doctors: 45, facilities_with_doctors: 20, facilities_with_beds: 10, avg_completeness_score: 0.38, facilities_with_contact: 22, facilities_accepting_volunteers: 5, facilities_with_procedures: 10, facilities_with_equipment: 8, facilities_with_capability: 12, unique_specialties_count: 8, top_5_specialties: ['General Medicine', 'Pediatrics'], has_emergency_care: false, has_maternal_care: true, has_pediatric_care: false, public_facilities: 25, private_facilities: 13, is_medical_desert: true, desert_severity: 'moderate', desert_reasons: ['Low facility count', 'Insufficient doctors'] },
  { address_stateOrRegion: 'Upper West', total_facilities: 15, total_hospitals: 1, total_clinics: 8, total_pharmacies: 3, total_dentists: 0, total_doctor_offices: 1, total_ngos: 2, total_bed_capacity: 95, total_doctors: 12, facilities_with_doctors: 8, facilities_with_beds: 4, avg_completeness_score: 0.28, facilities_with_contact: 9, facilities_accepting_volunteers: 2, facilities_with_procedures: 4, facilities_with_equipment: 3, facilities_with_capability: 5, unique_specialties_count: 4, top_5_specialties: ['General Medicine'], has_emergency_care: false, has_maternal_care: false, has_pediatric_care: false, public_facilities: 10, private_facilities: 5, is_medical_desert: true, desert_severity: 'critical', desert_reasons: ['Low facility count', 'Insufficient doctors', 'No emergency care'] },
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

  const radarData = comparisonData.length >= 2
    ? ['total_facilities', 'total_doctors', 'total_bed_capacity', 'unique_specialties_count', 'facilities_with_procedures'].map((key) => {
        const maxVal = Math.max(...regions.map((r) => (r as unknown as Record<string, number>)[key] || 0), 1);
        const item: Record<string, string | number> = { metric: key.replace('total_', '').replace('_', ' ').replace('facilities_with_', '') };
        comparisonData.forEach((r) => {
          item[r.address_stateOrRegion] = Math.round(((r as unknown as Record<string, number>)[key] || 0) / maxVal * 100);
        });
        return item;
      })
    : [];

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
          <MetricCard icon={<Shield size={22} />} title="Avg Quality" value={formatPercent(avgScore)} color="#F59E0B" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Horizontal Bar Chart */}
          <div className="card animate-fadeInUp">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Facilities by Region
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis type="category" dataKey="address_stateOrRegion" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                <Bar dataKey="total_facilities" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Facilities" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Plot */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Doctors vs Beds by Region
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" dataKey="doctors" name="Doctors" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis type="number" dataKey="beds" name="Beds" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
                />
                <Scatter name="Regions" data={scatterData} fill="#10B981">
                  {scatterData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
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
                      { label: 'Avg Quality', key: 'avg_completeness_score', format: 'percent' },
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
                          return <td key={r.address_stateOrRegion} style={{ fontFamily: 'monospace' }}>{display}</td>;
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
                  <PolarRadiusAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
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
                    <td style={{ fontFamily: 'monospace' }}>{formatNumber(r.total_facilities)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatNumber(r.total_doctors)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatNumber(r.total_bed_capacity)}</td>
                    <td>{formatPercent(r.avg_completeness_score)}</td>
                    <td>{r.has_emergency_care ? '✅' : '❌'}</td>
                    <td>{r.has_maternal_care ? '✅' : '❌'}</td>
                    <td><SeverityBadge severity={r.desert_severity} /></td>
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
