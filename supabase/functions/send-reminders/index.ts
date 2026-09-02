// Scheduled check-in reminders, sent from unravelreminders@gmail.com through the Gmail connector.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { authenticateCronRequest } from '../_shared/cron-auth.ts'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1'

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(''))
const mimeHeader = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`)

/** RFC 2822 message, base64url-encoded for Gmail's `raw` field. */
function rawEmail(from: string, to: string, subject: string, text: string, html: string): string {
  const boundary = `unravel_${crypto.randomUUID()}`
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${mimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return b64(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}


type Profile = {
  id: string
  name: string | null
  reminder_mode: string
  reminder_days: number[] | null
  reminder_time: string | null
  timezone: string | null
  discreet_notifications: boolean | null
  last_reminder_sent_at: string | null
}

/** Local weekday (0=Sun) and minutes-since-midnight for a time zone. */
function localNow(tz: string, now: Date) {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      hour12: false,
    }).formatToParts(now)
  } catch {
    return localNow('UTC', now)
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hour = Number(get('hour')) % 24
  return {
    weekday: Math.max(0, days.indexOf(get('weekday'))),
    minutes: hour * 60 + Number(get('minute')),
    dayOfMonth: Number(get('day')),
  }
}

function isDue(p: Profile, now: Date): boolean {
  const tz = p.timezone || 'UTC'
  const { weekday, minutes, dayOfMonth } = localNow(tz, now)
  const [h, m] = (p.reminder_time || '21:00').split(':').map(Number)
  const target = (h || 0) * 60 + (m || 0)
  // 15-minute window so an hourly/quarter-hourly cron still lands once.
  if (minutes < target || minutes >= target + 15) return false

  switch (p.reminder_mode) {
    case 'daily':
      return true
    case 'days':
      return (p.reminder_days ?? []).includes(weekday)
    case 'weekly':
      return weekday === ((p.reminder_days ?? [])[0] ?? 1)
    case 'monthly':
      return dayOfMonth === 1
    default:
      return false
  }
}

/** Minimum gap between reminders per rhythm, so nothing double-sends. */
function cooldownHours(mode: string) {
  if (mode === 'monthly') return 24 * 20
  if (mode === 'weekly') return 24 * 5
  return 20
}

function body(name: string, discreet: boolean) {
  const hello = name ? `Hi ${name},` : 'Hi,'
  const line = discreet
    ? 'A quiet moment for you, whenever you have one. Nothing to catch up on.'
    : 'A gentle nudge to open Unravel and check in, if you feel like it. Nothing to catch up on.'
  const text = `${hello}\n\n${line}\n\nSkipping is completely fine.\n`
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#3a3430;max-width:460px">
  <p style="margin:0 0 14px">${hello}</p>
  <p style="margin:0 0 14px">${line}</p>
  <p style="margin:0;color:#8a807a;font-size:14px">Skipping is completely fine.</p>
</div>`
  return { text, html }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  const scheduleSecret = Deno.env.get('REMINDER_CRON_SECRET')
  const bearer = /^Bearer ([^\s,]+)$/.exec(req.headers.get('authorization') ?? '')?.[1]
  if (!scheduleSecret || bearer !== scheduleSecret) {
    const unauthorized = authenticateCronRequest(req)
    if (unauthorized) return unauthorized
  }


  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY')
  if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
    return new Response(JSON.stringify({ error: 'Email is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const FROM = Deno.env.get('REMINDER_FROM') ?? 'Unravel <unravelreminders@gmail.com>'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const now = new Date()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      'id, name, reminder_mode, reminder_days, reminder_time, timezone, discreet_notifications, last_reminder_sent_at',
    )
    .eq('reminder_email_enabled', true)
    .neq('reminder_mode', 'manual')

  if (error) {
    console.error('profiles query failed', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0

  for (const p of (profiles ?? []) as Profile[]) {
    if (!isDue(p, now)) {
      skipped++
      continue
    }
    if (p.last_reminder_sent_at) {
      const hours = (now.getTime() - new Date(p.last_reminder_sent_at).getTime()) / 3_600_000
      if (hours < cooldownHours(p.reminder_mode)) {
        skipped++
        continue
      }
    }

    const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(p.id)
    const email = userRes?.user?.email
    if (userErr || !email) {
      console.error('no email for profile', p.id, userErr?.message)
      skipped++
      continue
    }

    const { text, html } = body(p.name ?? '', p.discreet_notifications ?? true)
    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
      },
      body: JSON.stringify({
        raw: rawEmail(FROM, email, 'A moment for you', text, html),
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error(`Gmail send failed [${res.status}]: ${detail}`)
      continue
    }


    await supabase
      .from('profiles')
      .update({ last_reminder_sent_at: now.toISOString() })
      .eq('id', p.id)
    sent++
  }

  return new Response(JSON.stringify({ sent, skipped }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
