export default {
  app: {
    name: 'MineRecycle',
    tagline: 'Ativos de mineração à venda'
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
    viewPackage: 'Ver pacote'
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
    storShort: 'STOR',
    pendingShort: 'pendente',
    lineCount: 'Itens',
    attachmentCount: 'Arquivos',
    updated: 'Atualizado',
    noPackages: 'Nenhum pacote ainda.',
    viewPublic: 'Ver página',
    tabs: { details: 'Dados', lines: 'Itens', attachments: 'Fotos e arquivos', links: 'Links de acesso' },
    fields: {
      number: 'Nº do catálogo',
      numberHint: 'Usado no endereço da página pública. Preenchido sozinho; o comprador não o vê.',
      name: 'Nome público (inglês)',
      nameHint: 'Aparece na vitrine e no link do comprador.',
      storFolder: 'Pasta no STOR',
      storFolderHint: 'Nome da pasta do pacote no STOR, escrito exatamente igual. Só vendedores veem.',
      storNumbers: 'Números do pacote',
      storNumbersShort: 'Nº STOR',
      storNumbersHint: 'IDs na planilha de estratégia de vendas, ex.: 1, 6. Ordenam as listas; o comprador não vê.',
      storDocumentsPending: 'Pendentes de validação (não importar ainda):',
      storDocumentsPendingHint: 'A importação de uma planilha marcada pede confirmação.',
      type: 'Tipo',
      location: 'Locais',
      locationsHint: 'Marque todos os locais onde há itens do pacote. Use "A confirmar" enquanto não souber.',
      storDocuments: 'Documentos STOR',
      storDocumentsHint: 'Códigos das planilhas deste pacote no STOR (7 dígitos, separados por vírgula). O código está no começo do nome do arquivo baixado. Só vendedores veem.',
      description: 'Descrição'
    },
    saved: 'Salvo.',
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
    importSpreadsheet: 'Importar planilha',
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
    uploadedAt: 'Enviado'
  },
  import: {
    title: 'Importar planilha',
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
  settings: {
    showcaseTitle: 'Vitrine pública',
    showcaseHelp: 'Quais situações de pacote aparecem no catálogo público. Rascunhos e inativos nunca aparecem. Compradores com link de acesso sempre veem os pacotes compartilhados com eles.',
    adminOnly: 'Só administradores podem mudar esta configuração.'
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
    passwordHint: 'Pelo menos 10 caracteres.'
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
          'Plataforma temporária que conecta vendedores e compradores dos ativos de um projeto de mineração paralisado. O comprador conhece os pacotes pela vitrine ou por um link de acesso e negocia direto com a equipe de vendas.',
        items: {
          a: 'Não há preço na plataforma: nem campo, nem tela, nem arquivo público com valor.',
          b: 'O site é em inglês, com português como opção. Nomes, descrições e itens cadastrados não são traduzidos.',
          c: 'Uma equipe só de vendedores: todos podem editar todos os pacotes, cada um com o seu login.'
        }
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
          name: { term: 'Nome público', text: 'Nome em inglês mostrado na vitrine e no link do comprador.' },
          folder: { term: 'Pasta no STOR', text: 'Nome da pasta, com a grafia original. Identifica o pacote e não se repete. Só vendedores.' },
          numbers: { term: 'Nº STOR', text: 'IDs do ativo na planilha de estratégia de vendas. Usados para ordenar a lista. Só vendedores.' },
          type: {
            term: 'Tipo',
            text: 'A granel, quando o lote é vendido em bloco (refratários, cabos, tubulação), ou equipamento, vendido por equipamento ou conjunto.'
          },
          locations: { term: 'Locais', text: 'Onde os bens estão. Um pacote pode ter vários. A confirmar pode ficar junto de um local conhecido.' },
          documents: {
            term: 'Documentos STOR',
            text: 'Códigos das planilhas do pacote. Um código marcado como pendente ainda aguarda validação do cliente. Só vendedores.'
          },
          status: { term: 'Situação', text: 'Rascunho, ativo, em negociação, vendido ou inativo. Rascunho e inativo nunca aparecem para o comprador.' }
        },
        items: {
          a: 'Uma planilha por pacote: importar de novo substitui todos os itens. Quando uma pasta tem uma planilha por local, ela vira um pacote por local, como os refratários de Conceição do Araguaia e de Uberaba.',
          b: 'O cadastro inicial dos pacotes veio do levantamento no STOR. O que for editado aqui é mantido: as atualizações do sistema não sobrescrevem o que o vendedor ajustou.'
        }
      },
      numbers: {
        title: 'Números do pacote e ordem da lista',
        items: {
          a: 'A fonte dos números é a planilha de estratégia de vendas, não o nome da pasta.',
          b: 'No nome da pasta, o hífen quer dizer "e", não intervalo: 1-6 são os ativos 1 e 6.',
          c: 'O mesmo número pode estar em mais de um pacote. Por exemplo, 10 e 12 estão no secador e no forno.',
          d: 'Quando a planilha não tem um ID que corresponda com clareza ao pacote, o número fica vazio. O vendedor pode completar no cabeçalho do pacote.',
          e: 'As listas são ordenadas pelo menor número do pacote e depois pelo nome. Pacotes sem número vão para o fim.',
          f: 'O comprador não vê número nenhum: nem o Nº STOR, nem o nº do catálogo, que só aparece no endereço da página.'
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
          h: 'Planilha com código pendente de validação só é importada com confirmação.'
        }
      },
      files: {
        title: 'Fotos e arquivos',
        rows: {
          public: { term: 'Público', text: 'Qualquer visitante vê, quando o pacote está na vitrine.' },
          restricted: { term: 'Restrito', text: 'Só quem tem link de acesso ao pacote, além dos vendedores.' },
          internal: { term: 'Interno', text: 'Só vendedores logados. É o caso da planilha original da importação, que pode ter valores.' }
        },
        items: {
          a: 'Fotos ganham uma versão para a web e uma miniatura, sem metadados. O público nunca recebe o arquivo original de uma foto, que pode ter localização GPS.',
          b: 'Proposta nunca é pública: fica restrita ou interna.',
          c: 'Um arquivo pode ser do pacote ou de um item. Arquivo ligado a item continua no mesmo nº de item depois de uma reimportação.',
          d: 'Antes de enviar um PDF, confira se ele tem preço, valor ou nome de comprador. Se tiver, use Interno.'
        }
      },
      access: {
        title: 'Quem vê o quê',
        rows: {
          visitor: {
            term: 'Visitante',
            text: 'A vitrine: só os pacotes nas situações escolhidas em Configuração (padrão: ativo) e os arquivos públicos.'
          },
          buyer: {
            term: 'Comprador com link',
            text: 'Os pacotes do link, menos rascunho e inativo, com os arquivos públicos e restritos. O link vale até a data definida (no máximo um ano) e pode ser revogado a qualquer momento.'
          },
          seller: { term: 'Vendedor', text: 'Tudo: todos os pacotes e situações, a identificação no STOR e os arquivos internos.' },
          admin: { term: 'Administrador', text: 'O mesmo que o vendedor, mais a gestão de usuários e a configuração da vitrine.' }
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
        s2: 'Na aba Itens, clique em Importar planilha, escolha o arquivo e clique em Ler arquivo. O sistema confere o código do STOR no nome do arquivo e avisa se a planilha for de outro pacote.',
        s3: 'Confira a aba e a linha do cabeçalho (a linha com os títulos das colunas). A prévia destaca a linha escolhida; troque o número se estiver errado.',
        s4: 'Para cada campo, escolha a coluna correspondente. O sistema sugere colunas pelo título: confira. Colunas de preço, valor ou total ficam em "não usar".',
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
        itemNo: 'Texto, como 1, 1.2 ou 10A. Não pode se repetir no pacote. 1.2 vira subitem de 1.',
        description: 'Até 4.000 caracteres.',
        quantity: 'Aceita decimal, com vírgula ou ponto (12,5). Célula vazia gera só um aviso.',
        unit: 'Padronizada: UN, pç e PEÇ viram PC; MT vira M; kg vira KG. Unidade desconhecida é mantida e sinalizada na conferência.',
        storCode: 'Código do item no STOR.',
        tag: 'Tag do equipamento.',
        warehouseLocation: 'Endereço no almoxarifado.'
      },
      discarded: 'Colunas não usadas (fornecedor, peso, preço, valor etc.) não são gravadas nos itens.'
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
    NUMBER_TAKEN: 'Já existe um pacote com este número.',
    STOR_FOLDER_TAKEN: 'Outro pacote já usa esta pasta do STOR.',
    IMPORT_DOCUMENT_PENDING: 'Esta planilha está pendente de validação. Confirme para importar mesmo assim.',
    ITEM_NO_TAKEN: 'Este nº de item já existe no pacote.',
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
