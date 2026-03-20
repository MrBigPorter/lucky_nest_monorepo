import { redirect } from 'next/navigation';
// Legacy route: /payment/channels → /payment-channels
export default function PaymentChannelsRedirectPage() {
  redirect('/payment-channels');
}
