'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Users,
  BedDouble, Clock, Stethoscope, Shield, Wrench, Activity,
  Heart, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { getFacility, type Facility } from '@/lib/api';
import { LoadingSpinner, ErrorState, QualityBadge } from '@/components/ui';
import { FACILITY_TYPES, formatPercent, getQualityTier } from '@/lib/constants';

export default function FacilityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFacility(id)
      .then(setFacility)
      .catch(() => setError('Failed to load facility details. The backend may be unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading facility details…" />;
  if (error || !facility) return <ErrorState message={error || 'Facility not found'} />;

  const tier = getQualityTier(facility.completeness_score);
  const facilityType = FACILITY_TYPES.find((ft) => ft.value === facility.facilityTypeId);

  const sections = [
    { label: 'Contact Info', score: facility.section_1_completeness },
    { label: 'Staffing', score: facility.section_2_completeness },
    { label: 'Services', score: facility.section_3_completeness },
    { label: 'Infrastructure', score: facility.section_4_completeness },
    { label: 'Data Quality', score: facility.section_5_completeness },
  ];

  const boolChecks = [
    { label: 'Contact Info', value: facility.has_contact_info, icon: Phone },
    { label: 'Procedures Listed', value: facility.has_procedures, icon: Stethoscope },
    { label: 'Equipment Listed', value: facility.has_equipment, icon: Wrench },
    { label: 'Capabilities Listed', value: facility.has_capability, icon: Shield },
    { label: 'Specialties Listed', value: facility.has_specialties, icon: Activity },
    { label: 'Accepts Volunteers', value: facility.acceptsVolunteers, icon: Heart },
  ];

  return (
    <div className="page-enter" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Back link */}
        <Link
          href="/facilities"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Back to Facilities
        </Link>

        {/* Header Card */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{facility.name}</h1>
                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                  {facilityType?.icon || '🏥'} {facility.facilityTypeId || 'Unknown'}
                </span>
                <QualityBadge score={facility.completeness_score} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {facility.address_stateOrRegion && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={14} /> {facility.address_city ? `${facility.address_city}, ` : ''}{facility.address_stateOrRegion}
                  </span>
                )}
                {facility.operatorTypeId && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Building2 size={14} /> {facility.operatorTypeId}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                {formatPercent(facility.completeness_score, 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Completeness Score</div>
            </div>
          </div>

          {facility.organizationDescription && (
            <p style={{ marginTop: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, borderTop: '1px solid var(--border-primary)', paddingTop: '1.25rem' }}>
              {facility.organizationDescription}
            </p>
          )}
        </div>

        {/* Grid: Contact + Capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Contact */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="var(--primary-light)" /> Contact Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {facility.phone_numbers?.length > 0 ? (
                facility.phone_numbers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Phone size={14} /> {p}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-tertiary)' }}>No phone numbers available</div>
              )}
              {facility.email?.length > 0 && facility.email.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Mail size={14} /> {e}
                </div>
              ))}
              {facility.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={14} />
                  <a href={facility.website} target="_blank" rel="noopener" style={{ color: 'var(--primary-light)' }}>{facility.website}</a>
                </div>
              )}
              {facility.address_line1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} /> {[facility.address_line1, facility.address_line2, facility.address_city].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="var(--secondary)" /> Capacity & Staffing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                <Users size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--primary-light)' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{facility.numberDoctors ?? '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doctors</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                <BedDouble size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--secondary)' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{facility.capacity ?? '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bed Capacity</div>
              </div>
            </div>
            {facility.operatingHours && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} /> {facility.operatingHours}
              </div>
            )}
          </div>
        </div>

        {/* Services & Specialties */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={16} color="var(--accent)" /> Services & Specialties
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Specialties</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {facility.specialties?.length > 0
                  ? facility.specialties.map((s) => <span key={s} className="badge badge-primary">{s}</span>)
                  : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No specialties listed</span>}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Procedures</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {facility.procedure?.length > 0
                  ? facility.procedure.map((p) => <span key={p} className="badge badge-info">{p}</span>)
                  : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No procedures listed</span>}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Equipment</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {facility.equipment?.length > 0
                  ? facility.equipment.map((e) => <span key={e} className="badge badge-warning">{e}</span>)
                  : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No equipment listed</span>}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Capabilities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {facility.capability?.length > 0
                  ? facility.capability.map((c) => <span key={c} className="badge badge-success">{c}</span>)
                  : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No capabilities listed</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} color="var(--success)" /> Quality Metrics
          </h2>

          {/* Overall Score */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Overall Completeness</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: tier.color }}>{formatPercent(facility.completeness_score)}</span>
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div className="progress-fill" style={{ width: `${(facility.completeness_score || 0) * 100}%`, background: tier.color }} />
            </div>
          </div>

          {/* Section Scores */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sections.map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'monospace' }}>{s.score !== null && s.score !== undefined ? formatPercent(s.score) : 'N/A'}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(s.score || 0) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Boolean checks */}
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {boolChecks.map((check) => {
              const Icon = check.icon;
              return (
                <div key={check.label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)', fontSize: '0.8125rem',
                }}>
                  {check.value === true ? (
                    <CheckCircle2 size={14} color="var(--success)" />
                  ) : check.value === false ? (
                    <XCircle size={14} color="var(--error)" />
                  ) : (
                    <AlertCircle size={14} color="var(--text-tertiary)" />
                  )}
                  <span style={{ color: 'var(--text-secondary)' }}>{check.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enrichment Data */}
        {facility.enrichment_success && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI Enrichment Insights
            </h2>
            {facility.enriched_procedures?.length ? (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Extracted Procedures</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {facility.enriched_procedures.map((p) => <span key={p} className="badge badge-info">{p}</span>)}
                </div>
              </div>
            ) : null}
            {facility.enriched_equipment?.length ? (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Extracted Equipment</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {facility.enriched_equipment.map((e) => <span key={e} className="badge badge-warning">{e}</span>)}
                </div>
              </div>
            ) : null}
            {facility.enriched_capabilities?.length ? (
              <div>
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Extracted Capabilities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {facility.enriched_capabilities.map((c) => <span key={c} className="badge badge-success">{c}</span>)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
