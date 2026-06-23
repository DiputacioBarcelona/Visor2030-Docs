import panzoom from 'panzoom'

/**
 * For each Mermaid diagram on the current page, attach a "fullscreen" button
 * that opens the diagram in a panzoom-enabled overlay.
 *
 * Mermaid renders asynchronously, so we retry briefly until the SVG appears.
 */
export function setupMermaidFullscreen(): void {
  if (typeof window === 'undefined') return

  let attempts = 0
  const tick = () => {
    attempts++
    const containers = document.querySelectorAll<HTMLElement>('.mermaid, [class*="language-mermaid"]')

    let attached = 0
    containers.forEach((container) => {
      if (container.dataset.fullscreenReady === '1') return
      const svg = container.querySelector('svg')
      if (!svg) return

      container.dataset.fullscreenReady = '1'
      attached++

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'mermaid-fs-btn'
      button.title = 'Obre en pantalla completa'
      button.setAttribute('aria-label', 'Obre el diagrama en pantalla completa')
      button.innerHTML = '⛶ Pantalla completa'
      button.addEventListener('click', () => openOverlay(svg))

      // Wrap diagram + button in a positioned container so the button sits in the top-right.
      const wrap = document.createElement('div')
      wrap.className = 'mermaid-fs-wrap'
      container.parentElement?.insertBefore(wrap, container)
      wrap.appendChild(container)
      wrap.appendChild(button)
    })

    // Keep trying for a couple of seconds while Mermaid finishes rendering.
    if (attempts < 20 && attached === 0) {
      setTimeout(tick, 150)
    }
  }

  tick()
}

function openOverlay(originalSvg: SVGElement): void {
  const overlay = document.createElement('div')
  overlay.className = 'mermaid-fs-overlay'

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'mermaid-fs-close'
  close.setAttribute('aria-label', 'Tanca')
  close.innerHTML = '✕'

  const stage = document.createElement('div')
  stage.className = 'mermaid-fs-stage'

  // Clone the SVG so we can resize it freely without disturbing the inline diagram.
  const clone = originalSvg.cloneNode(true) as SVGElement
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.removeAttribute('style')
  // Keep the original viewBox so panzoom can compute initial fit.
  stage.appendChild(clone)

  overlay.appendChild(stage)
  overlay.appendChild(close)
  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  const dismiss = () => {
    instance?.dispose()
    overlay.remove()
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss()
  }

  close.addEventListener('click', dismiss)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss()
  })
  document.addEventListener('keydown', onKey)

  // Pan with mouse drag, zoom with wheel / pinch.
  const instance = panzoom(clone as unknown as SVGElement, {
    smoothScroll: false,
    bounds: true,
    boundsPadding: 0.1,
    minZoom: 0.2,
    maxZoom: 10,
  })
}
