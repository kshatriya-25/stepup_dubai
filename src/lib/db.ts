/**
 * Postgres — a queryable copy of every registration and partner enquiry.
 *
 * WHERE THIS SITS. The lead log on disk (@/lib/leads) is still THE RECORD: written first,
 * and the only thing that can fail a submission. The Google Sheet is the projection
 * organisers work in. This is a second projection beside it, for anything a spreadsheet is
 * bad at — counting, joining, exporting, asking "how many Workshop passes from Salem".
 *
 * IT CAN NEVER FAIL A REGISTRATION. Every function here returns a result rather than
 * throwing, and every caller ignores a failure beyond logging it. That is the same rule the
 * Sheet write already follows and it exists for the same reason: somebody typed a pitch into
 * a form, and a database that is down, full, or mid-restart is not a reason to tell them it
 * did not work. A row missed here is recoverable from the lead log and the payment journal;
 * a lead refused at the door is gone.
 *
 * OFF UNLESS CONFIGURED. With no PGDATABASE every function is a no-op that reports
 * `skipped`, so a deployment that has not been given a database behaves exactly as before.
 *
 * IT BUILDS ITSELF. Fill in the five PG* values and nothing else is required: on the first
 * write this creates the database if it is missing, then creates its tables. There is no
 * migration folder to ship and no command to remember after a deploy — a schema that only
 * exists if someone remembers to run something is a schema that will be missing on the box
 * that matters. Every statement is IF NOT EXISTS, so it is safe on every start.
 *
 * WRITES ARE UPSERTS, keyed by an id the caller derives deterministically (`lead:<id>` or
 * `pay:<order id>`). A replay, a Razorpay webhook arriving after /verify, or a double-click
 * updates the row it already wrote instead of adding a second one.
 *
 * SERVER ONLY. PGPASSWORD must never reach the browser bundle, which is what the
 * `server-only` import enforces — the same guard SMTP_PASS has in ./email/mailer.
 */

import 'server-only'
import { Pool, Client, type PoolConfig } from 'pg'
import type { Registration } from '@/lib/payments/journal'

const env = (key: string) => (process.env[key] || '').trim()

/**
 * A readable reason, from whatever the driver threw.
 *
 * NOT just `err.message`. A refused connection reaches us as Node's AggregateError, whose
 * own message is the EMPTY STRING — the reasons live in `.errors` and the code in `.code`.
 * Left alone, every connection failure logged "[db] registration lead:x failed:" and
 * nothing else, which is the one case where the log matters most.
 */
function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const code = (err as { code?: string }).code
  const inner = err instanceof AggregateError ? err.errors.map((e) => (e as Error)?.message).filter(Boolean) : []
  const text = err.message || inner.join('; ') || err.name
  return code ? `${code}: ${text}` : text
}

/*
 * Connection settings from the five values in .env. DATABASE_URL still wins if it is set,
 * because a managed database (Supabase, Neon, RDS) hands you one string and splitting it by
 * hand is a good way to get the password wrong.
 */
const URL_FORM = env('DATABASE_URL')
const DATABASE = env('PGDATABASE')

/** Whether this deployment has a database at all. */
export const dbEnabled = URL_FORM.length > 0 || DATABASE.length > 0

function config(database?: string): PoolConfig {
  if (URL_FORM) {
    return {
      connectionString: database ? URL_FORM.replace(/\/[^/?]*(\?|$)/, `/${database}$1`) : URL_FORM,
      ssl: /[?&]sslmode=require/.test(URL_FORM) ? { rejectUnauthorized: false } : undefined,
    }
  }
  return {
    host: env('PGHOST') || 'localhost',
    port: Number(env('PGPORT')) || 5432,
    user: env('PGUSER') || 'postgres',
    password: env('PGPASSWORD'),
    database: database || DATABASE,
  }
}

