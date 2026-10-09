export type Held = {
  command: string
  hits: string[]
  // 'pane' : affichée dans le panneau latéral ; 'band' : repli au-dessus du prompt si le panneau n'est pas placé.
  where: 'pane' | 'band'
}

declare module 'claude-code' {
  interface PluginState {
    'sensitive-guard': { held: Held | null }
  }
}
