'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Building2, Users, BedDouble,
  ChevronDown, ChevronUp, X, SlidersHorizontal,
} from 'lucide-react';
import { getFacilities, searchFacilities, type Facility, type FacilityListResponse, type FacilityFilters } from '@/lib/api';
import { GHANA_REGIONS, FACILITY_TYPES, OPERATOR_TYPES, formatPercent, formatNumber, getQualityTier } from '@/lib/constants';
import { LoadingSpinner, ErrorState, QualityBadge, Pagination, SkeletonTable } from '@/components/ui';

// Mock facilities for demo — 969 total
const FACILITY_NAMES = [
  'Korle Bu Teaching Hospital', 'Ridge Hospital', 'Komfo Anokye Teaching Hospital',
  'Tamale Teaching Hospital', 'Greater Accra Regional Hospital', 'Okomfo Anokye Clinic',
  'Effia Nkwanta Regional Hospital', 'Cape Coast Teaching Hospital', 'Ho Municipal Hospital',
  'Sunyani Regional Hospital', 'Bolgatanga Regional Hospital', 'Wa Regional Hospital',
  'La General Hospital', 'Accra Psychiatric Hospital', 'Princess Marie Louise Hospital',
  'Mamprobi Polyclinic', 'Achimota Hospital', 'Legon Hospital', 'Tema General Hospital',
  'Volta Regional Hospital',
];
const REGIONS = ['Greater Accra', 'Ashanti', 'Western', 'Northern', 'Central', 'Volta', 'Eastern', 'Brong Ahafo', 'Upper East', 'Upper West', 'Savannah', 'North East', 'Oti', 'Ahafo', 'Bono East', 'Western North'];
const CITIES = ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Ho', 'Koforidua', 'Sunyani', 'Bolgatanga', 'Wa', 'Damongo', 'Nalerigu', 'Dambai', 'Goaso', 'Techiman', 'Sefwi Wiawso', 'Tema', 'Winneba', 'Sekondi', 'Obuasi'];
const TYPES = ['hospital', 'clinic', 'pharmacy', 'dentist', 'doctor_office'];

function generateMockFacilities(): Facility[] {
  const facilities: Facility[] = [];
  for (let i = 0; i < 969; i++) {
    const regionIdx = i % REGIONS.length;
    const nameIdx = i % FACILITY_NAMES.length;
    const typeIdx = i % TYPES.length;
    const cityIdx = i % CITIES.length;
    const baseName = FACILITY_NAMES[nameIdx];
    const name = i < 20 ? baseName : `${baseName} Branch ${Math.floor(i / 20) + 1}`;
    const docs = Math.max(0, Math.floor(Math.random() * 160));
    const beds = Math.max(0, Math.floor(Math.random() * 1000));
    const score = Math.round((0.2 + Math.random() * 0.7) * 100) / 100;
    facilities.push({
      unique_id: `fac-${i + 1}`,
      name,
      facilityTypeId: TYPES[typeIdx],
      operatorTypeId: i % 3 === 0 ? 'public' : i % 3 === 1 ? 'private' : 'ngo',
      address_city: CITIES[cityIdx],
      address_stateOrRegion: REGIONS[regionIdx],
      specialties: ['General Medicine', 'Surgery', 'Pediatrics'].slice(0, (i % 3) + 1),
      procedure: [],
      equipment: [],
      capability: [],
      phone_numbers: ['+233-302-670071'],
      email: [],
      capacity: beds,
      numberDoctors: docs,
      completeness_score: score,
      organization_type: undefined,
      organizationDescription: undefined,
      address_countryCode: 'GH',
    });
  }
  return facilities;
}

const ALL_MOCK_FACILITIES = generateMockFacilities();

