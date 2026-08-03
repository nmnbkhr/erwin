-- =====================================================================
-- CANON — Data Governance Program Platform
-- P0 SCHEMA  v4  (PostgreSQL 15+; 16 assumed)
--
-- CHANGES FROM v3
--  [13] INSERT/UPDATE/DELETE split completed across ALL 19 tables. v3 split
--       only the 7 forkable ones; FOR ALL checks DELETE against USING alone,
--       so a client_sponsor could DELETE an engagement (cascading everything)
--       while being unable to UPDATE it.
--  [14] Column privileges restructured. A column-level REVOKE cannot carve a
--       hole in a table-level GRANT — Postgres warns and changes nothing. The
--       table-level UPDATE grant is now revoked and re-granted per column.
--  [15] user_credential has NO write policy and no DML grant. Every mutation
--       goes through a SECURITY DEFINER function; set_password() added.
--  [16] response_uq widened to (assessment_id, question_id, respondent_id)
--       NULLS NOT DISTINCT, so two respondents can diverge on one question.
--  [17] audit coverage extended to app_user, tenant, user_credential, fork_run;
--       audit_row() redacts password_hash and mfa_secret before writing.
--  [18] apply_engagement_rls() generates the 4-verb split, with DELETE gated
--       one rank higher than UPDATE.
--
-- CHANGES FROM v2
--   [1] TRUST MODEL REBUILT. canon.role GUC removed entirely. Session context
--       carries user_id + tenant_id only. Effective role is resolved from
--       membership by SECURITY DEFINER lookup. A session can no longer assert
--       its own privilege level, so the membership-write escalation path has
--       no target. Library access additionally gates on app_user.is_platform_staff.
--   [2] membership writes constrained by grantable-role ladder (defence in depth)
--   [3] Frozen-version predicate moved into USING as well as WITH CHECK; write
--       policies split INSERT/UPDATE/DELETE so DELETE is covered
--   [4] Library content readable by platform staff only — it is the Godaitec IP
--   [5] audit_row()/audit_event() are SECURITY DEFINER; canon_app loses INSERT
--       on audit_log, so the trail cannot be forged
--   [6] auth_lookup reowned to canon_admin (BYPASSRLS) + REVOKE FROM PUBLIC;
--       lockout state written only via SECURITY DEFINER record_login_attempt()
--   [7] engagement visibility scoped to membership, not tenant-wide
--   [8] fork_run writes constrained to visible engagements
--   [9] assessment + response added — P0.7 cannot compute scores without them
--  [10] scope FKs DEFERRABLE INITIALLY IMMEDIATE + ON UPDATE CASCADE;
--       scope_key immutable after insert
--  [11] canon.apply_engagement_rls() so later migrations cannot add an
--       unprotected table by omission
--  [12] audit rows with NULL tenant (library events) readable by platform staff
--
-- INVENTORY: 19 tables · 9 enums · 5 views · RLS+FORCE on all 19
-- MIGRATION ORDER: 0001_roles → 0002_p0_core → 0003_score_projection
-- =====================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS canon;
SET search_path = canon, public;

DO $$ BEGIN
    IF current_setting('server_version_num')::int < 150000 THEN
        RAISE EXCEPTION 'CANON requires PostgreSQL 15+ (security_invoker views, NULLS NOT DISTINCT)';
    END IF;
END $$;

-- =====================================================================
-- SECTION 1 — ENUMS (9)
-- =====================================================================

CREATE TYPE pillar            AS ENUM ('people','process','policy','technology');
CREATE TYPE rung              AS ENUM ('diagnostic','blueprint','implementation','managed');
CREATE TYPE approval_state    AS ENUM ('draft','in_review','approved','rejected','superseded');
CREATE TYPE deployment_mode   AS ENUM ('saas','single_tenant');
CREATE TYPE engagement_status AS ENUM ('prospect','active','paused','closed');
CREATE TYPE response_type     AS ENUM ('maturity_1_5','boolean','single_select','multi_select','numeric','text');
CREATE TYPE render_engine     AS ENUM ('docxtpl','python_pptx','openpyxl','weasyprint','jinja_md','jinja_yaml','jinja_json');
CREATE TYPE audit_action      AS ENUM ('insert','update','delete','fork','promote','approve','login','login_failed','export');

CREATE TYPE app_role AS ENUM (
    'platform_admin', 'partner', 'consultant',
    'client_sponsor', 'client_steward', 'client_viewer'
);

-- =====================================================================
-- SECTION 2 — SESSION CONTEXT
--
-- The application sets ONLY:
--     SET LOCAL canon.user_id   = '<uuid>';
--     SET LOCAL canon.tenant_id = '<uuid>';
--     SET LOCAL canon.request_id = '...';  SET LOCAL canon.ip = '...';
--
-- There is deliberately no canon.role GUC. In v2 the role was a session claim,
-- which made every read policy reachable by anyone who could insert a
-- membership row for themselves. Role is now a database fact.
-- =====================================================================

