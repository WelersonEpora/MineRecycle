<template>
  <!-- Pedido de informação (decisão de 2026-11-17): formulário gravado no painel da equipe, mais e-mail e WhatsApp. -->
  <section class="mr-card p-3 mb-4">
    <h2 class="h6 mb-1"><i class="bi bi-chat-left-text"></i> {{ t('inquiry.title') }}</h2>
    <p class="small text-secondary mb-3">{{ isSeller ? t('inquiry.sellerHint') : t('inquiry.intro') }}</p>

    <div class="d-flex flex-wrap gap-2">
      <button v-if="canInquire" type="button" class="btn btn-accent btn-sm" @click="openForm">
        <i class="bi bi-envelope-paper"></i> {{ t('inquiry.open') }}
      </button>
      <a v-if="emailUrl" class="btn btn-outline-secondary btn-sm" :href="emailUrl">
        <i class="bi bi-envelope"></i> {{ t('inquiry.email') }}
      </a>
      <a v-if="waUrl" class="btn btn-outline-secondary btn-sm" :href="waUrl" target="_blank" rel="noopener">
        <i class="bi bi-whatsapp"></i> {{ t('inquiry.whatsapp') }}
      </a>
    </div>
    <p v-if="contact.email || contact.whatsapp" class="small text-secondary mt-2 mb-0">
      <span v-if="contact.email" class="me-3"><i class="bi bi-envelope"></i> {{ contact.email }}</span>
      <span v-if="contact.whatsapp"><i class="bi bi-whatsapp"></i> {{ whatsappLabel(contact.whatsapp) }}</span>
    </p>
    <RouterLink v-if="isSeller" class="small d-inline-block mt-2" :to="{ name: 'seller-inquiries' }">
      <i class="bi bi-inbox"></i> {{ t('inquiries.title') }}
    </RouterLink>
  </section>

  <ModalDialog v-model:show="form.show" :title="t('inquiry.formTitle', { name: pkg.name })">
    <div v-if="form.sent" class="text-center py-3">
      <i class="bi bi-check-circle text-success fs-2"></i>
      <p class="mt-2 mb-0">{{ t('inquiry.sent') }}</p>
    </div>
    <form v-else id="mr-inquiry-form" class="row g-3" novalidate @submit.prevent="send">
      <div class="col-sm-6">
        <label class="form-label small" for="mr-inq-name">{{ t('inquiry.fields.name') }}</label>
        <input id="mr-inq-name" v-model="form.name" class="form-control" maxlength="120" autocomplete="name" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-inq-company">{{ t('inquiry.fields.company') }}</label>
        <input id="mr-inq-company" v-model="form.company" class="form-control" maxlength="160" autocomplete="organization" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-inq-email">{{ t('inquiry.fields.email') }}</label>
        <input id="mr-inq-email" v-model="form.email" type="email" class="form-control" maxlength="255" autocomplete="email" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-inq-phone">{{ t('inquiry.fields.phone') }}</label>
        <input id="mr-inq-phone" v-model="form.phone" type="tel" class="form-control" maxlength="40" autocomplete="tel" />
      </div>
      <div class="col-12 form-text mt-1">{{ t('inquiry.contactHint') }}</div>
      <div class="col-sm-6">
        <label class="form-label small" for="mr-inq-country">{{ t('inquiry.fields.country') }}</label>
        <input id="mr-inq-country" v-model="form.country" class="form-control" maxlength="80" autocomplete="country-name" />
      </div>
      <div class="col-12">
        <label class="form-label small" for="mr-inq-message">{{ t('inquiry.fields.message') }}</label>
        <textarea id="mr-inq-message" v-model="form.message" class="form-control" rows="5" maxlength="4000" :placeholder="t('inquiry.messagePlaceholder')"></textarea>
      </div>
      <!-- Isca para robôs: fora da tela e fora da ordem de tabulação. Pessoa nunca preenche. -->
      <div class="mr-hp" aria-hidden="true">
        <label for="mr-inq-website">Website</label>
        <input id="mr-inq-website" v-model="form.website" tabindex="-1" autocomplete="off" />
      </div>
      <div class="col-12 form-text mt-0"><i class="bi bi-shield-lock"></i> {{ t('inquiry.privacy') }}</div>
    </form>
    <div v-if="form.error" class="alert alert-danger py-2 small mt-3 mb-0">{{ form.error }}</div>
    <template #footer>
      <template v-if="form.sent">
        <button class="btn btn-outline-secondary btn-sm" @click="form.show = false">{{ t('common.close') }}</button>
      </template>
      <template v-else>
        <button class="btn btn-outline-secondary btn-sm" @click="form.show = false">{{ t('common.cancel') }}</button>
        <button class="btn btn-accent btn-sm" type="submit" form="mr-inquiry-form" :disabled="form.busy">
          {{ form.busy ? t('inquiry.sending') : t('inquiry.send') }}
        </button>
      </template>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat.js'
import { api } from '../services/api.js'
import { whatsappUrl, mailtoUrl, whatsappLabel } from '../utils/contact.js'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({
  pkg: { type: Object, required: true },
  access: { type: String, required: true },
  canInquire: { type: Boolean, default: false }
})

const f = useFormat()
const t = f.t
const { locale } = useI18n()
const contact = ref({ email: null, whatsapp: null })
const isSeller = computed(() => props.access === 'seller')
const empty = { name: '', company: '', email: '', phone: '', country: '', message: '', website: '' }
const form = reactive({ show: false, sent: false, busy: false, error: '', ...empty })

// Texto já preenchido no e-mail e no WhatsApp: nome do pacote e endereço da página.
const pageUrl = computed(() => `${window.location.origin}/packages/${props.pkg.number}`)
const prefilled = computed(() => t('inquiry.prefilled', { name: props.pkg.name, url: pageUrl.value }))
const emailUrl = computed(() => mailtoUrl(contact.value.email, t('inquiry.subject', { name: props.pkg.name }), prefilled.value))
const waUrl = computed(() => whatsappUrl(contact.value.whatsapp, prefilled.value))

function openForm() {
  Object.assign(form, { show: true, error: '', busy: false })
  // Depois de enviado, reabrir começa um pedido novo.
  if (form.sent) Object.assign(form, { sent: false, ...empty })
}

async function send() {
  form.error = ''
  if (!form.email.trim() && !form.phone.trim()) {
    form.error = t('errors.INQUIRY_CONTACT_REQUIRED')
    return
  }
  form.busy = true
  try {
    const { name, company, email, phone, country, message, website } = form
    await api.sendInquiry(props.pkg.number, { name, company, email, phone, country, message, website, language: locale.value })
    form.sent = true
  } catch (err) {
    form.error = f.errorMessage(err)
  } finally {
    form.busy = false
  }
}

onMounted(async () => {
  try {
    contact.value = await api.contact()
  } catch {
    // Sem contato configurado (ou falha de rede): fica só o formulário.
  }
})
</script>

<style scoped>
.mr-hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
