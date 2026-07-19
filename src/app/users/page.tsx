import DashboardLayout from '@/components/layout/DashboardLayout';
import UsersPage from '@/components/pages/UsersPage';

export default function UsersRoute() {
  return (
    <DashboardLayout>
      <UsersPage />
    </DashboardLayout>
  );
}
