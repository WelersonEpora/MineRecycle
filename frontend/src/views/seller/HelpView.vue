<template>
  <HelpTabs />
  <div class="row g-4">
    <!-- Índice -->
    <nav class="col-lg-3 d-none d-lg-block">
      <div class="mr-help-toc small">
        <div class="text-secondary text-uppercase fw-semibold mb-2">{{ t('help.contents') }}</div>
        <ul class="list-unstyled d-flex flex-column gap-1 mb-0">
          <li v-for="s in SECTIONS" :key="s"><a :href="`#help-${s}`">{{ t(`help.${s}.title`) }}</a></li>
        </ul>
      </div>
    </nav>

    <div class="col-lg-9 d-flex flex-column gap-4" style="max-width: 860px">
      <header>
        <h1 class="h4 mb-1"><i class="bi bi-question-circle"></i> {{ t('help.title') }}</h1>
        <p class="text-secondary mb-0">{{ t('help.intro') }}</p>
      </header>

      <!-- 1. Exportar do STOR -->
      <section :id="'help-export'" class="mr-card p-3">
        <h2 class="h5">{{ t('help.export.title') }}</h2>
        <p>{{ t('help.export.intro') }}</p>
        <dl class="row small mb-3">
          <template v-for="k in keys('help.export.where')" :key="k">
            <dt class="col-sm-3">{{ t(`help.export.whereLabels.${k}`) }}</dt>
            <dd class="col-sm-9 mr-mono">{{ t(`help.export.where.${k}`) }}</dd>
          </template>
        </dl>
        <ol class="mb-3">
          <li v-for="k in keys('help.export.steps')" :key="k">{{ t(`help.export.steps.${k}`) }}</li>
        </ol>
        <div class="alert alert-warning small mb-0">
          <div class="fw-semibold mb-1"><i class="bi bi-exclamation-triangle"></i> {{ t('help.export.careTitle') }}</div>
          <ul class="mb-0 ps-3">
            <li v-for="k in keys('help.export.care')" :key="k">{{ t(`help.export.care.${k}`) }}</li>
          </ul>
        </div>
      </section>

      <!-- 2. Preparar a planilha -->
      <section :id="'help-prepare'" class="mr-card p-3">
        <h2 class="h5">{{ t('help.prepare.title') }}</h2>
        <p>{{ t('help.prepare.intro') }}</p>
        <ul class="mb-0">
          <li v-for="k in keys('help.prepare.items')" :key="k">{{ t(`help.prepare.items.${k}`) }}</li>
        </ul>
      </section>

      <!-- 3. Importar -->
      <section :id="'help-upload'" class="mr-card p-3">
        <h2 class="h5">{{ t('help.upload.title') }}</h2>
        <ol class="mb-3">
          <li v-for="k in keys('help.upload.steps')" :key="k">{{ t(`help.upload.steps.${k}`) }}</li>
        </ol>
        <RouterLink :to="{ name: 'seller-packages' }" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-box-seam"></i> {{ t('help.upload.goToPackages') }}
        </RouterLink>
      </section>

      <!-- Campos -->
      <section :id="'help-fields'" class="mr-card p-3">
        <h2 class="h5">{{ t('help.fields.title') }}</h2>
        <div class="table-responsive">
          <table class="table table-sm small align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t('help.fields.colField') }}</th>
                <th>{{ t('help.fields.colRequired') }}</th>
                <th>{{ t('help.fields.colNotes') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fd in FIELDS" :key="fd.key">
                <td class="text-nowrap fw-medium">{{ t(`lines.${fd.key}`) }}</td>
                <td>{{ fd.required ? t('help.fields.yes') : t('help.fields.no') }}</td>
                <td>{{ t(`help.fields.notes.${fd.key}`) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="small text-secondary mb-0">{{ t('help.fields.discarded') }}</p>
      </section>

      <!-- 4. Depois -->
      <section :id="'help-after'" class="mr-card p-3">
        <h2 class="h5">{{ t('help.after.title') }}</h2>
        <ul class="mb-0">
          <li v-for="k in keys('help.after.items')" :key="k">{{ t(`help.after.items.${k}`) }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import HelpTabs from '../../components/seller/HelpTabs.vue'

const { t, tm } = useI18n()

const SECTIONS = ['export', 'prepare', 'upload', 'fields', 'after']

// Mesmos campos e obrigatoriedade do assistente de importação (ImportWizard.vue).
const FIELDS = [
  { key: 'itemNo', required: true },
  { key: 'description', required: true },
  { key: 'quantity', required: true },
  { key: 'unit', required: true },
  { key: 'storCode' },
  { key: 'tag' },
  { key: 'warehouseLocation' }
]

// Chaves de um grupo de mensagens (passos, itens), na ordem em que estão em en.js/pt.js.
const keys = (path) => Object.keys(tm(path) || {})
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
