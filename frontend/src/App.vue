<template>
  <AppTopbar />
  <main class="container-xl py-4">
    <RouterView />
  </main>
  <footer class="container-xl pb-4 pt-2 small text-secondary">
    MineRecycle · {{ t('app.tagline') }}
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppTopbar from './components/AppTopbar.vue'

const { t } = useI18n()
</script>
