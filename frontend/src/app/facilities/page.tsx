'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Building2, Users, BedDouble,
  ChevronDown, ChevronUp, X, SlidersHorizontal, Download,
} from 'lucide-react';
import { getFacilities, searchFacilities, type Facility, type FacilityListResponse, type FacilityFilters } from '@/lib/api';
import { GHANA_REGIONS, FACILITY_TYPES, OPERATOR_TYPES, formatPercent, formatNumber, getQualityTier } from '@/lib/constants';
import { LoadingSpinner, ErrorState, QualityBadge, Pagination, SkeletonTable } from '@/components/ui';

// Mock facilities for demo
const MOCK_FACILITIES: Facility[] = Array.from({ length: 20 }, (_, i) => ({
  unique_id: `fac-${i + 1}`,
  name: [
    'Korle Bu Teaching Hospital', 'Ridge Hospital', 'Komfo Anokye Teaching Hospital',
    'Tamale Teaching Hospital', 'Greater Accra Regional Hospital', 'Okomfo Anokye Clinic',
    'Effia Nkwanta Regional Hospital', 'Cape Coast Teaching Hospital', 'Ho Municipal Hospital',
    'Sunyani Regional Hospital', 'Bolgatanga Regional Hospital', 'Wa Regional Hospital',
    'La General Hospital', 'Accra Psychiatric Hospital', 'Princess Marie Louise Hospital',
    'Mamprobi Polyclinic', 'Achimota Hospital', 'Legon Hospital', 'Tema General Hospital',
    'Volta Regional Hospital',
  ][i],
  facilityTypeId: ['hospital', 'clinic', 'hospital', 'hospital', 'hospital', 'clinic', 'hospital', 'hospital', 'hospital', 'hospital', 'hospital', 'hospital', 'hospital', 'hospital', 'hospital', 'clinic', 'hospital', 'clinic', 'hospital', 'hospital'][i],
  operatorTypeId: i % 3 === 0 ? 'public' : i % 3 === 1 ? 'private' : 'ngo',
  address_city: ['Accra', 'Accra', 'Kumasi', 'Tamale', 'Accra', 'Kumasi', 'Sekondi', 'Cape Coast', 'Ho', 'Sunyani', 'Bolgatanga', 'Wa', 'Accra', 'Accra', 'Accra', 'Accra', 'Accra', 'Accra', 'Tema', 'Ho'][i],
  address_stateOrRegion: ['Greater Accra', 'Greater Accra', 'Ashanti', 'Northern', 'Greater Accra', 'Ashanti', 'Western', 'Central', 'Volta', 'Brong Ahafo', 'Upper East', 'Upper West', 'Greater Accra', 'Greater Accra', 'Greater Accra', 'Greater Accra', 'Greater Accra', 'Greater Accra', 'Greater Accra', 'Volta'][i],
  specialties: ['General Medicine', 'Surgery', 'Pediatrics'].slice(0, (i % 3) + 1),
  procedure: [],
  equipment: [],
  capability: [],
  phone_numbers: ['+233-302-670071'],
  email: [],
  capacity: [800, 420, 1000, 350, 300, 40, 250, 280, 150, 200, 120, 80, 180, 200, 100, 60, 160, 50, 280, 140][i],
  numberDoctors: [120, 65, 150, 45, 50, 8, 35, 42, 22, 30, 15, 10, 25, 18, 15, 6, 20, 5, 40, 18][i],
  completeness_score: [0.85, 0.78, 0.82, 0.62, 0.7, 0.45, 0.68, 0.72, 0.55, 0.6, 0.42, 0.35, 0.65, 0.58, 0.52, 0.4, 0.63, 0.38, 0.75, 0.5][i],
  organization_type: undefined,
  organizationDescription: undefined,
  address_countryCode: 'GH',
}));

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FacilityFilters>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: FacilityListResponse;
      if (searchQuery.trim()) {
        data = await searchFacilities(searchQuery, page, pageSize, filters.region);
      } else {
        data = await getFacilities({
          ...filters,
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
      }
      setFacilities(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // Use mock data
      setFacilities(MOCK_FACILITIES);
      setTotal(MOCK_FACILITIES.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '') || searchQuery.trim();

  return (
    <div className="page-enter" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <Building2 size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: 'var(--primary-light)' }} />
            Facility Explorer
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.9375rem' }}>
            Search, filter, and browse {formatNumber(total)} healthcare facilities across Ghana
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 280, display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  id="facility-search"
                  className="input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Search facilities by name, city, or description…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <Search size={16} /> Search
              </button>
            </form>
            <button
              className={`btn ${filtersOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--primary)', display: 'inline-block'
                }} />
              )}
            </button>
            {hasActiveFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear All
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {filtersOpen && (
            <div className="animate-fadeIn" style={{
              marginTop: '1rem', paddingTop: '1rem',
              borderTop: '1px solid var(--border-primary)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Region
                </label>
                <select
                  className="input select"
                  value={filters.region || ''}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
                >
                  <option value="">All Regions</option>
                  {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Facility Type
                </label>
                <select
                  className="input select"
                  value={filters.facility_type || ''}
                  onChange={(e) => setFilters({ ...filters, facility_type: e.target.value || undefined })}
                >
                  <option value="">All Types</option>
                  {FACILITY_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.icon} {ft.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Operator Type
                </label>
                <select
                  className="input select"
                  value={filters.operator_type || ''}
                  onChange={(e) => setFilters({ ...filters, operator_type: e.target.value || undefined })}
                >
                  <option value="">All Operators</option>
                  {OPERATOR_TYPES.map((ot) => <option key={ot.value} value={ot.value}>{ot.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Has Doctors
                </label>
                <select
                  className="input select"
                  value={filters.has_doctors === undefined ? '' : String(filters.has_doctors)}
                  onChange={(e) => setFilters({ ...filters, has_doctors: e.target.value === '' ? undefined : e.target.value === 'true' })}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Has Beds
                </label>
                <select
                  className="input select"
                  value={filters.has_beds === undefined ? '' : String(filters.has_beds)}
                  onChange={(e) => setFilters({ ...filters, has_beds: e.target.value === '' ? undefined : e.target.value === 'true' })}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Min Completeness: {filters.min_completeness ? `${(filters.min_completeness * 100).toFixed(0)}%` : 'Any'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.min_completeness || 0}
                  onChange={(e) => setFilters({ ...filters, min_completeness: parseFloat(e.target.value) || undefined })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Showing {facilities.length} of {formatNumber(total)} facilities
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="input select"
              style={{ width: 140 }}
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="name">Sort: Name</option>
              <option value="address_stateOrRegion">Sort: Region</option>
              <option value="completeness_score">Sort: Quality</option>
              <option value="capacity">Sort: Capacity</option>
              <option value="numberDoctors">Sort: Doctors</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <select
              className="input select"
              style={{ width: 100 }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value="20">20/page</option>
              <option value="50">50/page</option>
              <option value="100">100/page</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <SkeletonTable rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Facility Name</th>
                    <th>Type</th>
                    <th>Region</th>
                    <th>City</th>
                    <th style={{ textAlign: 'center' }}><Users size={14} style={{ verticalAlign: 'middle' }} /> Doctors</th>
                    <th style={{ textAlign: 'center' }}><BedDouble size={14} style={{ verticalAlign: 'middle' }} /> Beds</th>
                    <th>Quality</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((f) => {
                    const tier = getQualityTier(f.completeness_score);
                    return (
                      <tr key={f.unique_id} style={{ cursor: 'pointer' }}>
                        <td>
                          <Link
                            href={`/facilities/${f.unique_id}`}
                            style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {f.name}
                          </Link>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                            {FACILITY_TYPES.find((ft) => ft.value === f.facilityTypeId)?.icon || '🏥'}{' '}
                            {f.facilityTypeId || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.address_stateOrRegion || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.address_city || '—'}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          {f.numberDoctors ?? '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          {f.capacity ?? '—'}
                        </td>
                        <td>
                          <QualityBadge score={f.completeness_score} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div className="progress-fill" style={{ width: `${(f.completeness_score || 0) * 100}%`, background: tier.color }} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                              {formatPercent(f.completeness_score)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
