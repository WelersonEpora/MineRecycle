import { reactive, readonly } from 'vue'
import { api } from '../services/api.js'

// Quem está usando o site: vendedor logado e/ou comprador com link. Estado simples, sem Pinia (como no FinMind).
const state = reactive({ user: null, buyer: null, loaded: false })

let pending = null

async function load(force = false) {
  if (state.loaded && !force) return
  if (!pending) {
    pending = api
      .me()
      .then((r) => {
        state.user = r.user
        state.buyer = r.buyer
      })
      .catch(() => {
        state.user = null
        state.buyer = null
      })
      .finally(() => {
        state.loaded = true
        pending = null
      })
  }
  await pending
}

async function login(email, password) {
  const r = await api.login(email, password)
  state.user = r.user
  await load(true)
}

async function logout() {
  try {
    await api.logout()
  } finally {
    state.user = null
  }
}

async function endBuyerSession() {
  try {
    await api.buyerLogout()
  } finally {
    state.buyer = null
  }
}

export function useSession() {
  return { state: readonly(state), load, login, logout, endBuyerSession }
}
