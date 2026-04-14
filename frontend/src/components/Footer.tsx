'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname === '/ask') return null;

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-primary)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        © 2026 Virtue Foundation — Ghana Healthcare Intelligence Platform.
        Built for the Databricks × Accenture Hackathon.
      </div>
    </footer>
  );
}
