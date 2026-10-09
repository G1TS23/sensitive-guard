import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Held } from '../types'

const PANE = 'sensitive-guard'
const held = atom({ plugin: 'sensitive-guard', key: 'held' } as const, null)

type Rule = { label: string; pattern: RegExp }

// Chaque règle décrit une famille de commandes difficiles ou impossibles à annuler.
const RULES: Rule[] = [
  { label: 'suppression récursive ou forcée (rm -r / -f)', pattern: /\brm\s+(?:[^|;&]*\s)?-[a-zA-Z]*[rRf]/ },
  { label: 'git reset --hard (perte des modifications locales)', pattern: /\bgit\s+reset\s+(?:[^|;&]*\s)?--hard\b/ },
  { label: 'git clean forcé (suppression de fichiers non suivis)', pattern: /\bgit\s+clean\s+(?:[^|;&]*\s)?-[a-zA-Z]*f/ },
  { label: "git push --force (réécriture de l'historique distant)", pattern: /\bgit\s+push\s+(?:[^|;&]*\s)?(?:--force\b|-f\b)/ },
  { label: 'git branch -D (suppression de branche non fusionnée)', pattern: /\bgit\s+branch\s+(?:[^|;&]*\s)?-D\b/ },
  { label: 'git checkout/restore sur tout le dépôt', pattern: /\bgit\s+(?:checkout\s+--\s+\.|restore\s+(?:--\S+\s+)*\.)(?:\s|$)/ },
  { label: 'SQL destructeur (DROP / TRUNCATE)', pattern: /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b/i },
  { label: 'terraform apply/destroy', pattern: /\bterraform\s+(?:apply|destroy)\b/ },
  { label: 'kubectl delete', pattern: /\bkubectl\s+delete\b/ },
  { label: 'docker system prune / volume prune', pattern: /\bdocker\s+(?:system|volume)\s+prune\b/ },
  { label: 'chmod/chown récursif', pattern: /\b(?:chmod|chown)\s+(?:[^|;&]*\s)?-R\b/ },
  { label: 'écriture directe sur un périphérique bloc', pattern: /\b(?:dd\s+[^|;&]*of=\/dev\/|mkfs(?:\.\w+)?\s|>\s*\/dev\/(?:sd|nvme|disk))/ },
  { label: "exécution d'un script distant (curl | sh)", pattern: /\b(?:curl|wget)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/ },
  { label: 'élévation de privilèges (sudo)', pattern: /(?:^|[;&|]\s*)sudo\s/ },
]

function classify(command: string): string[] {
  return RULES.filter(rule => rule.pattern.test(command)).map(rule => rule.label)
}

// La décision est lue par la boucle d'attente du hook et écrite par les boutons : elle vit dans le module,
// le temps d'un appel suspendu. L'affichage, lui, vient de $.state (atome `held`).
const gate: { decision: 'proceed' | 'cancel' | null; busy: boolean } = { decision: null, busy: false }

const short = (text: string) => (text.length > 400 ? `${text.slice(0, 400)}…` : text)

// Le même contenu s'affiche dans le panneau, ou au-dessus du prompt si le terminal est trop étroit.
function draw($: any, e: any, h: Held) {
  const { Box, Button, Text } = $.ui.resolve(e)

  return Box({
    flexDirection: 'column',
    paddingX: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    children: [
      Text({ bold: true, color: 'yellow', children: 'Commande sensible suspendue' }),
      Text({ children: short(h.command) }),
      Text({ dimColor: true, children: h.hits.map(label => `- ${label}`).join('\n') }),
      Box({
        flexDirection: 'row',
        children: [
          Button({
            key: 'proceed',
            label: 'Proceed',
            hotkey: '1',
            variant: 'primary',
            onPress: async () => {
              gate.decision = 'proceed'
            },
          }),
          Text({ children: '  ' }),
          Button({
            key: 'cancel',
            label: 'Cancel',
            hotkey: '2',
            onPress: async () => {
              gate.decision = 'cancel'
            },
          }),
        ],
      }),
    ],
  })
}

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    const hits = classify(command)
    if (hits.length === 0) return next(e)

    // Un seul panneau à la fois : les appels sensibles suivants attendent leur tour.
    while (gate.busy && !next.signal.aborted) await $.process.run(['sleep', '0.25'])
    if (next.signal.aborted) return { deny: `${$.plugin.name} : appel interrompu avant la validation.` }

    gate.busy = true
    gate.decision = null
    try {
      const entry: Held = { command, hits, where: 'pane' }
      await update($, held, () => entry)
      $.ui.toast('sensitive-guard : commande sensible en attente de votre décision')

      const opened = await $.ui.open({ id: PANE, title: 'Sensitive guard', focus: true })
      if (!opened.isPlaced) await update($, held, h => (h ? { ...h, where: 'band' } : h))

      // Le temps passé dans les appels $ ne compte pas dans le budget du hook : on attend par petits sleeps.
      while (gate.decision === null && !next.signal.aborted) await $.process.run(['sleep', '0.25'])

      if (gate.decision === 'proceed') return await next(e)

      return {
        deny:
          `${$.plugin.name} : l'utilisateur a refusé (Cancel) cette commande : ${hits.join(' ; ')}. ` +
          `Ne la relance pas telle quelle ; propose une alternative plus sûre ou demande-lui comment procéder.`,
      }
    } finally {
      await update($, held, () => null)
      await $.ui.close({ id: PANE })
      gate.decision = null
      gate.busy = false
    }
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: `${$.plugin.name} : le garde-fou a échoué, commande refusée par précaution.` },
  )

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const h = await read($, held)
    if (h === null) return next(e)

    return draw($, e, h)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const h = await read($, held)
    if (h === null || h.where !== 'band' || e.props.hasSurvey) return next(e)

    return draw($, e, h)
  })
}
// x
