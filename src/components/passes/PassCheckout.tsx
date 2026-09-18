'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Loader2,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Rocket,
  GraduationCap,
  Building2,
  Landmark,
  Globe,
  Users,
  Clock,
  User,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Combobox } from '@/components/primitives/Combobox'
import { cn } from '@/lib/cn'
import { site, tamilNaduCities } from '@/content/site'
import {
  formatInrRupees,
  isFreePass,
  categories,
  asksStartup,
  ASK_ATTENDING_AS,
  startupNameFromOrg,
  idTypeOptions,
  interestOptions,
  workshopOptions,
  meetingTypeOptions,
  stageOptions,
  MAX_EXTRA_MEMBERS,
  coFounderOptions,
  teamSize,
  type Ticket,
  type CategoryId,
} from '@/content/tickets'

/**
 * The checkout form, on its own route — see src/app/passes/[pass]/page.tsx.
 *
 * WHY THIS IS NOT A MODAL ANY MORE
 * It was, and every problem the modal version had came from the container rather than the
 * content: two nested scrollers fighting over which one the submit button lived in, a
 * `dvh` panel height to keep that button clear of mobile Safari's address bar, a body
 * scroll-lock that had to restore its own scroll position on close, and a backdrop click
 * that threw away fifteen answers. A dialog is the wrong shape for a flow that takes
 * money and takes minutes.
 *
 * On a route, all of that is answered by the platform. Refresh and Back work. The URL is
 * shareable. There is no focus trap to hand-roll. And crucially the page is a SERVER
 * component, so whether the till is open is read from the server env directly and passed
 * down as a prop — the old client-side probe of /api/payment/order, and the "not answered
 * yet" state it needed, are both gone.
 *
 * `mode` therefore arrives already decided. This component never asks.
 */

type RazorpayResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}
type RazorpayInstance = { open: () => void; on: (e: string, h: (x: unknown) => void) => void }

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Load Checkout once, on demand. Cached as a promise so a double-click cannot start
 * two loads, and cleared on failure so someone who lost connection mid-load can retry
 * rather than being stuck with a permanently rejected promise.
 */
let checkoutPromise: Promise<void> | null = null
function loadCheckout(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve()
  if (checkoutPromise) return checkoutPromise
  checkoutPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    const el = existing ?? document.createElement('script')
    el.src = CHECKOUT_SRC
    el.async = true
    el.addEventListener('load', () => resolve())
    el.addEventListener('error', () => reject(new Error('checkout script failed to load')))
    if (!existing) document.body.appendChild(el)
  }).catch((err) => {
    checkoutPromise = null
    throw err
  })
  return checkoutPromise
}

type Status = 'idle' | 'sending' | 'confirming' | 'done' | 'error'
type ExtraMember = { name: string; role: string }
type StepId = 'you' | 'about' | 'details' | 'review'

const STEP_TITLE: Record<StepId, string> = {
  you: 'Your details',
  about: 'How you’re attending',
  details: 'A bit more',
  review: 'Review & confirm',
}

/**
 * Which steps this form has — a function of the pass AND the chosen category.
 *
 * 'details' is skipped entirely for the Free and Delegate passes: they have no extra
 * questions, so showing an empty third step would be three clicks to confirm what the
 * first two already said.
 *
 * The category is picked on 'about', which is step 2, so by the time this decides whether
 * step 3 exists the answer is known. That ordering is load-bearing: a member of the public
 * on the Investor Pitch Pass has no startup to describe, so 'details' disappears and their
 * form is three steps rather than four. See asksStartup() in @/content/tickets.
 */
function stepsFor(ticket: Ticket, category: CategoryId | ''): StepId[] {
  // 'about' is the "I'm attending as" step — off while ASK_ATTENDING_AS is false.
  const s: StepId[] = ASK_ATTENDING_AS ? ['you', 'about'] : ['you']
  if (ticket.form.workshop || asksStartup(ticket, category)) s.push('details')
  s.push('review')
  return s
}

/**
 * Lucide icons per category, replacing the emoji the client's mock-up used.
 *
 * Emoji render as a different typeface on every platform — colour glyphs on macOS, flat
 * monochrome on Windows, and a tofu box where the font is missing — so a form built on
 * them looks unfinished on somebody else's machine and cannot be given a brand colour.
 * These inherit currentColor and sit on the same optical grid as the rest of the UI.
 */
const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  founder: Rocket,
  college: GraduationCap,
  private: Building2,
  tbi: Landmark,
  public: Globe,
}


/* ------------------------------------------------------------------ *
 * Draft persistence
 * ------------------------------------------------------------------ */

/**
 * Keep what has been typed across an accidental refresh, a backdrop mis-tap, or a phone
 * that killed the tab while the reader went to find their DPIIT number.
 *
 * The Investor Pitch Pass form asks for a written pitch. Losing that to a stray click is
 * the kind of thing that makes someone give up rather than start again, so the draft is
 * saved on every change and restored when the same pass is reopened.
 *
 * FIVE DELIBERATE CHOICES
 *
 * 1. Keyed PER PASS. Someone comparing the Workshop and Investor Pitch passes should not
 *    find half a pitch in the workshop form.
 *
 * 2. CONSENT IS NEVER SAVED. It is an affirmation about the details as they stand, not a
 *    field like any other. Restoring a pre-ticked consent box would mean the record says
 *    someone agreed on a screen they may never have read. It is re-ticked every time, and
 *    it costs one click.
 *
 * 3. VERSIONED KEY. The stored shape is this component's state. Change the fields and old
 *    drafts become wrong rather than merely stale, so the version goes up and they are
 *    ignored — never migrated on the fly, which is how you get a half-populated form.
 *
 * 4. EXPIRES. A draft older than the window is dropped. Someone returning weeks later is
 *    not resuming, and prices or the pass itself may have changed underneath them.
 *
 * 5. EVERY ACCESS IS GUARDED. localStorage throws outright in Safari private mode and
 *    where site data is blocked — not returns null, throws. An unguarded read here would
 *    take the whole form down for those visitors, which is far worse than losing a draft.
 */
// v2 since the "I'm attending as" step was switched off: a v1 draft carries a category and
// organisation that no longer have a field, so v1 drafts are ignored rather than restored.
const DRAFT_KEY_PREFIX = 't2r:pass-draft:v2:'
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