export default function FacilitiesPage() {
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FacilityFilters>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Server-side state (when API is available)
  const [serverTotal, setServerTotal] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: FacilityListResponse;
      if (appliedSearch.trim()) {
        data = await searchFacilities(appliedSearch, page, pageSize, filters.region);
      } else {
        data = await getFacilities({
          ...filters,
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
      }
      setAllFacilities(data.items);
      setServerTotal(data.total);
      setServerTotalPages(data.total_pages);
      setUsingMock(false);
    } catch {
      // Use mock data with full client-side operations
      setAllFacilities(ALL_MOCK_FACILITIES);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, sortBy, sortOrder, appliedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering, sorting, and pagination for mock data
  const processedData = useMemo(() => {
    if (!usingMock) {
      return {
        items: allFacilities,
        total: serverTotal,
        totalPages: serverTotalPages,
      };
    }

    let filtered = [...allFacilities];

    // Search filter
    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      filtered = filtered.filter((f) =>
        f.name?.toLowerCase().includes(q) ||
        f.address_city?.toLowerCase().includes(q) ||
        f.address_stateOrRegion?.toLowerCase().includes(q) ||
        f.facilityTypeId?.toLowerCase().includes(q)
      );
    }

    // Region filter
    if (filters.region) {
      filtered = filtered.filter((f) => f.address_stateOrRegion === filters.region);
    }

    // Facility type filter
    if (filters.facility_type) {
      filtered = filtered.filter((f) => f.facilityTypeId === filters.facility_type);
    }

    // Operator type filter
    if (filters.operator_type) {
      filtered = filtered.filter((f) => f.operatorTypeId === filters.operator_type);
    }

    // Has doctors filter
    if (filters.has_doctors !== undefined) {
      filtered = filtered.filter((f) =>
        filters.has_doctors ? (f.numberDoctors || 0) > 0 : (f.numberDoctors || 0) === 0
      );
    }

    // Has beds filter
    if (filters.has_beds !== undefined) {
      filtered = filtered.filter((f) =>
        filters.has_beds ? (f.capacity || 0) > 0 : (f.capacity || 0) === 0
      );
    }

    // Min completeness filter
    if (filters.min_completeness && filters.min_completeness > 0) {
      filtered = filtered.filter((f) => (f.completeness_score || 0) >= (filters.min_completeness || 0));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortBy) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'address_stateOrRegion':
          aVal = (a.address_stateOrRegion || '').toLowerCase();
          bVal = (b.address_stateOrRegion || '').toLowerCase();
          break;
        case 'completeness_score':
          aVal = a.completeness_score || 0;
          bVal = b.completeness_score || 0;
          break;
        case 'capacity':
          aVal = a.capacity || 0;
          bVal = b.capacity || 0;
          break;
        case 'numberDoctors':
          aVal = a.numberDoctors || 0;
          bVal = b.numberDoctors || 0;
          break;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, totalPages };
  }, [allFacilities, usingMock, appliedSearch, filters, sortBy, sortOrder, page, pageSize, serverTotal, serverTotalPages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setAppliedSearch('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '') || appliedSearch.trim();

  const { items: displayItems, total, totalPages } = processedData;

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
            Search, filter, and browse {formatNumber(usingMock ? ALL_MOCK_FACILITIES.length : serverTotal || ALL_MOCK_FACILITIES.length)} healthcare facilities across Ghana
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
                  placeholder="Search facilities by name, city, or region…"
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
                  onChange={(e) => { setFilters({ ...filters, region: e.target.value || undefined }); setPage(1); }}
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
                  onChange={(e) => { setFilters({ ...filters, facility_type: e.target.value || undefined }); setPage(1); }}
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
                  onChange={(e) => { setFilters({ ...filters, operator_type: e.target.value || undefined }); setPage(1); }}
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
                  onChange={(e) => { setFilters({ ...filters, has_doctors: e.target.value === '' ? undefined : e.target.value === 'true' }); setPage(1); }}
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
                  onChange={(e) => { setFilters({ ...filters, has_beds: e.target.value === '' ? undefined : e.target.value === 'true' }); setPage(1); }}
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
                  onChange={(e) => { setFilters({ ...filters, min_completeness: parseFloat(e.target.value) || undefined }); setPage(1); }}
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
            Showing {Math.min(displayItems.length, pageSize)} of {formatNumber(total)} facilities
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="input select"
              style={{ width: 160 }}
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="name">Sort: Name</option>
              <option value="address_stateOrRegion">Sort: Region</option>
              <option value="completeness_score">Sort: Quality</option>
              <option value="capacity">Sort: Beds</option>
              <option value="numberDoctors">Sort: Doctors</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1); }}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <select
              className="input select"
              style={{ width: 140 }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
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
                    <th style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                        <Users size={13} /> Doctors
                      </div>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                        <BedDouble size={13} /> Beds
                      </div>
                    </th>
                    <th>Quality</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((f) => {
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
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>
                          {f.numberDoctors != null ? formatNumber(f.numberDoctors) : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>
                          {f.capacity != null ? formatNumber(f.capacity) : '—'}
                        </td>
                        <td>
                          <QualityBadge score={f.completeness_score} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div className="progress-fill" style={{ width: `${(f.completeness_score || 0) * 100}%`, background: tier.color }} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
