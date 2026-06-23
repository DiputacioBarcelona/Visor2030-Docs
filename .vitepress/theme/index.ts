import DefaultTheme from 'vitepress/theme'
import { h, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './custom.css'
import { setupMermaidFullscreen } from './mermaidFullscreen'

export default {
  extends: DefaultTheme,
  Layout() {
    const route = useRoute()

    onMounted(() => {
      setupMermaidFullscreen()
      // Re-run on route change (Mermaid blocks may appear on another page)
      watch(
        () => route.path,
        () => nextTick(() => setupMermaidFullscreen()),
      )
    })

    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-after': () =>
        h('span', { class: 'doc-subtitle' }, 'Documentació'),
      'home-hero-info-before': () =>
        h('img', {
          src: '/logo.svg',
          class: 'home-hero-logo',
          alt: 'Visor 2030',
        }),
    })
  },
}
