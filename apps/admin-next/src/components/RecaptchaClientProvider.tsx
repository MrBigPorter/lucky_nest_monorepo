'use client';

import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface Props {
  siteKey: string;
  children: React.ReactNode;
}

/**
 * Client-side wrapper for GoogleReCaptchaProvider.
 * Must be a Client Component because react-google-recaptcha-v3
 * uses React.createContext internally (RSC-incompatible).
 */
export function RecaptchaClientProvider({ siteKey, children }: Props) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
