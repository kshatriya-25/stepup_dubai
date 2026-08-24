# Working views on the Registrations sheet

The `Registrations` tab is the RECORD: one row per submission, every column the four
forms can produce, written by one code path. Most cells are blank on most rows and that
is correct — a Free Pass has no startup and a public attendee has no organisation. A
blank means the question was never asked, not that an answer was lost.

Do not work in it. Add the tabs below and work in those.

## Why views rather than one tab per pass

Splitting the WRITE path would mean the server choosing a tab per pass — two more places
a paid registration can go missing, and `findDuplicateRow_` would have to know which tab
to search before it could tell a retry from a new sale. The idempotency guard is the one
thing standing between a slow Apps Script response and a duplicate paid row, so it keeps
one tab to look at.

A view costs nothing, cannot be written to by accident, and updates itself. If the master
row is right, every view is right.

## Adding them

For each block below: add a tab with that name, click A1, paste the formula. That is all —
no script, no permissions, nothing to redeploy.

`QUERY` re-runs whenever the master changes, so a new registration appears in its view
within seconds. Newest first, because the useful question is almost always "who just
signed up".

### Tab: `Free passes`

```
=QUERY(Registrations!A:AD, "select A,B,D,E,F,G,O,P,Q,H where I = 'Free Pass' order by A desc label A 'Submitted'", 1)
```

Columns: Timestamp · Name · Email · Phone · City · Register As · Organisation · ID / Reg No · Designation · Payment Status

### Tab: `Delegate`

```
=QUERY(Registrations!A:AD, "select A,B,D,E,F,G,O,P,Q,H,K,N where I = 'Delegate Pass' order by A desc label A 'Submitted'", 1)
```

Columns: Timestamp · Name · Email · Phone · City · Register As · Organisation · ID / Reg No · Designation · Payment Status · Amount · Paid At (IST)

### Tab: `Workshop`

```
=QUERY(Registrations!A:AD, "select A,B,D,E,F,G,O,P,Q,R,S,T,U,H,K,N where I = 'Workshop Pass' order by A desc label A 'Submitted'", 1)
```

Columns: Timestamp · Name · Email · Phone · City · Register As · Organisation · ID / Reg No · Designation · Workshop · Networking · Meeting Type · Meeting Agenda · Payment Status · Amount · Paid At (IST)

### Tab: `Investor pitch`

```
=QUERY(Registrations!A:AD, "select A,B,D,E,F,G,O,P,Q,V,W,C,X,Y,Z,AA,AB,H,K,N where I = 'Investor Pitch Pass' order by A desc label A 'Submitted'", 1)
```

Columns: Timestamp · Name · Email · Phone · City · Register As · Organisation · ID / Reg No · Designation · Startup · Stage · Sector · One-line Pitch · Problem & Solution · Traction · Extra Members · Team Members · Payment Status · Amount · Paid At (IST)

### Tab: `Paid` — money only

Every row where a payment was actually captured, with the ids you would quote to Razorpay
or a bank in a dispute. Waitlist rows are excluded by definition.

```
=QUERY(Registrations!A:AD, "select N,B,D,E,I,K,L,M where H = 'Paid' order by N desc", 1)
```

### Tab: `Door list` — everyone expected on the day

Name, phone, pass and what it opens, for the registration desk. Sorted by name rather
than by time, because at the desk you are looking somebody up, not reading a feed.

```
=QUERY(Registrations!A:AD, "select B,E,I,J,O,P,H,AA order by B", 1)
```

## Two things to know

**Do not sort or filter the master tab in place.** Sorting rewrites the rows, and the
payment journal on the server references orders by id rather than row number, so a sorted
master is not corrupt — but it does make `findDuplicateRow_` scan a moving target, and it
makes any row number you quoted to somebody else wrong. Sort a view.

**`A:AD` is the whole width.** If a column is ever appended to the master (append only —
see the rule at the top of `registration/Code.gs`), widen the range in these formulas to
match, or the new column is invisible to every view.