/*
 * One pool per process, cached on globalThis.
 *
 * Next's dev server re-evaluates modules on every hot reload; without the cache each edit
 * leaks a pool and Postgres runs out of connections after an afternoon's work. Same reason
 * the mailer caches its transport. `ready` is cached beside it so the schema check runs once
 * per process rather than on every registration.
 */
const g = globalThis as typeof globalThis & { __pgPool?: Pool; __pgReady?: Promise<void> }

function pool(): Pool {
  if (!g.__pgPool) {
    g.__pgPool = new Pool({
      ...config(),
      // A registration is already waiting on a sheet write and two emails. A database that
      // cannot answer in five seconds is a database this request should stop waiting for.
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30_000,
      max: 5,
    })
    // A pool emits 'error' for a connection dropped while idle. Unhandled, that is an
    // uncaught exception and pm2 restarts the site — over a connection nobody was using.
    g.__pgPool.on('error', (err) => console.error('[db] idle client error:', describe(err)))
  }
  return g.__pgPool
}

/**
 * CREATE DATABASE, if the server has one but it is empty of ours.
 *
 * Postgres cannot create a database from inside another connection to it, so this connects
 * to the built-in `postgres` database to issue the statement. Best effort: a managed
 * provider usually forbids it, and there the database already exists anyway — so a failure
 * here is logged at low volume and the schema step tries regardless.
 */
async function ensureDatabase(): Promise<void> {
  if (URL_FORM || !DATABASE) return
  const admin = new Client({ ...config('postgres'), connectionTimeoutMillis: 5000 })
  try {
    await admin.connect()
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DATABASE])
    if (!rowCount) {
      // Not parameterisable — an identifier, not a value. DATABASE comes from our own .env,
      // and the quoting keeps a name with a hyphen or capital in it working.
      await admin.query(`CREATE DATABASE "${DATABASE.replace(/"/g, '""')}"`)
      console.log(`[db] created database ${DATABASE}`)
    }
  } catch (err) {
    console.error('[db] could not ensure the database exists:', describe(err))
  } finally {
    await admin.end().catch(() => {})
  }
}

/**
 * The tables, applied on first use.
 *
 * EVERY COLUMN IS NULLABLE except the identity and the timestamps. A projection that
 * rejects a row because a question has since been removed from the form is a projection
 * that loses leads, and this table has already outlived several of its own columns —
 * attending-as, ID number, designation, interest, all asked once and no longer.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS registrations (
  id                TEXT PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  source            TEXT        NOT NULL,
  payment_status    TEXT,
  name              TEXT,
  email             TEXT,
  phone             TEXT,
  city              TEXT,
  ticket_id         TEXT,
  ticket_name       TEXT,
  access            TEXT,
  startup_name      TEXT,
  stage             TEXT,
  sector            TEXT,
  pitch_one_line    TEXT,
  pitch_detail      TEXT,
  traction          TEXT,
  co_founder        TEXT,
  co_founder_name   TEXT,
  co_founder_phone  TEXT,
  extra_members     INTEGER NOT NULL DEFAULT 0,
  extra_member_list TEXT,
  workshop          TEXT,
  want_networking   TEXT,
  meeting_type      TEXT,
  meeting_note      TEXT,
  register_as       TEXT,
  category          TEXT,
  org_name          TEXT,
  id_number         TEXT,
  id_type           TEXT,
  designation       TEXT,
  interest          TEXT,
  consent           BOOLEAN,
  updates           BOOLEAN,
  amount_inr        INTEGER,
  payment_id        TEXT,
  order_id          TEXT,
  paid_at           TIMESTAMPTZ,
  raw               JSONB       NOT NULL
);
CREATE INDEX IF NOT EXISTS registrations_email_idx      ON registrations (lower(email));
CREATE INDEX IF NOT EXISTS registrations_ticket_idx     ON registrations (ticket_id);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS registrations_order_id_key ON registrations (order_id) WHERE order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS partner_enquiries (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  name          TEXT,
  business_name TEXT,
  email         TEXT,
  phone         TEXT,
  raw           JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS partner_enquiries_created_at_idx ON partner_enquiries (created_at DESC);
`

/** Create the database and tables once per process. Never throws. */
function ready(): Promise<void> {
  if (!g.__pgReady) {
    g.__pgReady = (async () => {
      await ensureDatabase()
      try {
        await pool().query(SCHEMA)
      } catch (err) {
        console.error('[db] schema setup failed:', describe(err))
        // Cleared so the next write retries: the usual cause is the database being down
        // for a moment, and one failed start should not leave this process writing
        // nowhere until somebody restarts it.
        g.__pgReady = undefined
      }
    })()
  }
  return g.__pgReady
}

