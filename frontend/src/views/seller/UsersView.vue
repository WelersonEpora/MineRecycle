<template>
  <div class="d-flex mb-3">
    <button class="btn btn-accent btn-sm ms-auto" @click="openForm(null)"><i class="bi bi-person-plus"></i> {{ t('users.newUser') }}</button>
  </div>
  <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
  <div class="table-responsive mr-card">
    <table class="table table-sm align-middle mb-0">
      <thead class="table-light small">
        <tr>
          <th>{{ t('users.name') }}</th>
          <th>{{ t('users.email') }}</th>
          <th>{{ t('users.role') }}</th>
          <th>{{ t('users.active') }}</th>
          <th>{{ t('users.lastLogin') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id" :class="{ 'text-secondary': !u.active }">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>{{ t(`enums.role.${u.role}`) }}</td>
          <td>{{ u.active ? t('common.yes') : t('common.no') }}</td>
          <td class="small">{{ f.dateTime(u.lastLoginAt) }}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-link" :title="t('common.edit')" @click="openForm(u)"><i class="bi bi-pencil"></i></button>
            <button v-if="u.id !== myId" class="btn btn-sm btn-link text-danger" :title="t('users.delete')" @click="remove(u)">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <ModalDialog v-model:show="form.show" :title="form.id ? form.name : t('users.newUser')">
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label small">{{ t('users.name') }}</label>
        <input v-model="form.name" class="form-control" maxlength="120" />
      </div>
      <div class="col-12">
        <label class="form-label small">{{ t('users.email') }}</label>
        <input v-model="form.email" type="email" class="form-control" :disabled="!!form.id" />
      </div>
      <div class="col-6">
        <label class="form-label small">{{ t('users.role') }}</label>
        <select v-model="form.role" class="form-select">
          <option value="seller">{{ t('enums.role.seller') }}</option>
          <option value="admin">{{ t('enums.role.admin') }}</option>
        </select>
      </div>
      <div v-if="form.id" class="col-6 d-flex align-items-end">
        <div class="form-check">
          <input id="mr-u-active" v-model="form.active" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="mr-u-active">{{ t('users.active') }}</label>
        </div>
      </div>
      <div class="col-12">
        <label class="form-label small">{{ form.id ? t('users.newPassword') : t('users.password') }}</label>
        <input v-model="form.password" type="password" class="form-control" autocomplete="new-password" />
        <div class="form-text">{{ t('users.passwordHint') }}</div>
      </div>
    </div>
    <div v-if="form.error" class="alert alert-danger py-2 small mt-3 mb-0">{{ form.error }}</div>
    <template #footer>
      <button class="btn btn-outline-secondary btn-sm" @click="form.show = false">{{ t('common.cancel') }}</button>
      <button class="btn btn-accent btn-sm" :disabled="form.busy" @click="save">{{ t('common.save') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useFormat } from '../../composables/useFormat.js'
import { api } from '../../services/api.js'
import ModalDialog from '../../components/ModalDialog.vue'
import { confirmDialog, notify } from '../../composables/useDialog.js'
import { useSession } from '../../stores/session.js'

const f = useFormat()
const t = f.t
const session = useSession()
const myId = computed(() => session.state.user?.id)
const users = ref([])
const error = ref('')
const form = reactive({ show: false, id: null, name: '', email: '', role: 'seller', active: true, password: '', error: '', busy: false })

async function load() {
  try {
    users.value = await api.users()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

function openForm(u) {
  Object.assign(form, {
    show: true,
    id: u?.id || null,
    name: u?.name || '',
    email: u?.email || '',
    role: u?.role || 'seller',
    active: u ? u.active : true,
    password: '',
    error: ''
  })
}

async function save() {
  form.busy = true
  form.error = ''
  try {
    if (form.id) {
      const body = { name: form.name, role: form.role, active: form.active }
      if (form.password) body.password = form.password
      await api.updateUser(form.id, body)
    } else {
      const created = await api.createUser({ name: form.name, email: form.email, role: form.role, password: form.password })
      if (created.reactivated) notify(t('users.reactivated'), 'info', 8000)
    }
    form.show = false
    await load()
  } catch (err) {
    form.error = f.errorMessage(err)
  } finally {
    form.busy = false
  }
}

// Exclusão lógica: some da lista e perde o acesso; volta se o mesmo e-mail for incluído de novo.
async function remove(u) {
  const ok = await confirmDialog({ title: t('users.deleteTitle'), message: t('users.deleteConfirm', { name: u.name }), confirmLabel: t('common.delete') })
  if (!ok) return
  error.value = ''
  try {
    await api.deleteUser(u.id)
    notify(t('users.deleted'))
    await load()
  } catch (err) {
    error.value = f.errorMessage(err)
  }
}

onMounted(load)
</script>
