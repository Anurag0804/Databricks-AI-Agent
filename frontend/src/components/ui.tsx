'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export function LoadingSpinner({ size = 40, text }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid var(--border-primary)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin-slow 1s linear infinite',
        }}
      />
      {text && (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{text}</div>
      )}
    </div>
  );
}

export function SkeletonCard({ count = 1, height = 120 }: { count?: number; height?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height, borderRadius: 'var(--radius-lg)', width: '100%' }}
        />
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-md)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 'var(--radius-md)' }} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          marginBottom: '1rem',
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          fontSize: '1.5rem',
        }}
      >
        ⚠️
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Error
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 400, marginBottom: '1.5rem' }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function QualityBadge({ score }: { score?: number | null }) {
  if (score === null || score === undefined) {
    return <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>Unknown</span>;
  }

  let tier: { label: string; className: string };
  if (score >= 0.8) tier = { label: 'Excellent', className: 'badge-success' };
  else if (score >= 0.6) tier = { label: 'Good', className: 'badge-primary' };
  else if (score >= 0.4) tier = { label: 'Fair', className: 'badge-warning' };
  else tier = { label: 'Poor', className: 'badge-error' };

  return <span className={`badge ${tier.className}`}>{tier.label}</span>;
}

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  const map: Record<string, string> = {
    critical: 'badge-error',
    high: 'badge-warning',
    moderate: 'badge-info',
    low: 'badge-success',
  };
  return (
    <span className={`badge ${map[severity] || 'badge-primary'}`}>
      <span className={`severity-dot severity-dot-${severity}`} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const range = 2;
  for (let i = Math.max(1, page - range); i <= Math.min(totalPages, page + range); i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '1rem 0' }}>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>
      {pages[0] > 1 && (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(1)}>1</button>
          {pages[0] > 2 && <span style={{ color: 'var(--text-tertiary)' }}>…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span style={{ color: 'var(--text-tertiary)' }}>…</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
