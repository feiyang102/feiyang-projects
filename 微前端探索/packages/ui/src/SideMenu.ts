import { defineComponent, h } from 'vue'
import { ElMenu, ElMenuItem, ElSubMenu } from 'element-plus'
import type { MenuNode } from '@admin/core'
import { renderMenuIcon } from './icons'

export default defineComponent({
  name: 'AdminSideMenu',
  props: {
    items: { type: Array as () => MenuNode[], required: true },
    collapsed: { type: Boolean, default: false },
    defaultActive: { type: String, default: '' },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const renderItems = (items: MenuNode[]): unknown[] =>
      items.map((item) => {
        const title = () => h('span', { class: 'admin-side-menu__title' }, item.title)
        const icon = renderMenuIcon(item.icon)
        if (item.children?.length) {
          return h(
            ElSubMenu,
            { index: item.path, key: item.key, title: item.title },
            {
              title: () => [icon, title()],
              default: () => renderItems(item.children as MenuNode[]),
            },
          )
        }
        return h(
          ElMenuItem,
          { index: item.external ?? item.path, key: item.key, title: item.title },
          { default: () => [icon, title()] },
        )
      })

    return () =>
      h(
        ElMenu,
        {
          class: 'admin-side-menu',
          collapse: props.collapsed,
          collapseTransition: false,
          defaultActive: props.defaultActive,
          onSelect: (index: string) => emit('select', index),
        },
        { default: () => renderItems(props.items) },
      )
  },
})
