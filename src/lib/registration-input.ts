/**
 * Parse and validate a submission from either public entry point.
 *
 * /api/register (waitlist, and every free pass) and /api/payment/order (paid) receive
 * the SAME body from the same form, so they must accept exactly the same thing. This is
 * that definition, in one place — two copies of a conditional rule like "an ID number is
 * mandatory for a TBI member but not for a founder" would drift on the first change to
 * either, and the drift would show up as one endpoint accepting a row the other rejects.
 *
 * NOTHING FROM THE CLIENT IS TRUSTED. The browser runs the same rules for a fast, kind
 * error message; these run because the endpoint is public and a direct POST can send
 * anything. In particular the pass is resolved from the catalogue by id — the browser
 * never names a price, a pass name, or what a pass includes.
 */

import 'server-only'
import { EMAIL_RE, clean, normalisePhone } from '@/lib/submission'
import { pricedTicketById } from '@/lib/pricing'
import {
  ticketAccess,
  categories,
  asksStartup,
  idTypeOptions,
  interestOptions,
  workshopOptions,
  meetingTypeOptions,
  stageOptions,
  MAX_EXTRA_MEMBERS,
  type Ticket,
  type CategoryId,
} from '@/content/tickets'
import type { Registration } from '@/lib/payments/journal'

export type ParseResult =
  | { ok: true; ticket: Ticket; reg: Registration; extraMembers: number }
  | { ok: false; error: string }

/** Membership test against a literal option list, so a crafted value cannot get through. */
function oneOf(value: string, allowed: readonly { value: string }[]): boolean {
  return allowed.some((o) => o.value === value)
}

