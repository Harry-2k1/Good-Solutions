import DashboardLayout from '@/components/layout/DashboardLayout';
import CompaniesPage from '@/components/pages/CompaniesPage';

export default function HomePage() {
  return (
    <DashboardLayout>
      <CompaniesPage />
    </DashboardLayout>
  );
}
