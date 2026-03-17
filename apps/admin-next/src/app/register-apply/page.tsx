import type { Metadata } from 'next';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
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
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <RegisterApply />
    </GoogleReCaptchaProvider>
  );
}