CREATE OR REPLACE FUNCTION canon.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('canon.user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION canon.current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('canon.tenant_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION canon.role_rank(r app_role) RETURNS int
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE r
        WHEN 'platform_admin' THEN 60 WHEN 'partner'        THEN 50
        WHEN 'consultant'     THEN 40 WHEN 'client_sponsor' THEN 30
        WHEN 'client_steward' THEN 20 WHEN 'client_viewer'  THEN 10 END
$$;

-- Resolved from membership, never from the session. SECURITY DEFINER so the
-- membership read bypasses RLS and cannot recurse into a policy that calls this.
-- Owner set to canon_admin (BYPASSRLS) in migration 0001_roles.
CREATE OR REPLACE FUNCTION canon.effective_role(p_engagement uuid DEFAULT NULL)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT m.role
    FROM canon.membership m
    WHERE m.user_id   = canon.current_user_id()
      AND m.tenant_id = canon.current_tenant()
      AND (m.engagement_id IS NULL OR m.engagement_id = p_engagement)
    ORDER BY canon.role_rank(m.role) DESC
    LIMIT 1
$$;

-- Godaitec staff flag. canon_app has no UPDATE privilege on this column
-- (see ROLES block), so it cannot be self-granted.
CREATE OR REPLACE FUNCTION canon.is_platform_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT EXISTS (SELECT 1 FROM canon.app_user u
                    WHERE u.id = canon.current_user_id()
                      AND u.is_platform_staff AND u.is_active)
$$;

-- Cross-tenant admin: requires the staff flag AND a platform_admin membership
-- somewhere. Not scoped to current_tenant, which is what makes it cross-tenant.
CREATE OR REPLACE FUNCTION canon.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT canon.is_platform_staff()
       AND EXISTS (SELECT 1 FROM canon.membership m
                    WHERE m.user_id = canon.current_user_id()
                      AND m.role = 'platform_admin')
$$;

CREATE OR REPLACE FUNCTION canon.platform_role_at_least(p_min app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT canon.is_platform_staff()
       AND EXISTS (SELECT 1 FROM canon.membership m
                    WHERE m.user_id = canon.current_user_id()
                      AND canon.role_rank(m.role) >= canon.role_rank(p_min))
$$;

-- [4] Library is Godaitec IP. Clients see their fork, never the source.
CREATE OR REPLACE FUNCTION canon.can_read_library() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT canon.platform_role_at_least('consultant') $$;

CREATE OR REPLACE FUNCTION canon.can_write_library() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT canon.platform_role_at_least('partner') $$;

-- [7] Engagement visibility is membership-scoped. A tenant-wide membership
-- (engagement_id IS NULL) still grants breadth; an engagement-scoped one does not.
CREATE OR REPLACE FUNCTION canon.visible_engagement(p_engagement uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT p_engagement IS NOT NULL AND (
        canon.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM canon.engagement e
            JOIN canon.membership m ON m.tenant_id = e.tenant_id
            WHERE e.id = p_engagement
              AND e.tenant_id = canon.current_tenant()
              AND m.user_id = canon.current_user_id()
              AND (m.engagement_id IS NULL OR m.engagement_id = e.id)
        )
    )
$$;

CREATE OR REPLACE FUNCTION canon.can_write_engagement(p_engagement uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT canon.visible_engagement(p_engagement)
       AND canon.role_rank(canon.effective_role(p_engagement))
           >= canon.role_rank('client_steward')
$$;

-- client_viewer ranks below client_steward, so read-only is a database
-- guarantee rather than an API promise.

-- [13] Destructive operations sit one rank above edits.
CREATE OR REPLACE FUNCTION canon.can_delete_engagement(p_engagement uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT canon.visible_engagement(p_engagement)
       AND canon.role_rank(canon.effective_role(p_engagement))
           >= canon.role_rank('client_sponsor')
$$;

CREATE OR REPLACE FUNCTION canon.library_version_writable(p_version uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT EXISTS (SELECT 1 FROM canon.library_version lv
                    WHERE lv.id = p_version AND NOT lv.is_frozen)
$$;

CREATE OR REPLACE FUNCTION canon.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- =====================================================================
-- SECTION 3 — TENANCY, IDENTITY, CREDENTIALS, AUDIT
-- =====================================================================

CREATE TABLE tenant (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    legal_name  text NOT NULL,
    country     text,
    industry    text,
    deployment  deployment_mode NOT NULL DEFAULT 'saas',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email               text NOT NULL,
    full_name           text NOT NULL,
    is_platform_staff   boolean NOT NULL DEFAULT false,
    is_active           boolean NOT NULL DEFAULT true,
    last_login_at       timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX app_user_email_uq ON app_user (lower(email));

CREATE TABLE user_credential (
    user_id         uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    password_hash   text,
    mfa_secret      text,
    failed_attempts smallint NOT NULL DEFAULT 0,
    locked_until    timestamptz,
    rotated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE membership (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role          app_role NOT NULL,
    engagement_id uuid,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT membership_uq UNIQUE NULLS NOT DISTINCT (tenant_id, user_id, engagement_id)
);

CREATE TABLE audit_log (
    id            bigserial PRIMARY KEY,
    occurred_at   timestamptz NOT NULL DEFAULT now(),
    tenant_id     uuid,
    engagement_id uuid,
    actor_user_id uuid,
    actor_role    text,
    action        audit_action NOT NULL,
    entity_table  text NOT NULL,
    entity_id     text,
    summary       text,
    before_state  jsonb,
    after_state   jsonb,
    request_id    text,
    ip_address    inet
);
CREATE INDEX audit_log_tenant_time_idx ON audit_log (tenant_id, occurred_at DESC);
CREATE INDEX audit_log_engagement_idx  ON audit_log (engagement_id, occurred_at DESC);
CREATE INDEX audit_log_entity_idx      ON audit_log (entity_table, entity_id);

CREATE OR REPLACE FUNCTION canon.block_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'canon.audit_log is append-only (attempted %)', TG_OP; END $$;

CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION canon.block_audit_mutation();

-- [6] Login has no session context, so it cannot satisfy any policy.
-- This definer function is the sole path to credential material, and is
-- reowned to canon_admin (BYPASSRLS) + revoked from PUBLIC in 0001_roles.
CREATE OR REPLACE FUNCTION canon.auth_lookup(p_email text)
RETURNS TABLE (user_id uuid, password_hash text, is_active boolean,
               is_platform_staff boolean, locked_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = canon, pg_temp AS $$
    SELECT u.id, c.password_hash, u.is_active, u.is_platform_staff, c.locked_until
    FROM canon.app_user u
    LEFT JOIN canon.user_credential c ON c.user_id = u.id
    WHERE lower(u.email) = lower(p_email)
$$;

-- Lockout counters are not writable by the account they protect.
CREATE OR REPLACE FUNCTION canon.record_login_attempt(p_user uuid, p_success boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = canon, pg_temp AS $$
BEGIN
    IF p_success THEN
        UPDATE canon.user_credential
           SET failed_attempts = 0, locked_until = NULL WHERE user_id = p_user;
        UPDATE canon.app_user SET last_login_at = now() WHERE id = p_user;
    ELSE
        UPDATE canon.user_credential
           SET failed_attempts = failed_attempts + 1,
               locked_until = CASE WHEN failed_attempts + 1 >= 5
                                   THEN now() + interval '15 minutes' END
         WHERE user_id = p_user;
    END IF;

    INSERT INTO canon.audit_log (actor_user_id, action, entity_table, entity_id,
                                 request_id, ip_address)
    VALUES (p_user, CASE WHEN p_success THEN 'login' ELSE 'login_failed' END,
            'app_user', p_user::text,
            NULLIF(current_setting('canon.request_id', true), ''),
            NULLIF(current_setting('canon.ip', true), '')::inet);
END $$;

-- [15] user_credential has no write policy and no DML grant for canon_app.
-- This is the only door. Adding a column later cannot reopen the column trap.
CREATE OR REPLACE FUNCTION canon.set_password(p_user uuid, p_hash text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = canon, pg_temp AS $$
BEGIN
    IF p_user <> canon.current_user_id() AND NOT canon.is_platform_admin() THEN
        RAISE EXCEPTION 'set_password: not permitted for another user';
    END IF;
    INSERT INTO canon.user_credential (user_id, password_hash, rotated_at)
    VALUES (p_user, p_hash, now())
    ON CONFLICT (user_id) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            rotated_at = now(), failed_attempts = 0, locked_until = NULL;
    PERFORM canon.audit_event('update', 'user_credential', p_user::text, NULL,
                              'password rotated');
END $$;

-- =====================================================================
-- SECTION 4 — LIBRARY VERSIONING + ENGAGEMENT
--
-- SCOPE CONVENTION (every forkable table, parents AND children):
--   engagement_id NULL     + library_version_id NOT NULL -> LIBRARY row
--   engagement_id NOT NULL + library_version_id NULL     -> ENGAGEMENT row
--   scope_key = COALESCE(engagement_id, library_version_id), NEVER NULL,
--               trigger-maintained, IMMUTABLE after insert
--   source_id         -> library row forked from (NULL if client-authored)
--   source_version_id -> library version it came from (survives promote/rebase)
-- =====================================================================

CREATE TABLE library_version (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    semver       text NOT NULL UNIQUE,
    label        text,
    notes        text,
    is_frozen    boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_by   uuid REFERENCES app_user(id),
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION canon.guard_library_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_frozen THEN
            RAISE EXCEPTION 'library_version %: frozen versions cannot be deleted', OLD.semver;
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.is_frozen AND NOT NEW.is_frozen THEN
        RAISE EXCEPTION 'library_version %: freeze is irreversible', OLD.semver;
    END IF;
    IF OLD.is_frozen AND (NEW.semver, NEW.label, NEW.notes)
                      IS DISTINCT FROM (OLD.semver, OLD.label, OLD.notes) THEN
        RAISE EXCEPTION 'library_version %: frozen version is immutable', OLD.semver;
    END IF;
    IF NEW.is_frozen AND NOT OLD.is_frozen AND NEW.published_at IS NULL THEN
        NEW.published_at := now();
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER library_version_guard BEFORE UPDATE OR DELETE ON library_version
    FOR EACH ROW EXECUTE FUNCTION canon.guard_library_version();

CREATE TABLE engagement (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               uuid NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
    code                    text NOT NULL,
    name                    text NOT NULL,
    client_legal_name       text,
    status                  engagement_status NOT NULL DEFAULT 'prospect',
    current_rung            rung NOT NULL DEFAULT 'diagnostic',
    primary_framework_code  text,
    forked_from_version_id  uuid REFERENCES library_version(id),
    forked_at               timestamptz,
    sponsor_name            text,
    sponsor_title           text,
    start_date              date,
    end_date                date,
    metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);

ALTER TABLE membership ADD CONSTRAINT membership_engagement_fk
    FOREIGN KEY (engagement_id) REFERENCES engagement(id) ON DELETE CASCADE;

CREATE TABLE fork_run (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid NOT NULL REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id uuid NOT NULL REFERENCES library_version(id),
    direction          text NOT NULL CHECK (direction IN ('fork','promote','rebase')),
    tables_affected    text[] NOT NULL DEFAULT '{}',
    rows_affected      integer NOT NULL DEFAULT 0,
    manifest           jsonb NOT NULL DEFAULT '{}'::jsonb,
    executed_by        uuid REFERENCES app_user(id),
    executed_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fork_run_one_fork_per_engagement
    ON fork_run (engagement_id) WHERE direction = 'fork';

-- [10] scope_key is set on insert and frozen thereafter. Changing a row's scope
-- would strand its children even with ON UPDATE CASCADE, so it is simply barred.
CREATE OR REPLACE FUNCTION canon.set_scope_key() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.scope_key := COALESCE(NEW.engagement_id, NEW.library_version_id);
    IF NEW.scope_key IS NULL THEN
        RAISE EXCEPTION '%: row must be scoped to an engagement or a library version', TG_TABLE_NAME;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.scope_key IS DISTINCT FROM OLD.scope_key THEN
        RAISE EXCEPTION '%: scope is immutable after insert', TG_TABLE_NAME;
    END IF;
    RETURN NEW;
END $$;

-- =====================================================================
-- SECTION 5 — FRAMEWORK PROJECTION SPINE
-- =====================================================================

CREATE TABLE canonical_capability (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id         uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id    uuid REFERENCES library_version(id),
    scope_key             uuid NOT NULL,
    source_id             uuid REFERENCES canonical_capability(id) ON DELETE SET NULL,
    source_version_id     uuid REFERENCES library_version(id),
    code                  text NOT NULL,
    name                  text NOT NULL,
    pillar                pillar NOT NULL,
    parent_id             uuid,
    description           text,
    evidence_requirements text,
    sort_order            integer NOT NULL DEFAULT 0,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_cc_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_cc_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT cc_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT cc_parent_same_scope FOREIGN KEY (parent_id, scope_key)
        REFERENCES canonical_capability (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT cc_code_uq   UNIQUE (scope_key, code),
    CONSTRAINT cc_source_uq UNIQUE (scope_key, source_id)
);

CREATE TABLE framework (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id uuid REFERENCES library_version(id),
    scope_key          uuid NOT NULL,
    source_id          uuid REFERENCES framework(id) ON DELETE SET NULL,
    source_version_id  uuid REFERENCES library_version(id),
    code               text NOT NULL,
    name               text NOT NULL,
    publisher          text,
    version_label      text,
    is_client_internal boolean NOT NULL DEFAULT false,
    scoring_scale_min  numeric NOT NULL DEFAULT 1,
    scoring_scale_max  numeric NOT NULL DEFAULT 5,
    description        text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_fw_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_fw_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT chk_fw_scale     CHECK (scoring_scale_max > scoring_scale_min),
    CONSTRAINT fw_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT fw_code_uq       UNIQUE (scope_key, code),
    CONSTRAINT fw_source_uq     UNIQUE (scope_key, source_id)
);

CREATE TABLE framework_dimension (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id uuid REFERENCES library_version(id),
    scope_key          uuid NOT NULL,
    source_id          uuid REFERENCES framework_dimension(id) ON DELETE SET NULL,
    source_version_id  uuid REFERENCES library_version(id),
    framework_id       uuid NOT NULL,
    parent_id          uuid,
    code               text NOT NULL,
    name               text NOT NULL,
    pillar             pillar,
    weight             numeric NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
    level              smallint NOT NULL DEFAULT 1,
    description        text,
    sort_order         integer NOT NULL DEFAULT 0,
    CONSTRAINT chk_fd_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_fd_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT fd_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT fd_framework_same_scope FOREIGN KEY (framework_id, scope_key)
        REFERENCES framework (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT fd_parent_same_scope FOREIGN KEY (parent_id, scope_key)
        REFERENCES framework_dimension (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT fd_code_uq   UNIQUE (framework_id, code),
    CONSTRAINT fd_source_uq UNIQUE (scope_key, source_id)
);
CREATE INDEX fd_framework_idx ON framework_dimension (framework_id, parent_id);

CREATE TABLE capability_mapping (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id           uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id      uuid REFERENCES library_version(id),
    scope_key               uuid NOT NULL,
    source_id               uuid REFERENCES capability_mapping(id) ON DELETE SET NULL,
    source_version_id       uuid REFERENCES library_version(id),
    framework_dimension_id  uuid NOT NULL,
    canonical_capability_id uuid NOT NULL,
    coverage_weight         numeric NOT NULL DEFAULT 1.0
                            CHECK (coverage_weight > 0 AND coverage_weight <= 1),
    rationale               text,
    CONSTRAINT chk_cm_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_cm_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT cm_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT cm_dimension_same_scope FOREIGN KEY (framework_dimension_id, scope_key)
        REFERENCES framework_dimension (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT cm_capability_same_scope FOREIGN KEY (canonical_capability_id, scope_key)
        REFERENCES canonical_capability (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT cm_pair_uq   UNIQUE (framework_dimension_id, canonical_capability_id),
    CONSTRAINT cm_source_uq UNIQUE (scope_key, source_id)
);
CREATE INDEX cm_capability_idx ON capability_mapping (canonical_capability_id);

CREATE TABLE question (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id uuid REFERENCES library_version(id),
    scope_key          uuid NOT NULL,
    source_id          uuid REFERENCES question(id) ON DELETE SET NULL,
    source_version_id  uuid REFERENCES library_version(id),
    code               text NOT NULL,
    prompt             text NOT NULL,
    guidance           text,
    response_type      response_type NOT NULL DEFAULT 'maturity_1_5',
    options            jsonb NOT NULL DEFAULT '[]'::jsonb,
    evidence_required  boolean NOT NULL DEFAULT false,
    target_role        app_role,
    sort_order         integer NOT NULL DEFAULT 0,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_q_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_q_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT q_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT q_code_uq       UNIQUE (scope_key, code),
    CONSTRAINT q_source_uq     UNIQUE (scope_key, source_id)
);

CREATE TABLE question_mapping (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id           uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id      uuid REFERENCES library_version(id),
    scope_key               uuid NOT NULL,
    source_id               uuid REFERENCES question_mapping(id) ON DELETE SET NULL,
    source_version_id       uuid REFERENCES library_version(id),
    question_id             uuid NOT NULL,
    canonical_capability_id uuid NOT NULL,
    weight                  numeric NOT NULL DEFAULT 1.0 CHECK (weight > 0),
    CONSTRAINT chk_qm_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_qm_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT qm_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT qm_question_same_scope FOREIGN KEY (question_id, scope_key)
        REFERENCES question (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT qm_capability_same_scope FOREIGN KEY (canonical_capability_id, scope_key)
        REFERENCES canonical_capability (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT qm_pair_uq   UNIQUE (question_id, canonical_capability_id),
    CONSTRAINT qm_source_uq UNIQUE (scope_key, source_id)
);

CREATE TABLE artifact_template (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid REFERENCES engagement(id) ON DELETE CASCADE,
    library_version_id uuid REFERENCES library_version(id),
    scope_key          uuid NOT NULL,
    source_id          uuid REFERENCES artifact_template(id) ON DELETE SET NULL,
    source_version_id  uuid REFERENCES library_version(id),
    code               text NOT NULL,
    name               text NOT NULL,
    rung               rung NOT NULL,
    pillar             pillar,
    engine             render_engine NOT NULL,
    template_path      text NOT NULL,
    output_extension   text NOT NULL,
    binding_spec       jsonb NOT NULL DEFAULT '{}'::jsonb,
    requires_approval  boolean NOT NULL DEFAULT true,
    description        text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_at_scope     CHECK ((engagement_id IS NULL) <> (library_version_id IS NULL)),
    CONSTRAINT chk_at_scope_key CHECK (scope_key = COALESCE(engagement_id, library_version_id)),
    CONSTRAINT at_id_scope_uq   UNIQUE (id, scope_key),
    CONSTRAINT at_code_uq       UNIQUE (scope_key, code),
    CONSTRAINT at_source_uq     UNIQUE (scope_key, source_id)
);

-- =====================================================================
-- SECTION 6 — ASSESSMENT + RESPONSE  [9]
-- Engagement-scoped only (never forkable). The composite FK to question
-- enforces that a response can only target a FORKED question, never a
-- library one — the same scope discipline as the crosswalk.
-- =====================================================================

CREATE TABLE assessment (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES engagement(id) ON DELETE CASCADE,
    code          text NOT NULL,
    name          text NOT NULL,
    status        approval_state NOT NULL DEFAULT 'draft',
    fielded_at    timestamptz,
    completed_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT assessment_code_uq UNIQUE (engagement_id, code),
    CONSTRAINT assessment_id_scope_uq UNIQUE (id, engagement_id)
);

CREATE TABLE response (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id  uuid NOT NULL,
    assessment_id  uuid NOT NULL,
    question_id    uuid NOT NULL,
    value_numeric  numeric,
    value_bool     boolean,
    value_text     text,
    value_json     jsonb,
    respondent_id  uuid REFERENCES app_user(id),
    answered_at    timestamptz NOT NULL DEFAULT now(),
    confidence     smallint CHECK (confidence BETWEEN 1 AND 5),
    notes          text,
    CONSTRAINT response_has_value CHECK (
        num_nonnulls(value_numeric, value_bool, value_text, value_json) >= 1),
    CONSTRAINT response_assessment_fk FOREIGN KEY (assessment_id, engagement_id)
        REFERENCES assessment (id, engagement_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT response_question_same_scope FOREIGN KEY (question_id, engagement_id)
        REFERENCES question (id, scope_key)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    -- [16] NULLS NOT DISTINCT keeps a single anonymous response possible
    -- alongside named ones. Without respondent_id in the key, risk and IT
    -- cannot both answer one question, so divergence is unrecordable.
    CONSTRAINT response_uq UNIQUE NULLS NOT DISTINCT
        (assessment_id, question_id, respondent_id)
);
CREATE INDEX response_engagement_idx ON response (engagement_id);

-- =====================================================================
-- SECTION 7 — PILLAR-TAGGED TASK STUB (Wave model = P5)
-- =====================================================================

CREATE TABLE task (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES engagement(id) ON DELETE CASCADE,
    code          text NOT NULL,
    name          text NOT NULL,
    pillar        pillar NOT NULL,
    rung          rung NOT NULL,
    state         approval_state NOT NULL DEFAULT 'draft',
    wave_id       uuid,
    assigned_to   uuid REFERENCES app_user(id),
    planned_start date,
    planned_end   date,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT task_code_uq     UNIQUE (engagement_id, code),
    CONSTRAINT task_id_scope_uq UNIQUE (id, engagement_id)
);

CREATE TABLE task_dependency (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id      uuid NOT NULL REFERENCES engagement(id) ON DELETE CASCADE,
    task_id            uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    is_pillar_gate     boolean NOT NULL DEFAULT false,
    CHECK (task_id <> depends_on_task_id),
    CONSTRAINT td_task_same_engagement FOREIGN KEY (task_id, engagement_id)
        REFERENCES task (id, engagement_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT td_dep_same_engagement FOREIGN KEY (depends_on_task_id, engagement_id)
        REFERENCES task (id, engagement_id)
        ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT td_pair_uq UNIQUE (task_id, depends_on_task_id)
);

-- =====================================================================
-- SECTION 8 — TRIGGERS
-- audit_row() is SECURITY DEFINER; canon_app has no INSERT on audit_log,
-- so the definer path is the only way a row is ever written.  [5]
-- =====================================================================

CREATE OR REPLACE FUNCTION canon.audit_row() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = canon, pg_temp AS $$
DECLARE
    v_before jsonb; v_after jsonb; v_row jsonb;
    v_id text; v_eng uuid; v_tenant uuid;
BEGIN
    -- [17] audit_log is immutable, so secrets written here are permanent.
    IF TG_OP = 'DELETE' THEN
        v_before := to_jsonb(OLD); v_after := NULL; v_id := OLD.id::text;
    ELSIF TG_OP = 'UPDATE' THEN
        v_before := to_jsonb(OLD); v_after := to_jsonb(NEW); v_id := NEW.id::text;
    ELSE
        v_before := NULL; v_after := to_jsonb(NEW); v_id := NEW.id::text;
    END IF;

    v_before := v_before - 'password_hash' - 'mfa_secret';
    v_after  := v_after  - 'password_hash' - 'mfa_secret';
    v_row    := COALESCE(v_after, v_before);

    IF TG_TABLE_NAME = 'engagement' THEN
        v_eng := v_id::uuid;
    ELSE
        v_eng := NULLIF(v_row ->> 'engagement_id', '')::uuid;
    END IF;

    v_tenant := COALESCE(NULLIF(v_row ->> 'tenant_id', '')::uuid,
                         (SELECT e.tenant_id FROM canon.engagement e WHERE e.id = v_eng),
                         canon.current_tenant());

    INSERT INTO canon.audit_log
        (tenant_id, engagement_id, actor_user_id, actor_role, action,
         entity_table, entity_id, before_state, after_state, request_id, ip_address)
    VALUES
        (v_tenant, v_eng, canon.current_user_id(),
         canon.effective_role(v_eng)::text, lower(TG_OP)::canon.audit_action,
         TG_TABLE_NAME, v_id, v_before, v_after,
         NULLIF(current_setting('canon.request_id', true), ''),
         NULLIF(current_setting('canon.ip', true), '')::inet);

    RETURN COALESCE(NEW, OLD);
END $$;

CREATE OR REPLACE FUNCTION canon.audit_event(
    p_action audit_action, p_entity_table text, p_entity_id text,
    p_engagement uuid DEFAULT NULL, p_summary text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = canon, pg_temp AS $$
BEGIN
    INSERT INTO canon.audit_log
        (tenant_id, engagement_id, actor_user_id, actor_role, action,
         entity_table, entity_id, summary, request_id, ip_address)
    VALUES
        (canon.current_tenant(), p_engagement, canon.current_user_id(),
         canon.effective_role(p_engagement)::text, p_action,
         p_entity_table, p_entity_id, p_summary,
         NULLIF(current_setting('canon.request_id', true), ''),
         NULLIF(current_setting('canon.ip', true), '')::inet);
END $$;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'canonical_capability','framework','framework_dimension','capability_mapping',
        'question','question_mapping','artifact_template'
    ] LOOP
        EXECUTE format('CREATE TRIGGER %1$I_scope BEFORE INSERT OR UPDATE ON canon.%1$I
                        FOR EACH ROW EXECUTE FUNCTION canon.set_scope_key();', t);
    END LOOP;

    FOREACH t IN ARRAY ARRAY[
        'tenant','app_user','engagement','canonical_capability','framework',
        'question','artifact_template','task','assessment'
    ] LOOP
        EXECUTE format('CREATE TRIGGER %1$I_touch BEFORE UPDATE ON canon.%1$I
                        FOR EACH ROW EXECUTE FUNCTION canon.touch_updated_at();', t);
    END LOOP;

    FOREACH t IN ARRAY ARRAY[
        'tenant','app_user','user_credential','membership','engagement','fork_run',
        'library_version','canonical_capability','framework','framework_dimension',
        'capability_mapping','question','question_mapping','artifact_template',
        'task','task_dependency','assessment','response'
    ] LOOP
        EXECUTE format('CREATE TRIGGER %1$I_audit AFTER INSERT OR UPDATE OR DELETE ON canon.%1$I
                        FOR EACH ROW EXECUTE FUNCTION canon.audit_row();', t);
    END LOOP;
END $$;

-- =====================================================================
-- SECTION 9 — ROW LEVEL SECURITY
-- =====================================================================

DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'canon' LOOP
        EXECUTE format('ALTER TABLE canon.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE canon.%I FORCE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- [11] Later migrations use this instead of hand-writing policies, so an
-- added table cannot silently ship without protection.
CREATE OR REPLACE FUNCTION canon.apply_engagement_rls(p_table text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format('ALTER TABLE canon.%I ENABLE ROW LEVEL SECURITY;', p_table);
    EXECUTE format('ALTER TABLE canon.%I FORCE ROW LEVEL SECURITY;', p_table);
    EXECUTE format('CREATE POLICY %1$I_read ON canon.%1$I FOR SELECT
                    USING (canon.visible_engagement(engagement_id));', p_table);
    EXECUTE format('CREATE POLICY %1$I_insert ON canon.%1$I FOR INSERT
                    WITH CHECK (canon.can_write_engagement(engagement_id));', p_table);
    EXECUTE format('CREATE POLICY %1$I_update ON canon.%1$I FOR UPDATE
                    USING (canon.can_write_engagement(engagement_id))
                    WITH CHECK (canon.can_write_engagement(engagement_id));', p_table);
    EXECUTE format('CREATE POLICY %1$I_delete ON canon.%1$I FOR DELETE
                    USING (canon.can_delete_engagement(engagement_id));', p_table);
END $$;

-- --- tenancy / identity -------------------------------------------------
CREATE POLICY tenant_read ON tenant FOR SELECT
    USING (id = canon.current_tenant() OR canon.is_platform_admin());
CREATE POLICY tenant_insert ON tenant FOR INSERT WITH CHECK (canon.is_platform_admin());
CREATE POLICY tenant_update ON tenant FOR UPDATE
    USING (canon.is_platform_admin()) WITH CHECK (canon.is_platform_admin());
CREATE POLICY tenant_delete ON tenant FOR DELETE USING (canon.is_platform_admin());

CREATE POLICY app_user_read ON app_user FOR SELECT
    USING (
        id = canon.current_user_id()
     OR canon.is_platform_admin()
     OR EXISTS (SELECT 1 FROM canon.membership m
                 WHERE m.user_id = app_user.id AND m.tenant_id = canon.current_tenant())
    );
-- Self-update is permitted, but canon_app holds UPDATE on (full_name) only —
-- see [14] in the ROLES block. RLS cannot restrict columns, and a column-level
-- REVOKE against a table-level GRANT is silently ignored by Postgres.
CREATE POLICY app_user_insert ON app_user FOR INSERT
    WITH CHECK (canon.is_platform_admin()
             OR canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor'));
CREATE POLICY app_user_update ON app_user FOR UPDATE
    USING (canon.is_platform_admin() OR id = canon.current_user_id())
    WITH CHECK (canon.is_platform_admin() OR id = canon.current_user_id());
-- [13] no self-delete: it cascaded user_credential and every membership row
CREATE POLICY app_user_delete ON app_user FOR DELETE USING (canon.is_platform_admin());

-- [15] SELECT only, and only for platform_admin. There is deliberately no
-- INSERT/UPDATE/DELETE policy and canon_app holds no DML grant on this table,
-- so auth_lookup(), record_login_attempt() and set_password() are the only
-- paths in. A user could previously DELETE their own credential row, after
-- which auth_lookup returns password_hash NULL — an auth bypass if the login
-- path reads that as "SSO user" rather than failing closed.
CREATE POLICY user_credential_read ON user_credential FOR SELECT
    USING (canon.is_platform_admin());

CREATE POLICY membership_read ON membership FOR SELECT
    USING (tenant_id = canon.current_tenant() OR canon.is_platform_admin());

-- [2] Grantable-role ladder. Nobody may grant a role above their own, and no
-- client role may grant a platform role at all. With the role GUC gone this is
-- defence in depth rather than the sole control, but both layers ship.
CREATE POLICY membership_delete ON membership FOR DELETE
    USING (
        canon.is_platform_admin()
     OR (tenant_id = canon.current_tenant()
         AND canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor')
         AND canon.role_rank(role) <= canon.role_rank(canon.effective_role()))
    );

CREATE POLICY membership_insert ON membership FOR INSERT
    WITH CHECK (
        canon.is_platform_admin()
     OR (tenant_id = canon.current_tenant()
         AND canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor')
         AND canon.role_rank(role) <= canon.role_rank(canon.effective_role())
         AND (canon.is_platform_staff()
              OR role IN ('client_sponsor','client_steward','client_viewer')))
    );

CREATE POLICY membership_update ON membership FOR UPDATE
    USING (
        canon.is_platform_admin()
     OR (tenant_id = canon.current_tenant()
         AND canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor')
         AND canon.role_rank(role) <= canon.role_rank(canon.effective_role()))
    )
    WITH CHECK (
        canon.is_platform_admin()
     OR (tenant_id = canon.current_tenant()
         AND canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor')
         AND canon.role_rank(role) <= canon.role_rank(canon.effective_role())
         AND (canon.is_platform_staff()
              OR role IN ('client_sponsor','client_steward','client_viewer')))
    );

-- --- audit --------------------------------------------------------------
-- [12] tenant_id IS NULL covers library/global events, which would otherwise
-- be invisible to the Godaitec staff who generate them.
CREATE POLICY audit_read ON audit_log FOR SELECT
    USING (
        canon.is_platform_admin()
     OR (tenant_id IS NULL AND canon.can_read_library())
     OR (tenant_id = canon.current_tenant()
         AND canon.role_rank(canon.effective_role()) >= canon.role_rank('client_sponsor'))
    );
-- Harmless because canon_app holds no INSERT privilege; only the SECURITY
-- DEFINER functions reach this table.  [5]
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (true);

-- --- engagement ---------------------------------------------------------
CREATE POLICY engagement_read ON engagement FOR SELECT
    USING (canon.visible_engagement(id));
CREATE POLICY engagement_insert ON engagement FOR INSERT
    WITH CHECK (canon.is_platform_admin()
        OR (tenant_id = canon.current_tenant()
            AND canon.role_rank(canon.effective_role()) >= canon.role_rank('consultant')));
CREATE POLICY engagement_update ON engagement FOR UPDATE
    USING (canon.is_platform_admin()
        OR (canon.visible_engagement(id)
            AND canon.role_rank(canon.effective_role(id)) >= canon.role_rank('consultant')))
    WITH CHECK (canon.is_platform_admin()
        OR (tenant_id = canon.current_tenant()
            AND canon.role_rank(canon.effective_role()) >= canon.role_rank('consultant')));
-- [13] Under FOR ALL, DELETE was checked against USING alone. A client_sponsor
-- (rank 30) passed it and could drop an engagement, cascading every forked
-- capability, framework, question, template, assessment, response, task and
-- fork_run row — while WITH CHECK denied them a simple UPDATE. Use status
-- 'closed'; hard delete is platform_admin only.
CREATE POLICY engagement_delete ON engagement FOR DELETE
    USING (canon.is_platform_admin());

-- [8] previously had no tenant predicate at all
CREATE POLICY fork_run_read ON fork_run FOR SELECT
    USING (canon.visible_engagement(engagement_id));
-- [13] Insert-only. fork_run is the record of what was copied from which
-- library version; a deletable provenance log is not a provenance log.
CREATE POLICY fork_run_insert ON fork_run FOR INSERT
    WITH CHECK (canon.can_write_library() AND canon.visible_engagement(engagement_id));

CREATE POLICY library_version_read ON library_version FOR SELECT
    USING (canon.can_read_library());
CREATE POLICY library_version_insert ON library_version FOR INSERT
    WITH CHECK (canon.can_write_library());
CREATE POLICY library_version_update ON library_version FOR UPDATE
    USING (canon.can_write_library()) WITH CHECK (canon.can_write_library());
-- guard_library_version() additionally blocks deleting a frozen version
CREATE POLICY library_version_delete ON library_version FOR DELETE
    USING (canon.can_write_library());

-- --- forkable content ---------------------------------------------------
-- [3] INSERT / UPDATE / DELETE are separate policies. In v2 the frozen
-- predicate lived only in WITH CHECK, which PostgreSQL evaluates for INSERT and
-- UPDATE but not DELETE — so rows could be deleted out of a published version.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'canonical_capability','framework','framework_dimension','capability_mapping',
        'question','question_mapping','artifact_template'
    ] LOOP
        -- [4] library rows are platform-staff only
        EXECUTE format($p$
            CREATE POLICY %1$I_read ON canon.%1$I FOR SELECT
              USING (
                  (engagement_id IS NULL AND canon.can_read_library())
               OR canon.visible_engagement(engagement_id)
              );$p$, t);

        EXECUTE format($p$
            CREATE POLICY %1$I_insert ON canon.%1$I FOR INSERT
              WITH CHECK (
                  canon.can_write_engagement(engagement_id)
               OR (engagement_id IS NULL
                   AND canon.can_write_library()
                   AND canon.library_version_writable(library_version_id))
              );$p$, t);

        EXECUTE format($p$
            CREATE POLICY %1$I_update ON canon.%1$I FOR UPDATE
              USING (
                  canon.can_write_engagement(engagement_id)
               OR (engagement_id IS NULL
                   AND canon.can_write_library()
                   AND canon.library_version_writable(library_version_id))
              )
              WITH CHECK (
                  canon.can_write_engagement(engagement_id)
               OR (engagement_id IS NULL
                   AND canon.can_write_library()
                   AND canon.library_version_writable(library_version_id))
              );$p$, t);

        EXECUTE format($p$
            CREATE POLICY %1$I_delete ON canon.%1$I FOR DELETE
              USING (
                  canon.can_write_engagement(engagement_id)
               OR (engagement_id IS NULL
                   AND canon.can_write_library()
                   AND canon.library_version_writable(library_version_id))
              );$p$, t);
    END LOOP;
END $$;

-- --- engagement-scoped operational tables -------------------------------
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['task','task_dependency','assessment','response'] LOOP
        PERFORM canon.apply_engagement_rls(t);
    END LOOP;
END $$;

-- =====================================================================
-- SECTION 10 — VIEWS (security_invoker on all)
-- =====================================================================

CREATE OR REPLACE VIEW v_rls_gaps WITH (security_invoker = true) AS
SELECT c.relname AS tablename, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'canon' AND c.relkind = 'r'
  AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) = 0);

CREATE OR REPLACE VIEW v_framework_coverage WITH (security_invoker = true) AS
SELECT f.id AS framework_id, f.code AS framework_code, f.scope_key,
       CASE WHEN f.engagement_id IS NULL THEN 'library' ELSE 'engagement' END AS scope,
       count(DISTINCT cm.canonical_capability_id) AS capabilities_mapped,
       (SELECT count(*) FROM canon.canonical_capability c WHERE c.scope_key = f.scope_key)
           AS capabilities_total,
       round(100.0 * count(DISTINCT cm.canonical_capability_id)
             / NULLIF((SELECT count(*) FROM canon.canonical_capability c
                        WHERE c.scope_key = f.scope_key), 0), 1) AS coverage_pct
FROM canon.framework f
LEFT JOIN canon.framework_dimension fd ON fd.framework_id = f.id
LEFT JOIN canon.capability_mapping cm  ON cm.framework_dimension_id = fd.id
GROUP BY f.id, f.code, f.scope_key, f.engagement_id;

CREATE OR REPLACE VIEW v_pillar_balance_capability WITH (security_invoker = true) AS
SELECT scope_key,
       CASE WHEN engagement_id IS NULL THEN 'library' ELSE 'engagement' END AS scope,
       pillar, count(*) AS capability_count
FROM canon.canonical_capability
GROUP BY scope_key, engagement_id, pillar;

CREATE OR REPLACE VIEW v_spine_orphans WITH (security_invoker = true) AS
SELECT 'capability_unmapped' AS issue, c.scope_key, c.id AS entity_id, c.code,
       c.pillar::text AS detail
FROM canon.canonical_capability c
WHERE NOT EXISTS (SELECT 1 FROM canon.capability_mapping m
                   WHERE m.canonical_capability_id = c.id)
UNION ALL
SELECT 'question_unmapped', q.scope_key, q.id, q.code, q.response_type::text
FROM canon.question q
WHERE NOT EXISTS (SELECT 1 FROM canon.question_mapping m WHERE m.question_id = q.id)
UNION ALL
SELECT 'dimension_unmapped', fd.scope_key, fd.id, fd.code, 'leaf dimension with no capability'
FROM canon.framework_dimension fd
WHERE NOT EXISTS (SELECT 1 FROM canon.framework_dimension ch WHERE ch.parent_id = fd.id)
  AND NOT EXISTS (SELECT 1 FROM canon.capability_mapping m WHERE m.framework_dimension_id = fd.id);

CREATE OR REPLACE VIEW v_crosswalk_weight_anomalies WITH (security_invoker = true) AS
SELECT fd.scope_key, f.code AS framework_code, fd.code AS dimension_code,
       round(sum(cm.coverage_weight), 4) AS weight_sum, count(*) AS mapping_count
FROM canon.framework_dimension fd
JOIN canon.framework f ON f.id = fd.framework_id
JOIN canon.capability_mapping cm ON cm.framework_dimension_id = fd.id
GROUP BY fd.scope_key, f.code, fd.code
HAVING abs(sum(cm.coverage_weight) - 1.0) > 0.001;

COMMIT;

-- =====================================================================
-- ROLES — migration 0001_roles, which runs BEFORE the schema migration.
--
-- Ordering matters and was wrong in v2: policies in the schema migration call
-- SECURITY DEFINER functions that must already be owned by a BYPASSRLS role,
-- and ALTER DEFAULT PRIVILEGES only affects objects created after it runs.
--
--   canon_owner  — owns tables, runs migrations, NOT superuser, NOT a runtime
--                  role. Bootstrapped by infra (docker init script or DBA
--                  runbook) since it must exist before Alembic connects.
--   canon_app    — request path. LOGIN NOBYPASSRLS. Not an owner.
--   canon_admin  — LOGIN BYPASSRLS. Owns every SECURITY DEFINER function.
--                  Used directly by exactly two services: library seeder and
--                  fork/promote engine.
--
-- 0001_roles.upgrade():
--   DO $r$ BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='canon_app') THEN
--       CREATE ROLE canon_app   LOGIN PASSWORD :'app_pw'   NOBYPASSRLS; END IF;
--     IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='canon_admin') THEN
--       CREATE ROLE canon_admin LOGIN PASSWORD :'admin_pw' BYPASSRLS;   END IF;
--   END $r$;
--   ALTER DEFAULT PRIVILEGES FOR ROLE canon_owner IN SCHEMA canon
--       GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO canon_app, canon_admin;
--   ALTER DEFAULT PRIVILEGES FOR ROLE canon_owner IN SCHEMA canon
--       GRANT USAGE, SELECT                   ON SEQUENCES TO canon_app, canon_admin;
--
-- 0002_p0_core.upgrade(), AFTER the DDL above:
--   GRANT USAGE ON SCHEMA canon TO canon_app, canon_admin;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA canon TO canon_app, canon_admin;
--   GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA canon TO canon_app, canon_admin;
--
--   -- [5] the audit trail cannot be forged: no direct write path exists
--   REVOKE INSERT, UPDATE, DELETE ON canon.audit_log FROM canon_app;
--
--   -- [14] COLUMN PRIVILEGES. A column-level REVOKE cannot subtract from a
--   -- table-level GRANT: Postgres emits "no privileges could be revoked for
--   -- column ..." and leaves the ACL untouched. v3's REVOKE UPDATE (col) lines
--   -- were therefore no-ops. Revoke at table level first, then re-grant the
--   -- columns that are genuinely self-serviceable.
--   REVOKE UPDATE ON canon.app_user FROM canon_app;
--   GRANT  UPDATE (full_name) ON canon.app_user TO canon_app;
--
--   -- [15] user_credential has no DML path for the request role at all.
--   -- auth_lookup / record_login_attempt / set_password are the only doors,
--   -- which also means a column added later cannot reopen the column trap.
--   REVOKE INSERT, UPDATE, DELETE ON canon.user_credential FROM canon_app;
--
--   -- ALTER DEFAULT PRIVILEGES keeps issuing table-level UPDATE on every
--   -- future table, so any migration adding a column-restricted table must
--   -- repeat this revoke-then-grant. Record it in CLAUDE.md.
--
--   -- every SECURITY DEFINER function must be owned by the BYPASSRLS role,
--   -- because FORCE ROW LEVEL SECURITY removes the owner exemption
--   ALTER FUNCTION canon.effective_role(uuid)        OWNER TO canon_admin;
--   ALTER FUNCTION canon.is_platform_staff()         OWNER TO canon_admin;
--   ALTER FUNCTION canon.is_platform_admin()         OWNER TO canon_admin;
--   ALTER FUNCTION canon.platform_role_at_least(canon.app_role) OWNER TO canon_admin;
--   ALTER FUNCTION canon.visible_engagement(uuid)    OWNER TO canon_admin;
--   ALTER FUNCTION canon.library_version_writable(uuid) OWNER TO canon_admin;
--   ALTER FUNCTION canon.auth_lookup(text)           OWNER TO canon_admin;
--   ALTER FUNCTION canon.record_login_attempt(uuid, boolean) OWNER TO canon_admin;
--   ALTER FUNCTION canon.set_password(uuid, text)    OWNER TO canon_admin;
--   ALTER FUNCTION canon.audit_row()                 OWNER TO canon_admin;
--   ALTER FUNCTION canon.audit_event(canon.audit_action, text, text, uuid, text)
--                                                    OWNER TO canon_admin;
--
--   -- a SECURITY DEFINER credential reader must not be world-executable
--   REVOKE EXECUTE ON FUNCTION canon.auth_lookup(text) FROM PUBLIC;
--   REVOKE EXECUTE ON FUNCTION canon.record_login_attempt(uuid, boolean) FROM PUBLIC;
--   GRANT  EXECUTE ON FUNCTION canon.auth_lookup(text) TO canon_app;
--   GRANT  EXECUTE ON FUNCTION canon.record_login_attempt(uuid, boolean) TO canon_app;
--   REVOKE EXECUTE ON FUNCTION canon.set_password(uuid, text) FROM PUBLIC;
--   GRANT  EXECUTE ON FUNCTION canon.set_password(uuid, text) TO canon_app;
--
-- downgrade(), in this order — a role holding privileges cannot be dropped,
-- and roles are cluster-level so they survive DROP SCHEMA CASCADE:
--   ALTER DEFAULT PRIVILEGES FOR ROLE canon_owner IN SCHEMA canon
--       REVOKE ALL ON TABLES FROM canon_app, canon_admin;
--   ALTER DEFAULT PRIVILEGES FOR ROLE canon_owner IN SCHEMA canon
--       REVOKE ALL ON SEQUENCES FROM canon_app, canon_admin;
--   DROP OWNED BY canon_app;
--   DROP OWNED BY canon_admin;
--   DROP ROLE IF EXISTS canon_app;
--   DROP ROLE IF EXISTS canon_admin;
--
-- ALEMBIC: version_table_schema MUST be 'public'.
-- =====================================================================
