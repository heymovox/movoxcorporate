-- MovoX Corporate — Neon PostgreSQL Schema
-- Run this in your Neon console or via `psql $DATABASE_URL`

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Admin users (staff + client portal accounts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'team_member',
  company     TEXT NOT NULL DEFAULT '',
  client_of   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  phone       TEXT NOT NULL DEFAULT '',
  avatar      TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Enquiries (form submissions + newsletter signups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  business    TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  service     TEXT NOT NULL DEFAULT '',
  budget      TEXT NOT NULL DEFAULT '',
  timeline    TEXT NOT NULL DEFAULT '',
  brief       TEXT NOT NULL DEFAULT '',
  consent     BOOLEAN NOT NULL DEFAULT false,
  source      TEXT NOT NULL DEFAULT 'enquiry',  -- 'enquiry' | 'newsletter'
  ip_address  INET,
  user_agent  TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);
CREATE INDEX IF NOT EXISTS idx_enquiries_source ON enquiries(source);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);

-- ---------------------------------------------------------------------------
-- Works / portfolio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS works (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  client            TEXT NOT NULL DEFAULT '',
  client_descriptor TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT '',
  services          TEXT[] NOT NULL DEFAULT '{}',
  year              TEXT NOT NULL DEFAULT '',
  summary           TEXT NOT NULL DEFAULT '',
  image             TEXT NOT NULL DEFAULT '',
  challenge         TEXT NOT NULL DEFAULT '',
  objectives        TEXT[] NOT NULL DEFAULT '{}',
  approach          TEXT[] NOT NULL DEFAULT '{}',
  deliverables      TEXT[] NOT NULL DEFAULT '{}',
  results           JSONB NOT NULL DEFAULT '[]',
  quote             JSONB,
  is_sample         BOOLEAN NOT NULL DEFAULT false,
  published         BOOLEAN NOT NULL DEFAULT false,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Blogs / insights
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  published_on    DATE,
  reading_minutes INTEGER NOT NULL DEFAULT 0,
  image           TEXT NOT NULL DEFAULT '',
  author          TEXT NOT NULL DEFAULT '',
  author_role     TEXT NOT NULL DEFAULT '',
  body            JSONB NOT NULL DEFAULT '[]',
  related_services TEXT[] NOT NULL DEFAULT '{}',
  published       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Team members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  photo       TEXT NOT NULL DEFAULT '',
  linkedin    TEXT NOT NULL DEFAULT '',
  twitter     TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  client_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'planning',
  priority    TEXT NOT NULL DEFAULT 'normal',
  start_date  DATE,
  end_date    DATE,
  budget      NUMERIC(12,2) NOT NULL DEFAULT 0,
  progress    INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ---------------------------------------------------------------------------
-- Project members (assignments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Project updates / messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL DEFAULT 'message',
  body        TEXT NOT NULL DEFAULT '',
  progress    INTEGER,
  urgency     TEXT NOT NULL DEFAULT 'normal',
  visibility  TEXT NOT NULL DEFAULT 'shared',
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);

-- ---------------------------------------------------------------------------
-- Project files
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  filename        TEXT NOT NULL,
  storage_key     TEXT NOT NULL,
  public_url      TEXT NOT NULL DEFAULT '',
  content_type    TEXT NOT NULL DEFAULT '',
  size_bytes      BIGINT NOT NULL DEFAULT 0,
  client_finalized BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE NOT NULL,
  client_name     TEXT NOT NULL DEFAULT '',
  client_email    TEXT NOT NULL DEFAULT '',
  client_company  TEXT NOT NULL DEFAULT '',
  client_gstin    TEXT NOT NULL DEFAULT '',
  client_address  TEXT NOT NULL DEFAULT '',
  enquiry_id      UUID,
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'draft',
  notes           TEXT NOT NULL DEFAULT '',
  terms           TEXT NOT NULL DEFAULT '',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ---------------------------------------------------------------------------
-- Invoice line items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ---------------------------------------------------------------------------
-- Agreements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agreements (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT NOT NULL DEFAULT '',
  reference             TEXT UNIQUE,
  agreement_type        TEXT NOT NULL DEFAULT 'service',
  client_name           TEXT NOT NULL DEFAULT '',
  client_email          TEXT NOT NULL DEFAULT '',
  client_phone          TEXT NOT NULL DEFAULT '',
  client_company        TEXT NOT NULL DEFAULT '',
  client_address        TEXT NOT NULL DEFAULT '',
  client_gstin          TEXT NOT NULL DEFAULT '',
  client_rep_name       TEXT NOT NULL DEFAULT '',
  client_rep_designation TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'draft',
  content               TEXT NOT NULL DEFAULT '',
  effective_date        DATE,
  expiry_date           DATE,
  signed_at             TIMESTAMPTZ,
  signature_name        TEXT NOT NULL DEFAULT '',
  document_url          TEXT NOT NULL DEFAULT '',
  project_name          TEXT NOT NULL DEFAULT '',
  movox_rep_name        TEXT NOT NULL DEFAULT '',
  movox_rep_designation TEXT NOT NULL DEFAULT '',
  movox_rep_email       TEXT NOT NULL DEFAULT '',
  law_state             TEXT NOT NULL DEFAULT '',
  law_city              TEXT NOT NULL DEFAULT '',
  law_country           TEXT NOT NULL DEFAULT '',
  client_signature      TEXT,
  client_signed_name    TEXT,
  client_signed_at      TIMESTAMPTZ,
  movox_signature       TEXT,
  movox_signed_name     TEXT,
  movox_signed_at       TIMESTAMPTZ,
  share_token           TEXT UNIQUE,
  share_sent_at         TIMESTAMPTZ,
  client_viewed_at      TIMESTAMPTZ,
  schedule_a            JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_share ON agreements(share_token);

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT '',
  summary         TEXT NOT NULL DEFAULT '',
  content         TEXT NOT NULL DEFAULT '',
  version         TEXT NOT NULL DEFAULT '1.0',
  effective_date  DATE,
  status          TEXT NOT NULL DEFAULT 'draft',
  show_in_footer  BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT 'null',
  group_name  TEXT NOT NULL DEFAULT 'general',
  label       TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'text',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
