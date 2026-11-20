export default {
  app: {
    name: 'MineRecycle',
    tagline: 'Ativos de mineração à venda',
    assetSaleOf: 'Venda de ativos da'
  },
  nav: {
    catalog: 'Catálogo',
    sellerArea: 'Área do vendedor',
    myAccess: 'Meu acesso',
    login: 'Entrar (vendedor)',
    logout: 'Sair',
    language: 'Idioma'
  },
  enums: {
    source: { linked_system: 'Sistema', family: 'Família comercial', subfamily: 'Subfamília', manual: 'Montado' },
    lotStatus: { available: 'Disponível', sold: 'Vendido', unavailable: 'Indisponível' },
    type: { bulk: 'A granel', equipment: 'Equipamento' },
    category: {
      refractories: 'Refratários',
      electrical: 'Elétrica',
      piping: 'Tubulação',
      process_equipment: 'Equipamentos de processo',
      office: 'Escritório',
      other: 'Outros'
    },
    location: {
      conceicao_do_araguaia: 'Conceição do Araguaia',
      uberaba: 'Uberaba',
      niquelandia: 'Niquelândia',
      belo_horizonte: 'Belo Horizonte',
      at_supplier: 'No fornecedor',
      to_be_confirmed: 'A confirmar'
    },
    status: {
      draft: 'Rascunho',
      active: 'Ativo',
      under_negotiation: 'Em negociação',
      sold: 'Vendido',
      inactive: 'Inativo'
    },
    kind: {
      photo: 'Foto',
      datasheet: 'Ficha técnica',
      drawing: 'Desenho',
      list: 'Lista',
      proposal: 'Proposta'
    },
    visibility: { public: 'Público', restricted: 'Restrito', internal: 'Interno' },
    role: { seller: 'Vendedor', admin: 'Administrador' },
    linkState: { valid: 'Válido', expired: 'Expirado', revoked: 'Revogado' },
    action: { open: 'Abriu o link', view_package: 'Viu o pacote', download: 'Baixou arquivo' }
  },
  common: {
    all: 'Todos',
    search: 'Buscar',
    save: 'Salvar',
    saving: 'Salvando…',
    cancel: 'Cancelar',
    close: 'Fechar',
    edit: 'Editar',
    delete: 'Excluir',
    create: 'Criar',
    back: 'Voltar',
    loading: 'Carregando…',
    yes: 'Sim',
    no: 'Não',
    none: 'Nenhum',
    optional: 'opcional',
    previous: 'Anterior',
    next: 'Próxima',
    pageOf: 'Página {page} de {pages}',
    results: 'nenhum resultado | 1 resultado | {n} resultados',
    download: 'Baixar',
    open: 'Abrir',
    copy: 'Copiar',
    copied: 'Copiado',
    actions: 'Ações',
    confirmDelete: 'Excluir definitivamente? Não dá para desfazer.'
  },
  dialog: {
    confirm: 'Confirmar',
    typeToConfirm: 'Para confirmar, digite',
    deleteFileTitle: 'Excluir arquivo'
  },
  catalog: {
    title: 'Ativos de mineração à venda',
    intro:
      'Equipamentos e materiais de um projeto de mineração desativado, organizados em pacotes de venda. Os preços não são publicados: compradores qualificados recebem um link de acesso com a documentação completa.',
    type: 'Tipo',
    location: 'Local',
    status: 'Situação',
    empty: 'Nenhum pacote com esses filtros.',
    lots: 'nenhum lote | 1 lote | {n} lotes',
    soldOf: '{sold} de {total} vendidos',
    packageId: 'ID do pacote',
    viewPackage: 'Ver pacote',
    highlight: { lots: 'lote | lote | lotes' }
  },
  package: {
    number: 'Pacote {number}',
    description: 'Descrição',
    photos: 'Fotos',
    documents: 'Documentos',
    noDocuments: 'Nenhum documento disponível.',
    lots: 'Lotes',
    noLots: 'Nenhum lote.',
    searchLots: 'Nº, descrição ou fornecedor',
    restrictedHint:
      'Há documentação restrita deste pacote ({n} arquivo) disponível para compradores qualificados por link de acesso. | Há documentação restrita deste pacote ({n} arquivos) disponível para compradores qualificados por link de acesso.',
    buyerBanner: 'Você está vendo este pacote pelo link de acesso “{label}”, válido até {date}. Os documentos restritos estão incluídos.',
    sellerBanner: 'Você entrou como vendedor: tudo fica visível, inclusive os arquivos restritos.',
    editInSellerArea: 'Editar na área do vendedor',
    restricted: 'Restrito',
    lineFiles: 'Arquivos deste item',
    noPhotos: 'Ainda sem fotos.'
  },
  access: {
    opening: 'Abrindo seu link de acesso…',
    missingToken: 'Este endereço não contém um link de acesso. Use o link completo que você recebeu.',
    title: 'Seu acesso',
    validUntil: 'Válido até {date}',
    packages: 'Pacotes compartilhados com você',
    noSession: 'Nenhum link de acesso ativo. Abra o link que você recebeu para ver os documentos restritos.',
    endSession: 'Encerrar acesso',
    ended: 'Acesso encerrado.'
  },
  login: {
    title: 'Entrada do vendedor',
    email: 'E-mail',
    password: 'Senha',
    submit: 'Entrar'
  },
  seller: {
    lots: 'Lotes',
    level: 'Nível',
    site: 'Site',
    lotCount: 'Lotes',
    soldOf: '{sold} de {total} vendidos',
    automaticNote: 'Pacote automático: os lotes vêm da coluna "{level}" da planilha (valor "{value}") e mudam a cada importação. Aqui você edita nome, descrição, fotos e arquivos.',
    manualNote: 'Pacote montado: você escolhe os lotes.',
    addLots: 'Adicionar lotes',
    removeLots: 'Tirar do pacote',
    removeLotsConfirm: 'Tirar {n} lote do pacote? O lote continua no sistema e nos outros pacotes. | Tirar {n} lotes do pacote? Os lotes continuam no sistema e nos outros pacotes.',
    lotsAdded: '{n} lote adicionado. | {n} lotes adicionados.',
    lotsRemoved: '{n} lote retirado do pacote. | {n} lotes retirados do pacote.',
    saleConfirmTitle: 'Lotes já vendidos',
    saleConfirmMessage: '{n} lote deste pacote já foi vendido (pela planilha ou em outro pacote). Marcar o pacote como vendido mesmo assim? | {n} lotes deste pacote já foram vendidos (pela planilha ou em outro pacote). Marcar o pacote como vendido mesmo assim?',
    saleConfirmLabel: 'Marcar como vendido',
    saleDone: 'Pacote vendido: {n} lote marcado como vendido em todos os pacotes. | Pacote vendido: {n} lotes marcados como vendidos em todos os pacotes.',
    unsaleDone: 'Venda desfeita: {released} lote(s) voltaram; {stillSold} continuam vendidos por outro motivo.',
    packages: 'Pacotes',
    accessLinks: 'Links de acesso',
    settings: 'Configuração',
    users: 'Usuários',
    account: 'Minha conta',
    newPackage: 'Novo pacote',
    storShort: 'Doc.',
    exportPackages: 'Exportar pacotes',
    exportPackage: 'Exportar pacote',
    importPackages: 'Importar pacotes',
    importPackage: 'Importar pacote',
    pendingShort: 'pendente',
    lineCount: 'Itens',
    attachmentCount: 'Arquivos',
    updated: 'Atualizado',
    noPackages: 'Nenhum pacote ainda.',
    viewPublic: 'Ver página',
    tabs: { details: 'Dados', lots: 'Lotes', packages: 'Pacotes', attachments: 'Fotos e arquivos', links: 'Links de acesso' },
    fields: {
      number: 'ID',
      numberHint: 'Identificação do pacote, usada no endereço da página pública e mostrada no catálogo (#12). Preenchido sozinho. Não muda depois de criado.',
      numberLockedHint: 'Identificação do pacote, usada no endereço da página pública. Não muda depois de criado.',
      name: 'Nome público (inglês)',
      nameHint: 'Aparece no catálogo e no link do comprador.',
      storFolder: 'Pasta no STOR',
      storFolderHint: 'Nome da pasta do pacote no STOR, escrito exatamente igual. Só vendedores veem.',
      storNumbers: 'Ativos',
      storNumbersShort: 'Ativos',
      storNumbersHint: 'Números dos ativos na planilha de estratégia de vendas, ex.: 1, 6 (ativos 1 e 6). Ordenam as listas; o comprador não vê. Não é o ID do pacote.',
      storDocumentsPending: 'Pendentes de validação (não importar ainda):',
      storDocumentsPendingHint: 'A importação de uma planilha marcada pede confirmação.',
      type: 'Tipo',
      category: 'Categoria',
      origin: 'Origem',
      originChoose: 'Escolha a origem',
      originNone: 'Sem origem',
      originHint: 'De onde vieram os ativos (opcional). É diferente do site, que diz onde os lotes estão hoje.',
      categoryHint: 'Define a cor e o ícone do cartão no catálogo quando o pacote não tem foto.',
      location: 'Locais',
      locationsHint: 'Marque todos os locais onde há itens do pacote. Use "A confirmar" enquanto não souber.',
      storDocuments: 'Documentos STOR',
      storDocumentsHint: 'Códigos das planilhas deste pacote no STOR (7 dígitos, separados por vírgula). O código está no começo do nome do arquivo baixado. Só vendedores veem.',
      description: 'Descrição',
      help: 'Ajuda: {field}'
    },
    saved: 'Salvo.',
    editDetails: 'Editar dados do pacote',
    statusActions: {
      title: 'Mudar situação',
      active: 'Ativar',
      under_negotiation: 'Marcar em negociação',
      sold: 'Marcar como vendido',
      inactive: 'Desativar',
      draft: 'Voltar para rascunho'
    },
    deletePackage: 'Excluir pacote',
    deletePackageTitle: 'Excluir pacote',
    deletePackageConfirm: 'O pacote “{name}” será excluído com as fotos e os arquivos dele. Os lotes continuam no sistema. Não dá para desfazer.',
    addLine: 'Adicionar item',
    editLine: 'Editar item',
    importSpreadsheet: 'Importar itens',
    deleteLineTitle: 'Excluir item',
    deleteLineConfirm: 'Excluir o item {itemNo}?',
    unitHint: 'Normalizada automaticamente (UN, pç → PC; MT → M…)'
  },
  table: {
    refresh: 'Atualizar tabela',
    perPage: 'Por página',
    report: 'Página {page} de {pages} ({total} no total)',
    pages: 'Páginas',
    first: 'Primeira página',
    last: 'Última página'
  },
  lots: {
    menu: 'Lotes',
    lotNumber: 'Lote',
    title: 'Descrição',
    supplier: 'Fornecedor',
    linkedSystem: 'Sistema vinculado',
    family: 'Família comercial',
    subfamily: 'Subfamília',
    site: 'Site',
    status: 'Situação',
    sheetStatus: 'Situação na planilha',
    packages: 'Pacotes',
    files: 'Arquivos',
    none: 'Nenhum lote.',
    emptyValue: '(vazio)',
    withdrawn: 'Retirado da planilha',
    showWithdrawn: 'Só os retirados da planilha',
    description: 'Descrição do vendedor',
    descriptionHint: 'Texto livre sobre o lote. A importação não apaga.',
    fromSheet: 'Dados da planilha (mudam só pela importação)',
    soldBySheet: 'Vendido pela planilha',
    soldByPackage: 'vendido por este pacote',
    createPackage: 'Criar pacote deste lote',
    noPackages: 'Este lote não está em nenhum pacote.',
    packagesHint: 'Pacotes em que este lote está. Arquivos do lote aparecem em todos eles.',
    editDescription: 'Editar descrição do lote',
    importLots: 'Importar lotes',
    exportLots: 'Exportar lotes',
    exportHint: 'Planilha com todos os lotes (menos os retirados), no formato da importação. Os filtros da tela não se aplicam.',
    total: '{n} lote | {n} lotes',
    selected: '{n} selecionado | {n} selecionados',
    selectFiltered: 'Selecionar os {n} do filtro',
    clearSelection: 'Limpar seleção',
    pickerTitle: 'Adicionar lotes ao pacote',
    pickerHint: 'Filtre e marque os lotes. Os que já estão no pacote não aparecem.',
    addSelected: 'Adicionar {n} lote | Adicionar {n} lotes',
    back: 'Lotes',
    imported: 'Importado em'
  },
  lotImport: {
    title: 'Importar lotes',
    intro: 'Envie a planilha de lotes (aba "Matriz de lotes"). Só as colunas de lote são lidas; colunas de preço e as demais são ignoradas. Nada é gravado antes de você confirmar.',
    chooseFile: 'Escolher arquivo',
    reading: 'Lendo a planilha…',
    sheet: 'Aba',
    headerRow: 'Cabeçalho na linha {row}',
    blocked: 'A planilha tem problemas que impedem a importação. Corrija e envie de novo.',
    errorRow: 'Linha {row}',
    summaryTitle: 'O que vai mudar',
    created: 'Lotes novos',
    updated: 'Lotes alterados',
    restored: 'Voltaram à planilha',
    withdrawn: 'Saíram da planilha (ficam como retirados)',
    unchanged: 'Sem mudança',
    statusChanges: 'Mudanças de situação',
    disagreements: 'Vendidos no sistema, mas não na planilha',
    disagreementsHint: 'Continuam vendidos. Atualize a coluna STATUS da planilha.',
    packagesCreated: 'Pacotes automáticos novos (rascunho)',
    packagesUpdated: 'Pacotes automáticos com lotes alterados',
    packagesEmptied: 'Pacotes automáticos que ficam sem lotes',
    lotsChange: '+{added} / −{removed} → {total} lotes',
    more: 'e mais {n}',
    confirm: 'Importar',
    done: 'Importação concluída: {created} novos, {updated} alterados, {withdrawn} retirados, {packages} pacotes novos.',
    nothing: 'Nada muda: a planilha está igual ao sistema.',
    codes: {
      LOT_SHEET_NO_HEADER: 'Não achei o cabeçalho (coluna "Lot Number") nas primeiras linhas desta aba.',
      LOT_SHEET_MISSING_COLUMNS: 'Faltam colunas: {fields}.',
      LOT_SHEET_TOO_MANY_ROWS: 'A aba tem linhas demais.',
      LOT_SHEET_EMPTY: 'A aba não tem lotes.',
      LOT_NUMBER_EMPTY: 'Lote sem número.',
      LOT_NUMBER_DUPLICATE: 'Número de lote repetido ({value}; primeira vez na linha {firstRow}).',
      LOT_TITLE_EMPTY: 'Lote sem descrição (Title / Equipment Description).',
      LOT_STATUS_UNKNOWN: 'STATUS desconhecido: "{value}". Use "Sold", "Collected by court officer" ou deixe vazio.',
      LOT_VALUE_TOO_LONG: 'Texto longo demais em {field} (máximo {max}).'
    }
  },
  attachments: {
    upload: 'Enviar',
    uploading: 'Enviando… {percent}%',
    files: 'Arquivos',
    kind: 'Tipo',
    visibility: 'Visibilidade',
    line: 'Item',
    packageLevel: 'Pacote inteiro',
    title: 'Título',
    titleSingleOnly: 'Título (só para um arquivo)',
    chooseFiles: 'Escolher arquivos',
    dropOrPaste: 'ou arraste para cá, ou cole uma imagem com Ctrl+V',
    maxFiles: 'Até {n} arquivos por envio.',
    readyCount: '{n} arquivo pronto para enviar | {n} arquivos prontos para enviar',
    clearFiles: 'Limpar',
    removeFile: 'Tirar {name} da lista',
    duplicatesSkipped: 'Um arquivo repetido foi ignorado. | {n} arquivos repetidos foram ignorados.',
    overflowSkipped: 'Limite de {max} arquivos por envio: {n} ficaram de fora.',
    proposalRestricted: 'Propostas nunca são públicas.',
    internalNote: 'Interno: só vendedores logados veem, nunca o comprador com link.',
    publicPhotoNote: 'O público vê só as fotos redimensionadas, sem os metadados da câmera.',
    photos: 'Fotos',
    documents: 'Documentos',
    empty: 'Nenhum arquivo ainda.',
    moveUp: 'Subir',
    moveDown: 'Descer',
    makePublic: 'Tornar público',
    makeRestricted: 'Tornar restrito',
    size: 'Tamanho',
    uploadedAt: 'Enviado',
    addFiles: 'Adicionar arquivos',
    addFilesHint: 'Fotos e documentos. Também dá para arrastar arquivos para esta página ou colar uma imagem com Ctrl+V.',
    dropToAdd: 'Solte para adicionar os arquivos',
    uploaded: '{n} arquivo enviado. | {n} arquivos enviados.'
  },
  links: {
    new: 'Novo link de acesso',
    newForPackage: 'Novo link para este pacote',
    edit: 'Editar link de acesso',
    label: 'Comprador / identificação',
    buyerEmail: 'E-mail do comprador',
    note: 'Observação interna',
    expiresAt: 'Válido até',
    packages: 'Pacotes',
    state: 'Situação',
    accesses: 'Acessos',
    lastAccess: 'Último acesso',
    created: 'Criado',
    createdBy: 'por {name}',
    revoke: 'Revogar',
    revokeTitle: 'Revogar link',
    revokeConfirm: 'Revogar o link “{label}”? O comprador perde o acesso na hora.',
    logs: 'Registro de acessos',
    noLogs: 'Nenhum acesso ainda.',
    empty: 'Nenhum link de acesso ainda.',
    createdTitle: 'Link criado',
    createdInfo: 'Envie este link ao comprador. Por segurança ele só aparece agora: copie antes de fechar.',
    noEligible: 'Só pacotes que não estão em rascunho nem inativos podem ser compartilhados.',
    when: 'Quando',
    what: 'O quê',
    from: 'IP / navegador'
  },
  inquiry: {
    title: 'Interessado neste pacote?',
    intro: 'Peça mais informações à nossa equipe comercial. Respondemos por e-mail ou telefone.',
    sellerHint: 'O comprador vê aqui o formulário de pedido e o contato da equipe. Os pedidos chegam em Pedidos.',
    open: 'Pedir informações',
    email: 'Enviar e-mail',
    whatsapp: 'WhatsApp',
    formTitle: 'Pedir informações · {name}',
    fields: { name: 'Nome', company: 'Empresa', email: 'E-mail', phone: 'Telefone / WhatsApp', country: 'País', message: 'Mais informações' },
    contactHint: 'Nenhum campo é obrigatório, mas deixe um e-mail ou um telefone para podermos responder.',
    messagePlaceholder: 'O que você gostaria de saber? Ex.: quantidades, estado, documentos, visita, logística.',
    privacy: 'Usamos estes dados só para responder a este pedido.',
    send: 'Enviar pedido',
    sending: 'Enviando…',
    sent: 'Obrigado. Seu pedido foi enviado e nossa equipe vai entrar em contato em breve.',
    subject: 'Pedido de informações: {name}',
    prefilled: 'Olá, gostaria de mais informações sobre o pacote "{name}".\n{url}'
  },
  inquiries: {
    menu: 'Pedidos',
    title: 'Pedidos de informação',
    help: 'Pedidos enviados pelos compradores na página do pacote. Assuma um pedido para a equipe saber que você está cuidando dele e atualize a situação conforme avança.',
    newBadge: '{n} pedido novo | {n} pedidos novos',
    status: 'Situação',
    open: 'Em aberto',
    statuses: { new: 'Novo', in_progress: 'Em atendimento', done: 'Concluído', discarded: 'Descartado' },
    assignee: 'Responsável',
    mine: 'Meus',
    unassigned: 'Ninguém',
    take: 'Assumir',
    search: 'Nome, empresa, e-mail, mensagem…',
    empty: 'Nenhum pedido aqui.',
    viaLink: 'pelo link “{label}”',
    language: 'site em {lang}',
    packageDeleted: 'pacote excluído',
    noMessage: 'Sem mensagem.',
    note: 'Nota interna',
    noteHint: 'Só a equipe vê (ex.: "liguei na segunda, vou mandar fotos").',
    lastChange: 'Última alteração: {name}, {date}',
    replySubject: 'Re: pedido de informações – {name}',
    deleteTitle: 'Excluir pedido',
    deleteConfirm: 'Excluir o pedido de “{name}”? Use para spam ou dado que não deve ficar guardado.',
    new: 'Novo pedido',
    newHelp: 'Registre um contato que chegou por e-mail, WhatsApp ou telefone, para todo pedido ficar no mesmo lugar.',
    package: 'Pacote',
    choosePackage: 'Escolha o pacote.',
    channel: 'Canal',
    channels: { form: 'Formulário do site', email: 'E-mail', whatsapp: 'WhatsApp', phone: 'Telefone', other: 'Outro' },
    contactHint: 'Deixe um e-mail ou um telefone para a equipe poder responder.',
    replyLanguage: 'Idioma da resposta',
    buyerMessage: 'O que o comprador perguntou',
    registeredBy: 'registrado por {name}',
    created: 'Pedido registrado.',
    outcome: 'Desfecho',
    noOutcome: '—',
    outcomes: { sold: 'Vendido para este comprador', not_pursued: 'Não avançou', no_reply: 'Sem resposta do comprador' },
    deleted: 'Pedido excluído.'
  },
  contact: {
    title: 'Contato comercial',
    help: 'Aparece na página de cada pacote, ao lado do formulário de pedido, com o nome do pacote já preenchido.',
    email: 'E-mail da equipe',
    whatsapp: 'WhatsApp da equipe',
    whatsappHint: 'Número completo, com o código do país.',
    adminOnly: 'Só administradores alteram o contato.',
    saved: 'Contato salvo.'
  },
  how: {
    tab: 'Como funciona',
    title: 'Como o MineRecycle funciona',
    intro: 'Da planilha de lotes até a venda: quem faz cada passo, onde no sistema e o que o comprador vê.',
    expandAll: 'Abrir todos',
    collapseAll: 'Fechar todos',
    where: 'Onde:',
    who: { outside: 'Fora do sistema', seller: 'Vendedor', buyer: 'Comprador' },
    lanes: { prepare: 'Preparação', publish: 'Publicação', serve: 'Atendimento', close: 'Desfecho' },
    steps: {
      sheet: {
        title: 'Planilha de lotes',
        items: {
          a: 'A aba "Matriz de lotes" da planilha de inventário lista os lotes, um por linha, com nº do lote, site, descrição, fornecedor, agrupamentos e STATUS.',
          b: 'A planilha continua sendo mantida fora do sistema. Quando ela muda, basta importar de novo.',
          c: 'Colunas de preço e valor nunca são lidas.'
        }
      },
      importLots: {
        title: 'Importar os lotes',
        items: {
          a: 'Envie a planilha: o sistema mostra o que muda (lotes novos, alterados, retirados, mudanças de situação) e só grava quando você confirma.',
          b: 'Lote que sai da planilha não é apagado: fica como retirado e some do lado público.',
          c: 'STATUS "Sold" marca o lote como vendido; "Collected by court officer" tira o lote da venda.'
        },
        where: 'Lotes → Importar lotes'
      },
      packages: {
        title: 'Montar os pacotes',
        intro: 'O pacote agrupa lotes, e um lote pode estar em vários pacotes.',
        items: {
          a: 'A importação cria um pacote automático (rascunho) para cada valor das colunas Sistema vinculado, Família comercial e Subfamília. Os lotes dele seguem a planilha.',
          b: 'O vendedor monta pacotes manuais com os lotes que quiser ("Novo pacote" e a aba Lotes do pacote).',
          c: 'Pacote de um lote só: "Criar pacote deste lote", na página do lote.',
          d: 'Confira nome, descrição, categoria e origem de cada pacote antes de publicar.'
        },
        where: 'Pacotes e Lotes'
      },
      files: {
        title: 'Fotos e arquivos',
        items: {
          a: 'Fotos, ficha técnica, desenho, lista e proposta, no pacote ou no lote.',
          b: 'Arquivo do lote acompanha o lote em todos os pacotes em que ele estiver.',
          c: 'Cada arquivo tem uma visibilidade: Público (todos), Restrito (comprador com link) ou Interno (só vendedores). Proposta nunca é pública.'
        },
        where: 'Pacote → aba Fotos e arquivos; Lote → Fotos e arquivos'
      },
      activate: {
        title: 'Publicar: situação Ativo',
        items: {
          a: 'Ao mudar para Ativo, o pacote entra no catálogo público: qualquer pessoa vê, sem login.',
          b: 'O catálogo mostra o pacote com os lotes em oferta, fotos e arquivos públicos. Lotes fora da venda não aparecem. Nunca preço.',
          c: 'Pacote sem nenhum lote em oferta não aparece no catálogo.'
        },
        where: 'Pacotes → Mudar situação'
      },
      browse: {
        title: 'Visitante encontra o pacote',
        items: {
          a: 'Busca por nome, descrição, nº do lote, descrição do lote ou fornecedor; filtra por agrupamento, origem e site.',
          b: 'Abre cada lote para ver os dados e as fotos dele.',
          c: 'Vê que há documentos restritos (sem ver quais) e pode pedir acesso.'
        },
        where: 'Catálogo (página inicial)'
      },
      link: {
        title: 'Link do comprador',
        intro: 'Opcional, para comprador qualificado. Pode vir antes ou durante o atendimento.',
        items: {
          a: 'Escolha os pacotes e a validade (até um ano). O comprador vê os arquivos restritos do pacote e dos lotes, e a proposta.',
          b: 'Cada acesso fica registrado. O link pode ser revogado na hora.'
        },
        where: 'Links de acesso'
      },
      ask: {
        title: 'Comprador pede informações',
        items: {
          a: 'Formulário na página do pacote: vira um pedido Novo na aba Pedidos.',
          b: 'E-mail ou WhatsApp da equipe, com o pacote já no texto: a conversa acontece fora do sistema.',
          c: 'Pacote vendido, ou com todos os lotes já vendidos, não recebe pedido.'
        },
        where: 'Página do pacote → "Interessado neste pacote?"'
      },
      direct: {
        title: 'Registrar contato direto',
        items: {
          a: 'Contato por e-mail, WhatsApp ou telefone: o vendedor registra em "Novo pedido", escolhendo o pacote e o canal.',
          b: 'Assim todo atendimento fica no mesmo lugar.'
        },
        where: 'Pedidos → Novo pedido'
      },
      take: {
        title: 'Assumir o pedido',
        items: {
          a: '"Assumir" torna você o responsável e passa o pedido para Em atendimento.',
          b: 'O responsável é um usuário do sistema e pode ser trocado. A nota interna registra o que foi feito.'
        },
        where: 'Pedidos'
      },
      negotiate: {
        title: 'Pacote em negociação',
        items: {
          a: 'Quando a conversa avança, mude a situação do pacote para Em negociação.',
          b: 'No catálogo, ele só aparece com a caixa "Mostrar pacotes em negociação". Outros compradores ainda podem pedir informações.'
        },
        where: 'Pacotes → Mudar situação'
      },
      outcome: {
        title: 'Registrar o desfecho',
        items: {
          a: 'Escolha o desfecho: vendido para este comprador, não avançou ou sem resposta. O pedido fica Concluído.',
          b: 'Sem valor nem preço: só o desfecho e a nota.'
        },
        where: 'Pedidos → Desfecho'
      },
      package: {
        title: 'Vender o pacote',
        items: {
          a: 'Quem é vendido é o pacote: ao marcar Vendido, todos os lotes dele passam a vendidos, em todos os pacotes em que aparecem.',
          b: 'Se algum lote já tinha sido vendido (por outro pacote ou pela planilha), o sistema avisa e pede confirmação.',
          c: 'Desfazer a venda (voltar para Ativo) libera só os lotes vendidos por este pacote.',
          d: 'Pacote vendido sai do catálogo e deixa de receber pedidos; o comprador com link ainda o vê.'
        },
        where: 'Pacotes → Mudar situação'
      },
      others: {
        title: 'Fechar o resto',
        items: {
          a: 'Responda e conclua os outros pedidos em aberto sobre o pacote vendido.',
          b: 'Revise os pacotes que tinham os mesmos lotes: os lotes aparecem vendidos neles.',
          c: 'Atualize a coluna STATUS da planilha, para a próxima importação concordar com o sistema.'
        },
        where: 'Pedidos, Pacotes e a planilha'
      }
    },
    states: {
      title: 'Situação do pacote: quem vê o quê',
      intro: 'A situação decide se o pacote aparece no catálogo, para o comprador com link e se recebe pedidos.',
      status: 'Situação',
      catalog: 'Catálogo',
      link: 'Link do comprador',
      requests: 'Pedidos',
      withToggle: 'Com a caixa marcada',
      path: 'Caminho comum: Rascunho → Ativo → Em negociação → Vendido. Se a negociação não avança, volta para Ativo.'
    }
  },
  origins: {
    title: 'Origens',
    help: 'De onde vieram os ativos do pacote (diferente de Local, que é onde estão hoje). Cada pacote tem uma origem.',
    new: 'Nova origem',
    edit: 'Editar origem',
    name: 'Nome',
    code: 'Sigla',
    codeHint: 'Até 10 letras, números ou hífen.',
    active: 'Ativa',
    inactive: 'inativa',
    packages: 'Pacotes',
    adminOnly: 'Só administradores incluem e editam origens.',
    inactiveHint: 'Origem inativa deixa de ser oferecida no cadastro de pacote, mas continua nos pacotes que já a usam.',
    saved: 'Origem salva.'
  },
  filters: {
    title: 'Filtros',
    searchPlaceholder: 'Buscar por pacote, lote, fornecedor ou descrição',
    clearSearch: 'Limpar busca',
    button: 'Filtros',
    type: 'Tipo',
    origin: 'Origem',
    level: 'Agrupamento',
    site: 'Site',
    all: 'Todos',
    types: { bulk: 'A granel', equipment: 'Equipamentos' },
    count: 'nenhum pacote | 1 pacote | {n} pacotes',
    showNegotiation: 'Mostrar pacotes em negociação',
    clear: 'Limpar filtros'
  },
  users: {
    name: 'Nome',
    email: 'E-mail',
    role: 'Papel',
    active: 'Ativo',
    lastLogin: 'Último acesso',
    newUser: 'Novo usuário',
    password: 'Senha',
    newPassword: 'Nova senha (em branco para manter)',
    passwordHint: 'Pelo menos 9 caracteres.',
    delete: 'Excluir usuário',
    deleteTitle: 'Excluir usuário',
    deleteConfirm: '“{name}” sai da lista e perde o acesso na hora. O histórico dele fica guardado. Para voltar, inclua de novo o mesmo e-mail.',
    deleted: 'Usuário excluído.',
    reactivated: 'Este e-mail pertencia a um usuário excluído. Ele foi reativado com os dados informados.'
  },
  account: {
    changePassword: 'Trocar senha',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    changed: 'Senha trocada.'
  },
  // Ajuda da área do vendedor (HelpView.vue). Sem chaves, arroba nem barra vertical: são sintaxe do vue-i18n.
  guide: {
    tab: 'Guia do MineRecycle',
    title: 'Guia do MineRecycle',
    intro: 'Como o sistema está organizado, de onde vêm os dados e as regras que valem para todos.',
    goToImport: 'Ver como importar a planilha de lotes',
    sections: {
      overview: {
        title: 'O que é o MineRecycle',
        intro:
          'Plataforma temporária que conecta vendedores e compradores dos ativos de um projeto de mineração paralisado. O comprador conhece os pacotes pelo catálogo ou por um link de acesso e negocia direto com a equipe de vendas.',
        items: {
          a: 'Não há preço na plataforma: nem campo, nem tela, nem arquivo público com valor.',
          b: 'O site é em inglês, com português como opção. Nomes, descrições e lotes cadastrados não são traduzidos.',
          c: 'Uma equipe só de vendedores: todos podem editar todos os pacotes e lotes, cada um com o seu login.'
        }
      },
      source: {
        title: 'De onde vêm os dados',
        intro:
          'A fonte é a planilha de inventário do cliente, aba "Matriz de lotes". O sistema lê só as colunas de lote dessa aba; as outras colunas e abas, inclusive as de preço e valor, são ignoradas.',
        items: {
          a: 'A planilha continua sendo mantida fora do sistema. Importar de novo atualiza os lotes; nada é gravado antes da confirmação.',
          b: 'Os dados que vêm da planilha só mudam pela importação. O vendedor acrescenta a sua descrição, fotos e arquivos, que a importação não apaga.'
        }
      },
      lots: {
        title: 'Lotes',
        intro: 'O lote é a menor unidade: cada linha da planilha é um lote, identificado pelo nº do lote.',
        rows: {
          number: { term: 'Lote', text: 'Nº do lote na planilha. Não se repete e é a chave da reimportação.' },
          data: { term: 'Dados da planilha', text: 'Site (como está na planilha), descrição, fornecedor, sistema vinculado, família comercial e subfamília.' },
          available: { term: 'Disponível', text: 'À venda nos pacotes em que estiver.' },
          sold: { term: 'Vendido', text: 'Pela planilha (STATUS "Sold") ou pela venda de um pacote que o contém. Aparece com o selo de vendido em todos os pacotes. A planilha nunca tira um lote de vendido.' },
          unavailable: { term: 'Fora da venda', text: 'STATUS "Collected by court officer". Some do lado público; o vendedor continua vendo.' },
          withdrawn: { term: 'Retirado', text: 'Saiu da planilha. Não é apagado (guarda arquivos e histórico) e volta se reaparecer numa importação.' }
        }
      },
      packages: {
        title: 'Pacotes',
        intro: 'O pacote é o que se vende: agrupa lotes, e um lote pode estar em vários pacotes.',
        rows: {
          automatic: {
            term: 'Automático',
            text: 'Um por valor das colunas Sistema vinculado, Família comercial e Subfamília, criado pela importação como rascunho, com o valor como nome. Os lotes seguem a planilha; o vendedor edita nome, descrição e o resto, mas não os lotes.'
          },
          manual: { term: 'Manual', text: 'Montado pelo vendedor com os lotes que quiser. Inclui o pacote de um lote só ("Criar pacote deste lote").' },
          id: { term: 'ID', text: 'Número do pacote, gerado ao criar e fixo depois. É o endereço público ("#12") e aparece para todos.' },
          name: { term: 'Nome e descrição', text: 'O que o comprador vê. Em inglês, como o resto do site.' },
          origin: { term: 'Origem', text: 'De onde vieram os ativos (cadastro em Configuração). Opcional.' }
        },
        items: {
          a: 'Pacote automático que fica sem lotes (o valor saiu da planilha) não aparece no catálogo e pode ser excluído.',
          b: 'Pacote vendido não muda de lotes e não pode ser excluído.'
        }
      },
      sale: {
        title: 'Venda',
        items: {
          a: 'Marcar o pacote como Vendido marca todos os seus lotes como vendidos, em todos os pacotes.',
          b: 'Se algum lote já estava vendido, o sistema mostra quais e pede confirmação.',
          c: 'Desfazer a venda libera só os lotes vendidos por este pacote. Os vendidos pela planilha ou por outro pacote continuam vendidos.',
          d: 'Lote fora da venda ou retirado não é vendido junto.',
          e: 'Depois da venda, atualize a coluna STATUS da planilha. A importação avisa quando o sistema e a planilha discordam.'
        }
      },
      files: {
        title: 'Fotos e arquivos',
        rows: {
          public: { term: 'Público', text: 'Qualquer visitante vê, quando o pacote está no catálogo.' },
          restricted: { term: 'Restrito', text: 'Só quem tem link de acesso ao pacote, além dos vendedores.' },
          internal: { term: 'Interno', text: 'Só vendedores logados.' }
        },
        items: {
          a: 'Fotos ganham uma versão para a web e uma miniatura, sem metadados. O público nunca recebe o arquivo original de uma foto, que pode ter localização GPS.',
          b: 'Proposta nunca é pública: fica restrita ou interna.',
          c: 'Um arquivo pode ser do pacote (galeria e capa do catálogo) ou do lote. O do lote acompanha o lote em todos os pacotes; quem vê é decidido pelo melhor acesso entre esses pacotes.',
          d: 'Antes de enviar um PDF, confira se ele tem preço, valor ou nome de comprador. Se tiver, use Interno.',
          e: 'Para enviar: clique em Adicionar arquivos, ou arraste os arquivos para a página, ou cole uma imagem com Ctrl+V (um print, por exemplo); as três formas abrem a janela de envio. Confira a lista e clique em Enviar. Cancelar descarta a lista.'
        }
      },
      access: {
        title: 'Quem vê o quê',
        rows: {
          visitor: {
            term: 'Visitante',
            text: 'O catálogo: pacotes ativos e, com a caixa "Mostrar pacotes em negociação" marcada, os em negociação, com os lotes em oferta e os arquivos públicos. Vendidos e rascunhos nunca aparecem.'
          },
          buyer: {
            term: 'Comprador com link',
            text: 'Os pacotes do link, menos rascunho e inativo (vendidos aparecem: podem ser dele), com os arquivos públicos e restritos do pacote e dos lotes. O link vale até a data definida (no máximo um ano) e pode ser revogado a qualquer momento.'
          },
          seller: { term: 'Vendedor', text: 'Tudo: todos os pacotes e situações, todos os lotes (inclusive retirados e fora da venda) e os arquivos internos.' },
          admin: { term: 'Administrador', text: 'O mesmo que o vendedor, mais a gestão de usuários, o cadastro de origens e o contato comercial (Configuração).' }
        }
      },
      inquiries: {
        title: 'Pedidos dos compradores',
        intro:
          'O comprador pede informações na página do pacote: pelo formulário de pedido, por e-mail ou por WhatsApp. O e-mail e o WhatsApp são os da equipe, definidos em Configuração.',
        rows: {
          form: {
            term: 'Formulário de pedido',
            text: 'Nome, empresa, e-mail, telefone, país e "Mais informações". Nenhum campo é obrigatório sozinho, mas o comprador deixa um e-mail ou um telefone. Um pacote por pedido. Não há campo de preço nem de oferta.'
          },
          where: {
            term: 'Quem pode pedir',
            text: 'Visitantes (catálogo) e compradores com link. Pacote vendido, ou com todos os lotes já vendidos, não recebe pedido. Pedido enviado por um link mostra o nome do link.'
          },
          panel: {
            term: 'Aba Pedidos',
            text: 'Todo pedido cai lá, com um contador de novos na aba. Ainda não há aviso por e-mail: confira a aba todo dia.'
          },
          take: {
            term: 'Assumir',
            text: 'Torna você o responsável e passa o pedido novo para Em atendimento. O responsável pode ser trocado para qualquer pessoa da equipe.'
          },
          direct: {
            term: 'Contato direto',
            text: 'Pedido que chegou por e-mail, WhatsApp ou telefone é registrado à mão em "Novo pedido", com o canal. Ele começa Em atendimento, com você como responsável.'
          },
          outcome: {
            term: 'Desfecho',
            text: 'Com o pedido Concluído, escolha o desfecho: vendido para este comprador, não avançou ou sem resposta. Escolher o desfecho conclui o pedido. Sem valor nem preço.'
          },
          status: {
            term: 'Situação',
            text: 'Novo (ninguém assumiu), Em atendimento, Concluído (respondido) ou Descartado (spam ou sem sentido). A nota interna registra o que foi feito; a última alteração mostra quem e quando.'
          }
        },
        items: {
          a: 'Responda no idioma em que o comprador usava o site (aparece no pedido).',
          b: 'Pedidos têm dados pessoais: use só para responder e exclua o spam.',
          c: 'E-mails e mensagens de WhatsApp enviados direto só aparecem na aba Pedidos depois que alguém os registra em Novo pedido.'
        }
      },
      rules: {
        title: 'Regras que valem sempre',
        items: {
          a: 'Nenhum preço, valor ou nome de comprador entra no cadastro, nos lotes ou em arquivo público.',
          b: 'Os dados do cliente são confidenciais. A planilha e os documentos entram só pelas telas do sistema.',
          c: 'A planilha manda nos dados dos lotes e nos lotes dos pacotes automáticos; o sistema manda na venda dos pacotes.',
          d: 'Na dúvida sobre um lote ou um agrupamento, corrija a planilha e importe de novo, em vez de contornar no sistema.'
        }
      }
    }
  },
  help: {
    menu: 'Ajuda',
    tab: 'Importar lotes',
    title: 'Ajuda: importar a planilha de lotes',
    intro: 'Como a planilha de lotes é lida, o que cada coluna vira no sistema e o que acontece ao importar de novo.',
    contents: 'Nesta página',
    sheet: {
      title: '1. A planilha',
      intro: 'Use a planilha de inventário do cliente (.xlsx, .xlsm ou .xls). O sistema abre a aba "Matriz de lotes"; se ela não existir, a primeira aba, e você pode escolher outra na prévia.',
      items: {
        a: 'O cabeçalho pode estar em qualquer uma das 30 primeiras linhas e as colunas podem estar em qualquer ordem: o sistema acha cada coluna pelo nome.',
        b: 'As 8 colunas da tabela abaixo são obrigatórias. Coluna faltando impede a importação, para não apagar um campo em todos os lotes.',
        c: 'Todas as outras colunas são ignoradas, inclusive as de preço e valor.'
      }
    },
    upload: {
      title: '2. Importar',
      steps: {
        s1: 'Em Lotes, clique em Importar lotes e escolha o arquivo.',
        s2: 'Confira a prévia: lotes novos, alterados, retirados, mudanças de situação e pacotes automáticos novos ou alterados.',
        s3: 'Se a prévia mostrar erros (nº de lote repetido ou vazio, STATUS desconhecido, coluna faltando), corrija a planilha e envie de novo.',
        s4: 'Clique em Importar. Se alguém mudou os lotes depois da prévia, o sistema pede para conferir de novo.'
      },
      goToLots: 'Ir para Lotes'
    },
    fields: {
      title: 'Colunas lidas',
      colColumn: 'Coluna na planilha',
      colField: 'No sistema',
      colNotes: 'Observações',
      notes: {
        lotNumber: 'Chave do lote: não pode faltar nem se repetir. É por ele que a reimportação acha o lote.',
        siteName: 'Mostrado como está na planilha, também para o comprador.',
        title: 'Obrigatória em cada linha.',
        masterSupplier: 'Opcional.',
        linkedSystem: 'Cada valor vira um pacote automático.',
        commercialFamily: 'Cada valor vira um pacote automático.',
        subfamily: 'Cada valor vira um pacote automático.',
        status: 'Vazio ou "Available": disponível. "Sold": vendido. "Collected by court officer": fora da venda. Outro valor impede a importação.'
      },
      discarded: 'Os nomes das colunas são comparados sem acento, maiúsculas ou pontuação, e alguns sinônimos em inglês e português também são aceitos.'
    },
    after: {
      title: '3. Importar de novo',
      items: {
        a: 'Importar a mesma planilha não muda nada. Lote alterado na planilha é atualizado; lote novo é criado.',
        b: 'Lote que saiu da planilha fica como retirado (some do lado público) e volta se reaparecer.',
        c: 'A planilha só marca um lote como vendido, nunca desfaz: se o sistema tem um lote vendido que a planilha não tem, a prévia avisa e ele continua vendido.',
        d: 'Os pacotes automáticos acompanham a planilha: ganham e perdem lotes. O que ficar sem lotes sai do catálogo e pode ser excluído. Lote novo num pacote automático já vendido entra vendido.',
        e: 'Descrição do vendedor, fotos, arquivos e pacotes manuais nunca são apagados pela importação.',
        f: 'Exportar lotes (tela Lotes) gera a planilha de todos os lotes neste mesmo formato. O STATUS sai como a planilha disse, não como o sistema; a situação no sistema e os pacotes vêm em colunas à parte, que a importação ignora.'
      }
    }
  },
  errors: {
    PACKAGE_SALE_CONFIRM: 'Há lotes deste pacote já vendidos. Confirme para marcar o pacote como vendido.',
    PACKAGE_LOTS_AUTOMATIC: 'Os lotes deste pacote vêm da planilha: mude pela importação de lotes.',
    PACKAGE_SOLD_LOCKED: 'Pacote vendido não muda de lotes nem pode ser excluído.',
    PACKAGE_AUTOMATIC_NOT_EMPTY: 'Pacote automático só pode ser excluído quando a planilha não tiver mais lotes para ele.',
    PACKAGE_EMPTY: 'Um pacote sem lotes não pode ser vendido.',
    IMPORT_STALE: 'Os lotes mudaram depois da prévia. Confira a importação de novo.',
    INQUIRY_CONTACT_REQUIRED: 'Informe um e-mail ou um telefone para podermos responder.',
    INQUIRY_NOT_ALLOWED: 'Este pacote não recebe mais pedidos.',
    EMAIL_INVALID: 'Confira o endereço de e-mail.',
    WHATSAPP_INVALID: 'Informe o número completo do WhatsApp, com o código do país.',
    generic: 'Algo deu errado. Tente de novo.',
    network: 'Não foi possível falar com o servidor.',
    INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
    TOO_MANY_REQUESTS: 'Tentativas demais. Aguarde alguns minutos.',
    UNAUTHORIZED: 'Sua sessão expirou. Entre de novo.',
    FORBIDDEN: 'Você não tem permissão para esta ação.',
    NOT_FOUND: 'Não encontrado.',
    LINK_INVALID: 'Este link de acesso não é válido. Confira se usou o link completo.',
    LINK_EXPIRED: 'Este link de acesso expirou. Peça um novo ao vendedor.',
    LINK_REVOKED: 'Este link de acesso foi revogado. Fale com o vendedor.',
    NUMBER_TAKEN: 'Já existe um pacote com este ID.',
    NUMBER_LOCKED: 'O ID do pacote não pode ser alterado.',
    PACKAGE_IMPORT_STALE: 'Os pacotes mudaram depois da verificação. Verifique o arquivo de novo.',
    PACKAGE_IMPORT_HAS_ERRORS: 'O arquivo tem problemas que impedem a importação.',
    PACKAGE_IMPORT_CONFIRM: 'Confirme todos os avisos antes de importar.',
    STOR_FOLDER_TAKEN: 'Outro pacote já usa esta pasta do STOR.',
    IMPORT_DOCUMENT_PENDING: 'Esta planilha está pendente de validação. Confirme para importar mesmo assim.',
    ITEM_NO_TAKEN: 'Este nº de item já existe no pacote.',
    USER_DELETE_SELF: 'Você não pode excluir o seu próprio usuário.',
    ORIGIN_CODE_TAKEN: 'Já existe uma origem com esta sigla.',
    ORIGIN_INACTIVE: 'Esta origem está inativa. Escolha uma origem ativa.',
    ORIGIN_INVALID: 'Escolha a origem do pacote.',
    EMAIL_TAKEN: 'Já existe um usuário com este e-mail.',
    PAYLOAD_TOO_LARGE: 'Arquivo grande demais.',
    IMPORT_FILE_TYPE: 'Envie um arquivo Excel (.xlsx, .xlsm ou .xls).',
    IMPORT_UNREADABLE: 'Não foi possível ler a planilha.',
    IMPORT_NOT_FOUND: 'Esta importação expirou. Envie o arquivo de novo.',
    IMPORT_MAPPING_INVALID: 'Confira as colunas: falta a coluna de um campo obrigatório ou a mesma coluna está em dois campos.',
    IMPORT_HAS_ERRORS: 'A planilha tem problemas que impedem a importação.',
    IMPORT_EMPTY: 'Não há linhas válidas para importar.'
  },
  notFound: {
    title: 'Página não encontrada',
    back: 'Voltar ao catálogo'
  }
}
