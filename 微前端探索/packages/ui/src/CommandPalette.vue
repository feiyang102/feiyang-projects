<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElDialog, ElInput } from 'element-plus'
import { filterCommands } from './command'
import type { CommandItem } from './command'

const props = defineProps<{
  modelValue: boolean
  items: CommandItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [item: CommandItem]
}>()

const keyword = ref('')
const activeIndex = ref(0)

const filtered = computed(() => filterCommands(props.items, keyword.value))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      keyword.value = ''
      activeIndex.value = 0
    }
  },
)

watch(filtered, () => {
  activeIndex.value = 0
})

function move(step: number) {
  const length = filtered.value.length
  if (!length) return
  activeIndex.value = (activeIndex.value + step + length) % length
}

function choose(item?: CommandItem) {
  const target = item ?? filtered.value[activeIndex.value]
  if (!target) return
  emit('update:modelValue', false)
  emit('select', target)
}

function onKeydown(event: Event | KeyboardEvent) {
  const keyboard = event as KeyboardEvent
  if (keyboard.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (keyboard.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (keyboard.key === 'Enter') {
    event.preventDefault()
    choose()
  } else if (keyboard.key === 'Escape') {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    width="560px"
    :show-close="false"
    append-to-body
    class="admin-command"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <ElInput
        v-model="keyword"
        placeholder="搜索页面、菜单或路径…"
        size="large"
        autofocus
        @keydown="onKeydown"
      />
    </template>

    <div class="admin-command__list">
      <button
        v-for="(item, index) in filtered"
        :key="item.key"
        class="admin-command__item"
        :class="{ 'is-active': index === activeIndex }"
        type="button"
        @mouseenter="activeIndex = index"
        @click="choose(item)"
      >
        <span class="admin-command__title">{{ item.title }}</span>
        <span v-if="item.group" class="admin-command__group">{{ item.group }}</span>
        <span class="admin-command__path">{{ item.path }}</span>
      </button>
      <p v-if="filtered.length === 0" class="admin-command__empty">没有匹配的页面</p>
    </div>

    <template #footer>
      <div class="admin-command__footer">
        <span>↑↓ 选择 · Enter 打开 · Esc 关闭</span>
        <span>⌘K / Ctrl+K</span>
      </div>
    </template>
  </ElDialog>
</template>
