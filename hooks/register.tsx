import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit, Ctx } from '../types'

const limits = atom({ plugin: 'usage-ribbon', key: 'limits' } as const, [] as Limit[])
const ctx = atom({ plugin: 'usage-ribbon', key: 'ctx' } as const, {} as Ctx)

const NAMES: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }

function left(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!(ms > 0)) return 'resetting'
  const m = Math.round(ms / 60000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const mm = m % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${mm}m`
  return `${mm}m`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const u = await $.session.usage()
    await update($, limits, () => u.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })))
    await update($, ctx, () => ({ tokens: u.context.tokens, window: u.context.window, percent: u.context.percent, usd: u.cost?.usd }))
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, ctx, () => ({ tokens: e.context.tokens, window: e.context.window, percent: e.context.percent, usd: e.cost?.usd }))
    if (e.context.tokens !== undefined) {
      const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)
      $.ui.status(`ctx ${k(e.context.tokens)}${e.context.percent !== undefined ? ` (${Math.round(e.context.percent)}%)` : ''}${e.cost ? ` · $${e.cost.usd.toFixed(2)}` : ''}`)
    }
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => e.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })))
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const ls = await read($, limits)
    const c = await read($, ctx)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)
    const parts: string[] = []
    if (c.tokens !== undefined) {
      parts.push(`context: ${fmt(c.tokens)}${c.window ? ` / ${fmt(c.window)}` : ''}${c.percent !== undefined ? ` (${Math.round(c.percent)}%)` : ''}`)
    }
    if (c.usd !== undefined) parts.push(`$${c.usd.toFixed(2)}`)
    for (const l of ls) {
      const t = left(l.resetsAt, now)
      parts.push(`${NAMES[l.kind] ?? l.kind}: ${l.percentUsed}%${t ? ` · resets in ${t}` : ''}`)
    }
    if (ls.length === 0) parts.push('limits: no data')
    return (
      <Box>
        <Text dimColor>{parts.join('   |   ')}</Text>
      </Box>
    )
  })
}
