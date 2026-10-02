import { audio, definirFone } from './audio'

/**
 * Trilha própria: arquivos de música escolhidos por quem joga, no próprio
 * computador.
 *
 * Os arquivos nunca saem do navegador — ficam guardados no IndexedDB desta
 * máquina e não vão para o repositório nem para o site publicado. É assim
 * que dá para apresentar o jogo com uma gravação que não pode ser
 * distribuída junto com ele.
 *
 * Dois arquivos: o piano sozinho (a trilha de fundo) e, se houver, a versão
 * com todos os instrumentos, que entra por cima nos picos. Os dois tocam
 * juntos desde o começo, alinhados; a versão completa só fica muda.
 *
 * E um terceiro, à parte: um arquivo com "lia" ou "fone" no nome vira a
 * música que toca no fone da Lia, no quarto dela, no lugar da composição
 * do jogo.
 */

const BANCO = 'nos-trilha'
const LOJA = 'arquivos'

type Papel = 'piano' | 'completo' | 'fone'

/** Pelo nome, o arquivo que vai para o fone da Lia. */
function pareceFone(nome: string): boolean {
  return /lia|fone/i.test(nome)
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((ok, falha) => {
    const req = indexedDB.open(BANCO, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA)
    req.onsuccess = () => ok(req.result)
    req.onerror = () => falha(req.error)
  })
}

async function guardar(papel: Papel, arquivo: Blob | null): Promise<void> {
  const db = await abrirBanco()
  await new Promise<void>((ok, falha) => {
    const tx = db.transaction(LOJA, 'readwrite')
    if (arquivo) tx.objectStore(LOJA).put(arquivo, papel)
    else tx.objectStore(LOJA).delete(papel)
    tx.oncomplete = () => ok()
    tx.onerror = () => falha(tx.error)
  })
  db.close()
}

async function buscar(papel: Papel): Promise<Blob | null> {
  const db = await abrirBanco()
  const r = await new Promise<Blob | null>((ok, falha) => {
    const req = db.transaction(LOJA, 'readonly').objectStore(LOJA).get(papel)
    req.onsuccess = () => ok((req.result as Blob | undefined) ?? null)
    req.onerror = () => falha(req.error)
  })
  db.close()
  return r
}

/** Pelo nome, qual dos dois arquivos é a versão com todos os instrumentos. */
function pareceCompleto(nome: string): boolean {
  return /complet|full|band|orquest|instrument|cheia|todos/i.test(nome)
}

class TrilhaPropria {
  private buffers: Partial<Record<Papel, AudioBuffer>> = {}
  private fontes: AudioBufferSourceNode[] = []
  private ganho: Partial<Record<Papel, GainNode>> = {}
  private mestre: GainNode | null = null
  nomes: Partial<Record<Papel, string>> = {}
  private carregou = false

  get pronta(): boolean {
    return this.buffers.piano !== undefined
  }

  get temCompleto(): boolean {
    return this.buffers.completo !== undefined
  }

  get tocando(): boolean {
    return this.fontes.length > 0
  }

  /** Lê o que ficou guardado da última vez. Silencioso se não houver nada. */
  async carregarGuardada(): Promise<void> {
    if (this.carregou) return
    this.carregou = true
    try {
      for (const papel of ['piano', 'completo', 'fone'] as const) {
        const blob = await buscar(papel)
        if (blob) await this.decodificar(papel, blob, (blob as File).name ?? papel)
      }
    } catch {
      /* sem IndexedDB: segue com a trilha sintetizada */
    }
  }

  private async decodificar(papel: Papel, blob: Blob, nome: string): Promise<void> {
    const ctx = audio.contexto
    if (!ctx) return
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    this.buffers[papel] = buf
    this.nomes[papel] = nome
    if (papel === 'fone') definirFone(buf)
  }

  /**
   * Um ou dois arquivos escolhidos. Com dois, o que tiver "completo" no
   * nome (ou o maior, na falta disso) é a versão cheia.
   */
  async escolher(todos: File[]): Promise<void> {
    if (todos.length === 0) return
    // O do fone da Lia vai para o lugar dele, e não mexe na trilha.
    const doFone = todos.find((f) => pareceFone(f.name))
    if (doFone) {
      await this.decodificar('fone', doFone, doFone.name)
      try {
        await guardar('fone', doFone)
      } catch {
        /* sem armazenamento: vale só para esta visita */
      }
    }
    const arquivos = todos.filter((f) => f !== doFone)
    if (arquivos.length === 0) return
    this.parar(0.3)
    let piano = arquivos[0]
    let completo: File | undefined = arquivos[1]
    if (arquivos.length >= 2 && piano && completo) {
      const a = piano
      const b = completo
      if (pareceCompleto(a.name) && !pareceCompleto(b.name)) {
        piano = b
        completo = a
      } else if (!pareceCompleto(b.name) && !pareceCompleto(a.name) && a.size > b.size) {
        piano = b
        completo = a
      }
    }
    if (!piano) return
    const fone = this.buffers.fone
    const nomeFone = this.nomes.fone
    this.buffers = fone ? { fone } : {}
    this.nomes = nomeFone ? { fone: nomeFone } : {}
    await this.decodificar('piano', piano, piano.name)
    if (completo) await this.decodificar('completo', completo, completo.name)
    try {
      await guardar('piano', piano)
      await guardar('completo', completo ?? null)
    } catch {
      /* sem armazenamento: vale só para esta visita */
    }
  }

  async remover(): Promise<void> {
    this.parar(0.3)
    this.buffers = {}
    this.nomes = {}
    definirFone(null)
    try {
      await guardar('piano', null)
      await guardar('completo', null)
      await guardar('fone', null)
    } catch {
      /* nada a apagar */
    }
  }

  tocar(nivel = 0.8): void {
    const ctx = audio.contexto
    const out = audio.saida
    if (!ctx || !out || !this.buffers.piano || this.tocando) return
    this.mestre = ctx.createGain()
    this.mestre.gain.value = 0
    this.mestre.connect(out)
    const t = ctx.currentTime + 0.05
    for (const papel of ['piano', 'completo'] as const) {
      const buf = this.buffers[papel]
      if (!buf) continue
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const g = ctx.createGain()
      g.gain.value = papel === 'piano' ? 1 : 0
      src.connect(g).connect(this.mestre)
      src.start(t)
      this.fontes.push(src)
      this.ganho[papel] = g
    }
    this.volume(nivel, 2.5)
  }

  volume(nivel: number, segundos = 2): void {
    const ctx = audio.contexto
    const g = this.mestre
    if (!ctx || !g) return
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(nivel, t + Math.max(0.01, segundos))
  }

  /** A versão cheia entra (1) ou sai (0). O piano sozinho cede o lugar. */
  completo(nivel: number, segundos = 1.2): void {
    const ctx = audio.contexto
    if (!ctx || !this.ganho.completo) return
    const t = ctx.currentTime
    for (const [papel, alvo] of [['completo', nivel], ['piano', 1 - nivel]] as const) {
      const g = this.ganho[papel]
      if (!g) continue
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(g.gain.value, t)
      g.gain.linearRampToValueAtTime(alvo, t + Math.max(0.01, segundos))
    }
  }

  parar(segundos = 2): void {
    const ctx = audio.contexto
    if (!ctx) return
    this.volume(0, segundos)
    const fontes = this.fontes
    this.fontes = []
    this.ganho = {}
    const t = ctx.currentTime + segundos + 0.05
    for (const f of fontes) {
      try {
        f.stop(t)
      } catch {
        /* já parada */
      }
    }
  }
}

export const trilhaPropria = new TrilhaPropria()
