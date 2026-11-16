<template>
  <div v-if="photos.length">
    <img :src="current.webUrl" class="mr-gallery-main" :alt="current.title || ''" @click="zoom = true" />
    <div v-if="current.title" class="small text-secondary mt-1">{{ current.title }}</div>
    <div v-if="photos.length > 1" class="d-flex flex-wrap gap-2 mt-2">
      <img
        v-for="(p, i) in photos"
        :key="p.id"
        :src="p.thumbUrl"
        class="mr-thumb"
        :class="{ active: i === index }"
        :alt="p.title || ''"
        loading="lazy"
        @click="index = i"
      />
    </div>
    <ModalDialog v-model:show="zoom" :title="current.title || ''" size="xl">
      <div class="mr-lightbox">
        <img :src="current.webUrl" :alt="current.title || ''" />
        <div class="d-flex justify-content-between mt-2">
          <button class="btn btn-sm btn-outline-secondary" :disabled="index === 0" @click="index--">
            <i class="bi bi-chevron-left"></i>
          </button>
          <a v-if="current.url" :href="current.url" target="_blank" rel="noopener" class="btn btn-sm btn-link">
            <i class="bi bi-download"></i> {{ t('common.download') }}
          </a>
          <button class="btn btn-sm btn-outline-secondary" :disabled="index === photos.length - 1" @click="index++">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
  <p v-else class="text-secondary small">{{ t('package.noPhotos') }}</p>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({ photos: { type: Array, required: true } })
const { t } = useI18n()
const index = ref(0)
const zoom = ref(false)
const current = computed(() => props.photos[Math.min(index.value, props.photos.length - 1)] || {})
watch(
  () => props.photos.length,
  () => (index.value = 0)
)
</script>
