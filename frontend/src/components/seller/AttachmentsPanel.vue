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
          <select v-model="visibility" class="form-select form-select-sm">
            <option value="public">{{ t('enums.visibility.public') }}</option>
            <option value="restricted">{{ t('enums.visibility.restricted') }}</option>
            <option value="internal">{{ t('enums.visibility.internal') }}</option>
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
          <!-- Área de envio: clicar, arrastar ou colar (Ctrl+V em qualquer ponto da aba, fora dos campos de texto). -->
          <div
            class="mr-dropzone"
            :class="{ 'is-over': dragDepth > 0 }"
            @dragenter.prevent="dragDepth++"
            @dragover.prevent
            @dragleave="dragDepth = Math.max(0, dragDepth - 1)"
            @drop.prevent="onDrop"
          >
            <input
              ref="fileInput"
              type="file"
              multiple
              class="visually-hidden"
              tabindex="-1"
              :aria-label="t('attachments.chooseFiles')"
              :accept="kind === 'photo' ? 'image/jpeg,image/png,image/webp,image/tiff,image/gif' : undefined"
              @change="onPick"
            />
            <i class="bi bi-cloud-arrow-up mr-dropzone-icon" aria-hidden="true"></i>
            <div>
              <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="fileInput?.click()">
                {{ t('attachments.chooseFiles') }}
              </button>
              <span class="ms-2">{{ t('attachments.dropOrPaste') }}</span>
            </div>
            <div class="small text-secondary">{{ t('attachments.maxFiles', { n: MAX_FILES }) }}</div>
          </div>

          <div v-if="files.length" class="mt-2">
            <div class="d-flex align-items-center small mb-1">
              <span class="fw-medium">{{ t('attachments.readyCount', { n: files.length }, files.length) }}</span>
              <button type="button" class="btn btn-sm btn-link ms-auto py-0" :disabled="busy" @click="clearFiles">{{ t('attachments.clearFiles') }}</button>
            </div>
            <ul class="mr-pending list-unstyled mb-0">
              <li v-for="(p, i) in files" :key="p.key">
                <img v-if="p.preview" :src="p.preview" alt="" />
                <span v-else class="mr-pending-icon"><i class="bi bi-file-earmark" aria-hidden="true"></i></span>
                <span class="mr-pending-name" :title="p.file.name">{{ p.file.name }}</span>
                <span class="text-secondary">{{ f.bytes(p.file.size) }}</span>
                <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" :disabled="busy" :aria-label="t('attachments.removeFile', { name: p.file.name })" @click="removeFile(i)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </li>
            </ul>
          </div>
          <div v-if="notice" class="small text-warning-emphasis mt-1">{{ notice }}</div>

          <div class="form-text">
            <span v-if="visibility === 'internal'">{{ t('attachments.internalNote') }}</span>
            <span v-else-if="kind === 'proposal'">{{ t('attachments.proposalRestricted') }}</span>
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
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFormat, KINDS } from '../../composables/useFormat.js'
import { confirmDialog } from '../../composables/useDialog.js'
import { api } from '../../services/api.js'
import { MAX_FILES, isImageFile, isTextField, mergeFiles, pastedFileName } from '../../utils/pending-files.js'

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
// Arquivos escolhidos e ainda não enviados: { key, file, preview } (preview = URL local da miniatura, só imagem).
const files = ref([])
const fileInput = ref(null)
const busy = ref(false)
const progress = ref(0)
const error = ref('')
const notice = ref('')
const dragDepth = ref(0)
let keySeq = 0

function addFiles(incoming) {
  const r = mergeFiles(
    files.value.map((p) => p.file),
    incoming
  )
  const known = new Set(files.value.map((p) => p.file))
  const added = r.files.filter((f) => !known.has(f)).map((file) => ({ key: ++keySeq, file, preview: isImageFile(file) ? URL.createObjectURL(file) : null }))
  files.value = [...files.value, ...added]
  const parts = []
  if (r.duplicates) parts.push(t('attachments.duplicatesSkipped', { n: r.duplicates }, r.duplicates))
  if (r.overflow) parts.push(t('attachments.overflowSkipped', { max: MAX_FILES, n: r.overflow }))
  notice.value = parts.join(' ')
}

function removeFile(index) {
  const [p] = files.value.splice(index, 1)
  if (p?.preview) URL.revokeObjectURL(p.preview)
  notice.value = ''
}

function clearFiles() {
  for (const p of files.value) if (p.preview) URL.revokeObjectURL(p.preview)
  files.value = []
  notice.value = ''
}

