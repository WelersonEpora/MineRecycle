<template>
  <ul class="nav nav-pills small mb-3">
    <li class="nav-item">
      <RouterLink class="nav-link" :to="{ name: 'seller-help-how' }"><i class="bi bi-diagram-3"></i> {{ t('how.tab') }}</RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink class="nav-link" :to="{ name: 'seller-help-guide' }"><i class="bi bi-book"></i> {{ t('guide.tab') }}</RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink class="nav-link" :to="{ name: 'seller-help-import' }"><i class="bi bi-file-earmark-spreadsheet"></i> {{ t('help.tab') }}</RouterLink>
    </li>
  </ul>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
