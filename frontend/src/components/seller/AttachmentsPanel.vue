<template>
  <div>
    <form class="mr-card p-3 mb-4" @submit.prevent="upload">
      <div class="row g-3 align-items-end">
        <div class="col-md-2">
          <label class="form-label small">{{ t('attachments.kind') }}</label>
          <select v-model="kind" class="form-select form-select-sm">
            <option v-for="k in KINDS" :key="k" :value="k">{{ f.kindLabel(k) }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small">{{ t('attachments.visibility') }}</label>
          <select v-model="visibility" class="form-select form-select-sm" :disabled="kind === 'proposal'">
            <option value="public">{{ t('enums.visibility.public') }}</option>
            <option value="restricted">{{ t('enums.visibility.restricted') }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small">{{ t('attachments.line') }}</label>
          <select v-model="lineId" class="form-select form-select-sm">
            <option value="">{{ t('attachments.packageLevel') }}</option>
            <option v-for="l in lines" :key="l.id" :value="l.id">{{ l.itemNo }} — {{ l.description.slice(0, 60) }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small">{{ t('attachments.titleSingleOnly') }}</label>
          <input v-model="title" class="form-control form-control-sm" maxlength="200" :disabled="files.length > 1" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-accent btn-sm w-100" :disabled="!files.length || busy">
            <i class="bi bi-upload"></i> {{ busy ? t('attachments.uploading', { percent: progress }) : t('attachments.upload') }}
          </button>
        </div>
        <div class="col-12">
          <input
            ref="fileInput"
            type="file"
            multiple
            class="form-control form-control-sm"
            :accept="kind === 'photo' ? 'image/jpeg,image/png,image/webp,image/tiff,image/gif' : undefined"
            @change="files = [...$event.target.files]"
          />
          <div class="form-text">
            <span v-if="kind === 'proposal'">{{ t('attachments.proposalRestricted') }}</span>
            <span v-else-if="kind === 'photo'">{{ t('attachments.publicPhotoNote') }}</span>
          </div>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">{{ error }}</div>
    </form>

    <p v-if="!items.length" class="text-secondary">{{ t('attachments.empty') }}</p>

    <template v-if="photos.length">
      <h3 class="h6">{{ t('attachments.photos') }} ({{ photos.length }})</h3>
      <div class="row g-3 mb-4">
        <div v-for="(p, i) in photos" :key="p.id" class="col-6 col-md-4 col-lg-3">
          <div class="mr-card overflow-hidden h-100 d-flex flex-column">
            <a :href="p.url" target="_blank" rel="noopener"><img :src="p.thumbUrl" class="mr-cover" alt="" loading="lazy" /></a>
            <div class="p-2 small d-flex flex-column gap-1 flex-grow-1">
              <input :value="p.title" class="form-control form-control-sm" :placeholder="t('attachments.title')" @change="patch(p, { title: $event.target.value })" />
              <select :value="p.lineId || ''" class="form-select form-select-sm" @change="patch(p, { lineId: $event.target.value || null })">
                <option value="">{{ t('attachments.packageLevel') }}</option>
                <option v-for="l in lines" :key="l.id" :value="l.id">{{ l.itemNo }}</option>
              </select>
              <div class="d-flex align-items-center gap-1 mt-auto">
                <VisibilityToggle :att="p" @toggle="toggleVisibility(p)" />
                <button class="btn btn-sm btn-link px-1 ms-auto" :title="t('attachments.moveUp')" :disabled="i === 0" @click="move(photos, i, -1)"><i class="bi bi-arrow-left"></i></button>
                <button class="btn btn-sm btn-link px-1" :title="t('attachments.moveDown')" :disabled="i === photos.length - 1" @click="move(photos, i, 1)"><i class="bi bi-arrow-right"></i></button>
                <button class="btn btn-sm btn-link text-danger px-1" :title="t('common.delete')" @click="remove(p)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="documents.length">
      <h3 class="h6">{{ t('attachments.documents') }} ({{ documents.length }})</h3>
      <div class="table-responsive mr-card">
        <table class="table table-sm align-middle mb-0">
          <thead class="table-light small">
            <tr>
              <th>{{ t('attachments.title') }}</th>
              <th>{{ t('attachments.kind') }}</th>
              <th>{{ t('attachments.line') }}</th>
              <th>{{ t('attachments.visibility') }}</th>
              <th class="mr-num">{{ t('attachments.size') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in documents" :key="d.id">
              <td>
                <input :value="d.title" class="form-control form-control-sm" :placeholder="d.originalName" @change="patch(d, { title: $event.target.value })" />
                <a :href="d.url" target="_blank" rel="noopener" class="small">{{ d.originalName }}</a>
              </td>
              <td>
                <select :value="d.kind" class="form-select form-select-sm" @change="patch(d, { kind: $event.target.value })">
                  <option v-for="k in KINDS.filter((x) => x !== 'photo')" :key="k" :value="k">{{ f.kindLabel(k) }}</option>
                </select>
              </td>
              <td>
                <select :value="d.lineId || ''" class="form-select form-select-sm" @change="patch(d, { lineId: $event.target.value || null })">
                  <option value="">{{ t('attachments.packageLevel') }}</option>
                  <option v-for="l in lines" :key="l.id" :value="l.id">{{ l.itemNo }}</option>
                </select>
              </td>
              <td><VisibilityToggle :att="d" @toggle="toggleVisibility(d)" /></td>
              <td class="mr-num small">{{ f.bytes(d.sizeBytes) }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-link text-danger" :title="t('common.delete')" @click="remove(d)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useFormat, KINDS } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'

const props = defineProps({ packageId: { type: String, required: true } })
const emit = defineEmits(['changed'])
const f = useFormat()
const t = f.t

const items = ref([])
const lines = ref([])
const kind = ref('photo')
const visibility = ref('public')
const lineId = ref('')
const title = ref('')
const files = ref([])
const fileInput = ref(null)
const busy = ref(false)
const progress = ref(0)
const error = ref('')

const photos = computed(() => items.value.filter((a) => a.kind === 'photo'))
const documents = computed(() => items.value.filter((a) => a.kind !== 'photo'))

watch(kind, (k) => {
  visibility.value = k === 'photo' ? 'public' : 'restricted'
})

async function load() {
  items.value = await api.attachments(props.packageId)
  lines.value = (await api.sellerLines(props.packageId, { pageSize: 500 })).items
}

function changed() {
  emit('changed', items.value)
}

async function upload() {
  busy.value = true
  progress.value = 0
  error.value = ''
  try {
    await api.uploadAttachments(
      props.packageId,
      files.value,
      { kind: kind.value, visibility: kind.value === 'proposal' ? 'restricted' : visibility.value, lineId: lineId.value, title: files.value.length === 1 ? title.value : '' },
      (p) => (progress.value = p)
    )
    files.value = []
    title.value = ''
    if (fileInput.value) fileInput.value.value = ''
    await load()
    changed()
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function patch(att, body) {
  error.value = ''
  try {
    const updated = await api.updateAttachment(att.id, body)
    items.value = items.value.map((a) => (a.id === att.id ? updated : a))
    changed()
  } catch (err) {
    error.value = f.errorMessage(err)
    await load()
  }
}

function toggleVisibility(att) {
  if (att.kind === 'proposal') return
  patch(att, { visibility: att.visibility === 'public' ? 'restricted' : 'public' })
}

async function move(list, index, delta) {
  const a = list[index]
  const b = list[index + delta]
  await patch(a, { sortOrder: b.sortOrder })
  await patch(b, { sortOrder: a.sortOrder })
  items.value = [...items.value].sort((x, y) => x.sortOrder - y.sortOrder)
}

async function remove(att) {
  if (!window.confirm(t('common.confirmDelete'))) return
  try {
    await api.deleteAttachment(att.id)
    items.value = items.value.filter((a) => a.id !== att.id)
    changed()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

const VisibilityToggle = (p, { emit: e }) =>
  h(
    'button',
    {
      type: 'button',
      class: ['btn btn-sm py-0', p.att.visibility === 'public' ? 'btn-outline-success' : 'btn-outline-warning'],
      title: p.att.kind === 'proposal' ? t('attachments.proposalRestricted') : p.att.visibility === 'public' ? t('attachments.makeRestricted') : t('attachments.makePublic'),
      disabled: p.att.kind === 'proposal',
      onClick: () => e('toggle')
    },
    [h('i', { class: p.att.visibility === 'public' ? 'bi bi-globe' : 'bi bi-lock' }), ' ', t(`enums.visibility.${p.att.visibility}`)]
  )
VisibilityToggle.props = ['att']
VisibilityToggle.emits = ['toggle']

onMounted(load)
</script>
