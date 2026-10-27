import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import MaintenancePage from './components/MaintenancePage';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Portfolio from './pages/Portfolio';
import CaseStudy from './pages/CaseStudy';
import About from './pages/About';
import Insights from './pages/Insights';
import Article from './pages/Article';
import Contact from './pages/Contact';
import StartProject from './pages/StartProject';
import Pricing from './pages/Pricing';
import { Privacy, Terms } from './pages/Legal';
import ThankYou from './pages/ThankYou';
import NotFound from './pages/NotFound';
import AdminRoutes from './pages/admin';
import SignAgreement from './pages/SignAgreement';
import ClientPortal from './pages/portal/ClientPortal';
import PortalLogin from './pages/portal/PortalLogin';
import { ClientPortalGate, AdminLoginRoute } from './pages/admin';
import { hostMode, isSecureHost, portalOrigin } from './lib/host';

/** Base URL of the enquiry API. Uses api.heymovox.com subdomain in production. */
const API_BASE = (import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com').replace(/\/+$/, '');

/**
 * Maintenance mode only covers the public marketing pages. Staff dashboards,
 * the client portal and emailed agreement-signing links stay reachable so the
 * team can keep working (and clients can still sign) while the site is down.
 */
const MAINTENANCE_EXEMPT = '/* dummy */';

/**
 * The app serves three separate surfaces, decided by hostname:
 *
 *   heymovox.com         → marketing site (below)
 *   admin.heymovox.com   → staff login + dashboard only
 *   portal.heymovox.com  → client portal only
 *   secure.heymovox.com  → redirects to the portal
 *
 * On localhost the paths are used instead (/admin/login, /portal/login), so
 * development is unchanged.
 */
export default function App() {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (hostMode() !== 'site') {
      setChecking(false);
      return;
    }
    // Build-time kill switch: set VITE_MAINTENANCE=true and redeploy to show
    // the maintenance page even when the API is unreachable. Clearing it takes
    // another rebuild, so the runtime flag below stays the normal control.
    if (import.meta.env.VITE_MAINTENANCE === 'true') {
      setMaintenance(true);
      setChecking(false);
      return;
    }
    fetch(`${API_BASE}/api/content/maintenance`)
      .then(r => {
        if (!r.ok) throw new Error(`maintenance flag: HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setMaintenance(Boolean(d.maintenance)))
      .catch(err => {
        // Fail open: if the flag can't be read, show the site rather than a
        // maintenance page nobody can turn off.
        console.error(err);
        setMaintenance(false);
      })
      .finally(() => setChecking(false));
  }, []);

  const publicSiteOnly = true;

  if (isSecureHost()) return <SecureRedirect />;

  const mode = hostMode();

  return (
    <AuthProvider>
      {mode === 'admin' && (
        <Routes>
          {/* the login screen lives at the short /login slug on this host */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLoginRoute />} />
          {/* old URLs keep working by bouncing to the new slug */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )}

      {mode === 'portal' && (
        <Routes>
          <Route path="/" element={<Navigate to="/portal" replace />} />
          <Route path="/login" element={<Navigate to="/portal/login" replace />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route element={<ClientPortalGate />}>
            <Route path="/portal" element={<ClientPortal />} />
          </Route>
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      )}

      {mode === 'site' && (
        checking ? (
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          </div>
        ) : maintenance && publicSiteOnly ? (
          <MaintenancePage />
        ) : (
          <Routes>
            <Route path="sign/:token" element={<SignAgreement />} />
            <Route path="portal/login" element={<PortalLogin />} />
            <Route element={<ClientPortalGate />}>
              <Route path="portal" element={<ClientPortal />} />
            </Route>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="services/:slug" element={<ServiceDetail />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="portfolio/:slug" element={<CaseStudy />} />
              <Route path="about" element={<About />} />
              <Route path="insights" element={<Insights />} />
              <Route path="insights/:slug" element={<Article />} />
              <Route path="contact" element={<Contact />} />
              <Route path="start-a-project" element={<StartProject />} />
              <Route path="thank-you" element={<ThankYou />} />
              <Route path="privacy-policy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/*" element={<AdminRoutes />} />
          </Routes>
        )
      )}
    </AuthProvider>
  );
}

/**
 * secure.heymovox.com is reserved as a memorable security address; it always
 * forwards to the client portal.
 */
function SecureRedirect() {
  const target = portalOrigin();
  return <RedirectTo target={target} />;
}

/**
 * Hard redirect (full page load, not client-side routing) so the portal is
 * served by its own origin.
 */
function RedirectTo({ target }: { target: string }) {
  // Replace immediately on mount; keep a visible message in case of a CSP block.
  if (typeof window !== 'undefined' && window.location.href !== `${target}/`) {
    window.location.replace(`${target}/`);
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="font-heading text-lg font-semibold text-ink">
        Redirecting to the client portal…
      </p>
      <p className="text-sm text-slate-500">
        If nothing happens,{' '}
        <a href={target} className="font-semibold text-brand-700 hover:underline">
          open the portal
        </a>
        .
      </p>
    </div>
  );
}