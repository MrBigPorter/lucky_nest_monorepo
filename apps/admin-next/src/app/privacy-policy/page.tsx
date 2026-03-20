import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for JoyMini Admin access application.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-dark-900 border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: 2026-03-20
          </p>
        </header>

        <section className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            1. What We Collect
          </h2>
          <p>
            For access application, we collect the information you submit,
            including username, full name, email, and application reason.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            2. How We Use Data
          </h2>
          <p>
            We use this data only for account review, approval workflow,
            security checks, and audit records.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            3. Data Security
          </h2>
          <p>
            Submitted data is processed through protected admin APIs and stored
            with access controls. We limit internal access to authorized staff.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            4. Contact
          </h2>
          <p>
            For privacy requests, contact the system administrator through your
            official support channel.
          </p>
        </section>

        <div className="pt-2">
          <Link
            href="/register-apply"
            className="text-sm text-primary-500 hover:underline"
          >
            Back to Apply for Access
          </Link>
        </div>
      </div>
    </main>
  );
}