export type DbResult = { ok: true } | { ok: false; skipped: true } | { ok: false; error: string }

const SKIPPED: DbResult = { ok: false, skipped: true }

/** Shared shape of the write helpers: never throws, never rejects. */
async function run(sql: string, values: unknown[], label: string): Promise<DbResult> {
  if (!dbEnabled) return SKIPPED
  try {
    await ready()
    await pool().query(sql, values)
    return { ok: true }
  } catch (err) {
    const message = describe(err)
    console.error(`[db] ${label} failed:`, message)
    return { ok: false, error: message }
  }
}

/** Is the database reachable? For the health endpoints, not for request paths. */
export async function dbHealth(): Promise<{ enabled: boolean; healthy: boolean; error?: string }> {
  if (!dbEnabled) return { enabled: false, healthy: false }
  try {
    await ready()
    await pool().query('SELECT 1')
    return { enabled: true, healthy: true }
  } catch (err) {
    return { enabled: true, healthy: false, error: describe(err) }
  }
}

/** 'yes' / 'no' / '' as stored by the form → a real boolean, or null when never asked. */
function bool(value: string | undefined): boolean | null {
  if (value === undefined || value === '') return null
  return value === 'yes' || value === 'Yes' || value === 'true'
}

function int(value: string | undefined): number {
  const n = Number.parseInt(value || '0', 10)
  return Number.isFinite(n) ? n : 0
}

function nullable(value: string | undefined): string | null {
  return value && value.trim() ? value.trim() : null
}

export type RegistrationMeta = {
  /** `lead:<id>` or `pay:<order id>` — deterministic, so a retry updates one row. */
  id: string
  source: 'register' | 'paid' | 'replay'
  paymentStatus: string
  access?: string | null
  amountInr?: number | null
  paymentId?: string | null
  orderId?: string | null
  paidAt?: Date | null
}

/**
 * Insert or update one registration.
 *
 * The column list is written out rather than generated from the object: a registration
 * carries fields that have no business in a queryable table (consent wording, internal ids),
 * and a generated INSERT would quietly start storing whatever the form gained next. The
 * whole submission goes into `raw` for exactly that case.
 *
 * ON CONFLICT updates every column except created_at, so a replay corrects a row written
 * from partial data rather than leaving the first, worse version in place.
 */
