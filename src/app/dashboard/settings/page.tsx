
import { redirect } from 'next/navigation';

// This page now acts as a root for the settings section.
// Redirect to the "profile" settings page by default.
export default function SettingsRootPage() {
  redirect('/dashboard/settings/profile');
}
