import { redirect } from 'next/navigation';
// Legacy route: /act/section → /act-sections
export default function ActSectionRedirectPage() {
  redirect('/act-sections');
}
