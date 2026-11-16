<template>
  <div class="mx-auto mr-card p-4" style="max-width: 400px">
    <h1 class="h5 mb-3">{{ t('login.title') }}</h1>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label" for="email">{{ t('login.email') }}</label>
        <input id="email" v-model="email" type="email" class="form-control" autocomplete="username" required />
      </div>
      <div class="mb-3">
        <label class="form-label" for="password">{{ t('login.password') }}</label>
        <input id="password" v-model="password" type="password" class="form-control" autocomplete="current-password" required />
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <button class="btn btn-accent w-100" :disabled="busy">{{ t('login.submit') }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormat } from '../composables/useFormat.js'
import { useSession } from '../stores/session.js'

const f = useFormat()
const t = f.t
const session = useSession()
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await session.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/seller'
    router.replace(redirect)
  } catch (err) {
    error.value = f.errorMessage(err)
  } finally {
    busy.value = false
  }
}
</script>
