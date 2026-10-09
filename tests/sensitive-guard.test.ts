import { describe, expect, test } from 'claude-code/testing'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


// Ce qui, dans une vraie session, se trouve sous le plugin : le moteur qui place, ferme et signale.
function engineStubs(on: any) {
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  // Le mod attend sa décision par petits `sleep` : le stub attend vraiment, pour laisser tourner la boucle d'événements.
  on('process.run', async () => {
    await wait(50)
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.render', () => ({ value: null }) as any)
}

async function openPane($: any) {
  return $.ui.mount({
    plugin: 'sensitive-guard',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'sensitive-guard',
    props: {},
  } as any)
}

describe('sensitive-guard', () => {
  test('une commande ordinaire passe sans panneau', async ($, on) => {
    engineStubs(on)
    on('tool.call', () => ({ result: 'ran' }) as any)

    const r: any = await $.tool.call({ tool: 'Bash', command: 'git status' } as any)
    expect(r.deny).toBeUndefined()
  })

  test('Proceed exécute la commande sensible', async ($, on) => {
    engineStubs(on)
    let ran = false
    on('tool.call', () => {
      ran = true
      return { result: 'ran' } as any
    })

    const pending: Promise<any> = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
    await wait(600)
    expect(ran).toBe(false)

    const ui = await openPane($)
    expect(await ui.find({ type: 'Text', text: /rm -rf build/ })).toBeDefined()
    await ui.press({ key: 'proceed' })

    const r = await pending
    expect(ran).toBe(true)
    expect(r.deny).toBeUndefined()
    await ui.unmount()
  })

  test('Cancel refuse la commande sensible', async ($, on) => {
    engineStubs(on)
    let ran = false
    on('tool.call', () => {
      ran = true
      return { result: 'ran' } as any
    })

    const pending: Promise<any> = $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~1' } as any)
    await wait(600)

    const ui = await openPane($)
    await ui.press({ key: 'cancel' })

    const r = await pending
    expect(ran).toBe(false)
    expect(r.isError === true || r.deny !== undefined).toBe(true)
    await ui.unmount()
  })
})
