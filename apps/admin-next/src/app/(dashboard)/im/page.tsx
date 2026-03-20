import { redirect } from 'next/navigation';

// Legacy route: /im → /customer-service
export default function ImRedirectPage() {
  redirect('/customer-service');
}
