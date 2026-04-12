import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Ghana Healthcare Intelligence Platform — Virtue Foundation",
  description:
    "Data-driven healthcare analytics platform providing insights into Ghana's healthcare facilities, regional performance, medical deserts, and AI-powered intelligence for public health planning.",
  keywords: [
    "Ghana", "healthcare", "medical deserts", "facilities", "analytics",
    "Virtue Foundation", "public health", "AI", "intelligence platform"
  ],
  authors: [{ name: "Virtue Foundation" }],
  openGraph: {
    title: "Ghana Healthcare Intelligence Platform",
    description: "Empowering healthcare planners with data-driven insights for Ghana's healthcare infrastructure.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
            },
          }}
        />
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </main>
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
      </body>
    </html>
  );
}
