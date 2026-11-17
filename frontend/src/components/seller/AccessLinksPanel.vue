<template>
  <div>
    <div class="d-flex mb-3">
      <button class="btn btn-accent btn-sm ms-auto" :disabled="packageId && !packageShareable" @click="openCreate">
        <i class="bi bi-link-45deg"></i> {{ packageId ? t('links.newForPackage') : t('links.new') }}
      </button>
    </div>
    <p v-if="packageId && !packageShareable" class="small text-secondary text-end">{{ t('links.noEligible') }}</p>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <p v-if="!loading && !links.length" class="text-secondary">{{ t('links.empty') }}</p>
    <div v-else class="table-responsive mr-card">
      <table class="table table-sm align-middle mb-0">
        <thead class="table-light small">
          <tr>
            <th>{{ t('links.label') }}</th>
            <th>{{ t('links.packages') }}</th>
            <th>{{ t('links.expiresAt') }}</th>
            <th>{{ t('links.state') }}</th>
            <th class="mr-num">{{ t('links.accesses') }}</th>
            <th>{{ t('links.lastAccess') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in links" :key="l.id">
            <td>
              <div class="fw-medium">{{ l.label }}</div>
              <div class="small text-secondary">
                {{ l.buyerEmail }}<span v-if="l.createdBy"> · {{ t('links.createdBy', { name: l.createdBy.name }) }}</span>
              </div>
            </td>
            <td class="small">
              <span v-for="p in l.packages" :key="p.id" class="badge text-bg-light border me-1" :title="p.storFolder || ''">{{ p.name }}</span>
            </td>
            <td class="small text-nowrap">{{ f.dateTime(l.expiresAt) }}</td>
            <td>
              <span class="badge" :class="{ 'text-bg-success': l.state === 'valid', 'text-bg-secondary': l.state === 'expired', 'text-bg-danger': l.state === 'revoked' }">
                {{ t(`enums.linkState.${l.state}`) }}
              </span>
            </td>
            <td class="mr-num">{{ l.accessCount }}</td>
            <td class="small text-nowrap">{{ f.dateTime(l.lastAccessAt) }}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-link" :title="t('links.logs')" @click="openLogs(l)"><i class="bi bi-list-ul"></i></button>
              <button v-if="l.state !== 'revoked'" class="btn btn-sm btn-link" :title="t('common.edit')" @click="openEdit(l)"><i class="bi bi-pencil"></i></button>
              <button v-if="l.state === 'valid'" class="btn btn-sm btn-link text-danger" :title="t('links.revoke')" @click="revoke(l)"><i class="bi bi-x-octagon"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Criar / editar -->
    <ModalDialog v-model:show="form.show" :title="form.id ? t('links.edit') : t('links.new')" size="lg">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label small">{{ t('links.label') }}</label>
          <input v-model="form.label" class="form-control" maxlength="200" />
        </div>
        <div class="col-md-6">
          <label class="form-label small">{{ t('links.buyerEmail') }} <span class="text-secondary">({{ t('common.optional') }})</span></label>
          <input v-model="form.buyerEmail" type="email" class="form-control" maxlength="255" />
        </div>
        <div class="col-md-4">
          <label class="form-label small">{{ t('links.expiresAt') }}</label>
          <input v-model="form.expiresDate" type="date" class="form-control" :min="minDate" :max="maxDate" />
        </div>
        <div class="col-md-8">
          <label class="form-label small">{{ t('links.note') }} <span class="text-secondary">({{ t('common.optional') }})</span></label>
          <input v-model="form.note" class="form-control" maxlength="4000" />
        </div>
        <div class="col-12">
          <label class="form-label small">{{ t('links.packages') }}</label>
          <div class="border rounded p-2" style="max-height: 260px; overflow-y: auto">
            <div v-for="p in shareable" :key="p.id" class="form-check">
              <input :id="`mr-lp-${p.id}`" v-model="form.packageIds" class="form-check-input" type="checkbox" :value="p.id" />
              <label class="form-check-label small" :for="`mr-lp-${p.id}`">
                {{ p.name }} <span v-if="p.storFolder" class="text-secondary mr-mono">({{ p.storFolder }})</span> <StatusBadge :status="p.status" />
              </label>
            </div>
          </div>
          <div class="form-text">{{ t('links.noEligible') }}</div>
        </div>
      </div>
      <div v-if="form.error" class="alert alert-danger py-2 small mt-3 mb-0">{{ form.error }}</div>
      <template #footer>
        <button class="btn btn-outline-secondary btn-sm" @click="form.show = false">{{ t('common.cancel') }}</button>
        <button class="btn btn-accent btn-sm" :disabled="form.busy" @click="save">{{ form.id ? t('common.save') : t('common.create') }}</button>
      </template>
    </ModalDialog>

    <!-- URL do link recém-criado: aparece uma vez -->
    <ModalDialog v-model:show="created.show" :title="t('links.createdTitle')">
      <p class="small">{{ t('links.createdInfo') }}</p>
      <div class="input-group">
        <input class="form-control mr-mono" :value="created.url" readonly @focus="$event.target.select()" />
        <button class="btn btn-accent" @click="copy">{{ created.copied ? t('common.copied') : t('common.copy') }}</button>
      </div>
    </ModalDialog>

    <!-- Registro de acessos -->
    <ModalDialog v-model:show="logs.show" :title="`${t('links.logs')} · ${logs.label}`" size="lg">
      <p v-if="!logs.items.length" class="text-secondary small">{{ t('links.noLogs') }}</p>
      <div v-else class="table-responsive" style="max-height: 60vh">
        <table class="table table-sm small mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ t('links.when') }}</th>
              <th>{{ t('links.what') }}</th>
              <th>{{ t('links.from') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in logs.items" :key="e.id">
              <td class="text-nowrap">{{ f.dateTime(e.at) }}</td>
              <td>
                {{ t(`enums.action.${e.action}`) }}
                <span v-if="e.package" class="text-secondary">· {{ e.package.name }}</span>
                <span v-if="e.attachment" class="text-secondary">· {{ e.attachment.title }}</span>
              </td>
              <td class="text-secondary text-truncate" style="max-width: 260px" :title="e.userAgent">{{ e.ip }} · {{ e.userAgent }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { confirmDialog } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import { dateInputValue, endOfDayIso } from '../../utils/format.js'
import ModalDialog from '../ModalDialog.vue'
import StatusBadge from '../StatusBadge.vue'

const props = defineProps({
  packageId: { type: String, default: null },
  packageStatus: { type: String, default: null }
})
const f = useFormat()
const t = f.t

const HIDDEN = ['draft', 'inactive']
const links = ref([])
const packages = ref([])
const loading = ref(true)
const error = ref('')
const form = reactive({ show: false, id: null, label: '', buyerEmail: '', note: '', expiresDate: '', packageIds: [], error: '', busy: false })
const created = reactive({ show: false, url: '', copied: false })
const logs = reactive({ show: false, label: '', items: [] })

const minDate = dateInputValue(1)
const maxDate = dateInputValue(364)
const shareable = computed(() => packages.value.filter((p) => !HIDDEN.includes(p.status)))
const packageShareable = computed(() => !HIDDEN.includes(props.packageStatus))

async function load() {
  loading.value = true
  try {
    links.value = await api.accessLinks(props.packageId ? { packageId: props.packageId } : {})
    packages.value = await api.sellerPackages()
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(form, {
    show: true,
    id: null,
    label: '',
    buyerEmail: '',
    note: '',
    expiresDate: dateInputValue(30),
    packageIds: props.packageId ? [props.packageId] : [],
    error: ''
  })
}

function openEdit(l) {
  const d = new Date(l.expiresAt)
  const pad = (x) => String(x).padStart(2, '0')
  Object.assign(form, {
    show: true,
    id: l.id,
    label: l.label,
    buyerEmail: l.buyerEmail || '',
    note: l.note || '',
    expiresDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    packageIds: l.packages.map((p) => p.id),
    error: ''
  })
}

async function save() {
  form.busy = true
  form.error = ''
  const body = {
    label: form.label,
    buyerEmail: form.buyerEmail,
    note: form.note,
    expiresAt: endOfDayIso(form.expiresDate),
    packageIds: form.packageIds
  }
  try {
    if (form.id) {
      await api.updateAccessLink(form.id, body)
    } else {
      const r = await api.createAccessLink(body)
      Object.assign(created, { show: true, url: r.url, copied: false })
    }
    form.show = false
    await load()
  } catch (err) {
    form.error = f.errorMessage(err)
  } finally {
    form.busy = false
  }
}

async function revoke(l) {
  const ok = await confirmDialog({ title: t('links.revokeTitle'), message: t('links.revokeConfirm', { label: l.label }), confirmLabel: t('links.revoke') })
  if (!ok) return
  try {
    await api.revokeAccessLink(l.id)
    await load()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

async function openLogs(l) {
  Object.assign(logs, { show: true, label: l.label, items: [] })
  logs.items = await api.accessLinkLogs(l.id)
}

async function copy() {
  try {
    await navigator.clipboard.writeText(created.url)
    created.copied = true
  } catch (_err) {
    created.copied = false
  }
}

onMounted(load)
</script>
