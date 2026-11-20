// Partes do sistema escondidas na tela, mas mantidas no banco e na API (voltar = trocar para true).
//
// Origem (2026-11-19): escondida a pedido do usuário depois da mudança para lotes. A planilha não tem coluna de
// origem, a importação não a preenche e o Site já mostra onde os lotes estão. Some o cadastro em Configuração, o
// campo do pacote, o filtro da lista do vendedor e os chips do catálogo; o que já estiver gravado fica intacto.
export const SHOW_ORIGIN = false
