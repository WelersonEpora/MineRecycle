<template>
  <div>
    <ul class="nav mr-subnav border-bottom mb-4">
      <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'seller-packages' }" active-class="" :class="{ 'router-link-active': inPackages }">{{ t('seller.packages') }}</RouterLink></li>
      <li class="nav-item">
        <RouterLink class="nav-link" :to="{ name: 'seller-inquiries' }">
          {{ t('inquiries.menu') }}<span v-if="newInquiries" class="badge rounded-pill text-bg-danger ms-1" :title="t('inquiries.newBadge', newInquiries)">{{ newInquiries }}</span>
        </RouterLink>
      </li>
      <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'seller-links' }">{{ t('seller.accessLinks') }}</RouterLink></li>
      <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'seller-settings' }">{{ t('seller.settings') }}</RouterLink></li>
      <li v-if="isAdmin" class="nav-item"><RouterLink class="nav-link" :to="{ name: 'seller-users' }">{{ t('seller.users') }}</RouterLink></li>
      <li class="nav-item ms-auto"><RouterLink class="nav-link" :to="{ name: 'seller-help-how' }" active-class="" :class="{ 'router-link-active': inHelp }"><i class="bi bi-question-circle"></i> {{ t('help.menu') }}</RouterLink></li>
      <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'seller-account' }"><i class="bi bi-person"></i> {{ t('seller.account') }}</RouterLink></li>
    </ul>
    <RouterView />
  </div>
</template>

<script setup>
import { computed, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSession } from '../../stores/session.js'
import { api } from '../../services/api.js'

const { t } = useI18n()
const route = useRoute()
const session = useSession()
const isAdmin = computed(() => session.state.user?.role === 'admin')
// /seller é prefixo de todas as abas: o destaque automático do RouterLink ficaria sempre ligado em Pacotes.
const inHelp = computed(() => route.path.startsWith('/seller/help'))
const inPackages = computed(() => route.name === 'seller-packages' || route.name === 'seller-package')

// Pedidos novos (ninguém assumiu ainda): contador na aba, atualizado a cada troca de tela e quando a tela de pedidos
// muda algo (inject "refreshInquiryCount").
const newInquiries = ref(0)
async function refreshInquiryCount() {
  try {
    newInquiries.value = (await api.inquiryCounts()).new
  } catch {
    // Contador é só um aviso: falha não atrapalha a tela.
  }
}
provide('refreshInquiryCount', refreshInquiryCount)
watch(() => route.name, refreshInquiryCount, { immediate: true })
</script>
