import { defineComponent, h } from 'vue'
import type { VNode } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAdminRuntime } from './runtime'
import type { MenuNode } from './types'

function renderMenu(nodes: MenuNode[], currentPath: string, navigate: (node: MenuNode) => void): VNode {
  return h(
    'ul',
    { class: 'admin-default-menu' },
    nodes.map((node) =>
      h('li', { class: 'admin-default-menu__item', key: node.key }, [
        h(
          'a',
          {
            class: ['admin-default-menu__link', currentPath.startsWith(node.path) ? 'is-active' : ''],
            href: node.external ?? node.path,
            target: node.external ? '_blank' : undefined,
            rel: node.external ? 'noreferrer' : undefined,
            onClick: (event: MouseEvent) => {
              if (node.external) return
              event.preventDefault()
              navigate(node)
            },
          },
          node.title,
        ),
        node.children ? renderMenu(node.children, currentPath, navigate) : null,
      ]),
    ),
  )
}

export const DefaultLayout = defineComponent({
  name: 'AdminDefaultLayout',
  setup() {
    const runtime = useAdminRuntime()
    const router = useRouter()
    const route = useRoute()

    const navigate = (node: MenuNode) => {
      void router.push(node.path)
    }

    return () =>
      h('div', { class: 'admin-default-layout' }, [
        h('aside', { class: 'admin-default-layout__aside' }, [
          h('div', { class: 'admin-default-layout__brand' }, runtime.config.app.title),
          renderMenu(runtime.menus.value, route.path, navigate),
        ]),
        h('main', { class: 'admin-default-layout__main' }, [h(RouterView)]),
      ])
  },
})
