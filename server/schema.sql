-- MovoX admin — content & operations schema
-- Idempotent: safe to re-run.
--
-- NOTE: `updated_at` is maintained by the application layer (server/index.ts
-- sets `updated_at = now()` on every UPDATE) rather than by a BEFORE UPDATE
-- trigger. This keeps the migration portable to statement-splitting runners.

-- ---------------------------------------------------------------------------
-- Our Works (case studies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS works (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL,
  client            text NOT NULL DEFAULT '',
  client_descriptor text NOT NULL DEFAULT '',
  category          text NOT NULL DEFAULT 'Branding',
  services          text[] NOT NULL DEFAULT '{}',
  year              text NOT NULL DEFAULT '',
  summary           text NOT NULL DEFAULT '',
  image             text NOT NULL DEFAULT '',
  challenge         text NOT NULL DEFAULT '',
  objectives        text[] NOT NULL DEFAULT '{}',
  approach          text[] NOT NULL DEFAULT '{}',
  deliverables      text[] NOT NULL DEFAULT '{}',
  results           jsonb NOT NULL DEFAULT '[]'::jsonb,
  quote             jsonb,
  is_sample         boolean NOT NULL DEFAULT false,
  published         boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS works_published_idx ON works (published, sort_order);
CREATE INDEX IF NOT EXISTS works_category_idx ON works (category);

-- ---------------------------------------------------------------------------
-- Blogs (insights)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  excerpt         text NOT NULL DEFAULT '',
  category        text NOT NULL DEFAULT 'Branding',
  published_on    date NOT NULL DEFAULT CURRENT_DATE,
  reading_minutes integer NOT NULL DEFAULT 5,
  image           text NOT NULL DEFAULT '',
  author          text NOT NULL DEFAULT '',
  author_role     text NOT NULL DEFAULT '',
  body            jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_services text[] NOT NULL DEFAULT '{}',
  published       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blogs_published_idx ON blogs (published, published_on DESC);
CREATE INDEX IF NOT EXISTS blogs_category_idx ON blogs (category);

-- ---------------------------------------------------------------------------
-- Team
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text NOT NULL DEFAULT '',
  bio        text NOT NULL DEFAULT '',
  email      text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  photo      text NOT NULL DEFAULT '',
  linkedin   text NOT NULL DEFAULT '',
  twitter    text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_active_idx ON team_members (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Users (extend existing admin_users)
-- ---------------------------------------------------------------------------
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone     text NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar   text NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes    text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS admin_users_active_idx ON admin_users (is_active);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  client_name    text NOT NULL,
  client_email   text NOT NULL DEFAULT '',
  client_company text NOT NULL DEFAULT '',
  enquiry_id     uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  issue_date     date NOT NULL DEFAULT CURRENT_DATE,
  due_date       date,
  subtotal       numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate       numeric(5,2)  NOT NULL DEFAULT 0,
  tax_amount     numeric(12,2) NOT NULL DEFAULT 0,
  discount       numeric(12,2) NOT NULL DEFAULT 0,
  total          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'INR',
  status         text NOT NULL DEFAULT 'draft',
  notes          text NOT NULL DEFAULT '',
  terms          text NOT NULL DEFAULT '',
  paid_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status, issue_date DESC);
CREATE INDEX IF NOT EXISTS invoices_client_idx ON invoices (client_email);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity    numeric(10,2) NOT NULL DEFAULT 1,
  unit_price  numeric(12,2) NOT NULL DEFAULT 0,
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_items (invoice_id, sort_order);

-- ---------------------------------------------------------------------------
-- Agreements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agreements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  reference       text NOT NULL UNIQUE,
  agreement_type  text NOT NULL DEFAULT 'Service Agreement',
  client_name     text NOT NULL DEFAULT '',
  client_email    text NOT NULL DEFAULT '',
  client_company  text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'draft',
  content         text NOT NULL DEFAULT '',
  effective_date  date,
  expiry_date     date,
  signed_at       timestamptz,
  signature_name  text NOT NULL DEFAULT '',
  document_url    text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agreements_status_idx ON agreements (status, effective_date DESC);
CREATE INDEX IF NOT EXISTS agreements_client_idx ON agreements (client_email);

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  category      text NOT NULL DEFAULT 'General',
  summary       text NOT NULL DEFAULT '',
  content       text NOT NULL DEFAULT '',
  version       text NOT NULL DEFAULT '1.0',
  effective_date date,
  status        text NOT NULL DEFAULT 'draft',
  show_in_footer boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policies_status_idx ON policies (status, sort_order);

-- ---------------------------------------------------------------------------
-- Settings (key/value)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL DEFAULT 'null'::jsonb,
  group_name text NOT NULL DEFAULT 'General',
  label      text NOT NULL DEFAULT '',
  type       text NOT NULL DEFAULT 'text',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value, group_name, label, type) VALUES
  ('company.name',            '"MovoX"',                                   'Company',  'Company name',        'text'),
  ('company.tagline',         '"Beyond Digital"',                           'Company',  'Tagline',             'text'),
  ('company.email',           '"info@heymovox.com"',                        'Company',  'Public email',        'text'),
  ('company.phone',           '"+91 95006 95006"',                          'Company',  'Public phone',        'text'),
  ('company.address',         '"Coimbatore, Tamil Nadu, India"',            'Company',  'Address',             'text'),
  ('social.instagram',        '"https://www.instagram.com/movox.agency"',  'Social',   'Instagram URL',       'text'),
  ('social.twitter',          '"https://twitter.com/movox_agency"',         'Social',   'Twitter URL',         'text'),
  ('social.linkedin',         '"https://www.linkedin.com/company/movox"',   'Social',   'LinkedIn URL',        'text'),
  ('enquiry.notify_email',    '"info@heymovox.com"',                        'Enquiries','Notification email',  'text'),
  ('enquiry.auto_reply',      'false',                                      'Enquiries','Send auto-reply',     'boolean'),
  ('invoice.next_number',     '"INV-0001"',                                 'Invoicing','Next invoice number', 'text'),
  ('invoice.default_tax_rate','18',                                         'Invoicing','Default tax rate %',  'number'),
  ('invoice.default_terms',   '"Payment due within 14 days of invoice date."','Invoicing','Default terms',      'text'),
  ('maintenance_mode',        'false',                                      'Site',      'Maintenance mode (public site)', 'boolean')
ON CONFLICT (key) DO NOTHING;
-- ---------------------------------------------------------------------------
-- Incremental migrations
-- Applied after the base schema above; kept here so a fresh install matches.
-- ---------------------------------------------------------------------------

-- 2026-10-19: footer newsletter signups.
-- Newsletter rows live in `enquiries` so they surface in the admin Enquiries
-- screen. `budget` / `timeline` are NOT NULL on that table, so newsletter
-- inserts pass an explicit 'n/a' rather than relying on a default.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'enquiry';

-- One subscriber per address. Re-subscribing updates instead of duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS idx_enquiries_newsletter_email
  ON enquiries (email) WHERE source = 'newsletter';

-- 2026-10-20: staff login accounts created from the Team page.
-- `email` is the login address (generated, e.g. sweatha@heymovox.com);
-- personal_email is where credentials and role-change notices are delivered,
-- because the company address cannot receive its own password.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS personal_email text NOT NULL DEFAULT '';

-- 2026-10-19: public-site maintenance flag.
-- Read by GET /api/content/maintenance; when true the site shell renders the
-- maintenance page instead of the marketing routes. Staff surfaces (admin,
-- portal, agreement signing) are exempt in App.tsx.
INSERT INTO settings (key, value, group_name, label, type) VALUES
  ('maintenance_mode', 'false', 'Site', 'Maintenance mode (public site)', 'boolean')
ON CONFLICT (key) DO NOTHING;