type DraftShape = {
  at: number
  stepIndex: number
  v: Record<string, unknown>
  extras: ExtraMember[]
}

function draftKey(ticketId: string): string {
  return `${DRAFT_KEY_PREFIX}${ticketId}`
}

function readDraft(ticketId: string): DraftShape | null {
  try {
    const raw = window.localStorage.getItem(draftKey(ticketId))
    if (!raw) return null
    const d = JSON.parse(raw) as DraftShape
    if (!d || typeof d.at !== 'number' || Date.now() - d.at > DRAFT_TTL_MS) {
      window.localStorage.removeItem(draftKey(ticketId))
      return null
    }
    return d
  } catch {
    // Unreadable, unparseable, or storage denied. A missing draft is not an error.
    return null
  }
}

function writeDraft(ticketId: string, draft: Omit<DraftShape, 'at'>): void {
  try {
    window.localStorage.setItem(draftKey(ticketId), JSON.stringify({ ...draft, at: Date.now() }))
  } catch {
    // Quota exceeded or storage denied. Nothing to do and nothing worth telling the
    // visitor — they lose a convenience, not their submission.
  }
}

function clearDraft(ticketId: string): void {
  try {
    window.localStorage.removeItem(draftKey(ticketId))
  } catch {
    /* see writeDraft */
  }
}

/**
 * ONE form for every pass, in either mode, across several steps.
 *
 * WHY IT IS STEPPED
 * The Investor Pitch Pass asks fifteen questions. In one column that is a modal taller
 * than the screen with a submit button somewhere past the fold — the reader cannot see
 * how much is left, cannot tell which answer failed validation without hunting, and on a
 * phone is scrolling a sheet inside a scrolling page. Splitting it into steps of four to
 * six related fields means every step fits without scrolling, the progress is visible,
 * and errors surface next to the field that caused them.
 *
 * The shell is a FIXED-HEIGHT panel: header, scrolling middle, pinned footer. The action
 * is therefore always on screen, which is the actual fix for "the popup is too big" — the
 * problem was never the field count, it was that the button moved.
 *
 * `mode` decides only what happens on the final submit — 'pay' creates a Razorpay order,
 * 'waitlist' records a registration. The questions are identical either way: someone who
 * came to buy and finds they cannot yet should not be asked for less, because the value
 * of catching them is knowing which pass they wanted and how to reach them.
 *
 * The field set comes from `ticket.form` and from the chosen category, never from `mode`.
 */
