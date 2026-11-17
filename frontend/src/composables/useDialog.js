import { reactive } from 'vue'

// Diálogos da aplicação no lugar de window.confirm/window.alert (mesmo padrão do ConfirmModal do FinMind).
// O estado é único e fica em AppDialogs.vue, montado uma vez em App.vue.
export const dialogState = reactive({
  confirm: null, // { title, message, confirmLabel, danger, requireText, resolve }
  toasts: [] // { id, message, variant }
})

let nextToastId = 1

// Pede confirmação. -> Promise<boolean>. Com requireText, o botão só habilita depois de digitar esse texto
// (ação irreversível de peso, como excluir um pacote inteiro).
export function confirmDialog({ title, message, confirmLabel, danger = true, requireText = '' }) {
  if (dialogState.confirm) dialogState.confirm.resolve(false)
  return new Promise((resolve) => {
    dialogState.confirm = { title, message, confirmLabel, danger, requireText, resolve }
  })
}

export function closeConfirm(result) {
  const current = dialogState.confirm
  dialogState.confirm = null
  current?.resolve(result)
}

// Aviso curto no canto da tela, que some sozinho. variant: success | danger | info.
export function notify(message, variant = 'success', timeout = 5000) {
  const id = nextToastId++
  dialogState.toasts.push({ id, message, variant })
  setTimeout(() => dismissToast(id), timeout)
}

export function dismissToast(id) {
  const i = dialogState.toasts.findIndex((x) => x.id === id)
  if (i >= 0) dialogState.toasts.splice(i, 1)
}
