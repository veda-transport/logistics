-- ============================================================================
-- VEDA TRANSPORT - MULTI-TENANT SAAS DATABASE SCHEMA & ARCHITECTURE
-- Target Database: Supabase PostgreSQL
-- ============================================================================
-- Description:
-- Complete production schema for Veda Transport Admin Panel.
-- Multi-tenant SaaS ready with Row Level Security (RLS) on all tables.
-- Contains EXACTLY the 15 required core tables, enums, triggers, indexes,
-- and reporting views.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. POSTGRESQL ENUMS (TYPE SAFETY)
-- ----------------------------------------------------------------------------

-- Organization & User Enums
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff', 'accountant');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'invited');

-- Driver Enums
CREATE TYPE driver_salary_type AS ENUM ('monthly', 'per_trip', 'daily', 'none');
CREATE TYPE driver_commission_type AS ENUM ('fixed_per_fera', 'percentage', 'per_ton', 'manual');
CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_leave');

-- Truck Enums
CREATE TYPE truck_owner_type AS ENUM ('company');
CREATE TYPE truck_status AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE truck_financial_type AS ENUM ('emi', 'insurance', 'tax', 'other');
CREATE TYPE financial_frequency AS ENUM ('monthly', 'yearly', 'one_time');
CREATE TYPE truck_expense_type AS ENUM ('repair', 'puncture', 'service', 'tyre', 'battery', 'maintenance', 'other');

-- Master Data Enums
CREATE TYPE party_status AS ENUM ('active', 'inactive');
CREATE TYPE material_unit AS ENUM ('ton', 'kg', 'piece', 'other');
CREATE TYPE material_status AS ENUM ('active', 'inactive');
CREATE TYPE location_status AS ENUM ('active', 'inactive');

-- Fera & Trip Enums
CREATE TYPE fera_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE fera_doc_type AS ENUM ('weight_slip', 'other');
CREATE TYPE fera_expense_type AS ENUM (
    'diesel', 
    'driver_commission', 
    'weighbridge', 
    'food', 
    'tea_water', 
    'puncture', 
    'repair', 
    'toll', 
    'loading', 
    'unloading', 
    'material_purchase', 
    'other'
);

-- Payment & Payroll Enums
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'other');
CREATE TYPE salary_record_status AS ENUM ('draft', 'calculated', 'partially_paid', 'paid');

-- ----------------------------------------------------------------------------
-- 2. AUTOMATIC TIMESTAMP TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. CORE TABLES (EXACTLY 15 TABLES)
-- ----------------------------------------------------------------------------

-- 1. organizations (Company Master)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India' NOT NULL,
    gst_number VARCHAR(30),
    status organization_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. users (Admin Panel Application Profiles linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role user_role DEFAULT 'staff' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Helper Functions (Fast & Stable)
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. drivers (Driver Master)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    joining_date DATE NOT NULL,
    salary_type driver_salary_type DEFAULT 'monthly' NOT NULL,
    monthly_salary NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    commission_type driver_commission_type DEFAULT 'manual' NOT NULL,
    commission_value NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status driver_status DEFAULT 'active' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. trucks (Truck Master)
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    truck_number VARCHAR(50) NOT NULL,
    truck_type VARCHAR(100) NOT NULL,
    capacity_tons NUMERIC(8, 2) NOT NULL,
    owner_type truck_owner_type DEFAULT 'company' NOT NULL,
    purchase_date DATE,
    status truck_status DEFAULT 'active' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_truck_number_org UNIQUE (organization_id, truck_number)
);

-- 5. truck_financials (Truck recurring/financial expenses: EMI, Insurance, Tax)
CREATE TABLE truck_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    type truck_financial_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    frequency financial_frequency NOT NULL,
    due_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. truck_expenses (Actual truck maintenance/repairs/tyres)
CREATE TABLE truck_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL,
    expense_type truck_expense_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    attachment_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. parties (Customer Master)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(30),
    contact_person VARCHAR(255),
    status party_status DEFAULT 'active' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. materials (Material Master)
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    unit material_unit DEFAULT 'ton' NOT NULL,
    description TEXT,
    status material_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_material_name_org UNIQUE (organization_id, name)
);

