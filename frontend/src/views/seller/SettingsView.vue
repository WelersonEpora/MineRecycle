<template>
  <!-- Contato comercial da equipe: aparece na página de cada pacote, ao lado do formulário de pedido. Só admin altera. -->
  <section class="mr-card p-3 mb-4" style="max-width: 820px">
    <h2 class="h6 mb-1">{{ t('contact.title') }}</h2>
    <p class="small text-secondary">{{ t('contact.help') }}</p>
    <p v-if="!isAdmin" class="small text-secondary"><i class="bi bi-lock"></i> {{ t('contact.adminOnly') }}</p>
    <form class="row g-3" @submit.prevent="saveContact">
      <div class="col-sm-6">
        <label class="form-label small" for="mr-contact-email">{{ t('contact.email') }}</label>
        <input id="mr-contact-email" v-model="contact.email" type="email" class="form-control" maxlength="255" :disabled="!isAdmin" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-contact-whatsapp">{{ t('contact.whatsapp') }}</label>
        <input id="mr-contact-whatsapp" v-model="contact.whatsapp" type="tel" class="form-control" maxlength="40" :disabled="!isAdmin" placeholder="+55 11 98765-4321" />
        <div class="form-text">{{ t('contact.whatsappHint') }}</div>
      </div>
      <div v-if="contact.error" class="col-12"><div class="alert alert-danger py-2 small mb-0">{{ contact.error }}</div></div>
      <div v-if="isAdmin" class="col-12">
        <button class="btn btn-accent btn-sm" type="submit" :disabled="contact.busy">{{ t('common.save') }}</button>
      </div>
    </form>
  </section>

  <section v-if="SHOW_ORIGIN" class="mr-card p-3" style="max-width: 820px">
    <div class="d-flex align-items-start gap-2 mb-2">
      <div class="flex-grow-1">
        <h2 class="h6 mb-1">{{ t('origins.title') }}</h2>
        <p class="small text-secondary mb-0">{{ t('origins.help') }}</p>
      </div>
      <button v-if="isAdmin" class="btn btn-accent btn-sm" @click="openForm(null)"><i class="bi bi-plus-lg"></i> {{ t('origins.new') }}</button>
    </div>
    <p v-if="!isAdmin" class="small text-secondary"><i class="bi bi-lock"></i> {{ t('origins.adminOnly') }}</p>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <DataTableCard :paginated="false" :empty="!origins.length" :empty-text="t('common.none')">
      <template #head>
          <tr>
            <th>{{ t('origins.name') }}</th>
            <th>{{ t('origins.code') }}</th>
            <th>{{ t('origins.active') }}</th>
            <th class="mr-num">{{ t('origins.packages') }}</th>
            <th v-if="isAdmin"></th>
          </tr>
      </template>
          <tr v-for="o in origins" :key="o.id" :class="{ 'text-secondary': !o.active }">
            <td>{{ o.name }}</td>
            <td class="mr-mono">{{ o.code }}</td>
            <td>{{ o.active ? t('common.yes') : t('common.no') }}</td>
            <td class="mr-num">{{ o.packageCount }}</td>
            <td v-if="isAdmin" class="text-end">
              <button class="btn btn-sm btn-link" :title="t('common.edit')" @click="openForm(o)"><i class="bi bi-pencil"></i></button>
            </td>
          </tr>
    </DataTableCard>
  </section>

  <!-- Limpeza geral (decisão de 2026-11-19): só admin. Apaga todos os dados de negócio; ficam usuários, contato e origens. -->
  <section v-if="isAdmin" class="mr-card p-3 mt-4 border border-2 border-danger" style="max-width: 820px">
    <div class="d-flex align-items-start gap-3 flex-wrap">
      <div class="flex-grow-1" style="min-width: 240px">
        <h2 class="h6 mb-1 text-danger"><i class="bi bi-exclamation-octagon-fill"></i> {{ t('reset.title') }}</h2>
        <p class="small text-secondary mb-1">{{ t('reset.help') }}</p>
        <p v-if="reset.last" class="small text-secondary mb-0">{{ t('reset.last', { date: f.dateTime(reset.last.at), name: reset.last.userName }) }}</p>
      </div>
      <button class="btn btn-outline-danger btn-sm" @click="openReset"><i class="bi bi-trash3"></i> {{ t('reset.open') }}</button>
    </div>
  </section>

  <ModalDialog :show="reset.show" persistent scrollable :title="t('reset.modalTitle')" @update:show="closeReset">
    <div class="alert alert-danger text-center mb-3">
      <div class="display-6 mb-2"><i class="bi bi-exclamation-triangle-fill"></i></div>
      <div class="fs-4 fw-bold">{{ t('reset.warningTitle') }}</div>
      <div class="mt-2">{{ t('reset.warningText') }}</div>
    </div>
    <p class="small fw-medium mb-1">{{ t('reset.willDelete') }}</p>
    <ul v-if="reset.counts" class="small mb-2">
      <li>{{ t('reset.lots') }}: <strong>{{ f.num(reset.counts.lots) }}</strong></li>
      <li>{{ t('reset.packages') }}: <strong>{{ f.num(reset.counts.packages) }}</strong></li>
      <li>{{ t('reset.attachments') }}: <strong>{{ f.num(reset.counts.attachments) }}</strong> ({{ f.bytes(reset.counts.attachmentBytes) }})</li>
      <li>{{ t('reset.inquiries') }}: <strong>{{ f.num(reset.counts.inquiries) }}</strong></li>
      <li>{{ t('reset.accessLinks') }}: <strong>{{ f.num(reset.counts.accessLinks) }}</strong></li>
    </ul>
    <p class="small text-secondary">{{ t('reset.kept') }}</p>
    <div class="alert alert-light border small d-flex align-items-center gap-2 flex-wrap">
      <span class="flex-grow-1">{{ t('reset.exportFirst') }}</span>
      <a class="btn btn-outline-secondary btn-sm" :href="api.lotExportUrl(locale)"><i class="bi bi-download"></i> {{ t('reset.exportLots') }}</a>
    </div>
    <form id="mr-reset-form" class="row g-3" autocomplete="off" @submit.prevent="runReset">
      <div class="col-sm-6">
        <label class="form-label small" for="mr-reset-phrase">
          <i18n-t keypath="reset.phraseLabel" tag="span"><template #phrase><strong class="mr-mono">{{ t('reset.phrase') }}</strong></template></i18n-t>
        </label>
        <input id="mr-reset-phrase" v-model="reset.phrase" class="form-control" autocomplete="off" spellcheck="false" :disabled="reset.busy" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-reset-password">{{ t('reset.passwordLabel') }}</label>
        <input id="mr-reset-password" v-model="reset.password" type="password" class="form-control" autocomplete="current-password" :disabled="reset.busy" />
      </div>
    </form>
    <div v-if="reset.error" class="alert alert-danger py-2 small mt-3 mb-0">{{ reset.error }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" :disabled="reset.busy" @click="closeReset(false)">{{ t('common.cancel') }}</button>
      <button class="btn btn-danger btn-sm" type="submit" form="mr-reset-form" :disabled="!canReset">
        <span v-if="reset.busy" class="spinner-border spinner-border-sm me-1"></span>
        {{ reset.busy ? t('reset.busy') : t('reset.confirm') }}
      </button>
    </template>
  </ModalDialog>

  <ModalDialog v-model:show="form.show" size="sm" :title="form.id ? t('origins.edit') : t('origins.new')">
    <form id="mr-origin-form" class="row g-3" @submit.prevent="save">
      <div class="col-12">
        <label class="form-label small" for="mr-origin-name">{{ t('origins.name') }}</label>
        <input id="mr-origin-name" v-model="form.name" class="form-control" maxlength="120" required />
      </div>
      <div class="col-6">
        <label class="form-label small" for="mr-origin-code">{{ t('origins.code') }}</label>
        <input id="mr-origin-code" v-model="form.code" class="form-control mr-mono text-uppercase" maxlength="10" required />
        <div class="form-text">{{ t('origins.codeHint') }}</div>
      </div>
      <div v-if="form.id" class="col-6 d-flex align-items-center">
        <div class="form-check">
          <input id="mr-origin-active" v-model="form.active" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="mr-origin-active">{{ t('origins.active') }}</label>
        </div>
      </div>
      <div class="col-12 form-text mt-0">{{ t('origins.inactiveHint') }}</div>
    </form>
    <div v-if="form.error" class="alert alert-danger py-2 small mt-3 mb-0">{{ form.error }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="form.show = false">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" type="submit" form="mr-origin-form" :disabled="form.busy">{{ t('common.save') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../../composables/useFormat.js'
import { useSession } from '../../stores/session.js'
import { notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import DataTableCard from '../../components/table/DataTableCard.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import { SHOW_ORIGIN } from '../../utils/features.js'

// Configuração: contato comercial (e-mail e WhatsApp da equipe) e cadastro de origens dos pacotes (de onde vieram os ativos). Todos veem; só admin inclui e edita.
// O catálogo não tem mais configuração: regra fixa (ativos; em negociação com a caixa marcada; vendidos nunca).
const f = useFormat()
const t = f.t
const session = useSession()
const isAdmin = computed(() => session.state.user?.role === 'admin')
const origins = ref([])
const error = ref('')
const contact = reactive({ email: '', whatsapp: '', error: '', busy: false })
const form = reactive({ show: false, id: null, name: '', code: '', active: true, error: '', busy: false })
const { locale } = useI18n()
const reset = reactive({ show: false, counts: null, last: null, phrase: '', password: '', error: '', busy: false })
// O botão só libera com a frase exata do idioma da tela e a senha preenchida (o backend confere as duas de novo).
const canReset = computed(() => !reset.busy && reset.phrase.trim() === t('reset.phrase') && reset.password.length > 0)

async function loadReset() {
  try {
    const r = await api.dataReset()
    reset.counts = r.counts
    reset.last = r.lastReset
  } catch (err) {
    reset.error = f.errorMessage(err)
  }
}

async function openReset() {
  Object.assign(reset, { show: true, phrase: '', password: '', error: '', counts: null })
  await loadReset()
}

// Enquanto apaga, nada fecha o modal.
function closeReset(value) {
  if (value === false && !reset.busy) Object.assign(reset, { show: false, phrase: '', password: '' })
}

async function runReset() {
  if (!canReset.value) return
  reset.busy = true
  reset.error = ''
  try {
    const r = await api.runDataReset({ confirm: reset.phrase, password: reset.password })
    Object.assign(reset, { show: false, phrase: '', password: '' })
    notify(r.filesRemoved ? t('reset.done') : t('reset.filesPending'))
    await loadReset()
  } catch (err) {
    reset.error = f.errorMessage(err)
  } finally {
    reset.busy = false
  }
}

async function loadContact() {
  try {
    const c = await api.contact()
    Object.assign(contact, { email: c.email || '', whatsapp: c.whatsapp ? `+${c.whatsapp}` : '' })
  } catch (err) {
    contact.error = f.errorMessage(err)
  }
}

async function saveContact() {
  contact.busy = true
  contact.error = ''
  try {
    const c = await api.setContact({ email: contact.email, whatsapp: contact.whatsapp })
    Object.assign(contact, { email: c.email || '', whatsapp: c.whatsapp ? `+${c.whatsapp}` : '' })
    notify(t('contact.saved'))
  } catch (err) {
    contact.error = f.errorMessage(err)
  } finally {
    contact.busy = false
  }
}

async function load() {
  try {
    origins.value = await api.origins()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

function openForm(o) {
  Object.assign(form, { show: true, id: o?.id || null, name: o?.name || '', code: o?.code || '', active: o ? o.active : true, error: '' })
}

async function save() {
  form.busy = true
  form.error = ''
  try {
    const body = { name: form.name, code: form.code.trim().toUpperCase() }
    if (form.id) await api.updateOrigin(form.id, { ...body, active: form.active })
    else await api.createOrigin(body)
    form.show = false
    notify(t('origins.saved'))
    await load()
  } catch (err) {
    form.error = f.errorMessage(err)
  } finally {
    form.busy = false
  }
}

onMounted(() => {
  if (SHOW_ORIGIN) load()
  loadContact()
  if (isAdmin.value) loadReset()
})
</script>
