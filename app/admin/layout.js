import Providers from '../providers';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata = {
  title: 'Tournify Admin',
  description: 'Admin dashboard for managing tournaments',
};

export default function Layout({ children }) {
  return (
    <Providers>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Providers>
  );
}
