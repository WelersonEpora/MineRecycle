<template>
  <!-- Tubulação não tem ícone na biblioteca (bootstrap-icons): cotovelo de tubo desenhado aqui. -->
  <svg v-if="category === 'piping'" class="mr-cat-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" aria-hidden="true">
    <path d="M1 3.5h6a5.5 5.5 0 0 1 5.5 5.5v6.5" />
    <path d="M1 7.5h6A1.5 1.5 0 0 1 8.5 9v6.5" />
    <path d="M3.2 2.3v6.4M7.3 12.8h6.4" />
  </svg>
  <i v-else class="mr-cat-icon bi" :class="ICONS[category] || ICONS.other" aria-hidden="true"></i>
</template>

<script setup>
defineProps({ category: { type: String, default: 'other' } })

// Ícone por categoria do pacote (cartão do catálogo sem foto).
const ICONS = {
  refractories: 'bi-bricks',
  electrical: 'bi-lightning-charge',
  process_equipment: 'bi-gear-wide-connected',
  office: 'bi-buildings',
  other: 'bi-boxes'
}
</script>
