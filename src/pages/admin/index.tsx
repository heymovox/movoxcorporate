import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminShell from '../../components/admin/AdminShell';
import { AdminErrorBoundary } from '../../components/admin/AdminErrorBoundary';
import AdminLogin from './Login';
import { isAdminHost } from '../../lib/host';
import AdminDashboard from './Dashboard';
import AdminEnquiries from './Enquiries';
import AdminProjects from './Projects';
import AdminWorks from './Works';
import AdminBlogs from './Blogs';
import AdminTeam from './Team';
import AdminUsers from './Users';
import AdminInvoices from './Invoices';
import AdminAgreements from './Agreements';
import AdminPolicies from './Policies';
import AdminSettings from './Settings';

export function ClientPortalGate() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />;
  }
  if (user.role !== 'client') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative flex items-center justify-center">
        <img
          src="/images/brand/logo-dark.png"
          alt="MovoX"
          className="h-16 w-auto animate-pulse"
          width="220"
          height="57"
        />
      </div>
    </div>
  );
}

/**
 * The login screen for the admin host's short `/login` slug. Already-signed-in
 * visitors are sent straight to the dashboard so the URL never lies about
 * what's on screen.
 */
export function AdminLoginRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/admin" replace />;
  return <AdminLogin />;
}

export default function AdminRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  // admin.heymovox.com uses the short /login slug; the path-based localhost
  // setup keeps /admin/login.
  const loginPath = isAdminHost() ? '/login' : '/admin/login';
  const isLogin =
    location.pathname === '/admin/login' || location.pathname === '/login';

  if (!user) {
    return isLogin ? <AdminLogin /> : <Navigate to={loginPath} replace />;
  }

  // Clients belong in the portal, never the admin surface.
  if (user.role === 'client') return <Navigate to="/portal" replace />;

  // Already signed in — skip the login screen.
  if (isLogin) return <Navigate to="/admin" replace />;

  return (
    <AdminErrorBoundary>
      <Routes>
        <Route element={<AdminShell />}>
<Route index element={<AdminDashboard />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="works" element={<AdminWorks />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="agreements" element={<AdminAgreements />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AdminErrorBoundary>
  );
}