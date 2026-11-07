export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Ctx = { tokens?: number; window?: number; percent?: number; usd?: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-ribbon': { limits: Limit[]; ctx: Ctx }
  }
}
