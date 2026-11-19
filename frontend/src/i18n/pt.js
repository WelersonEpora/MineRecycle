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
    lines: 'nenhum item | 1 item | {n} itens',
    packageId: 'ID do pacote',
    viewPackage: 'Ver pacote',
    highlight: { weight: 'peso total', units: 'unidade | unidade | unidades', items: 'item | item | itens' }
  },
  package: {
    number: 'Pacote {number}',
    description: 'Descrição',
    photos: 'Fotos',
    documents: 'Documentos',
    noDocuments: 'Nenhum documento disponível.',
    items: 'Itens',
    restrictedHint:
      'Há documentação restrita deste pacote ({n} arquivo) disponível para compradores qualificados por link de acesso. | Há documentação restrita deste pacote ({n} arquivos) disponível para compradores qualificados por link de acesso.',
    buyerBanner: 'Você está vendo este pacote pelo link de acesso “{label}”, válido até {date}. Os documentos restritos estão incluídos.',
    sellerBanner: 'Você entrou como vendedor: tudo fica visível, inclusive os arquivos restritos.',
    editInSellerArea: 'Editar na área do vendedor',
    restricted: 'Restrito',
    lineFiles: 'Arquivos deste item',
    noPhotos: 'Ainda sem fotos.'
  },
  lines: {
    itemNo: 'Item',
    description: 'Descrição',
    quantity: 'Qtde',
    unit: 'Unid.',
    storCode: 'Código STOR',
    tag: 'Tag',
    warehouseLocation: 'Localização no almoxarifado',
    parent: 'Item pai',
    files: 'Arquivos',
    searchPlaceholder: 'Buscar descrição, item, código STOR ou tag',
    empty: 'Nenhum item.',
    total: '{n} itens'
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
    packages: 'Pacotes',
    accessLinks: 'Links de acesso',
    settings: 'Configuração',
    users: 'Usuários',
    account: 'Minha conta',
    newPackage: 'Novo pacote',
    storShort: 'Doc.',
    exportPackages: 'Exportar pacotes',
    exportPackage: 'Exportar pacote',
    pendingShort: 'pendente',
    lineCount: 'Itens',
    attachmentCount: 'Arquivos',
    updated: 'Atualizado',
    noPackages: 'Nenhum pacote ainda.',
    viewPublic: 'Ver página',
    tabs: { details: 'Dados', lines: 'Itens', attachments: 'Fotos e arquivos', links: 'Links de acesso' },
    fields: {
      number: 'ID',
      numberHint: 'Identificação do pacote, usada no endereço da página pública. Preenchido sozinho; o comprador não o vê. Não muda depois de criado.',
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
      originHint: 'De onde vieram os ativos. É diferente de Local, que diz onde estão hoje.',
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
    deletePackageConfirm: 'O pacote “{name}” será excluído com todos os itens, fotos e arquivos. Não dá para desfazer.',
    addLine: 'Adicionar item',
    editLine: 'Editar item',
    importSpreadsheet: 'Importar itens',
    deleteLineTitle: 'Excluir item',
    deleteLineConfirm: 'Excluir o item {itemNo}?',
    unitHint: 'Normalizada automaticamente (UN, pç → PC; MT → M…)'
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
  import: {
    title: 'Importar itens',
    step1: '1. Arquivo',
    step2: '2. Colunas',
    step3: '3. Conferência',
    chooseFile: 'Escolha um arquivo Excel (.xlsx ou .xls). Os itens atuais deste pacote serão substituídos.',
    readFile: 'Ler arquivo',
    sheet: 'Aba',
    headerRow: 'Linha do cabeçalho',
    headerRowHint: 'Linha da planilha com os títulos das colunas (as linhas acima dela são ignoradas).',
    previewTitle: 'Primeiras linhas da aba',
    mapping: 'Qual coluna tem cada campo?',
    fieldHelp: 'O que vai no campo {field}',
    required: 'obrigatório',
    notMapped: '— não usar —',
    inferHierarchy: 'Detectar kits pela numeração (1.1 e 1.2 pertencem a 1)',
    numberRows: 'A planilha não tem nº do item: numerar pela ordem das linhas (1, 2, 3…)',
    numberRowsHint: 'Numa reimportação, os arquivos ligados a itens seguem o número. Se a ordem das linhas mudar, a foto do item 5 passa para a nova linha 5.',
    mappingMissing: 'Escolha a coluna de: {fields}.',
    mappingMissingItem: 'Escolha a coluna de: {fields}. Se a planilha não tem nº do item, marque “numerar pela ordem das linhas”.',
    mappingDuplicate: 'A mesma coluna está em “{a}” e em “{b}”. Escolha uma coluna diferente para cada campo.',
    keepFile: 'Guardar a planilha como arquivo interno do pacote (só vendedores, nunca o comprador)',
    check: 'Conferir',
    summary: '{valid} linhas válidas de {total}. {invalid} linhas com erro. {children} subitens.',
    unknownUnits: 'Unidades não reconhecidas (mantidas como escritas):',
    replaceWarning: 'Este pacote tem {n} itens hoje. Todos serão substituídos.',
    linkedWarning: '{n} arquivos estão ligados a itens: continuam no mesmo nº de item, se ele ainda existir.',
    errors: 'Erros',
    warnings: 'Avisos',
    row: 'Linha',
    field: 'Campo',
    problem: 'Problema',
    moreNotShown: '… e mais {n}',
    skipInvalid: 'Importar as linhas válidas e pular as linhas com erro',
    commit: 'Importar {n} itens',
    done: '{n} itens importados.',
    sampleLines: 'Prévia dos itens importados',
    stor: {
      thisPackage: 'Planilha {code}: é deste pacote ({name}).',
      otherPackage: 'A planilha {code} está cadastrada em outro pacote: {packages}. Confira se abriu o pacote certo.',
      confirmOther: 'Importar mesmo assim neste pacote',
      pending: 'A planilha {code} está marcada como pendente de validação: ainda não deveria ser importada.',
      confirmPending: 'Sei que está pendente e quero importar mesmo assim',
      notLinked: 'A planilha {code} ainda não está ligada a nenhum pacote.',
      addToPackage: 'Ligar o código {code} a este pacote ao importar',
      noCode: 'O nome do arquivo não começa com um código do STOR. Confira se a planilha é deste pacote.'
    },
    codes: {
      item_no_missing: 'Nº do item vazio',
      item_no_duplicate: 'Nº do item repetido',
      description_missing: 'Descrição vazia',
      quantity_invalid: 'Quantidade não é número',
      quantity_negative: 'Quantidade negativa',
      quantity_too_large: 'Quantidade grande demais',
      quantity_missing: 'Quantidade vazia',
      quantity_rounded: 'Quantidade arredondada para 4 casas',
      quantity_ambiguous: 'Número ambíguo (lido no formato brasileiro)',
      unit_missing: 'Unidade vazia',
      unit_unknown: 'Unidade não reconhecida',
      too_long: 'Valor longo demais',
      truncated: 'Valor cortado',
      too_many_rows: 'Linhas demais'
    }
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
    intro: 'Do pacote no STOR até a venda: quem faz cada passo, onde no sistema e o que o comprador vê.',
    expandAll: 'Abrir todos',
    collapseAll: 'Fechar todos',
    where: 'Onde:',
    who: { outside: 'Fora do sistema', seller: 'Vendedor', buyer: 'Comprador' },
    lanes: { prepare: 'Preparação', publish: 'Publicação', serve: 'Atendimento', close: 'Desfecho' },
    steps: {
      stor: {
        title: 'Pacote no STOR',
        items: {
          a: 'Cada pacote tem uma pasta no STOR, com a planilha de itens e as fotos.',
          b: 'O código de 7 dígitos no início do nome da planilha identifica o documento.',
          c: 'Planilhas com preço ou valor ficam só no computador: nunca entram no sistema.'
        }
      },
      register: {
        title: 'Cadastro do pacote',
        intro: 'Os 22 pacotes já chegam cadastrados como Rascunho, com nome público, pasta no STOR, números, tipo, categoria, origem, locais e códigos STOR.',
        items: { a: 'O vendedor confere os dados e escreve a descrição.', b: 'Pacote fora da lista: botão "Novo pacote".' },
        where: 'Pacotes → aba Detalhes'
      },
      import: {
        title: 'Importar os itens',
        items: {
          a: 'Baixe a planilha do STOR e importe no pacote. O sistema lê o código no nome do arquivo e confere se a planilha é deste pacote.',
          b: 'Confira o cabeçalho, as colunas e o relatório antes de gravar.',
          c: 'Uma planilha por pacote. Importar de novo substitui os itens.',
          d: 'Planilha pendente de validação pede confirmação. Pacote sem planilha (Steel Structure): itens à mão.'
        },
        where: 'Pacotes → aba Itens → Importar itens'
      },
      files: {
        title: 'Fotos e arquivos',
        items: {
          a: 'Fotos, ficha técnica, desenho, lista e proposta, no pacote ou num item.',
          b: 'Cada arquivo tem uma visibilidade: Público (todos), Restrito (comprador com link) ou Interno (só vendedores).',
          c: 'Proposta nunca é pública. A primeira foto pública vira a capa no catálogo.'
        },
        where: 'Pacotes → aba Fotos e arquivos'
      },
      activate: {
        title: 'Publicar: situação Ativo',
        items: {
          a: 'Ao mudar para Ativo, o pacote entra no catálogo público: qualquer pessoa vê, sem login.',
          b: 'O catálogo mostra nome, descrição, itens, fotos e arquivos públicos. Nunca preço.'
        },
        where: 'Pacotes → Mudar situação'
      },
      browse: {
        title: 'Visitante encontra o pacote',
        items: {
          a: 'Busca por nome, descrição ou item; filtra por tipo, origem e local.',
          b: 'Vê que há documentos restritos (sem ver quais) e pode pedir acesso.'
        },
        where: 'Catálogo (página inicial)'
      },
      link: {
        title: 'Link do comprador',
        intro: 'Opcional, para comprador qualificado. Pode vir antes ou durante o atendimento.',
        items: {
          a: 'Escolha os pacotes e a validade (até um ano). O comprador vê os arquivos restritos e a proposta.',
          b: 'Cada acesso fica registrado. O link pode ser revogado na hora.'
        },
        where: 'Links de acesso'
      },
      ask: {
        title: 'Comprador pede informações',
        items: {
          a: 'Formulário na página do pacote: vira um pedido Novo na aba Pedidos.',
          b: 'E-mail ou WhatsApp da equipe, com o pacote já no texto: a conversa acontece fora do sistema.',
          c: 'Pacote vendido não recebe pedido.'
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
        title: 'Atualizar o pacote',
        items: {
          a: 'Vendido: sai do catálogo e deixa de receber pedidos. O comprador com link ainda o vê.',
          b: 'Ativo: a negociação não avançou e o pacote volta ao catálogo.',
          c: 'Inativo: retirado por outro motivo. Ninguém fora da equipe vê.'
        },
        where: 'Pacotes → Mudar situação'
      },
      others: {
        title: 'Fechar os outros pedidos',
        items: {
          a: 'Pacote vendido: responda e conclua os outros pedidos em aberto sobre ele.',
          b: 'Revogue os links de comprador que não fazem mais sentido.'
        },
        where: 'Pedidos (busca pelo pacote) e Links de acesso'
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
    searchPlaceholder: 'Buscar por pacote, item ou descrição',
    clearSearch: 'Limpar busca',
    button: 'Filtros',
    type: 'Tipo',
    origin: 'Origem',
    location: 'Local',
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
    intro: 'Como o sistema está organizado, de onde vêm os dados dos pacotes e as regras que valem para todos.',
    goToImport: 'Ver o passo a passo da carga de planilhas',
    sections: {
      overview: {
        title: 'O que é o MineRecycle',
        intro:
          'Plataforma temporária que conecta vendedores e compradores dos ativos de um projeto de mineração paralisado. O comprador conhece os pacotes pelo catálogo ou por um link de acesso e negocia direto com a equipe de vendas.',
        items: {
          a: 'Não há preço na plataforma: nem campo, nem tela, nem arquivo público com valor.',
          b: 'O site é em inglês, com português como opção. Nomes, descrições e itens cadastrados não são traduzidos.',
          c: 'Uma equipe só de vendedores: todos podem editar todos os pacotes, cada um com o seu login.'
        }
      },
      scope: {
        title: 'Por que não são 60 mil itens',
        conclusion:
          'O site mostra os 22 pacotes de venda, cada um com a sua própria lista de itens. Ele não mostra os cerca de 60 mil itens do projeto.',
        status: 'É uma conclusão sustentada por evidências, ainda não confirmada pelo cliente.',
        startTitle: 'Ponto de partida',
        start:
          'A informação inicial era que o cliente tinha uma planilha com cerca de 60 mil itens, formando cerca de mil lotes, e que o dado mais confiável estaria no STOR.',
        evidenceTitle: 'Evidências, na ordem em que apareceram',
        evidence: {
          e1: 'Os 60 mil são o projeto, não o estoque. O número aparece no cadastro de itens (61.246) e na árvore da Planta de Processo (61.835 linhas). Nessas bases há cerca de 36 mil itens na etapa "Inicial" (especificados e nunca finalizados), cerca de 2 mil serviços, cerca de 3.600 linhas de matéria-prima e itens de catálogo criados em 2015, antes do projeto. Não há quantidade em estoque nem localização.',
          e2: 'O recebido é muito menos. O ramo "Recebimento de Materiais" (item 443815) tem cerca de 3.650 itens, organizados por fornecedor e contrato. O projeto parou no meio da obra.',
          e3: 'O inventário físico confirma a ordem de grandeza. A planilha "Inventário Almoxarifado" (documento 1810554) tem 14.144 linhas contadas, com endereço de armazenagem e a chave "Nº STOR".',
          e4: 'A venda é organizada em pacotes. Em Documento > Suprimentos/Supply > Projeto Araguaia - ANM > Assets Sales > Packages há 24 pastas de pacote. A matriz de responsabilidades do cliente (documento 1808732) descreve o processo como organizar os ativos em pacotes e compilar uma lista de materiais por pacote.',
          e5: 'Estrutura metálica é vendida a peso. A planilha do pacote (1809537) é uma linha, com toneladas. A maior parte do inventário é estrutura metálica, que não precisa aparecer peça a peça.',
          e6: 'As listas de venda são independentes do STOR. A lista de material elétrico (1809601) tem 561 linhas, foi escrita à mão, não tem código STOR, e nenhuma das descrições bate com o cadastro, o inventário ou o ERP.'
        },
        factsTitle: 'Fato e inferência',
        colClaim: 'Afirmação',
        colBasis: 'Base',
        facts: {
          f1: { claim: 'Os 60 mil incluem itens nunca comprados, serviços e matéria-prima', basis: 'Visto nos dados' },
          f2: { claim: 'Fisicamente existem cerca de 14 mil linhas', basis: 'Inventário do cliente' },
          f3: { claim: 'A venda é por pacote', basis: 'Pastas e documento de processo do cliente' },
          f4: {
            claim: 'Cada pacote tem lista própria, independente do STOR',
            basis: 'Testado em um pacote; nos demais, pelo formato das planilhas'
          },
          f5: { claim: 'O cliente não espera ver os 60 mil no site', basis: 'Inferência, a confirmar' }
        },
        ambiguityTitle: 'Ambiguidade conhecida',
        ambiguity:
          'Há três bases com cerca de 60 mil linhas: o cadastro de itens, a árvore da Planta de Processo e a aba "Analítico" da "Lista de materiais e Ativos" (1808778), com 61.726 lançamentos contábeis. Não se sabe a qual delas a informação inicial se referia.',
        source:
          'Fonte dos números: exploração do STOR feita em 16/11/2026. As exportações que sustentam esses números não estão guardadas com os arquivos do projeto.',
        consequencesTitle: 'Consequências no sistema',
        consequences: {
          c1: 'A unidade do catálogo é o pacote. Os itens são linhas do pacote, importadas da planilha de cada um, e importar de novo substitui a lista (ver Pacotes e Itens).',
          c2: 'Dois tipos de pacote: a granel e equipamento (ver Pacotes, campo Tipo).',
          c3: 'Código STOR, tag e localização no almoxarifado são campos opcionais de referência, não chave. O item é identificado pelo pacote e pelo nº do item (ver Itens).',
          c4: 'O número do pacote não é chave: o mesmo número aparece em mais de uma pasta. Quem identifica o pacote é a pasta no STOR (ver Números do pacote e ordem da lista).'
        },
        questionTitle: 'Pergunta em aberto para o cliente',
        question:
          'O site mostra os pacotes de venda com as suas listas, ou é esperado consultar os 60 mil itens do projeto? Se for a segunda opção, os dados já foram exportados do STOR e a mudança é de volume, não de modelo.'
      },
      stor: {
        title: 'Como o STOR está organizado',
        intro:
          'O STOR Global é o repositório de documentos e materiais do cliente. Ele não tem cadastro de pacotes: o que existe são pastas e planilhas feitas à mão.',
        items: {
          a: 'Cada pacote de venda é uma pasta dentro de Packages. O nome da pasta mistura números e texto, por exemplo 7-8-11 Crushers ou 28-Pipping.',
          b: 'Cada documento tem um código de 7 dígitos, que vem no começo do nome do arquivo baixado (por exemplo 1809438_REV0_VER0_...).',
          c: 'O código STOR do material é outra coisa: fica dentro da planilha, na linha do item, e pode se repetir em várias linhas.',
          d: 'Cada pacote tem a sua própria planilha, cada uma num formato: o cabeçalho muda de linha, os nomes das colunas variam e algumas não têm nº do item ou unidade.',
          e: 'Alguns pacotes não têm planilha, só PDFs e fotos. Nesses, os itens são cadastrados à mão.',
          f: 'Fotos no STOR só existem para os transformadores das subestações, os móveis de escritório e Niquelândia. Os demais pacotes dependem de fotos novas.',
          g: 'Nem toda pasta é um pacote: o contrato de leilão (Superbid), a venda do projeto inteiro (32-Project) e a negociação conjunta (32-BULK Sale) ficam de fora.'
        }
      },
      packages: {
        title: 'Pacotes',
        intro: 'O cabeçalho de cada pacote reúne o que o comprador vê e a identificação no STOR, que só os vendedores veem.',
        rows: {
          id: { term: 'ID', text: 'Identificação do pacote, gerada sozinha e fixa depois de criada. Aparece como #12 no catálogo e no endereço da página, e é a referência do pacote em planilhas.' },
          name: { term: 'Nome público', text: 'Nome em inglês mostrado no catálogo e no link do comprador.' },
          folder: { term: 'Pasta no STOR', text: 'Nome da pasta, com a grafia original. Identifica o pacote e não se repete. Só vendedores.' },
          numbers: { term: 'Ativos', text: 'Números dos ativos na planilha de estratégia de vendas (1-6 = ativos 1 e 6). Usados para ordenar a lista; podem se repetir entre pacotes. Só vendedores.' },
          origin: {
            term: 'Origem',
            text: 'De onde vieram os ativos (Araguaia Nickel Project, Niquelândia...). É diferente de Locais, que dizem onde estão hoje: os refratários do Porto Seco de Uberaba têm origem Araguaia e local Uberaba. Escolhida numa lista cadastrada em Configuração; aparece como filtro no catálogo quando há pacotes de mais de uma origem.'
          },
          category: {
            term: 'Categoria',
            text: 'Refratários, elétrica, tubulação, equipamentos de processo, escritório ou outros. No catálogo, o pacote sem foto aparece como uma etiqueta na cor e com o ícone da categoria e um número em destaque: unidades (equipamento), peso total (a granel, com itens em kg ou t) ou número de itens.'
          },
          type: {
            term: 'Tipo',
            text: 'A granel, quando o lote é vendido em bloco (refratários, cabos, tubulação), ou equipamento, vendido por equipamento ou conjunto.'
          },
          locations: { term: 'Locais', text: 'Onde os bens estão. Um pacote pode ter vários. A confirmar pode ficar junto de um local conhecido.' },
          documents: {
            term: 'Documentos STOR',
            text: 'Códigos (7 dígitos) das planilhas de itens do pacote no STOR, mostrados como "Doc. 1809438". A importação confere o código no nome do arquivo. Um código marcado como pendente ainda aguarda validação do cliente. Só vendedores.'
          },
          status: { term: 'Situação', text: 'Rascunho, ativo, em negociação, vendido ou inativo. Rascunho e inativo nunca aparecem para o comprador.' }
        },
        items: {
          a: 'Uma planilha por pacote: importar de novo substitui todos os itens. Quando uma pasta tem uma planilha por local, ela vira um pacote por local, como os refratários de Conceição do Araguaia e de Uberaba.',
          b: 'O cadastro inicial dos pacotes veio do levantamento no STOR. O que for editado aqui é mantido: as atualizações do sistema não sobrescrevem o que o vendedor ajustou.',
          c: 'Por que o catálogo é de pacotes, e não dos itens do projeto: ver Por que não são 60 mil itens.',
          d: 'Exportar pacotes (na lista) e Exportar pacote (na página do pacote) geram um Excel com a aba Pacotes e a aba Itens. A aba Itens pode ser editada e trazida de volta com Importar itens. A lista exporta o que está filtrado na tela.'
        }
      },
      numbers: {
        title: 'Ativos e ordem da lista',
        items: {
          a: 'A fonte dos números é a planilha de estratégia de vendas, não o nome da pasta.',
          b: 'No nome da pasta, o hífen quer dizer "e", não intervalo: 1-6 são os ativos 1 e 6.',
          c: 'O mesmo número pode estar em mais de um pacote. Por exemplo, 10 e 12 estão no secador e no forno.',
          d: 'Quando a planilha não tem um ID que corresponda com clareza ao pacote, o número fica vazio. O vendedor pode completar no cabeçalho do pacote.',
          e: 'As listas são ordenadas pelo menor número de ativo e depois pelo nome. Pacotes sem ativo vão para o fim.',
          f: 'O comprador não vê os Ativos. Vê só o ID do pacote ("#12" no cartão e na página do pacote), o mesmo número do endereço da página.'
        },
        note: 'A planilha de estratégia de vendas tem valores e contatos de compradores. Ela serve só como referência e nunca é importada nem anexada.'
      },
      locations: {
        title: 'Locais',
        intro: 'Um local só entra no pacote quando há um documento que o indique. Na dúvida, fica A confirmar.',
        rows: {
          cda: { term: 'Conceição do Araguaia', text: 'O site do projeto.' },
          uberaba: { term: 'Uberaba', text: 'O Porto Seco de Uberaba (EADI), onde há equipamentos e materiais armazenados.' },
          niquelandia: { term: 'Niquelândia', text: 'A refinaria de Niquelândia.' },
          bh: { term: 'Belo Horizonte', text: 'Móveis e equipamentos de escritório.' },
          supplier: { term: 'No fornecedor', text: 'Bens que ainda estão com o fornecedor.' },
          tbc: { term: 'A confirmar', text: 'Local ainda sem documento, ou partes do pacote em local desconhecido.' }
        }
      },
      items: {
        title: 'Itens',
        items: {
          a: 'Cada item é identificado pelo pacote e pelo nº do item, que é texto (1, 1.2, 10A). Se a planilha não tem nº do item, a importação pode numerar pela ordem das linhas.',
          b: 'Kits: 1.1 e 1.2 viram subitens do item 1 quando o item 1 está na mesma planilha.',
          c: 'A quantidade é a quantidade total na unidade da linha, não o número de embalagens.',
          d: 'Números são lidos primeiro no formato brasileiro (1.234,5). Quando o valor é ambíguo, a conferência avisa.',
          e: 'Unidades são padronizadas por uma tabela de sinônimos (pç, Peça e un viram PC). Unidade desconhecida é mantida como foi escrita.',
          f: 'Colunas sem campo no sistema, como fornecedor, peso, categoria e valores, não viram dado do item. Elas continuam na planilha original guardada no pacote, que só vendedores veem.',
          g: 'Linhas ocultas e filtradas da planilha também são importadas. Se não devem entrar, apague-as numa cópia antes de enviar.',
          h: 'Planilha com código pendente de validação só é importada com confirmação.',
          i: 'Código STOR, tag e localização são referência, não chave: ver Por que não são 60 mil itens.'
        }
      },
      files: {
        title: 'Fotos e arquivos',
        rows: {
          public: { term: 'Público', text: 'Qualquer visitante vê, quando o pacote está no catálogo.' },
          restricted: { term: 'Restrito', text: 'Só quem tem link de acesso ao pacote, além dos vendedores.' },
          internal: { term: 'Interno', text: 'Só vendedores logados. É o caso da planilha original da importação, que pode ter valores.' }
        },
        items: {
          a: 'Fotos ganham uma versão para a web e uma miniatura, sem metadados. O público nunca recebe o arquivo original de uma foto, que pode ter localização GPS.',
          b: 'Proposta nunca é pública: fica restrita ou interna.',
          c: 'Um arquivo pode ser do pacote inteiro (galeria e capa do catálogo) ou de um item (aparece só na linha do item). Arquivo ligado a item continua no mesmo nº de item depois de uma reimportação.',
          d: 'Antes de enviar um PDF, confira se ele tem preço, valor ou nome de comprador. Se tiver, use Interno.',
          e: 'Para enviar: clique em Adicionar arquivos, ou arraste os arquivos para a página, ou cole uma imagem com Ctrl+V (um print, por exemplo); as três formas abrem a janela de envio. Confira a lista e clique em Enviar. Cancelar descarta a lista.'
        }
      },
      access: {
        title: 'Quem vê o quê',
        rows: {
          visitor: {
            term: 'Visitante',
            text: 'O catálogo: pacotes ativos e, com a caixa "Mostrar pacotes em negociação" marcada, os em negociação, com os arquivos públicos. Vendidos e rascunhos nunca aparecem.'
          },
          buyer: {
            term: 'Comprador com link',
            text: 'Os pacotes do link, menos rascunho e inativo (vendidos aparecem: podem ser dele), com os arquivos públicos e restritos e os mesmos filtros do catálogo. O link vale até a data definida (no máximo um ano) e pode ser revogado a qualquer momento.'
          },
          seller: { term: 'Vendedor', text: 'Tudo: todos os pacotes e situações, a identificação no STOR e os arquivos internos.' },
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
            text: 'Visitantes (catálogo) e compradores com link. Pacote vendido não recebe pedido. Pedido enviado por um link mostra o nome do link.'
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
          a: 'Nenhum preço, valor ou nome de comprador entra no cadastro, nos itens ou em arquivo público.',
          b: 'Os dados do cliente são confidenciais. Planilhas e documentos entram só pelas telas do sistema.',
          c: 'Um pacote tem uma planilha. Importar de novo substitui os itens; não soma.',
          d: 'Local só com fonte em documento.',
          e: 'Na dúvida sobre um número, um local ou se uma planilha deve ser importada, deixe em aberto e confirme com o cliente.'
        }
      }
    }
  },
  help: {
    menu: 'Ajuda',
    tab: 'Carga de planilhas',
    title: 'Ajuda: carga de planilhas',
    intro: 'Como baixar do STOR as planilhas dos pacotes e importá-las no MineRecycle, uma planilha por pacote.',
    contents: 'Nesta página',
    export: {
      title: '1. Baixar a planilha do STOR',
      intro:
        'As listas de venda ficam no STOR Global, o sistema de documentos e materiais do cliente. Cada pacote tem a sua própria planilha, feita à mão e com formato próprio; não existe uma lista única.',
      whereLabels: { site: 'Endereço', project: 'Projeto', folder: 'Pasta dos pacotes' },
      where: {
        site: 'stor.storglobal.com/storweb',
        project: 'ANM - Araguaia Nickel Project',
        folder: 'Suprimentos/Supply › Projeto Araguaia - ANM › Assets Sales › Packages'
      },
      steps: {
        s1: 'Abra Documento › Gestão de Documentos.',
        s2: 'Na árvore de pastas, selecione Assets Sales.',
        s3: 'Digite o código do documento no campo de busca e clique na lupa. A busca só funciona com uma pasta selecionada e procura também nas subpastas.',
        s4: 'Marque a linha do documento e clique em Download.',
        s5: 'Salve o arquivo no seu computador. O nome do arquivo já começa pelo código do documento.'
      },
      careTitle: 'Cuidados no STOR',
      care: {
        c1: 'Use somente Download. Não use Novo, Importar, Salvar nem Enviar.',
        c2: 'Na tela de detalhes de um documento, saia sempre por Cancelar.',
        c3: 'Planilhas com preços ou valores são confidenciais: guarde-as só no seu computador e não as repasse por e-mail ou chat.'
      }
    },
    prepare: {
      title: '2. Conferir a planilha antes de enviar',
      intro: 'Abra o arquivo no Excel e confira os pontos abaixo. Se precisar mudar algo, trabalhe numa cópia.',
      items: {
        i1: 'Formato: .xlsx ou .xls. Se vier .xlsm, salve uma cópia como .xlsx.',
        i2: 'Se o arquivo tiver várias abas, você escolhe a aba certa na importação.',
        i3: 'O nº do item é obrigatório. Se a planilha não tiver essa coluna, marque “numerar pela ordem das linhas” (1, 2, 3…). Numa reimportação, mantenha a ordem das linhas para as fotos continuarem no item certo.',
        i4: 'Se a unidade só aparece no título da coluna (por exemplo, Quantidade (metros)), insira uma coluna de unidade com m, kg etc.',
        i5: 'Linhas ocultas ou escondidas por filtro são importadas como as outras. Apague na cópia as que não estão à venda.',
        i6: 'Linhas de total ou subtotal no fim da planilha aparecem como erro: apague-as ou pule-as na conferência.'
      }
    },
    upload: {
      title: '3. Importar no MineRecycle',
      steps: {
        s1: 'Em Pacotes, abra o pacote. Se ele ainda não existir, crie com Novo pacote: o nome público em inglês (o que o comprador vê), a pasta no STOR escrita exatamente igual (ex.: 1-6 Refractories), os números do pacote na planilha de estratégia, o tipo e todos os locais. Deixe-o em rascunho enquanto confere.',
        s2: 'Na aba Itens, clique em Importar itens, escolha o arquivo e clique em Ler arquivo. O sistema confere o código do STOR no nome do arquivo e avisa se a planilha for de outro pacote.',
        s3: 'Confira a aba e a linha do cabeçalho (a linha com os títulos das colunas). A prévia destaca a linha escolhida; troque o número se estiver errado.',
        s4: 'Para cada campo, escolha a coluna correspondente. O sistema sugere colunas pelo título: confira. O ? ao lado de cada campo explica o que vai nele. Colunas de preço ou valor (inclusive valor total) ficam em "não usar".',
        s5: 'Clique em Conferir. Nada é gravado ainda: veja quantas linhas são válidas, os erros e avisos por linha da planilha e a prévia dos itens.',
        s6: 'Se houver erros, corrija a planilha e envie de novo, ou marque a opção de pular as linhas com erro.',
        s7: 'Clique em Importar. Os itens atuais do pacote são substituídos pelos da planilha.',
        s8: 'Confira os itens na aba Itens e, quando estiver tudo certo, mude a situação do pacote.'
      },
      goToPackages: 'Ir para Pacotes'
    },
    fields: {
      title: 'Campos da importação',
      colField: 'Campo',
      colRequired: 'Obrigatório',
      colNotes: 'Observação',
      yes: 'sim',
      no: 'não',
      notes: {
        itemNo: 'Número do item na planilha, como 1, 1.2 ou 10A. Não pode se repetir no pacote, e 1.2 vira subitem de 1. Se a planilha não tiver essa coluna, marque a opção de numerar pela ordem das linhas.',
        description: 'O que é o item, do jeito que o comprador vai ler (ex.: Tijolo refratário 230 x 114 x 64 mm). Até 4.000 caracteres.',
        quantity: 'Quantidade na unidade escolhida em Unid. Se a unidade for KG ou T, use a coluna do peso total, não a do número de caixas ou paletes. Aceita decimal com vírgula ou ponto (12,5). Célula vazia gera só um aviso.',
        unit: 'Unidade da quantidade. É padronizada: UN, pç e PEÇ viram PC; MT vira M; kg vira KG. Unidade desconhecida é mantida e sinalizada na conferência.',
        storCode: 'Código do material no STOR (ex.: 100245). É referência, não chave: pode se repetir em várias linhas. Opcional; entra na busca de itens.',
        tag: 'Identificação do equipamento no projeto da planta, a mesma das listas de equipamentos e da plaqueta (ex.: MO-101, TR-01). Serve para pacotes de equipamento; material a granel normalmente não tem. Opcional; entra na busca de itens.',
        warehouseLocation: 'Onde o item está guardado no almoxarifado ou no pátio (ex.: Galpão 2 - Box 3, A3-R2). Opcional.'
      },
      discarded: 'Colunas não usadas (fornecedor, categoria, preço, valor etc.) não são gravadas nos itens.'
    },
    after: {
      title: '4. Depois da importação',
      items: {
        i1: 'Importar de novo substitui todos os itens do pacote: não soma nem duplica. Fotos ligadas a um item continuam ligadas se o nº do item se mantiver.',
        i2: 'Não há botão de desfazer. Para corrigir, importe a planilha certa de novo ou edite os itens um a um.',
        i3: 'Com a opção de guardar a planilha marcada, o arquivo original fica em Fotos e arquivos como Interno: só vendedores logados o veem, nunca o comprador com link nem o público.',
        i4: 'Pacotes sem planilha no STOR são cadastrados à mão, item por item, na aba Itens.'
      }
    }
  },
  errors: {
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
    IMPORT_FILE_TYPE: 'Envie um arquivo Excel (.xlsx ou .xls).',
    IMPORT_UNREADABLE: 'Não foi possível ler a planilha.',
    IMPORT_NOT_FOUND: 'Esta importação expirou. Envie o arquivo de novo.',
    IMPORT_MAPPING_INVALID: 'Confira as colunas: falta a coluna de um campo obrigatório ou a mesma coluna está em dois campos.',
    IMPORT_HAS_ERRORS: 'A planilha tem linhas com erro. Corrija ou escolha pular essas linhas.',
    IMPORT_EMPTY: 'Não há linhas válidas para importar.'
  },
  notFound: {
    title: 'Página não encontrada',
    back: 'Voltar ao catálogo'
  }
}
