<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    card?: boolean
  }>(),
  {
    card: true,
  },
)
</script>

<template>
  <section class="admin-page">
    <header v-if="title || description || $slots.extra" class="admin-page__header">
      <div class="admin-page__heading">
        <h2 v-if="title" class="admin-page__title">{{ title }}</h2>
        <p v-if="description" class="admin-page__desc">{{ description }}</p>
        <slot name="header" />
      </div>
      <div v-if="$slots.extra" class="admin-page__extra">
        <slot name="extra" />
      </div>
    </header>
    <div class="admin-page__body" :class="{ 'is-card': card }">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="admin-page__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>