function onPick(e) {
  addFiles([...e.target.files])
  // Limpa o input para poder escolher o mesmo arquivo de novo depois de tirá-lo da lista.
  e.target.value = ''
}

function onDrop(e) {
  dragDepth.value = 0
  if (busy.value) return
  addFiles([...(e.dataTransfer?.files || [])])
}

// Ctrl+V com imagem (print, imagem copiada do navegador ou do WhatsApp) em qualquer ponto da aba. Dentro de campo de
// texto com texto na área de transferência, segue a colagem normal. Com um diálogo aberto, não faz nada.
function onPaste(e) {
  const dt = e.clipboardData
  if (!dt || busy.value || document.querySelector('.mr-modal-backdrop')) return
  let incoming = [...(dt.files || [])]
  if (!incoming.length) incoming = [...(dt.items || [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter(Boolean)
  if (!incoming.length) return
  if (isTextField(e.target) && [...(dt.types || [])].includes('text/plain')) return
  e.preventDefault()
  const now = new Date()
  let n = 0
  const named = incoming.map((f) =>
    isImageFile(f) && (!f.name || /^image\.\w+$/i.test(f.name)) ? new File([f], pastedFileName(f.type, now, n++), { type: f.type, lastModified: now.getTime() }) : f
  )
  if (!files.value.length && named.every(isImageFile)) kind.value = 'photo'
  addFiles(named)
}

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
      files.value.map((p) => p.file),
      { kind: kind.value, visibility: kind.value === 'proposal' && visibility.value === 'public' ? 'restricted' : visibility.value, lineId: lineId.value, title: files.value.length === 1 ? title.value : '' },
      (p) => (progress.value = p)
    )
    clearFiles()
    title.value = ''
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

// Alterna só entre público e restrito. Interno não muda pela tela (evita expor por engano a planilha com valores);
// para mudar, apague e envie de novo.
function toggleVisibility(att) {
  if (att.kind === 'proposal' || att.visibility === 'internal') return
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
  const ok = await confirmDialog({ title: t('dialog.deleteFileTitle'), message: t('common.confirmDelete'), confirmLabel: t('common.delete') })
  if (!ok) return
  try {
    await api.deleteAttachment(att.id)
    items.value = items.value.filter((a) => a.id !== att.id)
    changed()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

const VISIBILITY_STYLE = {
  public: { btn: 'btn-outline-success', icon: 'bi bi-globe' },
  restricted: { btn: 'btn-outline-warning', icon: 'bi bi-lock' },
  internal: { btn: 'btn-outline-danger', icon: 'bi bi-shield-lock' }
}

function visibilityTitle(att) {
  if (att.visibility === 'internal') return t('attachments.internalNote')
  if (att.kind === 'proposal') return t('attachments.proposalRestricted')
  return att.visibility === 'public' ? t('attachments.makeRestricted') : t('attachments.makePublic')
}

const VisibilityToggle = (p, { emit: e }) => {
  const style = VISIBILITY_STYLE[p.att.visibility] || VISIBILITY_STYLE.restricted
  return h(
    'button',
    {
      type: 'button',
      class: ['btn btn-sm py-0', style.btn],
      title: visibilityTitle(p.att),
      disabled: p.att.kind === 'proposal' || p.att.visibility === 'internal',
      onClick: () => e('toggle')
    },
    [h('i', { class: style.icon }), ' ', t(`enums.visibility.${p.att.visibility}`)]
  )
}
VisibilityToggle.props = ['att']
VisibilityToggle.emits = ['toggle']

onMounted(() => {
  document.addEventListener('paste', onPaste)
  load()
})
onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  clearFiles()
})
</script>

<style scoped>
.mr-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.1rem 1rem;
  border: 2px dashed var(--mr-border);
  border-radius: 0.6rem;
  background: var(--mr-bg);
  text-align: center;
  font-size: 0.875rem;
  transition:
    border-color 0.15s,
    background-color 0.15s;
}
.mr-dropzone.is-over {
  border-color: var(--mr-accent);
  background: #fdf5e8;
}
.mr-dropzone-icon {
  font-size: 1.6rem;
  line-height: 1;
  color: var(--mr-muted);
}
.mr-dropzone.is-over .mr-dropzone-icon {
  color: var(--mr-accent-dark);
}
.mr-pending {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.mr-pending li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  border: 1px solid var(--mr-border);
  border-radius: 0.45rem;
  background: var(--mr-card);
  font-size: 0.8125rem;
}
.mr-pending img,
.mr-pending-icon {
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.3rem;
  object-fit: cover;
}
.mr-pending-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--mr-bg);
  color: var(--mr-muted);
  font-size: 1.1rem;
}
.mr-pending-name {
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
