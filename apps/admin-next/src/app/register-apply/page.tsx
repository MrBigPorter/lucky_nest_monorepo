import type { Metadata } from 'next';
import { RecaptchaClientProvider } from '@/components/RecaptchaClientProvider';
import { RegisterApply } from '@/views/RegisterApply';

export const metadata: Metadata = {
  title: 'Apply for Access — JoyMini Admin',
  description:
    'Submit an account application to request access to JoyMini Admin.',
  robots: { index: false, follow: false },
};

export default function RegisterApplyPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
  return (
    <RecaptchaClientProvider siteKey={siteKey}>
      <RegisterApply />
    </RecaptchaClientProvider>
  );
}