export async function recordRegistration(reg: Registration, meta: RegistrationMeta): Promise<DbResult> {
  return run(
    `INSERT INTO registrations (
       id, source, payment_status,
       name, email, phone, city,
       ticket_id, ticket_name, access,
       startup_name, stage, sector, pitch_one_line, pitch_detail, traction,
       co_founder, co_founder_name, co_founder_phone, extra_members, extra_member_list,
       workshop, want_networking, meeting_type, meeting_note,
       register_as, category, org_name, id_number, id_type, designation, interest,
       consent, updates,
       amount_inr, payment_id, order_id, paid_at,
       raw
     ) VALUES (
       $1,$2,$3, $4,$5,$6,$7, $8,$9,$10,
       $11,$12,$13,$14,$15,$16, $17,$18,$19,$20,$21,
       $22,$23,$24,$25, $26,$27,$28,$29,$30,$31,$32, $33,$34,
       $35,$36,$37,$38, $39
     )
     ON CONFLICT (id) DO UPDATE SET
       updated_at = now(),
       source = EXCLUDED.source, payment_status = EXCLUDED.payment_status,
       name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, city = EXCLUDED.city,
       ticket_id = EXCLUDED.ticket_id, ticket_name = EXCLUDED.ticket_name, access = EXCLUDED.access,
       startup_name = EXCLUDED.startup_name, stage = EXCLUDED.stage, sector = EXCLUDED.sector,
       pitch_one_line = EXCLUDED.pitch_one_line, pitch_detail = EXCLUDED.pitch_detail,
       traction = EXCLUDED.traction, co_founder = EXCLUDED.co_founder,
       co_founder_name = EXCLUDED.co_founder_name, co_founder_phone = EXCLUDED.co_founder_phone,
       extra_members = EXCLUDED.extra_members, extra_member_list = EXCLUDED.extra_member_list,
       workshop = EXCLUDED.workshop, want_networking = EXCLUDED.want_networking,
       meeting_type = EXCLUDED.meeting_type, meeting_note = EXCLUDED.meeting_note,
       register_as = EXCLUDED.register_as, category = EXCLUDED.category, org_name = EXCLUDED.org_name,
       id_number = EXCLUDED.id_number, id_type = EXCLUDED.id_type, designation = EXCLUDED.designation,
       interest = EXCLUDED.interest, consent = EXCLUDED.consent, updates = EXCLUDED.updates,
       amount_inr = EXCLUDED.amount_inr, payment_id = EXCLUDED.payment_id,
       order_id = EXCLUDED.order_id, paid_at = EXCLUDED.paid_at,
       raw = EXCLUDED.raw`,
    [
      meta.id, meta.source, nullable(meta.paymentStatus),
      nullable(reg.name), nullable(reg.email), nullable(reg.phone), nullable(reg.city),
      nullable(reg.ticketId), nullable(reg.ticketName), meta.access ?? null,
      nullable(reg.startupName), nullable(reg.stage), nullable(reg.sector),
      nullable(reg.pitchOneLine), nullable(reg.pitchDetail), nullable(reg.traction),
      nullable(reg.coFounder), nullable(reg.coFounderName), nullable(reg.coFounderPhone),
      int(reg.extraMembers), nullable(reg.extraMemberList),
      nullable(reg.workshop), nullable(reg.wantNetworking), nullable(reg.meetingType), nullable(reg.meetingNote),
      nullable(reg.registerAs), nullable(reg.category), nullable(reg.orgName),
      nullable(reg.idNumber), nullable(reg.idType), nullable(reg.designation), nullable(reg.interest),
      bool(reg.consent), bool(reg.updates),
      meta.amountInr ?? null, meta.paymentId ?? null, meta.orderId ?? null, meta.paidAt ?? null,
      JSON.stringify(reg),
    ],
    `registration ${meta.id}`,
  )
}

export type PartnerEnquiryRow = {
  id: string
  name?: string
  businessName?: string
  email?: string
  phone?: string
}

/** Insert one partner enquiry. Same rules: upsert by id, never throws. */
export async function recordPartnerEnquiry(enquiry: PartnerEnquiryRow): Promise<DbResult> {
  return run(
    `INSERT INTO partner_enquiries (id, name, business_name, email, phone, raw)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, business_name = EXCLUDED.business_name,
       email = EXCLUDED.email, phone = EXCLUDED.phone, raw = EXCLUDED.raw`,
    [
      enquiry.id,
      nullable(enquiry.name),
      nullable(enquiry.businessName),
      nullable(enquiry.email),
      nullable(enquiry.phone),
      JSON.stringify(enquiry),
    ],
    `partner enquiry ${enquiry.id}`,
  )
}
