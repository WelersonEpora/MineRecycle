<template>
  <HelpTabs />
  <div class="row g-4">
    <!-- Índice -->
    <nav class="col-lg-3 d-none d-lg-block">
      <div class="mr-help-toc small">
        <div class="text-secondary text-uppercase fw-semibold mb-2">{{ t('help.contents') }}</div>
        <ul class="list-unstyled d-flex flex-column gap-1 mb-0">
          <li v-for="s in sections" :key="s"><a :href="`#guide-${s}`">{{ t(`guide.sections.${s}.title`) }}</a></li>
        </ul>
      </div>
    </nav>

    <div class="col-lg-9 d-flex flex-column gap-4" style="max-width: 860px">
      <header>
        <h1 class="h4 mb-1"><i class="bi bi-book"></i> {{ t('guide.title') }}</h1>
        <p class="text-secondary mb-0">{{ t('guide.intro') }}</p>
      </header>

      <!-- Cada seção vem de guide.sections.<chave> em en.js/pt.js: título, introdução, termos (rows), lista (items) e nota. -->
      <section v-for="s in sections" :id="`guide-${s}`" :key="s" class="mr-card p-3">
        <h2 class="h5">{{ t(`guide.sections.${s}.title`) }}</h2>

        <p v-if="has(s, 'intro')">{{ t(`guide.sections.${s}.intro`) }}</p>
        <dl v-if="has(s, 'rows')" class="row small mb-3">
          <template v-for="k in keys(`guide.sections.${s}.rows`)" :key="k">
            <dt class="col-sm-4">{{ t(`guide.sections.${s}.rows.${k}.term`) }}</dt>
            <dd class="col-sm-8">{{ t(`guide.sections.${s}.rows.${k}.text`) }}</dd>
          </template>
        </dl>
        <ul v-if="has(s, 'items')" class="mb-0">
          <li v-for="k in keys(`guide.sections.${s}.items`)" :key="k">{{ t(`guide.sections.${s}.items.${k}`) }}</li>
        </ul>
        <div v-if="has(s, 'note')" class="alert alert-info small mt-3 mb-0">
          <i class="bi bi-info-circle"></i> {{ t(`guide.sections.${s}.note`) }}
        </div>
      </section>

      <RouterLink :to="{ name: 'seller-help-import' }" class="btn btn-sm btn-outline-secondary align-self-start">
        <i class="bi bi-file-earmark-spreadsheet"></i> {{ t('guide.goToImport') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTabs from '../../components/seller/HelpTabs.vue'

const { t, tm } = useI18n()

// Chaves de um grupo de mensagens, na ordem em que estão em en.js/pt.js.
const keys = (path) => Object.keys(tm(path) || {})
const sections = computed(() => keys('guide.sections'))
const has = (s, part) => Boolean(tm(`guide.sections.${s}`)?.[part])
</script>

<style scoped>
.mr-help-toc {
  position: sticky;
  top: 1rem;
}
section {
  scroll-margin-top: 1rem;
}
</style>
