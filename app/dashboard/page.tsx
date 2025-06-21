import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  // In case some legacy code navigates to /dashboard, redirect to home.
  redirect('/');
  return null;
}
