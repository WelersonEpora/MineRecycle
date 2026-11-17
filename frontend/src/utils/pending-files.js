// Fila de arquivos escolhidos para envio (clique, arrastar ou colar), antes de ir para o servidor.

// Mesmo limite do multer no backend (seller.routes.js).
export const MAX_FILES = 30

const EXT_BY_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/tiff': '.tif'
}

export const extensionForType = (type) => EXT_BY_TYPE[String(type || '').toLowerCase()] || null

const pad = (n) => String(n).padStart(2, '0')

// O navegador chama toda imagem colada de "image.png"; dá um nome com data e hora (e um índice, se vierem várias).
export function pastedFileName(type, date = new Date(), index = 0) {
  const ext = extensionForType(type) || '.png'
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `pasted-${stamp}${index ? `-${index + 1}` : ''}${ext}`
}

export const isImageFile = (file) => String(file?.type || '').startsWith('image/')

const fileKey = (f) => `${f.name}|${f.size}|${f.lastModified}`

// Junta os novos aos já escolhidos, sem repetir o mesmo arquivo e sem passar do limite.
export function mergeFiles(current, incoming, max = MAX_FILES) {
  const seen = new Set(current.map(fileKey))
  const files = [...current]
  let duplicates = 0
  let overflow = 0
  for (const f of incoming) {
    if (seen.has(fileKey(f))) duplicates++
    else if (files.length >= max) overflow++
    else {
      seen.add(fileKey(f))
      files.push(f)
    }
  }
  return { files, duplicates, overflow }
}

// Colar dentro de um campo de texto é colar texto: a colagem de arquivo só vale fora deles.
export function isTextField(el) {
  if (!el || typeof el !== 'object') return false
  if (el.isContentEditable) return true
  const tag = String(el.tagName || '').toLowerCase()
  if (tag === 'textarea') return true
  if (tag !== 'input') return false
  return !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes(String(el.type || 'text').toLowerCase())
}
