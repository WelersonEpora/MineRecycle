<template>
  <header class="mr-topbar">
    <nav class="container-xl d-flex align-items-center gap-3 py-2 flex-wrap">
      <RouterLink to="/" class="mr-brand fs-5 me-2">
        <i class="bi bi-gem mr-brand-mark"></i> MineRecycle
      </RouterLink>
      <RouterLink :to="{ name: 'catalog' }" exact-active-class="router-link-active">{{ t('nav.catalog') }}</RouterLink>
      <RouterLink v-if="session.state.buyer" :to="{ name: 'buyer' }">
        <i class="bi bi-key"></i> {{ t('nav.myAccess') }}
      </RouterLink>
      <RouterLink v-if="session.state.user" to="/seller">
        <i class="bi bi-briefcase"></i> {{ t('nav.sellerArea') }}
      </RouterLink>

      <div class="ms-auto d-flex align-items-center gap-3">
        <LanguageSwitcher />
        <template v-if="session.state.user">
          <span class="small text-white-50 d-none d-md-inline">{{ session.state.user.name }}</span>
          <button class="btn btn-link btn-sm p-0" @click="logout">{{ t('nav.logout') }}</button>
        </template>
        <RouterLink v-else :to="{ name: 'login' }" class="small">{{ t('nav.login') }}</RouterLink>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSession } from '../stores/session.js'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()
const session = useSession()
const router = useRouter()

async function logout() {
  await session.logout()
  router.push({ name: 'catalog' })
}
</script>
