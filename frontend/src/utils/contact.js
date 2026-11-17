// Links de contato com a equipe (decisão de 2026-11-17): e-mail e WhatsApp com o texto já preenchido (pacote e URL).

// "+55 11 98765-4321" etc. O backend já guarda só dígitos com código do país.
export function whatsappUrl(number, text) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function mailtoUrl(email, subject, body) {
  if (!email) return ''
  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`
}

// Número para exibir: "+" e os dígitos (sem tentar adivinhar a máscara de cada país).
export function whatsappLabel(number) {
  const digits = String(number || '').replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

// Telefone digitado pelo comprador, para link tel: (mantém só dígitos e o + inicial).
export function telUrl(phone) {
  const p = String(phone || '').trim()
  if (!p) return ''
  return `tel:${p.startsWith('+') ? '+' : ''}${p.replace(/\D/g, '')}`
}
