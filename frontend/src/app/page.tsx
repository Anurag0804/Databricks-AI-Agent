'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2, Users, BedDouble, AlertTriangle, Activity,
  Stethoscope, Heart, ArrowRight, MapPin, BarChart3,
  MessageSquare, Shield, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import MetricCard from '@/components/MetricCard';
import { LoadingSpinner, ErrorState } from '@/components/ui';
import { getRegionalSummary, type RegionalSummary, type RegionalListResponse } from '@/lib/api';
import { CHART_COLORS, formatPercent, formatNumber } from '@/lib/constants';

const GhanaMap = dynamic(() => import('@/components/GhanaMap'), { ssr: false });

// Mock data for when backend is unavailable
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

export default function DashboardPage() {
  const [regions, setRegions] = useState<RegionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegionalSummary();
      setRegions(data.items && data.items.length > 0 ? data.items : MOCK_REGIONS);
    } catch {
      // Use mock data when backend is unavailable
      setRegions(MOCK_REGIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Compute stats
  const totalFacilities = regions.reduce((s, r) => s + r.total_facilities, 0);
  const totalDoctors = regions.reduce((s, r) => s + r.total_doctors, 0);
  const totalBeds = regions.reduce((s, r) => s + r.total_bed_capacity, 0);
  const totalRegions = regions.length;
  const medicalDeserts = regions.filter((r) => r.is_medical_desert).length;
  const avgCompleteness = regions.reduce((s, r) => s + (r.avg_completeness_score || 0), 0) / totalRegions;
  const withEmergency = regions.filter((r) => r.has_emergency_care).length;
  const withMaternal = regions.filter((r) => r.has_maternal_care).length;

  // Chart data
  const barData = [...regions]
    .sort((a, b) => b.total_facilities - a.total_facilities)
    .slice(0, 10)
    .map((r) => ({ name: r.address_stateOrRegion, facilities: r.total_facilities, doctors: r.total_doctors }));

  const pieData = [
    { name: 'Public', value: regions.reduce((s, r) => s + r.public_facilities, 0) },
    { name: 'Private', value: regions.reduce((s, r) => s + r.private_facilities, 0) },
    { name: 'NGO', value: regions.reduce((s, r) => s + r.total_ngos, 0) },
  ];

  return (
    <div className="page-enter bg-grid-pattern" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '1rem' }}>
          <div className="animate-fadeIn" style={{ marginBottom: '1rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 1rem' }}>
              <Shield size={14} /> Powered by Databricks AI
            </span>
          </div>
          <h1
            className="animate-fadeInUp gradient-text"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem' }}
          >
            Ghana Healthcare<br />Intelligence Platform
          </h1>
          <p className="animate-fadeInUp" style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', animationDelay: '0.1s', lineHeight: 1.7 }}>
            Empowering healthcare planners with data-driven insights for {formatNumber(totalFacilities)} facilities across {totalRegions} regions of Ghana.
          </p>
        </div>

        {/* Key Metrics */}
        <div
          className="stagger-children"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}
        >
          <MetricCard
            icon={<Building2 size={22} />}
            title="Total Facilities"
            value={totalFacilities}
            subtitle="Across all regions"
            color="#3B82F6"
            delay={0}
          />
          <MetricCard
            icon={<Users size={22} />}
            title="Total Doctors"
            value={totalDoctors}
            subtitle={`~${(totalDoctors / totalFacilities).toFixed(1)} per facility`}
            color="#10B981"
            delay={50}
          />
          <MetricCard
            icon={<BedDouble size={22} />}
            title="Bed Capacity"
            value={totalBeds}
            subtitle={`${formatNumber(Math.round(totalBeds / totalRegions))} average per region`}
            color="#8B5CF6"
            delay={100}
          />
          <MetricCard
            icon={<AlertTriangle size={22} />}
            title="Medical Deserts"
            value={medicalDeserts}
            subtitle={`${totalRegions - medicalDeserts} regions well-served`}
            color="#EF4444"
            delay={150}
          />
          <MetricCard
            icon={<Activity size={22} />}
            title="Average Completeness"
            value={formatPercent(avgCompleteness)}
            subtitle="Data quality score"
            color="#F59E0B"
            delay={200}
          />
          <MetricCard
            icon={<Stethoscope size={22} />}
            title="Emergency Care"
            value={`${withEmergency}/${totalRegions}`}
            subtitle="Regions with emergency services"
            color="#06B6D4"
            delay={250}
          />
        </div>

        {/* Map + Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
          <div className="card animate-fadeInUp" style={{ padding: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} style={{ color: 'var(--primary-light)' }} />
                  Healthcare Facility Map
                </h2>
              </div>

              {/* Visual Legend */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.875rem',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {/* Size Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', opacity: 0.7 }} />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Few</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>→</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', opacity: 0.7 }} />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Many</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: 1, height: 24, background: 'var(--border-secondary)' }} />

                {/* Color Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Level</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {[
                      { color: '#22C55E', label: 'High' },
                      { color: '#3B82F6', label: 'Good' },
                      { color: '#F59E0B', label: 'Low' },
                      { color: '#EF4444', label: 'Critical' },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: item.color,
                          display: 'inline-block',
                          boxShadow: `0 0 6px ${item.color}60`,
                        }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <GhanaMap regions={regions} height={380} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick Links */}
            <div className="card animate-slideInRight" style={{ animationDelay: '0.15s' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} color="var(--primary-light)" /> Quick Access
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/facilities" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16} /> Explore Facilities</span>
                  <ArrowRight size={14} />
                </Link>
                <Link href="/regional" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={16} /> Regional Analytics</span>
                  <ArrowRight size={14} />
                </Link>
                <Link href="/deserts" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Medical Deserts</span>
                  <ArrowRight size={14} />
                </Link>
                <Link href="/ask" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} /> AI Assistant</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Service Coverage */}
            <div className="card animate-slideInRight" style={{ animationDelay: '0.25s' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>
                <Heart size={16} color="var(--secondary)" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Service Coverage
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'Emergency Care', count: withEmergency, total: totalRegions, color: '#EF4444' },
                  { label: 'Maternal Care', count: withMaternal, total: totalRegions, color: '#EC4899' },
                  { label: 'Has Doctors', count: regions.reduce((s, r) => s + r.facilities_with_doctors, 0), total: totalFacilities, color: '#3B82F6' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.count}/{item.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(item.count / item.total) * 100}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Charts Row: Bar Chart + Ownership Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
          {/* Bar Chart — Facilities by Region */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              <BarChart3 size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--primary-light)' }} />
              Facilities by Region (Top 10)
            </h2>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                />
                <Bar dataKey="facilities" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Facilities" />
                <Bar dataKey="doctors" fill="#10B981" radius={[4, 4, 0, 0]} name="Doctors" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ownership Distribution — Redesigned */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} style={{ color: 'var(--primary-light)' }} />
              Ownership Distribution
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {pieData.reduce((s, d) => s + d.value, 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Total</div>
                </div>
              </div>
            </div>

            {/* Stat rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pieData.map((item, i) => {
                const total = pieData.reduce((s, d) => s + d.value, 0);
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${CHART_COLORS[i]}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: CHART_COLORS[i], display: 'inline-block',
                      }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.value.toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: CHART_COLORS[i],
                        background: `${CHART_COLORS[i]}15`,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                      }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Region Rankings Table */}
        <div className="card animate-fadeInUp" style={{ padding: 0, overflow: 'hidden', animationDelay: '0.4s' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Regional Rankings</h2>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Region</th>
                  <th>Facilities</th>
                  <th>Doctors</th>
                  <th>Beds</th>
                  <th>Completeness</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...regions].sort((a, b) => b.total_facilities - a.total_facilities).map((r, i) => (
                  <tr key={r.address_stateOrRegion}>
                    <td style={{ color: 'var(--text-tertiary)', fontWeight: 600, width: 40 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <Link
                        href={`/regional?region=${encodeURIComponent(r.address_stateOrRegion)}`}
                        style={{ color: 'var(--primary-light)', textDecoration: 'none' }}
                      >
                        {r.address_stateOrRegion}
                      </Link>
                    </td>
                    <td>{formatNumber(r.total_facilities)}</td>
                    <td>{formatNumber(r.total_doctors)}</td>
                    <td>{formatNumber(r.total_bed_capacity)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${(r.avg_completeness_score || 0) * 100}%` }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {formatPercent(r.avg_completeness_score)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {r.is_medical_desert ? (
                        <span className={`badge badge-${r.desert_severity === 'critical' ? 'error' : r.desert_severity === 'high' ? 'warning' : 'info'}`}>
                          ⚠ {r.desert_severity}
                        </span>
                      ) : (
                        <span className="badge badge-success">✓ Adequate</span>
                      )}
                    </td>
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
