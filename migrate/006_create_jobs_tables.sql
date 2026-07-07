-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  department      VARCHAR(100),
  location        VARCHAR(150),
  employment_type VARCHAR(50)  DEFAULT 'Full-time',
  experience      VARCHAR(100),
  salary_range    VARCHAR(100),
  description     TEXT,
  requirements    TEXT,
  status          VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  posted_at       TIMESTAMPTZ,
  closes_at       TIMESTAMPTZ,
  sort_order      INTEGER      DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_status_idx     ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_posted_at_idx  ON jobs (posted_at DESC);

CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS jobs_updated_at_trg ON jobs;
CREATE TRIGGER jobs_updated_at_trg
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id            SERIAL PRIMARY KEY,
  job_id        INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  job_title     VARCHAR(255),
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  phone         VARCHAR(50),
  cover_letter  TEXT,
  linkedin_url  VARCHAR(500),
  portfolio_url VARCHAR(500),
  status        VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','rejected','hired')),
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_applications_job_id_idx   ON job_applications (job_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx   ON job_applications (status);
CREATE INDEX IF NOT EXISTS job_applications_applied_idx  ON job_applications (applied_at DESC);
