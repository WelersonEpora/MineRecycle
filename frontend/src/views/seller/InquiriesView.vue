<template>
  <!-- Pedidos de informação dos compradores (decisão de 2026-11-17): a equipe assume, muda a situação e anota. -->
  <div class="d-flex flex-wrap align-items-end gap-3 mb-3">
    <div class="flex-grow-1">
      <h1 class="h5 mb-1">{{ t('inquiries.title') }}</h1>
      <p class="small text-secondary mb-0">{{ t('inquiries.help') }}</p>
    </div>
  </div>

  <div class="d-flex flex-wrap align-items-center gap-3 mb-3">
    <ChipGroup id="inq-status" v-model="filters.status" :label="t('inquiries.status')" :all-label="t('common.all')" :all-count="totalAll" :options="statusOptions" />
    <div class="d-flex align-items-center gap-2">
      <label class="small text-secondary" for="mr-inq-assignee">{{ t('inquiries.assignee') }}</label>
      <select id="mr-inq-assignee" v-model="filters.assignee" class="form-select form-select-sm" style="width: auto">
        <option value="">{{ t('common.all') }}</option>
        <option value="me">{{ t('inquiries.mine') }}</option>
        <option value="none">{{ t('inquiries.unassigned') }}</option>
        <option v-for="u in team" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </div>
    <input v-model="searchText" type="search" class="form-control form-control-sm" style="max-width: 260px" :placeholder="t('inquiries.search')" :aria-label="t('common.search')" />
  </div>

  <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
  <p v-if="loading && !items.length" class="text-secondary">{{ t('common.loading') }}</p>
  <p v-else-if="!items.length" class="text-secondary">{{ t('inquiries.empty') }}</p>

  <div class="d-flex flex-column gap-3">
    <article v-for="i in items" :key="i.id" class="mr-card p-3" :class="{ 'mr-inq-new': i.status === 'new' }">
      <div class="d-flex flex-wrap align-items-start gap-2 mb-2">
        <div class="flex-grow-1">
          <div class="fw-semibold">
            <RouterLink v-if="i.package.id" :to="{ name: 'seller-package', params: { id: i.package.id } }">{{ i.package.name }}</RouterLink>
            <span v-else>{{ i.package.name }} <span class="small text-secondary">({{ t('inquiries.packageDeleted') }})</span></span>
          </div>
          <div class="small text-secondary">
            {{ f.dateTime(i.createdAt) }}
            <span v-if="i.link"> · <i class="bi bi-key"></i> {{ t('inquiries.viaLink', { label: i.link.label }) }}</span>
            <span> · {{ t('inquiries.language', { lang: i.language.toUpperCase() }) }}</span>
          </div>
        </div>
        <span class="badge rounded-pill" :class="statusClass(i.status)">{{ t(`inquiries.statuses.${i.status}`) }}</span>
      </div>

      <div class="row g-3">
        <div class="col-md-5">
          <dl class="small mb-0 mr-inq-contact">
            <template v-if="i.name"><dt>{{ t('inquiry.fields.name') }}</dt><dd>{{ i.name }}</dd></template>
            <template v-if="i.company"><dt>{{ t('inquiry.fields.company') }}</dt><dd>{{ i.company }}</dd></template>
            <template v-if="i.email"><dt>{{ t('inquiry.fields.email') }}</dt><dd><a :href="mailtoUrl(i.email, t('inquiries.replySubject', { name: i.package.name }))">{{ i.email }}</a></dd></template>
            <template v-if="i.phone">
              <dt>{{ t('inquiry.fields.phone') }}</dt>
              <dd>
                <a :href="telUrl(i.phone)">{{ i.phone }}</a>
                <a class="ms-2" :href="whatsappUrl(i.phone)" target="_blank" rel="noopener" :title="t('inquiry.whatsapp')"><i class="bi bi-whatsapp"></i></a>
              </dd>
            </template>
            <template v-if="i.country"><dt>{{ t('inquiry.fields.country') }}</dt><dd>{{ i.country }}</dd></template>
          </dl>
        </div>
        <div class="col-md-7">
          <div class="small text-secondary mb-1">{{ t('inquiry.fields.message') }}</div>
          <p v-if="i.message" class="mb-0 mr-inq-message">{{ i.message }}</p>
          <p v-else class="mb-0 text-secondary fst-italic small">{{ t('inquiries.noMessage') }}</p>
        </div>
      </div>

      <div v-if="i.note" class="alert alert-light border small py-2 mt-3 mb-0">
        <i class="bi bi-sticky"></i> <span class="mr-inq-message">{{ i.note }}</span>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2 border-top pt-2 mt-3">
        <button v-if="i.assignee?.id !== myId" class="btn btn-accent btn-sm" :disabled="busyId === i.id" @click="patch(i, { assignedTo: 'me' })">
          <i class="bi bi-person-check"></i> {{ t('inquiries.take') }}
        </button>
        <label class="small text-secondary" :for="`mr-inq-a-${i.id}`">{{ t('inquiries.assignee') }}</label>
        <select :id="`mr-inq-a-${i.id}`" class="form-select form-select-sm" style="width: auto" :value="i.assignee?.id || ''" :disabled="busyId === i.id" @change="patch(i, { assignedTo: $event.target.value || null })">
          <option value="">{{ t('inquiries.unassigned') }}</option>
          <option v-for="u in team" :key="u.id" :value="u.id">{{ u.name }}</option>
          <option v-if="i.assignee && !team.some((u) => u.id === i.assignee.id)" :value="i.assignee.id">{{ i.assignee.name }}</option>
        </select>
        <label class="small text-secondary" :for="`mr-inq-s-${i.id}`">{{ t('inquiries.status') }}</label>
        <select :id="`mr-inq-s-${i.id}`" class="form-select form-select-sm" style="width: auto" :value="i.status" :disabled="busyId === i.id" @change="patch(i, { status: $event.target.value })">
          <option v-for="s in STATUSES" :key="s" :value="s">{{ t(`inquiries.statuses.${s}`) }}</option>
        </select>
        <button class="btn btn-outline-secondary btn-sm" @click="openNote(i)"><i class="bi bi-sticky"></i> {{ t('inquiries.note') }}</button>
        <span class="small text-secondary ms-auto">
          <template v-if="i.updatedBy">{{ t('inquiries.lastChange', { name: i.updatedBy.name, date: f.dateTime(i.updatedAt) }) }}</template>
        </span>
        <button class="btn btn-sm btn-link text-danger" :title="t('common.delete')" @click="remove(i)"><i class="bi bi-trash"></i></button>
      </div>
    </article>
  </div>

  <div class="mt-3">
    <PagerNav v-model:page="page" :page-size="pageSize" :total="total" />
  </div>

  <ModalDialog v-model:show="note.show" size="sm" :title="t('inquiries.note')">
    <label class="form-label small" for="mr-inq-note">{{ t('inquiries.noteHint') }}</label>
    <textarea id="mr-inq-note" v-model="note.text" class="form-control" rows="5" maxlength="4000"></textarea>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="note.show = false">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="note.busy" @click="saveNote">{{ t('common.save') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { useSession } from '../../stores/session.js'
import { confirmDialog, notify } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import { mailtoUrl, telUrl, whatsappUrl } from '../../utils/contact.js'
import ChipGroup from '../../components/ChipGroup.vue'
import PagerNav from '../../components/PagerNav.vue'
import ModalDialog from '../../components/ModalDialog.vue'

const STATUSES = ['new', 'in_progress', 'done', 'discarded']

const f = useFormat()
const t = f.t
const session = useSession()
const refreshInquiryCount = inject('refreshInquiryCount', () => {})
const myId = computed(() => session.state.user?.id)

const items = ref([])
const team = ref([])
const counts = ref({})
const total = ref(0)
const page = ref(1)
const pageSize = 25
const loading = ref(false)
const error = ref('')
const busyId = ref(null)
// Abre em "em aberto" (novo + em atendimento): é o que a equipe precisa ver primeiro.
const filters = reactive({ status: 'open', assignee: '' })
const searchText = ref('')
const note = reactive({ show: false, id: null, text: '', busy: false })

const totalAll = computed(() => STATUSES.reduce((n, s) => n + (counts.value[s] || 0), 0))
const statusOptions = computed(() => [
  { value: 'open', label: t('inquiries.open'), count: (counts.value.new || 0) + (counts.value.in_progress || 0) },
  ...STATUSES.map((s) => ({ value: s, label: t(`inquiries.statuses.${s}`), count: counts.value[s] || 0 }))
])

function statusClass(s) {
  return { new: 'text-bg-danger', in_progress: 'text-bg-warning', done: 'text-bg-success', discarded: 'text-bg-secondary' }[s]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await api.inquiries({ ...filters, q: searchText.value.trim() || undefined, page: page.value, pageSize })
    items.value = r.items
    team.value = r.team
    counts.value = r.counts
    total.value = r.total
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    loading.value = false
  }
}

async function patch(i, body) {
  busyId.value = i.id
  try {
    Object.assign(i, await api.updateInquiry(i.id, body))
    refreshInquiryCount()
    // Atualiza as contagens dos chips; o cartão fica na tela até a próxima busca, para não sumir debaixo do mouse.
    counts.value = await api.inquiryCounts()
  } catch (err) {
    notify(f.errorMessage(err), 'danger')
    await load()
  } finally {
    busyId.value = null
  }
}

function openNote(i) {
  Object.assign(note, { show: true, id: i.id, text: i.note || '', busy: false })
}

async function saveNote() {
  const i = items.value.find((x) => x.id === note.id)
  note.busy = true
  await patch(i, { note: note.text })
  note.busy = false
  note.show = false
}

async function remove(i) {
  const ok = await confirmDialog({
    title: t('inquiries.deleteTitle'),
    message: t('inquiries.deleteConfirm', { name: i.name || i.email || i.phone }),
    confirmLabel: t('common.delete')
  })
  if (!ok) return
  try {
    await api.deleteInquiry(i.id)
    notify(t('inquiries.deleted'))
    refreshInquiryCount()
    await load()
  } catch (err) {
    notify(f.errorMessage(err), 'danger')
  }
}

let searchTimer = null
watch(searchText, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch(filters, () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)
</script>

<style scoped>
.mr-inq-new {
  border-left: 4px solid var(--bs-danger);
}
.mr-inq-message {
  white-space: pre-line;
}
.mr-inq-contact {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 0.75rem;
  row-gap: 0.15rem;
}
.mr-inq-contact dt {
  font-weight: normal;
  color: var(--mr-muted);
}
.mr-inq-contact dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
