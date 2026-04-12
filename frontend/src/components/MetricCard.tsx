'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
  delay?: number;
}

export default function MetricCard({ title, value, subtitle, icon, trend, color = '#3B82F6', delay = 0 }: MetricCardProps) {
  return (
    <div
      className="metric-card animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </div>
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend.positive ? 'var(--success)' : 'var(--error)',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              background: trend.positive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            }}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
