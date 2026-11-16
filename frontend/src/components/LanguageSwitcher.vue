<template>
  <div class="d-flex align-items-center gap-1" role="group" :aria-label="t('nav.language')">
    <button
      type="button"
      class="mr-lang-btn"
      :class="{ active: locale === 'en' }"
      title="English"
      aria-label="English"
      @click="setLocale('en')"
    >
      <!-- Bandeira dos EUA simplificada -->
      <svg class="mr-flag" viewBox="0 0 190 100" aria-hidden="true">
        <rect width="190" height="100" fill="#b22234" />
        <g fill="#fff">
          <rect y="7.7" width="190" height="7.7" />
          <rect y="23.1" width="190" height="7.7" />
          <rect y="38.5" width="190" height="7.7" />
          <rect y="53.8" width="190" height="7.7" />
          <rect y="69.2" width="190" height="7.7" />
          <rect y="84.6" width="190" height="7.7" />
        </g>
        <rect width="76" height="53.8" fill="#3c3b6e" />
      </svg>
    </button>
    <button
      type="button"
      class="mr-lang-btn"
      :class="{ active: locale === 'pt' }"
      title="Português"
      aria-label="Português"
      @click="setLocale('pt')"
    >
      <!-- Bandeira do Brasil simplificada -->
      <svg class="mr-flag" viewBox="0 0 140 98" aria-hidden="true">
        <rect width="140" height="98" fill="#009c3b" />
        <polygon points="70,10 128,49 70,88 12,49" fill="#ffdf00" />
        <circle cx="70" cy="49" r="22" fill="#002776" />
        <path d="M49 45 q21 -6 42 6" stroke="#fff" stroke-width="4" fill="none" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'

const { t, locale } = useI18n()
</script>