export function PassCheckout({
  ticket,
  mode,
  onExtrasChange,
}: {
  ticket: Ticket
  mode: 'pay' | 'waitlist'
  /** Reports the extra-member count up to PassFlow so the summary can price it. */
  onExtrasChange?: (n: number) => void
}) {
  const [stepIndex, setStepIndex] = useState(0)

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [paidNote, setPaidNote] = useState('')

  // Held in state rather than read from the DOM on submit: the fields of step 1 are
  // unmounted by the time step 3 is on screen, so a FormData sweep at the end would
  // collect nothing. This is the reason a stepped form keeps its own model.
  const [v, setV] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    category: '' as CategoryId | '',
    orgName: '',
    idNumber: '',
    idType: '',
    designation: '',
    interest: '',
    workshop: '',
    wantNetworking: false,
    meetingType: '',
    meetingNote: '',
    startupName: '',
    stage: '',
    sector: '',
    pitchOneLine: '',
    pitchDetail: '',
    traction: '',
    // The pass's second seat — see coFounderOptions. Only asked where includesCoFounder.
    coFounder: '',
    coFounderName: '',
    coFounderPhone: '',
    consent: false,
    updates: true,
  })
  const [extras, setExtras] = useState<ExtraMember[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  /*
   * THE DRAFT: what they typed survives a refresh, a Back-then-Forward, or an accidentally
   * closed tab. The rules live on readDraft/writeDraft above; this is only the wiring.
   *
   * RESTORED AFTER MOUNT, NOT IN useState's INITIALISER. The page is server-rendered, and
   * the server has no localStorage — reading it during the first render would make the
   * client's HTML differ from the server's and React would throw a hydration error. So the
   * form paints empty for one frame and fills in.
   *
   * `restored` GATES THE SAVE. Without it the save effect runs on that first empty render
   * and overwrites the draft with blanks before the restore has had a chance to read it —
   * the most likely way for this feature to silently do nothing.
   */
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const d = readDraft(ticket.id)
    if (d) {
      setV((cur) => {
        const next = { ...cur }
        // Only fields this form still has, and only with the type it expects — a draft is
        // storage the browser hands back, not something to trust shape-wise.
        for (const [k, val] of Object.entries(d.v || {})) {
          if (k === 'consent') continue // never restored — see rule 2 above
          if (k in next && typeof val === typeof next[k as keyof typeof next]) {
            ;(next as Record<string, unknown>)[k] = val
          }
        }
        return next
      })
      if (Array.isArray(d.extras)) {
        setExtras(d.extras.filter((m) => m && typeof m.name === 'string' && typeof m.role === 'string'))
      }
      if (Number.isInteger(d.stepIndex) && d.stepIndex > 0) setStepIndex(d.stepIndex)
    }
    setRestored(true)
  }, [ticket.id])

  /*
   * The step list can SHRINK under the reader.
   *
   * Picking 'public' on the Investor Pitch Pass removes the 'details' step, so a form that
   * was four steps becomes three. stepIndex is a number, and left alone it would point one
   * past the end — `steps[stepIndex]` undefined, and a blank panel with a dead Continue
   * button. Clamping here rather than in the click handlers covers every route to it,
   * including a restored draft written before the category changed.
   */
  const steps = useMemo(() => stepsFor(ticket, v.category), [ticket, v.category])
  const safeIndex = Math.min(stepIndex, steps.length - 1)
  const step = steps[safeIndex]
  useEffect(() => {
    if (stepIndex > steps.length - 1) setStepIndex(steps.length - 1)
  }, [stepIndex, steps.length])
  const busy = useRef(false)
  const scroller = useRef<HTMLDivElement>(null)

  // Report upward whenever the count moves. An effect rather than a call inside each
  // handler, so a restored draft and a removed row are covered by the same line.
  /*
   * Extras that are actually CHARGED. A solo founder cannot add paid members while the
   * pass's second seat is empty (see coFounderOptions), so their extras count as zero —
   * kept in state rather than discarded, so switching back to "Attending with me" does not
   * throw away names someone already typed. The server applies the same rule.
   */
  const chargedExtras = ticket.includesCoFounder && v.coFounder === 'solo' ? 0 : extras.length

  useEffect(() => {
    onExtrasChange?.(chargedExtras)
  }, [chargedExtras, onExtrasChange])

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [key]: value }))
    setErrors((e) => (e[key as string] ? { ...e, [key as string]: '' } : e))
  }

  const cfg = v.category ? categories[v.category] : null
  const paying = mode === 'pay'
  const totalInr = ticket.priceInr + (ticket.extraMemberInr ? chargedExtras * ticket.extraMemberInr : 0)
  const amountLabel = isFreePass(ticket) ? 'Free' : formatInrRupees(totalInr)

  /*
   * Save on every change once restored; clear once the registration is done, so a finished
   * visitor who refreshes gets a clean form rather than the one they just submitted.
   * Consent is stripped here too, so it never reaches storage at all.
   */
  useEffect(() => {
    if (!restored) return
    if (status === 'done') {
      clearDraft(ticket.id)
      return
    }
    const { consent: _consent, ...rest } = v
    writeDraft(ticket.id, { stepIndex: safeIndex, v: rest, extras })
  }, [restored, status, v, extras, safeIndex, ticket.id])

  useEffect(() => {
    if (status !== 'confirming') return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  /** Validate only the step on screen. Returns the errors so callers can act on them. */
  function validateStep(which: StepId): Record<string, string> {
    const e: Record<string, string> = {}
    if (which === 'you') {
      if (!v.name.trim()) e.name = 'Please tell us your name.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'That email looks wrong.'
      // Indian mobiles are 10 digits starting 6–9. The range check catches a pasted
      // leading 0 or 91, which would otherwise truncate to a wrong number.
      if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = 'Enter a 10-digit mobile number.'
      if (!v.city) e.city = 'Please pick your city.'
    }
    if (which === 'about') {
      if (!v.category) e.category = 'Please pick one.'
      else {
        // Same rules as parseSubmission in @/lib/registration-input, and they have to
        // stay the same: this copy exists only to answer faster and more kindly. "Is it
        // asked" and "is it required" are separate flags, so both are checked.
        const c = categories[v.category]
        if (c.showOrg && c.orgRequired && !v.orgName.trim()) e.orgName = `${c.orgLabel} is needed.`
        if (c.showId && c.idRequired && !v.idNumber.trim()) e.idNumber = `${c.idLabel} is needed.`
        if (c.showId && c.idType && !v.idType) e.idType = 'Please choose an ID type.'
        if (c.interest && !v.interest) e.interest = 'Please pick one.'
      }
    }
    if (which === 'details') {
      if (ticket.form.workshop && !v.workshop) e.workshop = 'Please choose a session.'
      if (asksStartup(ticket, v.category)) {
        if (!startupNameFromOrg(v.category) && !v.startupName.trim()) e.startupName = 'Startup name is needed.'
        if (!v.stage) e.stage = 'Please pick a stage.'
        if (!v.sector.trim()) e.sector = 'Sector is needed.'
        if (!v.pitchOneLine.trim()) e.pitchOneLine = 'A one-line pitch is needed.'
        if (!v.pitchDetail.trim()) e.pitchDetail = 'Please describe the problem and solution.'
        if (ticket.includesCoFounder) {
          if (!v.coFounder) e.coFounder = 'Please choose one.'
          if (v.coFounder === 'attending') {
            if (!v.coFounderName.trim()) e.coFounderName = 'Their name is needed.'
            // Optional — but if it is given it must be a real number, not half of one.
            if (v.coFounderPhone && !/^[6-9]\d{9}$/.test(v.coFounderPhone)) {
              e.coFounderPhone = 'Enter a 10-digit mobile number, or leave it blank.'
            }
          }
        }
      }
    }
    if (which === 'review') {
      if (!v.consent) e.consent = 'Please confirm to continue.'
    }
    return e
  }

  function next() {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length) return
    setStepIndex(Math.min(safeIndex + 1, steps.length - 1))
    scroller.current?.scrollTo({ top: 0 })
  }

  function back() {
    setErrors({})
    setStepIndex(Math.max(safeIndex - 1, 0))
    scroller.current?.scrollTo({ top: 0 })
  }

  /** The flat payload both endpoints take. Nothing here is trusted server-side. */
  function payload(): Record<string, string> {
    const named = extras.filter((m) => m.name.trim() || m.role.trim())
    const ws = !!ticket.form.workshop
    // Pass AND category — a public attendee on the Investor Pitch Pass sends no startup
    // fields and no extra members, whatever is left in state from an earlier choice.
    const su = asksStartup(ticket, v.category)
    return {
      ticketId: ticket.id,
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone ? `+91 ${v.phone.slice(0, 5)} ${v.phone.slice(5)}` : '',
      city: v.city,
      category: v.category,
      // Each sent only when the category asks it — otherwise a visitor who typed into a
      // field and then switched category would still submit what they typed.
      orgName: cfg?.showOrg ? v.orgName.trim() : '',
      idNumber: cfg?.showId ? v.idNumber.trim() : '',
      designation: cfg?.showDesignation ? v.designation.trim() : '',
      // Sent only where the category asks. Switching from 'public' to 'founder' after
      // answering these must not smuggle the old answers through — same reasoning as the
      // organisation block above.
      idType: cfg?.showId && cfg.idType ? v.idType : '',
      interest: cfg?.interest ? v.interest : '',
      workshop: ws ? v.workshop : '',
      wantNetworking: ws && v.wantNetworking ? 'yes' : '',
      meetingType: ws && v.wantNetworking ? v.meetingType : '',
      meetingNote: ws && v.wantNetworking ? v.meetingNote.trim() : '',
      // A founder was not asked twice: their step-2 "Startup name" is the startup. The
      // server does the same substitution and does not trust this value for a founder.
      startupName: su ? (startupNameFromOrg(v.category) ? v.orgName.trim() : v.startupName.trim()) : '',
      stage: su ? v.stage : '',
      sector: su ? v.sector.trim() : '',
      pitchOneLine: su ? v.pitchOneLine.trim() : '',
      pitchDetail: su ? v.pitchDetail.trim() : '',
      traction: su ? v.traction.trim() : '',
      // The COUNT is what the server prices from; the list is for the organiser.
      extraMembers: su && chargedExtras > 0 ? String(named.length) : '0',
      extraMemberList:
        su && chargedExtras > 0
          ? named.map((m) => `${m.name.trim()}${m.role.trim() ? ` (${m.role.trim()})` : ''}`).join('; ')
          : '',
      coFounder: su && ticket.includesCoFounder ? v.coFounder : '',
      coFounderName: su && v.coFounder === 'attending' ? v.coFounderName.trim() : '',
      coFounderPhone:
        su && v.coFounder === 'attending' && v.coFounderPhone
          ? `+91 ${v.coFounderPhone.slice(0, 5)} ${v.coFounderPhone.slice(5)}`
          : '',
      consent: 'yes',
      updates: v.updates ? 'yes' : 'no',
    }
  }

  async function submit() {
    if (busy.current) return
    const e = validateStep('review')
    setErrors(e)
    if (Object.keys(e).length) return

    busy.current = true
    setStatus('sending')
    setErrorMsg('')
    const body = payload()

    try {
      if (!paying) {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
        if (!res.ok || !data?.ok) {
          setErrorMsg(data?.error || '')
          setStatus('error')
          busy.current = false
          return
        }
        setStatus('done')
        busy.current = false
        return
      }

      // Only the pass id and the extra-member COUNT go up. The server prices it — the
      // browser never names an amount, so there is nothing here to tamper with.
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const order = (await orderRes.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            keyId?: string
            orderId?: string
            amount?: number
            currency?: string
            ticketName?: string
            prefill?: { name: string; email: string; contact: string }
          }
        | null

      if (!orderRes.ok || !order?.ok || !order.orderId || !order.keyId) {
        setErrorMsg(order?.error || '')
        setStatus('error')
        busy.current = false
        return
      }

      try {
        await loadCheckout()
      } catch {
        setErrorMsg('Could not reach the payment provider. Check your connection and try again.')
        setStatus('error')
        busy.current = false
        return
      }
      if (!window.Razorpay) {
        setErrorMsg('Could not start the payment window. Please try again.')
        setStatus('error')
        busy.current = false
        return
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: site.fullName,
        description: `${order.ticketName || ticket.name} · ${site.dates}`,
        /*
         * Name, email and phone come from our own form, so Checkout must not ask again.
         *
         * `prefill` alone only fills the boxes — Checkout still shows them and still lets
         * the payer edit, which is both an extra step and a data problem: a number typed
         * there goes onto Razorpay's payment record while OUR journal row, the sheet and
         * the confirmation email all keep the one from the form.
         *
         * The server builds prefill.contact as +91XXXXXXXXXX; Checkout silently falls
         * back to asking for a contact it cannot parse, so that format is load-bearing.
         */
        prefill: order.prefill,
        readonly: { name: true, email: true, contact: true },
        notes: { ticket: ticket.id },
        theme: { color: '#F47B20' },
        retry: { enabled: true, max_count: 3 },
        modal: {
          // Closing mid-payment with a bank page open is how people end up charged with
          // no record on our side.
          escape: false,
          ondismiss: () => {
            busy.current = false
            setErrorMsg('Payment cancelled — you have not been charged.')
            setStatus('error')
          },
        },
        handler: (res: RazorpayResponse) => {
          // Not awaited: Razorpay closes its modal when this returns, and holding it open
          // behind a network call looks like a freeze.
          void confirmPayment(res)
        },
      })

      rzp.on('payment.failed', (evt: unknown) => {
        busy.current = false
        const desc =
          (evt as { error?: { description?: string } } | null)?.error?.description ||
          'The payment did not go through.'
        // Razorpay only emits this for genuinely failed attempts, so no money moved and
        // an error is honest here.
        setErrorMsg(`${desc} You have not been charged — please try again.`)
        setStatus('error')
      })

      rzp.open()
    } catch {
      setErrorMsg('')
      setStatus('error')
      busy.current = false
    }
  }

  /**
   * Everything below runs AFTER the customer has been charged.
   *
   * There is deliberately no path here that reports a failure, with one exception. Once
   * Razorpay has handed us a payment id the money has moved, and the webhook records it
   * independently of this request — so an error shown here would describe our own
   * bookkeeping, not their payment, and the only thing it could make them do is pay
   * twice. The exception is a 402, the single post-Checkout case where the charge
   * genuinely did not complete.
   */
  async function confirmPayment(response: RazorpayResponse) {
    setStatus('confirming')
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(response),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null

      if (data?.ok) {
        setPaidNote(data.message || '')
        setStatus('done')
        return
      }
      if (res.status === 402) {
        setErrorMsg(data?.error || 'That payment did not complete. You have not been charged.')
        setStatus('error')
        return
      }
      setPaidNote(
        "We're confirming your payment. If it went through you'll receive an email shortly — " +
          'please do not pay again. Contact us if you have not heard within an hour.',
      )
      setStatus('done')
    } catch {
      // The browser could not reach us, but Razorpay has the payment and the webhook is
      // independent of this request. Reassure, never alarm.
      setPaidNote(
        'Your payment was submitted. Our confirmation email is on its way — please do not pay again. ' +
          `If you have not heard within an hour, contact ${site.contactEmail}.`,
      )
      setStatus('done')
    } finally {
      busy.current = false
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center border border-ink/10 bg-surface px-6 py-14 text-center sm:px-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <Check size={26} strokeWidth={3} className="text-accent-ink" />
        </span>
        <h3 className="mt-6 font-sans text-2xl font-bold tracking-[-0.01em] text-ink">
          {paying ? 'You’re in.' : 'You’re on the list.'}
        </h3>
        <p className="mt-3 max-w-sm leading-relaxed text-muted">
          {paying
            ? paidNote ||
              `Payment received for the ${ticket.name}. Your receipt is on its way to your inbox — see you in ${site.city.split(',')[0]}.`
            : `We have your interest in the ${ticket.name}. A confirmation is on its way, and we’ll reach you first the moment passes are released — see you in ${site.city.split(',')[0]}.`}
        </p>
        <Link
          href="/"
          className="mt-7 bg-base px-8 py-3 font-sans text-sm font-semibold text-surface transition-colors hover:bg-accent hover:text-accent-ink"
        >
          Back to the summit
        </Link>
      </div>
    )
  }

  const submitting = status === 'sending' || status === 'confirming'
  const onLast = step === 'review'

  return (
    /*
     * A card in a page, not a fixed-height dialog.
     *
     * The height cap, the internal scroller and the `dvh` arithmetic that used to be here
     * are all gone: the page scrolls, which is what pages do. The footer is a normal block
     * at the end of the form rather than something pinned over content, so nothing has to
     * be reserved for it and it cannot end up under mobile Safari's address bar.
     */
    <div className="flex flex-col border border-ink/10 bg-surface">
      {/* ---- progress ---- */}
      <div className="shrink-0 border-b border-ink/10 bg-foam px-5 py-3 sm:px-7">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < safeIndex ? 'bg-accent' : i === safeIndex ? 'bg-accent/60' : 'bg-ink/10',
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-sans text-sm font-semibold text-ink">{STEP_TITLE[step]}</span>
          <span className="font-sans text-xs tabular-nums text-muted">
            Step {safeIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* ---- the step ---- */}
      <div ref={scroller} className="px-5 py-6 text-ink sm:px-7 sm:py-7">
        {!paying && safeIndex === 0 && (
          <p className="mb-5 border-l-2 border-accent bg-foam px-4 py-3 text-sm leading-relaxed text-muted">
            {isFreePass(ticket)
              ? 'Free passes are released in limited batches. Leave your details and we’ll confirm your place as soon as the next batch opens.'
              : `Booking isn’t open just yet. Leave your details and we’ll come to you first when passes for the ${ticket.name} go on sale.`}
          </p>
        )}

        {step === 'you' && (
          <div className="flex flex-col gap-4">
            <Field label="Full name" required error={errors.name}>
              <input
                type="text"
                autoComplete="name"
                placeholder="Priya Kumar"
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                className={cn(input, errors.name && inputBad)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile number" required error={errors.phone}>
                {/* +91 is fixed chrome, not typed input — that is what makes the stored
                    format single-valued. The visible box holds digits only. */}
                <div
                  className={cn(
                    'flex items-center border bg-foam transition-colors focus-within:bg-surface',
                    errors.phone ? 'border-accent' : 'border-ink/15 focus-within:border-accent',
                  )}
                >
                  <span className="select-none border-r border-ink/10 px-3 py-2.5 text-sm text-muted">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    aria-label="Mobile number, 10 digits"
                    placeholder="98765 43210"
                    value={v.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums text-ink outline-none placeholder:text-muted/60"
                  />
                </div>
              </Field>

              <Field label="Email address" required error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={v.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={cn(input, errors.email && inputBad)}
                />
              </Field>
            </div>

            <Field label="City" required error={errors.city}>
              <Combobox
                label="City"
                placeholder="Select your city"
                searchPlaceholder="Search Tamil Nadu cities…"
                value={v.city}
                onChange={(x) => set('city', x)}
                options={tamilNaduCities}
                invalid={!!errors.city}
              />
            </Field>
          </div>
        )}

        {step === 'about' && (
          <div className="flex flex-col gap-5">
            <Field label="I’m attending as" required error={errors.category}>
              <div className="grid gap-2 sm:grid-cols-2">
                {ticket.form.categories.map((id) => {
                  const c = categories[id]
                  const Icon = CATEGORY_ICON[id]
                  const on = v.category === id
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('category', id)}
                      className={cn(
                        'flex items-start gap-3 border p-3 text-left transition-colors',
                        on
                          ? 'border-accent bg-accent/[0.06]'
                          : 'border-ink/15 bg-foam hover:border-ink/30 hover:bg-surface',
                      )}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.75}
                        className={cn('mt-0.5 shrink-0', on ? 'text-accent' : 'text-muted')}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight text-ink">{c.title}</span>
                        <span className="mt-1 block text-xs leading-snug text-muted">{c.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>

            {/*
              Which fields appear, their labels, placeholders and required-ness ALL come
              from the category — nothing in this block is written per pass, and there is
              no branch on a category id. Changing what step 2 asks is a change to
              `categories` in @/content/tickets, never to this markup.
            */}
            {/*
              Since September 2026 this is normally ONE field — the organisation's name —
              and for 'public' it is nothing at all, in which case the block (and its
              divider) is not drawn. A lone field spans both columns rather than sitting in
              the left one with an empty cell beside it.
            */}
            {cfg && (cfg.showOrg || cfg.showId || cfg.showDesignation) && (
              <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                {/* ID type first: it names what the number underneath it will be. */}
                {cfg.showId && cfg.idType && (
                  <Field label="ID you’ll bring" required error={errors.idType}>
                    <Combobox
                      options={idTypeOptions}
                      value={v.idType}
                      onChange={(x) => set('idType', x)}
                      placeholder="Select ID type"
                      invalid={!!errors.idType}
                    />
                  </Field>
                )}
                {cfg.showId && (
                  <Field label={cfg.idLabel} required={cfg.idRequired} error={errors.idNumber}>
                    <input
                      type="text"
                      placeholder={cfg.idPlaceholder}
                      value={v.idNumber}
                      onChange={(e) => set('idNumber', e.target.value)}
                      className={cn(input, errors.idNumber && inputBad)}
                    />
                  </Field>
                )}
                {cfg.showOrg && (
                  <div className={cn(!cfg.showId && !cfg.showDesignation && 'sm:col-span-2')}>
                    <Field
                      label={cfg.orgLabel}
                      required={cfg.orgRequired}
                      hint={cfg.orgRequired ? undefined : 'Optional'}
                      error={errors.orgName}
                    >
                      <input
                        type="text"
                        placeholder={cfg.orgPlaceholder}
                        value={v.orgName}
                        onChange={(e) => set('orgName', e.target.value)}
                        className={cn(input, errors.orgName && inputBad)}
                      />
                    </Field>
                  </div>
                )}
                {cfg.showDesignation && (
                  <Field label="Designation" hint="Optional">
                    <input
                      type="text"
                      placeholder={cfg.roleHint}
                      value={v.designation}
                      onChange={(e) => set('designation', e.target.value)}
                      className={input}
                    />
                  </Field>
                )}
              </div>
            )}

            {/*
              Nine options, so radio CARDS rather than a dropdown: they are all short, the
              reader is choosing an identity rather than looking one up, and a collapsed
              select would hide eight of the nine behind a click. Same treatment as the
              category picker above, one column narrower, so the step reads as one idea.
            */}
            {cfg?.interest && (
              <Field
                label="Your interest in Tier-2 Rising"
                required
                hint="Helps us plan the zones and sessions"
                error={errors.interest}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {interestOptions.map((o) => {
                    const on = v.interest === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set('interest', o.value)}
                        className={cn(
                          'border px-3 py-2.5 text-left text-sm font-medium leading-snug transition-colors',
                          on
                            ? 'border-accent bg-accent/[0.06] text-ink'
                            : 'border-ink/15 bg-foam text-muted hover:border-ink/30 hover:bg-surface hover:text-ink',
                        )}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </Field>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="flex flex-col gap-5">
            {ticket.form.workshop && (
              <>
                <Field label="Choose your workshop" required error={errors.workshop}>
                  <Combobox
                    label="Workshop"
                    placeholder="Select a session"
                    value={v.workshop}
                    onChange={(x) => set('workshop', x)}
                    options={workshopOptions}
                    invalid={!!errors.workshop}
                  />
                </Field>

                <label className="flex items-start gap-3 border border-ink/15 bg-foam p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={v.wantNetworking}
                    onChange={(e) => set('wantNetworking', e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span>
                    <span className="font-semibold text-ink">Book me a Power Networking appointment</span>
                    <span className="mt-1 block text-xs leading-snug text-muted">
                      Appointments are pre-booked. Tell us who you want to meet and we’ll schedule it.
                    </span>
                  </span>
                </label>

                {v.wantNetworking && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Who would you like to meet?">
                      {/* Optional, so "no preference" is simply leaving it alone rather
                          than an empty option that reads as a choice. */}
                      <Combobox
                        label="Who to meet"
                        placeholder="No preference"
                        value={v.meetingType}
                        onChange={(x) => set('meetingType', x)}
                        options={meetingTypeOptions}
                      />
                    </Field>
                    <Field label="What’s the agenda?" hint="Optional">
                      <input
                        type="text"
                        placeholder="Looking for a tech co-founder"
                        value={v.meetingNote}
                        onChange={(e) => set('meetingNote', e.target.value)}
                        className={input}
                      />
                    </Field>
                  </div>
                )}
              </>
            )}

            {ticket.form.startup && (
              <>
                {/* Two columns only when both fields are here: for a founder the name field is
                    gone, and Stage alone in the left column would leave a blank cell beside it
                    above the full-width fields that follow. */}
                <div className={cn('grid gap-4', !startupNameFromOrg(v.category) && 'sm:grid-cols-2')}>
                  {/* A founder gave this in step 2 as "Startup name" — see startupNameFromOrg. */}
                  {!startupNameFromOrg(v.category) && (
                    <Field label="Startup / idea name" required error={errors.startupName}>
                      <input
                        type="text"
                        placeholder="GreenCart"
                        value={v.startupName}
                        onChange={(e) => set('startupName', e.target.value)}
                        className={cn(input, errors.startupName && inputBad)}
                      />
                    </Field>
                  )}
                  <Field label="Stage" required error={errors.stage}>
                    <Combobox
                      label="Stage"
                      placeholder="Select stage"
                      value={v.stage}
                      onChange={(x) => set('stage', x)}
                      options={stageOptions}
                      invalid={!!errors.stage}
                    />
                  </Field>
                </div>

                <Field label="Sector / industry" required error={errors.sector}>
                  <input
                    type="text"
                    placeholder="AgriTech, FinTech, D2C…"
                    value={v.sector}
                    onChange={(e) => set('sector', e.target.value)}
                    className={cn(input, errors.sector && inputBad)}
                  />
                </Field>

                <Field label="One-line pitch" required error={errors.pitchOneLine}>
                  <input
                    type="text"
                    placeholder="Same-day organic produce delivery for Tier-2 cities"
                    value={v.pitchOneLine}
                    onChange={(e) => set('pitchOneLine', e.target.value)}
                    className={cn(input, errors.pitchOneLine && inputBad)}
                  />
                </Field>

                <Field
                  label="The problem & your solution"
                  required
                  error={errors.pitchDetail}
                  hint={`${v.pitchDetail.length}/2000`}
                >
                  <textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="What problem are you solving, and how? Keep it to the essentials."
                    value={v.pitchDetail}
                    onChange={(e) => set('pitchDetail', e.target.value)}
                    className={cn(input, 'resize-y leading-relaxed', errors.pitchDetail && inputBad)}
                  />
                </Field>

                <Field label="Registration / traction" hint="Optional — DPIIT, GST, revenue, users">
                  <input
                    type="text"
                    placeholder="DPIIT recognised, 500+ users"
                    value={v.traction}
                    onChange={(e) => set('traction', e.target.value)}
                    className={input}
                  />
                </Field>

                {/*
                  YOUR TEAM. On a pass with a co-founder seat it opens with what that seat is
                  doing — asked as a choice, not as a mandatory name field, because the
                  co-founder is the person on this form most likely to be unavailable,
                  undecided, or not to exist. See coFounderOptions for the three answers.

                  Extra members are chargeable, so the running total stays visible as they are
                  added — not revealed at the payment step.
                */}
                {/* A pass qualifies for this section if it seats a co-founder, sells extra
                    seats, or both — the Investor Pitch Pass stopped selling extras in
                    September 2026 and still has a second seat to ask about. */}
                {(ticket.includesCoFounder || ticket.extraMemberInr) && (
                  <div className="flex flex-col gap-4 border-t border-ink/10 pt-5">
                    {ticket.includesCoFounder && (
                      <>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="font-sans text-sm font-semibold text-ink">Your team</span>
                          <span className="text-xs text-muted">
                            {formatInrRupees(ticket.priceInr)} covers you and a co-founder
                          </span>
                        </div>

                        <Field label="Is your co-founder attending?" required error={errors.coFounder}>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {coFounderOptions.map((o) => {
                              const on = v.coFounder === o.value
                              const Icon = o.value === 'attending' ? Users : o.value === 'later' ? Clock : User
                              return (
                                <button
                                  key={o.value}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => set('coFounder', o.value)}
                                  className={cn(
                                    'flex items-start gap-3 border p-3 text-left transition-colors',
                                    on
                                      ? 'border-accent bg-accent/[0.06]'
                                      : 'border-ink/15 bg-foam hover:border-ink/30 hover:bg-surface',
                                  )}
                                >
                                  <Icon
                                    size={18}
                                    strokeWidth={1.75}
                                    className={cn('mt-0.5 shrink-0', on ? 'text-accent' : 'text-muted')}
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold leading-tight text-ink">{o.label}</span>
                                    <span className="mt-1 block text-xs leading-snug text-muted">{o.hint}</span>
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </Field>

                        {v.coFounder === 'attending' && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Co-founder’s name" required error={errors.coFounderName}>
                              <input
                                type="text"
                                autoComplete="off"
                                placeholder="Their full name"
                                value={v.coFounderName}
                                onChange={(e) => set('coFounderName', e.target.value)}
                                className={cn(input, errors.coFounderName && inputBad)}
                              />
                            </Field>
                            {/* Same fixed +91 chrome as the main mobile field, so both numbers
                                are stored in one format. Optional: a founder who does not have
                                it to hand should not be stopped here. */}
                            <Field label="Their mobile" hint="Optional" error={errors.coFounderPhone}>
                              <div
                                className={cn(
                                  'flex items-center border bg-foam transition-colors focus-within:bg-surface',
                                  errors.coFounderPhone ? 'border-accent' : 'border-ink/15 focus-within:border-accent',
                                )}
                              >
                                <span className="select-none border-r border-ink/10 px-3 py-2.5 text-sm text-muted">
                                  +91
                                </span>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={10}
                                  aria-label="Co-founder’s mobile number, 10 digits"
                                  placeholder="98765 43210"
                                  value={v.coFounderPhone}
                                  onChange={(e) => set('coFounderPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  className="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums text-ink outline-none placeholder:text-muted/60"
                                />
                              </div>
                            </Field>
                          </div>
                        )}

                        {/* What happens next, said where the choice is made rather than in
                            small print at the end. The price line is deliberate: a pass that
                            costs the same for one as for two must say so before payment. */}
                        {v.coFounder === 'later' && (
                          <p className="border-l-2 border-accent bg-foam px-4 py-3 text-sm leading-relaxed text-muted">
                            Their seat stays on your pass. Reply to your confirmation email with their name before{' '}
                            {site.datesCompact}.
                          </p>
                        )}
                        {v.coFounder === 'solo' && (
                          <p className="border-l-2 border-accent bg-foam px-4 py-3 text-sm leading-relaxed text-muted">
                            The pass is priced for two, so the price stays the same. If your co-founder can make it
                            after all, reply to your confirmation email with their name.
                          </p>
                        )}
                      </>
                    )}

                    {!ticket.extraMemberInr ? null : ticket.includesCoFounder && v.coFounder === 'solo' ? (
                      /* No paid extras while the paid second seat is empty — point them at it. */
                      <p className="text-xs leading-relaxed text-muted">
                        Bringing a teammate instead? Choose{' '}
                        <button
                          type="button"
                          onClick={() => set('coFounder', 'attending')}
                          className="font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          Attending with me
                        </button>{' '}
                        and add their name — that seat is already paid for.
                      </p>
                    ) : (
                      <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="font-sans text-sm font-semibold text-ink">
                            {ticket.includesCoFounder ? 'Anyone else from your startup?' : 'Bringing anyone else?'}
                          </span>
                          <span className="text-xs text-muted">
                            {ticket.includesCoFounder
                              ? `${formatInrRupees(ticket.extraMemberInr)} each`
                              : `You’re covered by the pass · ${formatInrRupees(ticket.extraMemberInr)} each after that`}
                          </span>
                        </div>

                        {extras.map((m, i) => (
                          <div key={i} className="mt-3 border border-ink/15 bg-foam p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-sans text-xs font-semibold text-accent">
                                Member {i + (ticket.includesCoFounder ? 3 : 2)} · +{formatInrRupees(ticket.extraMemberInr!)}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove member ${i + (ticket.includesCoFounder ? 3 : 2)}`}
                                onClick={() => setExtras((xs) => xs.filter((_, j) => j !== i))}
                                className="text-muted transition-colors hover:text-accent"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                              <input
                                type="text"
                                placeholder="Their name"
                                value={m.name}
                                onChange={(e) =>
                                  setExtras((xs) => xs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                                }
                                className={input}
                              />
                              <input
                                type="text"
                                placeholder="Their role"
                                value={m.role}
                                onChange={(e) =>
                                  setExtras((xs) => xs.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))
                                }
                                className={input}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          {extras.length < MAX_EXTRA_MEMBERS ? (
                            <button
                              type="button"
                              onClick={() => setExtras((xs) => [...xs, { name: '', role: '' }])}
                              className="flex items-center gap-2 border border-dashed border-ink/25 px-4 py-2.5 font-sans text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              <Plus size={15} />
                              Add a team member
                            </button>
                          ) : (
                            <span className="text-xs text-muted">
                              That&apos;s the maximum of {MAX_EXTRA_MEMBERS + (ticket.includesCoFounder ? 2 : 1)} people on
                              one pass. Email us for a larger team.
                            </span>
                          )}

                          {/* The total, restated where the change is being made — on a phone
                              the summary rail sits below the whole form. */}
                          {extras.length > 0 && (
                            <span className="font-sans text-sm text-muted">
                              {ticket.includesCoFounder ? teamSize(v.coFounder || 'attending', extras.length) : extras.length + 1}{' '}
                              people · <strong className="font-bold tabular-nums text-ink">{amountLabel}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col gap-5">
            {/* A summary, not a re-render of the form. Editing means going back to the
                step that owns the field, which keeps one field in one place. */}
            <dl className="divide-y divide-ink/10 border-y border-ink/10">
              <Summary label="Pass" value={ticket.name} />
              <Summary label="Name" value={v.name} />
              <Summary label="Mobile" value={v.phone ? `+91 ${v.phone.slice(0, 5)} ${v.phone.slice(5)}` : '—'} />
              <Summary label="Email" value={v.email} />
              <Summary label="City" value={v.city} />
              {cfg && <Summary label="Attending as" value={cfg.title} />}
              {cfg?.showId && cfg.idType && v.idType && (
                <Summary
                  label="ID you’ll bring"
                  value={idTypeOptions.find((o) => o.value === v.idType)?.label || v.idType}
                />
              )}
              {cfg?.showId && v.idNumber && <Summary label={cfg.idLabel} value={v.idNumber} />}
              {cfg?.showOrg && v.orgName && <Summary label={cfg.orgLabel} value={v.orgName} />}
              {cfg?.showDesignation && v.designation && <Summary label="Designation" value={v.designation} />}
              {cfg?.interest && v.interest && (
                <Summary
                  label="Interest"
                  value={interestOptions.find((o) => o.value === v.interest)?.label || v.interest}
                />
              )}
              {ticket.form.workshop && v.workshop && (
                <Summary
                  label="Workshop"
                  value={workshopOptions.find((w) => w.value === v.workshop)?.label || v.workshop}
                />
              )}
              {ticket.form.workshop && v.wantNetworking && (
                <Summary
                  label="Networking"
                  value={meetingTypeOptions.find((m) => m.value === v.meetingType)?.label || 'Yes'}
                />
              )}
              {/* A founder's startup is already listed above under "Startup name". */}
              {asksStartup(ticket, v.category) && !startupNameFromOrg(v.category) && v.startupName && (
                <Summary label="Startup" value={v.startupName} />
              )}
              {asksStartup(ticket, v.category) && v.stage && (
                <Summary label="Stage" value={stageOptions.find((s) => s.value === v.stage)?.label || v.stage} />
              )}
              {ticket.includesCoFounder && v.coFounder && (
                <Summary
                  label="Co-founder"
                  value={
                    v.coFounder === 'attending'
                      ? [v.coFounderName, v.coFounderPhone && `+91 ${v.coFounderPhone.slice(0, 5)} ${v.coFounderPhone.slice(5)}`]
                          .filter(Boolean)
                          .join(' · ')
                      : v.coFounder === 'later'
                        ? 'Name to follow'
                        : 'Not attending'
                  }
                />
              )}
              {ticket.includesCoFounder && v.coFounder ? (
                <Summary label="Team" value={`${teamSize(v.coFounder, chargedExtras)} ${teamSize(v.coFounder, chargedExtras) === 1 ? 'person' : 'people'}`} />
              ) : (
                extras.length > 0 && <Summary label="Team" value={`${extras.length + 1} people`} />
              )}
            </dl>

            {/* The one place the arithmetic is spelled out. A three-person startup is
                paying for extra seats should see how the total is built. (No pass sells
                extra seats today, so this does not render — see the team section above.) */}
            {paying && ticket.extraMemberInr && chargedExtras > 0 && (
              <div className="bg-foam p-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{ticket.name}</span>
                  <span className="tabular-nums">{formatInrRupees(ticket.priceInr)}</span>
                </div>
                <div className="mt-2 flex justify-between text-muted">
                  <span>
                    {chargedExtras} {ticket.includesCoFounder ? 'additional' : 'extra'}{' '}
                    {chargedExtras === 1 ? 'member' : 'members'} × {formatInrRupees(ticket.extraMemberInr)}
                  </span>
                  <span className="tabular-nums">{formatInrRupees(chargedExtras * ticket.extraMemberInr)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-ink/15 pt-3 font-semibold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{amountLabel}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className={cn('flex items-start gap-3 text-sm', errors.consent ? 'text-accent' : 'text-muted')}>
                <input
                  type="checkbox"
                  checked={v.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span>
                  The details above are correct, and I agree to be contacted about the {site.fullName}.
                  <span className="text-accent"> *</span>
                </span>
              </label>
              {errors.consent && <span className="text-xs font-medium text-accent">{errors.consent}</span>}

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={v.updates}
                  onChange={(e) => set('updates', e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span>Keep me posted about the agenda and speaker announcements.</span>
              </label>
            </div>

            {paying && (
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <ShieldCheck size={13} />
                Secure payment by Razorpay · UPI, cards, net banking
              </p>
            )}

            {/* Only ever rendered when no money has moved — see confirmPayment(). */}
            {status === 'error' && (
              <p className="border-l-2 border-accent bg-accent/5 px-4 py-3 text-sm font-medium text-accent">
                {errorMsg || 'Something went wrong'} — please try again, or email {site.contactEmail}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- actions ---- */}
      <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-5 py-4 sm:px-7">
        {safeIndex === 0 ? (
          <Link
            href="/#tickets"
            className="flex items-center gap-1.5 font-sans text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} /> All passes
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            disabled={submitting}
            className="flex items-center gap-1.5 font-sans text-sm font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <button
          type="button"
          onClick={onLast ? submit : next}
          disabled={submitting}
          className="flex min-w-[10rem] items-center justify-center gap-2 bg-accent px-6 py-3 font-sans text-sm font-bold text-accent-ink transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {status === 'confirming'
            ? 'Confirming…'
            : status === 'sending'
              ? paying
                ? 'Starting payment…'
                : 'Adding you…'
              : onLast
                ? paying
                  ? `Pay ${amountLabel}`
                  : isFreePass(ticket)
                    ? 'Register for free'
                    : 'Join the waitlist'
                : 'Continue'}
          {!onLast && !submitting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}

/*
 * Input and label styling.
 *
 * The labels were `uppercase tracking-[0.12em] font-bold` — the same treatment as the
 * section eyebrows. On a display heading that reads as brand; on fifteen consecutive
 * form labels it reads as shouting, and uppercase costs real legibility because it
 * removes the ascender/descender pattern the eye actually reads word shapes from.
 * Sentence case, medium weight, normal tracking. The brand voice stays where it earns
 * its keep: eyebrows, headings and buttons.
 */
const input =
  'w-full border border-ink/15 bg-foam px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:bg-surface'
const inputBad = 'border-accent'

function Field({
  label,
  children,
  required,
  hint,
  error,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  hint?: string
  error?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm font-medium text-ink">
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        {hint && <span className="font-sans text-xs tabular-nums text-muted/70">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-xs font-medium text-accent">{error}</span>}
    </label>
  )
}

/** One row of the review step. `dl` so the pairing is structural, not just visual. */
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 font-sans text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-sans text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  )
}
