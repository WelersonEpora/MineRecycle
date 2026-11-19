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

      <!-- 1. A planilha -->
      <section id="help-sheet" class="mr-card p-3">
        <h2 class="h5">{{ t('help.sheet.title') }}</h2>
        <p>{{ t('help.sheet.intro') }}</p>
        <ul class="mb-0">
          <li v-for="k in keys('help.sheet.items')" :key="k">{{ t(`help.sheet.items.${k}`) }}</li>
        </ul>
      </section>

      <!-- Colunas lidas -->
      <section id="help-fields" class="mr-card p-3">
        <h2 class="h5">{{ t('help.fields.title') }}</h2>
        <div class="table-responsive">
          <table class="table table-sm small align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t('help.fields.colColumn') }}</th>
                <th>{{ t('help.fields.colField') }}</th>
                <th>{{ t('help.fields.colNotes') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in COLUMNS" :key="c.key">
                <td class="text-nowrap mr-mono">{{ c.column }}</td>
                <td class="text-nowrap fw-medium">{{ t(`lots.${c.label}`) }}</td>
                <td>{{ t(`help.fields.notes.${c.key}`) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="small text-secondary mb-0">{{ t('help.fields.discarded') }}</p>
      </section>

      <!-- 2. Importar -->
      <section id="help-upload" class="mr-card p-3">
        <h2 class="h5">{{ t('help.upload.title') }}</h2>
        <ol class="mb-3">
          <li v-for="k in keys('help.upload.steps')" :key="k">{{ t(`help.upload.steps.${k}`) }}</li>
        </ol>
        <RouterLink :to="{ name: 'seller-lots' }" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-list-ul"></i> {{ t('help.upload.goToLots') }}
        </RouterLink>
      </section>

      <!-- 3. Importar de novo -->
      <section id="help-after" class="mr-card p-3">
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

const SECTIONS = ['sheet', 'fields', 'upload', 'after']

// Colunas da aba "Matriz de lotes", com o nome como está na planilha do cliente (não traduzido). Mesma lista do
// leitor do backend (LOT_COLUMNS em backend/src/import/lot-sheet.js).
const COLUMNS = [
  { key: 'lotNumber', column: 'Lot Number', label: 'lotNumber' },
  { key: 'siteName', column: 'Site Name', label: 'site' },
  { key: 'title', column: 'Title / Equipment Description', label: 'title' },
  { key: 'masterSupplier', column: 'Master Supplier', label: 'supplier' },
  { key: 'linkedSystem', column: 'Equipamento ou sistema vinculado', label: 'linkedSystem' },
  { key: 'commercialFamily', column: 'Família comercial', label: 'family' },
  { key: 'subfamily', column: 'Subfamília', label: 'subfamily' },
  { key: 'status', column: 'STATUS', label: 'status' }
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
