<template>
  <div class="text-center py-5">
    <h1 class="h4">{{ t('notFound.title') }}</h1>
    <RouterLink :to="{ name: 'catalog' }">{{ t('notFound.back') }}</RouterLink>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