export function parseSubmission(raw: Record<string, unknown>): ParseResult {
  /*
   * Resolve the pass BEFORE anything else touches it.
   *
   * An unrecognised id is rejected rather than falling back to a default — a silent
   * default is how a typo turns into a ₹299 charge for a ₹2,999 programme, and how a
   * junk id ends up written into the sheet's Ticket column.
   *
   * Resolved through @/lib/pricing, not ticketById, so the `ticket` this returns carries
   * the price THIS DEPLOYMENT charges. /api/payment/order prices straight off it, which
   * is what keeps staging's test price from needing a second lookup that could disagree.
   */
  const ticket = pricedTicketById(clean(raw.ticketId, 40))
  if (!ticket) return { ok: false, error: 'Unknown pass type.' }

  const name = clean(raw.name, 120)
  const email = clean(raw.email, 160).toLowerCase()
  const city = clean(raw.city, 80)
  if (!name || !email || !city) return { ok: false, error: 'Missing: name, email, city.' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'That email address looks wrong.' }

  const phone = normalisePhone(clean(raw.phone, 40))
  if (!phone) return { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' }

  // The consent tick is the record that they agreed to be contacted. It is required on
  // every form, so a submission without it is not a submission we should keep.
  if (!clean(raw.consent, 8)) return { ok: false, error: 'Please confirm the consent checkbox.' }

  /*
   * Category, checked against THIS PASS's own list.
   *
   * Every pass happens to offer every category right now, so this check passes anything
   * valid — but it is the mechanism, not a formality. The free pass withheld 'public'
   * until August 2026, and the next pass that needs restricting will rely on exactly this
   * line to stop a direct POST claiming a category the form never offered.
   */
  const category = clean(raw.category, 20) as CategoryId
  if (!ticket.form.categories.includes(category)) {
    return { ok: false, error: 'Please pick how you are attending.' }
  }
  const cfg = categories[category]

  /*
   * The organisation block exists only for categories that have one, and every rule in it
   * comes from the CATEGORY rather than the pass.
   *
   * Note orgRequired is checked, not showOrg. 'public' shows the organisation field and
   * does not insist on it — see the comment on that category. Reading showOrg here, as
   * this did before public gained the block, would have rejected every student and every
   * unaffiliated attendee with "Organisation / company name is required."
   */
  let orgName = ''
  let idNumber = ''
  let designation = ''
  let idType = ''
  if (cfg.showOrg) {
    orgName = clean(raw.orgName, 160)
    idNumber = clean(raw.idNumber, 80)
    designation = clean(raw.designation, 120)
    if (cfg.orgRequired && !orgName) return { ok: false, error: `${cfg.orgLabel} is required.` }
    if (cfg.idRequired && !idNumber) return { ok: false, error: `${cfg.idLabel} is required.` }
  }

  // Which government ID they will bring. Required wherever it is asked at all — an ID
  // number with no idea what it is a number OF is useless to the desk.
  if (cfg.idType) {
    idType = clean(raw.idType, 20)
    if (!oneOf(idType, idTypeOptions)) return { ok: false, error: 'Please choose an ID type.' }
  }

  // Why they are coming. Public only, and required there.
  let interest = ''
  if (cfg.interest) {
    interest = clean(raw.interest, 30)
    if (!oneOf(interest, interestOptions)) {
      return { ok: false, error: 'Please tell us your interest in Tier-2 Rising.' }
    }
  }

  // Workshop pass. A session must be chosen, and it must be one that exists.
  let workshop = ''
  let wantNetworking = ''
  let meetingType = ''
  let meetingNote = ''
  if (ticket.form.workshop) {
    workshop = clean(raw.workshop, 40)
    if (!oneOf(workshop, workshopOptions)) return { ok: false, error: 'Please choose a workshop session.' }
    wantNetworking = clean(raw.wantNetworking, 8) ? 'yes' : ''
    if (wantNetworking) {
      meetingType = clean(raw.meetingType, 20)
      // Optional on the form, so an unrecognised value is dropped rather than rejected —
      // losing a preference is not worth losing the registration over.
      if (!oneOf(meetingType, meetingTypeOptions)) meetingType = ''
      meetingNote = clean(raw.meetingNote, 300)
    }
  }

  // Investor pitch pass — the block the selection panel actually reads.
  let startupName = ''
  let stage = ''
  let sector = ''
  let pitchOneLine = ''
  let pitchDetail = ''
  let traction = ''
  let extraMembers = 0
  let extraMemberList = ''
  /*
   * asksStartup, not ticket.form.startup: a member of the public on the Investor Pitch
   * Pass answers the public block instead. Checking the flag alone would reject them with
   * "Startup / idea name is required" for a company they were never claiming to have —
   * and, worse, would price extra team members for a person attending alone.
   */
  if (asksStartup(ticket, category)) {
    startupName = clean(raw.startupName, 160)
    stage = clean(raw.stage, 20)
    sector = clean(raw.sector, 120)
    pitchOneLine = clean(raw.pitchOneLine, 300)
    pitchDetail = clean(raw.pitchDetail, 2000)
    traction = clean(raw.traction, 300)
    if (!startupName) return { ok: false, error: 'Startup / idea name is required.' }
    if (!oneOf(stage, stageOptions)) return { ok: false, error: 'Please pick a stage.' }
    if (!sector) return { ok: false, error: 'Sector / industry is required.' }
    if (!pitchOneLine) return { ok: false, error: 'A one-line pitch is required.' }
    if (!pitchDetail) return { ok: false, error: 'Please tell us about the problem and solution.' }

    /*
     * The extra-member COUNT is money — it is what the amount is priced from.
     *
     * So it is parsed as an integer, floored at 0 and capped at MAX_EXTRA_MEMBERS.
     * Without the cap a single POST could invoice for an arbitrary number of people;
     * without the floor a negative count would DISCOUNT the pass below its base price.
     */
    const claimed = Number.parseInt(clean(raw.extraMembers, 4) || '0', 10)
    extraMembers = Number.isFinite(claimed) ? Math.min(Math.max(claimed, 0), MAX_EXTRA_MEMBERS) : 0
    extraMemberList = clean(raw.extraMemberList, 600)
  }

  const reg: Registration = {
    name,
    email,
    phone,
    city,
    updates: clean(raw.updates, 8) === 'yes' ? 'yes' : 'no',
    ticketId: ticket.id,
    ticketName: ticket.name,
    // Human label into the existing column, raw id alongside it. The label is what an
    // organiser reads in the sheet; the id is what code should ever compare against.
    registerAs: cfg.title,
    category,
    sector,
    orgName,
    idNumber,
    designation,
    idType,
    interest,
    workshop,
    wantNetworking,
    meetingType,
    meetingNote,
    startupName,
    stage,
    pitchOneLine,
    pitchDetail,
    traction,
    extraMembers: String(extraMembers),
    extraMemberList,
    consent: 'yes',
  }

  return { ok: true, ticket, reg, extraMembers }
}

/**
 * The Google Sheet row, as a flat map of column key -> value.
 *
 * Keys must match the second element of each entry in FORMS.registration.columns in
 * registration/Code.gs. Anything the script does not know about is simply ignored, and
 * any column the script knows about that is missing here lands empty — so adding a
 * field is safe in either order, but they have to meet eventually.
 *
 * `paymentStatus` is the caller's to decide: 'Waitlist' from /api/register, 'Paid' from
 * the fulfilment path once money is confirmed captured.
 */
export function sheetRow(
  reg: Registration,
  extra: { paymentStatus: string; amount?: string; paymentId?: string; orderId?: string; paidAt?: string },
): Record<string, string> {
  const labelFor = (value: string, options: readonly { value: string; label: string }[]) =>
    options.find((o) => o.value === value)?.label || value

  return {
    // Common
    name: reg.name,
    email: reg.email,
    phone: reg.phone,
    city: reg.city,
    sector: reg.sector || '',
    registerAs: reg.registerAs || '',
    // Payment
    paymentStatus: extra.paymentStatus,
    ticket: reg.ticketName || '',
    access: ticketAccess(reg.ticketId) || '',
    amount: extra.amount || '',
    paymentId: extra.paymentId || '',
    orderId: extra.orderId || '',
    paidAt: extra.paidAt || '',
    // Organisation
    orgName: reg.orgName || '',
    idNumber: reg.idNumber || '',
    designation: reg.designation || '',
    // Human labels, not slugs — nobody reconciling a door list wants to map 'dl' back
    // to 'Driving Licence' by hand.
    idType: reg.idType ? labelFor(reg.idType, idTypeOptions) : '',
    interest: reg.interest ? labelFor(reg.interest, interestOptions) : '',
    // Workshop — the human label, not the slug. Nobody reconciling a session list wants
    // to map 'workshop-2' back to a name by hand.
    workshop: reg.workshop ? labelFor(reg.workshop, workshopOptions) : '',
    networking: reg.wantNetworking ? 'Yes' : '',
    meetingType: reg.meetingType ? labelFor(reg.meetingType, meetingTypeOptions) : '',
    meetingNote: reg.meetingNote || '',
    // Startup
    startupName: reg.startupName || '',
    stage: reg.stage ? labelFor(reg.stage, stageOptions) : '',
    pitchOneLine: reg.pitchOneLine || '',
    pitchDetail: reg.pitchDetail || '',
    traction: reg.traction || '',
    extraMembers: reg.extraMembers && reg.extraMembers !== '0' ? reg.extraMembers : '',
    extraMemberList: reg.extraMemberList || '',
    consent: reg.consent ? 'Yes' : '',
    updates: reg.updates || '',
  }
}
