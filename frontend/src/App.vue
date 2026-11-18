<template>
  <AppTopbar />
  <main class="container-xl py-4">
    <RouterView />
  </main>
  <footer class="mr-footer small text-secondary">
    <div class="container-xl mr-footer-inner">
      <span class="d-none d-sm-inline">MineRecycle · {{ t('app.tagline') }}</span>
      <span class="mr-footer-owner">
        {{ t('app.assetSaleOf') }}
        <img src="/brand/horizonte-minerals.svg" alt="Horizonte Minerals" width="172" height="27" />
      </span>
    </div>
  </footer>
  <AppDialogs />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppTopbar from './components/AppTopbar.vue'
import AppDialogs from './components/AppDialogs.vue'

const { t } = useI18n()
</script>