-- 9. locations (From & To Location Master)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT,
    status location_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. feras (Main Trip Table)
CREATE TABLE feras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    fera_number VARCHAR(50) NOT NULL,
    fera_date DATE NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE RESTRICT,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    agreed_amount NUMERIC(12, 2) NOT NULL,
    weight NUMERIC(10, 2) NOT NULL,
    weight_unit material_unit DEFAULT 'ton' NOT NULL,
    driver_commission NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status fera_status DEFAULT 'planned' NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_fera_number_org UNIQUE (organization_id, fera_number)
);

-- 11. fera_documents (Weight Slips & Documents Reference)
CREATE TABLE fera_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    fera_id UUID NOT NULL REFERENCES feras(id) ON DELETE CASCADE,
    document_type fera_doc_type DEFAULT 'weight_slip' NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. fera_expenses (Individual Trip Expenses)
CREATE TABLE fera_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    fera_id UUID NOT NULL REFERENCES feras(id) ON DELETE CASCADE,
    expense_type fera_expense_type NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(10, 2),
    unit VARCHAR(30),
    rate NUMERIC(10, 2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. party_payments (Receipts / Advances)
CREATE TABLE party_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method DEFAULT 'bank_transfer' NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. party_payment_allocations (Settlement of Payments to Feras)
CREATE TABLE party_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES party_payments(id) ON DELETE CASCADE,
    fera_id UUID NOT NULL REFERENCES feras(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. driver_salary_records (Monthly Payroll)
CREATE TABLE driver_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    salary_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    basic_salary NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    incentive_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    deduction_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    advance_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    net_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status salary_record_status DEFAULT 'draft' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_driver_salary_month UNIQUE (organization_id, driver_id, salary_month)
);

-- ----------------------------------------------------------------------------
-- 4. ATTACH AUTOMATIC UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_trucks_updated_at BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_feras_updated_at BEFORE UPDATE ON feras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. HIGH-PERFORMANCE COMPOSITE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_drivers_org_status ON drivers(organization_id, status);
CREATE INDEX idx_trucks_org_status ON trucks(organization_id, status);

CREATE INDEX idx_truck_financials_org_truck ON truck_financials(organization_id, truck_id, due_date);
CREATE INDEX idx_truck_expenses_org_truck_date ON truck_expenses(organization_id, truck_id, expense_date DESC);

CREATE INDEX idx_parties_org_status ON parties(organization_id, status);
CREATE INDEX idx_materials_org ON materials(organization_id, status);
CREATE INDEX idx_locations_org ON locations(organization_id, status);

CREATE INDEX idx_feras_org_date ON feras(organization_id, fera_date DESC);
CREATE INDEX idx_feras_org_party ON feras(organization_id, party_id);
CREATE INDEX idx_feras_org_truck ON feras(organization_id, truck_id);
CREATE INDEX idx_feras_org_driver ON feras(organization_id, driver_id);
CREATE INDEX idx_feras_org_status ON feras(organization_id, status);

CREATE INDEX idx_fera_expenses_org_fera ON fera_expenses(organization_id, fera_id);
CREATE INDEX idx_fera_docs_org_fera ON fera_documents(organization_id, fera_id);

CREATE INDEX idx_party_payments_org_party ON party_payments(organization_id, party_id, payment_date DESC);
CREATE INDEX idx_payment_alloc_org_payment ON party_payment_allocations(organization_id, payment_id);
CREATE INDEX idx_payment_alloc_org_fera ON party_payment_allocations(organization_id, fera_id);

CREATE INDEX idx_driver_salary_org_driver_month ON driver_salary_records(organization_id, driver_id, salary_month);

-- ----------------------------------------------------------------------------
-- 6. MULTI-TENANT ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feras ENABLE ROW LEVEL SECURITY;
ALTER TABLE fera_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fera_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_salary_records ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policy
CREATE POLICY "Users can access their own organization"
    ON organizations FOR ALL
    USING (id = get_auth_org_id());

-- 2. Users Policy
CREATE POLICY "Users can view members of their organization"
    ON users FOR SELECT
    USING (organization_id = get_auth_org_id());

CREATE POLICY "Owners and Admins can manage users"
    ON users FOR ALL
    USING (
        organization_id = get_auth_org_id() AND
        get_auth_user_role() IN ('owner', 'admin')
    );

-- 3. Dynamic tenant isolation policy for all business tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'drivers', 'trucks', 'truck_financials', 'truck_expenses', 
        'parties', 'materials', 'locations', 'feras', 'fera_documents', 
        'fera_expenses', 'party_payments', 'party_payment_allocations', 
        'driver_salary_records'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY "Tenant isolation for %I"
                ON %I FOR ALL
                USING (organization_id = get_auth_org_id())
                WITH CHECK (organization_id = get_auth_org_id());
        ', tbl, tbl);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 7. REPORTING & ANALYTICAL VIEWS
-- ----------------------------------------------------------------------------

-- View A: Fera Profit & Loss Live Summary
CREATE OR REPLACE VIEW v_fera_summary AS
SELECT 
    f.id AS fera_id,
    f.organization_id,
    f.fera_number,
    f.fera_date,
    f.agreed_amount AS revenue,
    p.name AS party_name,
    t.truck_number,
    d.name AS driver_name,
    m.name AS material_name,
    fl.name AS from_location,
    tl.name AS to_location,
    COALESCE(fe_agg.total_expenses, 0) AS total_expenses,
    f.agreed_amount - COALESCE(fe_agg.total_expenses, 0) AS net_profit,
    COALESCE(ppa_agg.total_received, 0) AS total_received,
    f.agreed_amount - COALESCE(ppa_agg.total_received, 0) AS outstanding_amount,
    f.status
FROM feras f
JOIN parties p ON f.party_id = p.id
JOIN trucks t ON f.truck_id = t.id
JOIN drivers d ON f.driver_id = d.id
JOIN materials m ON f.material_id = m.id
JOIN locations fl ON f.from_location_id = fl.id
JOIN locations tl ON f.to_location_id = tl.id
LEFT JOIN (
    SELECT fera_id, SUM(amount) AS total_expenses
    FROM fera_expenses
    GROUP BY fera_id
) fe_agg ON f.id = fe_agg.fera_id
LEFT JOIN (
    SELECT fera_id, SUM(amount) AS total_received
    FROM party_payment_allocations
    GROUP BY fera_id
) ppa_agg ON f.id = ppa_agg.fera_id;

-- View B: Party Ledger & Balance Summary
CREATE OR REPLACE VIEW v_party_ledger_summary AS
SELECT 
    p.id AS party_id,
    p.organization_id,
    p.name AS party_name,
    p.phone,
    COALESCE(fera_stats.total_billed, 0) AS total_billed,
    COALESCE(pay_stats.total_paid, 0) AS total_paid,
    COALESCE(pay_stats.total_allocated, 0) AS total_allocated,
    COALESCE(pay_stats.total_paid, 0) - COALESCE(pay_stats.total_allocated, 0) AS unallocated_advance,
    COALESCE(fera_stats.total_billed, 0) - COALESCE(pay_stats.total_allocated, 0) AS outstanding_balance
FROM parties p
LEFT JOIN (
    SELECT party_id, SUM(agreed_amount) AS total_billed
    FROM feras
    WHERE status != 'cancelled'
    GROUP BY party_id
) fera_stats ON p.id = fera_stats.party_id
LEFT JOIN (
    SELECT 
        pp.party_id,
        SUM(pp.amount) AS total_paid,
        COALESCE(SUM(ppa.amount), 0) AS total_allocated
    FROM party_payments pp
    LEFT JOIN party_payment_allocations ppa ON pp.id = ppa.payment_id
    GROUP BY pp.party_id
) pay_stats ON p.id = pay_stats.party_id;
