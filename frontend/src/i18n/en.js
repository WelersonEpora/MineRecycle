export default {
  app: {
    name: 'MineRecycle',
    tagline: 'Mining assets for sale',
    assetSaleOf: 'Asset sale of'
  },
  nav: {
    catalog: 'Catalog',
    sellerArea: 'Seller area',
    myAccess: 'My access',
    login: 'Seller login',
    logout: 'Log out',
    language: 'Language'
  },
  enums: {
    source: { linked_system: 'System', family: 'Commercial family', subfamily: 'Subfamily', manual: 'Custom' },
    lotStatus: { available: 'Available', sold: 'Sold', unavailable: 'Unavailable' },
    type: { bulk: 'Bulk', equipment: 'Equipment' },
    category: {
      refractories: 'Refractories',
      electrical: 'Electrical',
      piping: 'Piping',
      process_equipment: 'Process equipment',
      office: 'Office',
      other: 'Other'
    },
    location: {
      conceicao_do_araguaia: 'Conceição do Araguaia',
      uberaba: 'Uberaba',
      niquelandia: 'Niquelândia',
      belo_horizonte: 'Belo Horizonte',
      at_supplier: 'At supplier',
      to_be_confirmed: 'To be confirmed'
    },
    status: {
      draft: 'Draft',
      active: 'Active',
      under_negotiation: 'Under negotiation',
      sold: 'Sold',
      inactive: 'Inactive'
    },
    kind: {
      photo: 'Photo',
      datasheet: 'Datasheet',
      drawing: 'Drawing',
      list: 'List',
      proposal: 'Proposal'
    },
    visibility: { public: 'Public', restricted: 'Restricted', internal: 'Internal' },
    role: { seller: 'Seller', admin: 'Administrator' },
    linkState: { valid: 'Valid', expired: 'Expired', revoked: 'Revoked' },
    action: { open: 'Opened the link', view_package: 'Viewed package', download: 'Downloaded file' }
  },
  common: {
    all: 'All',
    search: 'Search',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    back: 'Back',
    loading: 'Loading…',
    yes: 'Yes',
    no: 'No',
    none: 'None',
    optional: 'optional',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {page} of {pages}',
    results: 'no results | 1 result | {n} results',
    download: 'Download',
    open: 'Open',
    copy: 'Copy',
    copied: 'Copied',
    actions: 'Actions',
    confirmDelete: 'Delete permanently? This cannot be undone.'
  },
  dialog: {
    confirm: 'Confirm',
    typeToConfirm: 'To confirm, type',
    deleteFileTitle: 'Delete file'
  },
  catalog: {
    title: 'Mining assets for sale',
    intro:
      'Equipment and materials from a decommissioned mining project, organized in sale packages. Prices are not published: qualified buyers receive an access link with the full documentation.',
    type: 'Type',
    location: 'Location',
    status: 'Status',
    empty: 'No packages match these filters.',
    lots: 'no lots | 1 lot | {n} lots',
    soldOf: '{sold} of {total} sold',
    packageId: 'Package ID',
    viewPackage: 'View package',
    highlight: { lots: 'lot | lot | lots' }
  },
  package: {
    number: 'Package {number}',
    description: 'Description',
    photos: 'Photos',
    documents: 'Documents',
    noDocuments: 'No documents available.',
    lots: 'Lots',
    noLots: 'No lots.',
    searchLots: 'Number, description or supplier',
    restrictedHint:
      'There is restricted documentation for this package ({n} file) available to qualified buyers through an access link. | There is restricted documentation for this package ({n} files) available to qualified buyers through an access link.',
    buyerBanner: 'You are viewing this package through the access link “{label}”, valid until {date}. Restricted documents are included.',
    sellerBanner: 'You are logged in as a seller: everything is visible, including restricted files.',
    editInSellerArea: 'Edit in seller area',
    restricted: 'Restricted',
    lineFiles: 'Files for this item',
    noPhotos: 'No photos yet.'
  },
  access: {
    opening: 'Opening your access link…',
    missingToken: 'This address does not contain an access link. Please use the full link you received.',
    title: 'Your access',
    validUntil: 'Valid until {date}',
    packages: 'Packages shared with you',
    noSession: 'No active access link. Open the link you received to see restricted documents.',
    endSession: 'End access session',
    ended: 'Access session ended.'
  },
  login: {
    title: 'Seller login',
    email: 'Email',
    password: 'Password',
    submit: 'Log in'
  },
  seller: {
    lots: 'Lots',
    level: 'Level',
    site: 'Site',
    lotCount: 'Lots',
    soldOf: '{sold} of {total} sold',
    automaticNote: 'Automatic package: its lots come from the spreadsheet column "{level}" (value "{value}") and change on every import. Here you edit name, description, photos and files.',
    manualNote: 'Custom package: you choose the lots.',
    addLots: 'Add lots',
    removeLots: 'Remove from package',
    removeLotsConfirm: 'Remove {n} lot from the package? The lot stays in the system and in other packages. | Remove {n} lots from the package? The lots stay in the system and in other packages.',
    lotsAdded: '{n} lot added. | {n} lots added.',
    lotsRemoved: '{n} lot removed from the package. | {n} lots removed from the package.',
    saleConfirmTitle: 'Lots already sold',
    saleConfirmMessage: '{n} lot of this package was already sold (by the spreadsheet or in another package). Mark the package as sold anyway? | {n} lots of this package were already sold (by the spreadsheet or in another package). Mark the package as sold anyway?',
    saleConfirmLabel: 'Mark as sold',
    saleDone: 'Package sold: {n} lot marked as sold in every package. | Package sold: {n} lots marked as sold in every package.',
    unsaleDone: 'Sale undone: {released} lot(s) are back; {stillSold} stay sold for another reason.',
    packages: 'Packages',
    accessLinks: 'Access links',
    settings: 'Settings',
    users: 'Users',
    account: 'My account',
    newPackage: 'New package',
    storShort: 'Doc.',
    exportPackages: 'Export packages',
    exportPackage: 'Export package',
    importPackages: 'Import packages',
    importPackage: 'Import package',
    pendingShort: 'pending',
    lineCount: 'Items',
    attachmentCount: 'Files',
    updated: 'Updated',
    noPackages: 'No packages yet.',
    viewPublic: 'View page',
    tabs: { details: 'Details', lots: 'Lots', packages: 'Packages', attachments: 'Photos and files', links: 'Access links' },
    fields: {
      number: 'ID',
      numberHint: 'Package identifier, used in the public page address and shown in the catalog (#12). Filled in automatically. It cannot be changed after creation.',
      numberLockedHint: 'Package identifier, used in the public page address. It cannot be changed after creation.',
      name: 'Public name (English)',
      nameHint: 'Shown in the catalog and to buyers with a link.',
      storFolder: 'STOR folder',
      storFolderHint: 'Name of the package folder in STOR, written exactly the same. Sellers only.',
      storNumbers: 'Assets',
      storNumbersShort: 'Assets',
      storNumbersHint: 'Asset numbers in the sales strategy spreadsheet, e.g. 1, 6 (assets 1 and 6). They order the lists; buyers do not see them. Not the package ID.',
      storDocumentsPending: 'Pending validation (do not import yet):',
      storDocumentsPendingHint: 'Importing a ticked spreadsheet asks for confirmation.',
      type: 'Type',
      category: 'Category',
      origin: 'Origin',
      originChoose: 'Choose the origin',
      originNone: 'No origin',
      originHint: 'Where the assets came from (optional). Not the same as the site, which says where the lots are now.',
      categoryHint: 'Sets the color and icon of the catalog card when the package has no photo.',
      location: 'Locations',
      locationsHint: 'Tick every location holding items of this package. Use "To be confirmed" while unknown.',
      storDocuments: 'STOR documents',
      storDocumentsHint: 'Codes of this package spreadsheets in STOR (7 digits, comma separated). The code is at the start of the downloaded file name. Sellers only.',
      description: 'Description',
      help: 'Help: {field}'
    },
    saved: 'Saved.',
    editDetails: 'Edit package details',
    statusActions: {
      title: 'Change status',
      active: 'Activate',
      under_negotiation: 'Mark under negotiation',
      sold: 'Mark as sold',
      inactive: 'Deactivate',
      draft: 'Back to draft'
    },
    deletePackage: 'Delete package',
    deletePackageTitle: 'Delete package',
    deletePackageConfirm: 'The package “{name}” will be deleted with its photos and files. The lots stay in the system. This cannot be undone.',
    addLine: 'Add item',
    editLine: 'Edit item',
    importSpreadsheet: 'Import items',
    deleteLineTitle: 'Delete item',
    deleteLineConfirm: 'Delete item {itemNo}?',
    unitHint: 'Normalized automatically (UN, pç → PC; MT → M…)'
  },
  table: {
    refresh: 'Refresh table',
    perPage: 'Per page',
    report: 'Page {page} of {pages} ({total} in total)',
    pages: 'Pages',
    first: 'First page',
    last: 'Last page'
  },
  lots: {
    menu: 'Lots',
    lotNumber: 'Lot',
    title: 'Description',
    supplier: 'Supplier',
    linkedSystem: 'Linked system',
    family: 'Commercial family',
    subfamily: 'Subfamily',
    site: 'Site',
    status: 'Status',
    sheetStatus: 'Status in the spreadsheet',
    packages: 'Packages',
    files: 'Files',
    none: 'No lots.',
    emptyValue: '(empty)',
    withdrawn: 'Removed from the spreadsheet',
    showWithdrawn: 'Only lots removed from the spreadsheet',
    description: 'Seller description',
    descriptionHint: 'Free text about the lot. Imports do not erase it.',
    fromSheet: 'Spreadsheet data (changes only through imports)',
    soldBySheet: 'Sold by the spreadsheet',
    soldByPackage: 'sold by this package',
    createPackage: 'Create a package from this lot',
    noPackages: 'This lot is not in any package.',
    packagesHint: 'Packages that contain this lot. Lot files show in all of them.',
    editDescription: 'Edit lot description',
    importLots: 'Import lots',
    exportLots: 'Export lots',
    exportHint: 'Spreadsheet with every lot (except withdrawn ones), in the import format. Screen filters do not apply.',
    total: '{n} lot | {n} lots',
    selected: '{n} selected | {n} selected',
    selectFiltered: 'Select the {n} filtered',
    clearSelection: 'Clear selection',
    pickerTitle: 'Add lots to the package',
    pickerHint: 'Filter and tick the lots. Lots already in the package are not listed.',
    addSelected: 'Add {n} lot | Add {n} lots',
    back: 'Lots',
    imported: 'Imported on'
  },
  lotImport: {
    title: 'Import lots',
    intro: 'Send the lot spreadsheet ("Matriz de lotes" sheet). Only the lot columns are read; price columns and all others are ignored. Nothing is saved before you confirm.',
    chooseFile: 'Choose file',
    reading: 'Reading the spreadsheet…',
    sheet: 'Sheet',
    headerRow: 'Header on row {row}',
    blocked: 'The spreadsheet has problems that prevent the import. Fix them and send it again.',
    errorRow: 'Row {row}',
    summaryTitle: 'What will change',
    created: 'New lots',
    updated: 'Changed lots',
    restored: 'Back in the spreadsheet',
    withdrawn: 'Left the spreadsheet (kept as removed)',
    unchanged: 'Unchanged',
    statusChanges: 'Status changes',
    disagreements: 'Sold in the system but not in the spreadsheet',
    disagreementsHint: 'They stay sold. Update the STATUS column of the spreadsheet.',
    packagesCreated: 'New automatic packages (draft)',
    packagesUpdated: 'Automatic packages with changed lots',
    packagesEmptied: 'Automatic packages left without lots',
    lotsChange: '+{added} / −{removed} → {total} lots',
    more: 'and {n} more',
    confirm: 'Import',
    done: 'Import finished: {created} new, {updated} changed, {withdrawn} removed, {packages} new packages.',
    nothing: 'Nothing changes: the spreadsheet matches the system.',
    codes: {
      LOT_SHEET_NO_HEADER: 'Could not find the header ("Lot Number" column) in the first rows of this sheet.',
      LOT_SHEET_MISSING_COLUMNS: 'Missing columns: {fields}.',
      LOT_SHEET_TOO_MANY_ROWS: 'The sheet has too many rows.',
      LOT_SHEET_EMPTY: 'The sheet has no lots.',
      LOT_NUMBER_EMPTY: 'Lot without a number.',
      LOT_NUMBER_DUPLICATE: 'Repeated lot number ({value}; first seen on row {firstRow}).',
      LOT_TITLE_EMPTY: 'Lot without a description (Title / Equipment Description).',
      LOT_STATUS_UNKNOWN: 'Unknown STATUS: "{value}". Use "Sold", "Collected by court officer" or leave it empty.',
      LOT_VALUE_TOO_LONG: 'Text too long in {field} (maximum {max}).'
    }
  },
  attachments: {
    upload: 'Upload',
    uploading: 'Uploading… {percent}%',
    files: 'Files',
    kind: 'Type',
    visibility: 'Visibility',
    line: 'Item',
    packageLevel: 'Whole package',
    title: 'Title',
    chooseFiles: 'Choose files',
    dropOrPaste: 'or drag them here, or paste an image with Ctrl+V',
    maxFiles: 'Up to {n} files per upload.',
    readyCount: '{n} file ready to upload | {n} files ready to upload',
    clearFiles: 'Clear',
    removeFile: 'Remove {name} from the list',
    duplicatesSkipped: 'A repeated file was skipped. | {n} repeated files were skipped.',
    overflowSkipped: 'Limit of {max} files per upload: {n} were left out.',
    titleSingleOnly:'Title (single file only)',
    proposalRestricted: 'Proposals are never public.',
    internalNote: 'Internal: only logged-in sellers can see it, never buyers with a link.',
    publicPhotoNote: 'Public visitors see resized photos only, without camera metadata.',
    photos: 'Photos',
    documents: 'Documents',
    empty: 'No files yet.',
    moveUp: 'Move up',
    moveDown: 'Move down',
    makePublic: 'Make public',
    makeRestricted: 'Make restricted',
    size: 'Size',
    uploadedAt: 'Uploaded',
    addFiles: 'Add files',
    addFilesHint: 'Photos and documents. You can also drag files onto this page or paste an image with Ctrl+V.',
    dropToAdd: 'Drop to add the files',
    uploaded: '{n} file uploaded. | {n} files uploaded.'
  },
  links: {
    new: 'New access link',
    newForPackage: 'New link for this package',
    edit: 'Edit access link',
    label: 'Buyer / label',
    buyerEmail: 'Buyer email',
    note: 'Internal note',
    expiresAt: 'Valid until',
    packages: 'Packages',
    state: 'Status',
    accesses: 'Accesses',
    lastAccess: 'Last access',
    created: 'Created',
    createdBy: 'by {name}',
    revoke: 'Revoke',
    revokeTitle: 'Revoke link',
    revokeConfirm: 'Revoke the link “{label}”? The buyer loses access immediately.',
    logs: 'Access log',
    noLogs: 'No access yet.',
    empty: 'No access links yet.',
    createdTitle: 'Link created',
    createdInfo: 'Send this link to the buyer. For security it is shown only now: copy it before closing.',
    noEligible: 'Only packages that are not draft or inactive can be shared.',
    when: 'When',
    what: 'What',
    from: 'IP / browser'
  },
  inquiry: {
    title: 'Interested in this package?',
    intro: 'Ask our sales team for more information. We answer by email or phone.',
    sellerHint: 'Buyers see the request form and the team contact here. Requests arrive under Requests.',
    open: 'Request information',
    email: 'Email us',
    whatsapp: 'WhatsApp',
    formTitle: 'Request information · {name}',
    fields: { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone / WhatsApp', country: 'Country', message: 'More information' },
    contactHint: 'All fields are optional, but leave an email or a phone so we can answer you.',
    messagePlaceholder: 'What would you like to know? E.g. quantities, condition, documents, visit, logistics.',
    privacy: 'We use these details only to answer this request.',
    send: 'Send request',
    sending: 'Sending…',
    sent: 'Thank you. Your request was sent and our team will contact you soon.',
    subject: 'Information request: {name}',
    prefilled: 'Hello, I would like more information about the package "{name}".\n{url}'
  },
  inquiries: {
    menu: 'Requests',
    title: 'Information requests',
    help: 'Requests sent by buyers from a package page. Take one to show the team you are handling it, and update its status as you go.',
    newBadge: '{n} new request | {n} new requests',
    status: 'Status',
    open: 'Open',
    statuses: { new: 'New', in_progress: 'In progress', done: 'Done', discarded: 'Discarded' },
    assignee: 'Assigned to',
    mine: 'Mine',
    unassigned: 'Nobody',
    take: 'Take it',
    search: 'Name, company, email, message…',
    empty: 'No requests here.',
    viaLink: 'via link “{label}”',
    language: 'site in {lang}',
    packageDeleted: 'package deleted',
    noMessage: 'No message.',
    note: 'Internal note',
    noteHint: 'Seen only by the team (e.g. "called on Monday, sending photos").',
    lastChange: 'Last change: {name}, {date}',
    replySubject: 'Re: information request – {name}',
    deleteTitle: 'Delete request',
    deleteConfirm: 'Delete the request from “{name}”? Use it for spam or data that should not be kept.',
    new: 'New request',
    newHelp: 'Register a contact that came by email, WhatsApp or phone, so every request is in one place.',
    package: 'Package',
    choosePackage: 'Choose the package.',
    channel: 'Channel',
    channels: { form: 'Site form', email: 'Email', whatsapp: 'WhatsApp', phone: 'Phone', other: 'Other' },
    contactHint: 'Leave an email or a phone so the team can answer.',
    replyLanguage: 'Language to answer in',
    buyerMessage: 'What the buyer asked',
    registeredBy: 'registered by {name}',
    created: 'Request registered.',
    outcome: 'Outcome',
    noOutcome: '—',
    outcomes: { sold: 'Sold to this buyer', not_pursued: 'Did not go ahead', no_reply: 'No reply from buyer' },
    deleted: 'Request deleted.'
  },
  contact: {
    title: 'Sales contact',
    help: 'Shown on every package page, next to the request form, with the package name already filled in.',
    email: 'Team email',
    whatsapp: 'Team WhatsApp',
    whatsappHint: 'Full number with country code.',
    adminOnly: 'Only administrators change the contact.',
    saved: 'Contact saved.'
  },
  how: {
    tab: 'How it works',
    title: 'How MineRecycle works',
    intro: 'From the lot spreadsheet to the sale: who does each step, where in the system and what the buyer sees.',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    where: 'Where:',
    who: { outside: 'Outside the system', seller: 'Seller', buyer: 'Buyer' },
    lanes: { prepare: 'Preparation', publish: 'Publishing', serve: 'Follow-up', close: 'Outcome' },
    steps: {
      sheet: {
        title: 'Lot spreadsheet',
        items: {
          a: 'The "Matriz de lotes" sheet of the inventory workbook lists the lots, one per row, with lot number, site, description, supplier, groupings and STATUS.',
          b: 'The spreadsheet is still kept outside the system. When it changes, just import it again.',
          c: 'Price and value columns are never read.'
        }
      },
      importLots: {
        title: 'Import the lots',
        items: {
          a: 'Upload the spreadsheet: the system shows what changes (new, changed and withdrawn lots, status changes) and saves only when you confirm.',
          b: 'A lot that leaves the spreadsheet is not deleted: it stays as withdrawn and disappears from the public side.',
          c: 'STATUS "Sold" marks the lot as sold; "Collected by court officer" takes the lot off sale.'
        },
        where: 'Lots → Import lots'
      },
      packages: {
        title: 'Build the packages',
        intro: 'A package groups lots, and a lot can be in several packages.',
        items: {
          a: 'The import creates an automatic package (draft) for each value of the Linked system, Commercial family and Subfamily columns. Its lots follow the spreadsheet.',
          b: 'Sellers build manual packages with any lots they want ("New package" and the package Lots tab).',
          c: 'Single-lot package: "Create package from this lot", on the lot page.',
          d: 'Check the name, description, category and origin of each package before publishing.'
        },
        where: 'Packages and Lots'
      },
      files: {
        title: 'Photos and files',
        items: {
          a: 'Photos, datasheet, drawing, list and proposal, on the package or on the lot.',
          b: 'A lot file follows the lot into every package it is in.',
          c: 'Each file has a visibility: Public (everyone), Restricted (buyer with a link) or Internal (sellers only). Proposals are never public.'
        },
        where: 'Package → Photos and files tab; Lot → Photos and files'
      },
      activate: {
        title: 'Publish: status Active',
        items: {
          a: 'Once Active, the package is in the public catalog: anyone can see it, no login.',
          b: 'The catalog shows the package with the lots on offer, public photos and files. Lots off sale are hidden. Never a price.',
          c: 'A package with no lot on offer does not show in the catalog.'
        },
        where: 'Packages → Change status'
      },
      browse: {
        title: 'A visitor finds the package',
        items: {
          a: 'Searches by name, description, lot number, lot description or supplier; filters by grouping, origin and site.',
          b: 'Opens each lot to see its data and photos.',
          c: 'Sees that restricted documents exist (not which) and can ask for access.'
        },
        where: 'Catalog (home page)'
      },
      link: {
        title: 'Buyer link',
        intro: 'Optional, for a qualified buyer. It can come before or during the follow-up.',
        items: {
          a: 'Choose the packages and the expiry (up to one year). The buyer sees the restricted files of the package and its lots, and the proposal.',
          b: 'Every access is logged. The link can be revoked at once.'
        },
        where: 'Access links'
      },
      ask: {
        title: 'The buyer asks for information',
        items: {
          a: 'Form on the package page: it becomes a New request in the Requests tab.',
          b: 'Team email or WhatsApp, with the package already in the text: the conversation happens outside the system.',
          c: 'A sold package, or one whose lots are all sold, takes no requests.'
        },
        where: 'Package page → "Interested in this package?"'
      },
      direct: {
        title: 'Record a direct contact',
        items: {
          a: 'Contact by email, WhatsApp or phone: the seller records it in "New request", choosing the package and the channel.',
          b: 'This keeps every follow-up in one place.'
        },
        where: 'Requests → New request'
      },
      take: {
        title: 'Take the request',
        items: {
          a: '"Take" makes you the owner and moves the request to In progress.',
          b: 'The owner is a system user and can be changed. The internal note records what was done.'
        },
        where: 'Requests'
      },
      negotiate: {
        title: 'Package under negotiation',
        items: {
          a: 'When the conversation moves forward, set the package to Under negotiation.',
          b: 'In the catalog, it only shows with the "Show packages under negotiation" box. Other buyers can still ask for information.'
        },
        where: 'Packages → Change status'
      },
      outcome: {
        title: 'Record the outcome',
        items: {
          a: 'Choose the outcome: sold to this buyer, did not move forward or no answer. The request becomes Done.',
          b: 'No value or price: only the outcome and the note.'
        },
        where: 'Requests → Outcome'
      },
      package: {
        title: 'Sell the package',
        items: {
          a: 'The package is what gets sold: when marked Sold, all its lots become sold, in every package they appear in.',
          b: 'If a lot was already sold (by another package or by the spreadsheet), the system warns and asks for confirmation.',
          c: 'Undoing the sale (back to Active) releases only the lots sold by this package.',
          d: 'A sold package leaves the catalog and takes no requests; a buyer with a link still sees it.'
        },
        where: 'Packages → Change status'
      },
      others: {
        title: 'Wrap up',
        items: {
          a: 'Answer and close the other open requests about the sold package.',
          b: 'Review the packages that had the same lots: the lots show as sold there.',
          c: 'Update the STATUS column of the spreadsheet, so the next import agrees with the system.'
        },
        where: 'Requests, Packages and the spreadsheet'
      }
    },
    states: {
      title: 'Package status: who sees what',
      intro: 'The status decides whether the package shows in the catalog, for the buyer with a link, and whether it takes requests.',
      status: 'Status',
      catalog: 'Catalog',
      link: 'Buyer link',
      requests: 'Requests',
      withToggle: 'With the box checked',
      path: 'Usual path: Draft → Active → Under negotiation → Sold. If the negotiation does not move forward, back to Active.'
    }
  },
  origins: {
    title: 'Origins',
    help: 'Where the package assets came from (unlike Location, which is where they are now). Each package has one origin.',
    new: 'New origin',
    edit: 'Edit origin',
    name: 'Name',
    code: 'Code',
    codeHint: 'Up to 10 letters, digits or hyphens.',
    active: 'Active',
    inactive: 'inactive',
    packages: 'Packages',
    adminOnly: 'Only administrators add and edit origins.',
    inactiveHint: 'An inactive origin is no longer offered for packages, but stays on the packages that already use it.',
    saved: 'Origin saved.'
  },
  filters: {
    title: 'Filters',
    searchPlaceholder: 'Search by package, lot, supplier or description',
    clearSearch: 'Clear search',
    button: 'Filters',
    type: 'Type',
    origin: 'Origin',
    level: 'Grouping',
    site: 'Site',
    all: 'All',
    types: { bulk: 'Bulk', equipment: 'Equipment' },
    count: 'no packages | 1 package | {n} packages',
    showNegotiation: 'Show packages under negotiation',
    clear: 'Clear filters'
  },
  users: {
    name: 'Name',
    email: 'Email',
    role: 'Role',
    active: 'Active',
    lastLogin: 'Last login',
    newUser: 'New user',
    password: 'Password',
    newPassword: 'New password (leave blank to keep)',
    passwordHint: 'At least 9 characters.',
    delete: 'Delete user',
    deleteTitle: 'Delete user',
    deleteConfirm: '“{name}” leaves the list and loses access immediately. Their history is kept. To bring them back, add the same email again.',
    deleted: 'User deleted.',
    reactivated: 'This email belonged to a deleted user, who was reactivated with the data you entered.'
  },
  account: {
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    changed: 'Password changed.'
  },
  // Seller area help (HelpView.vue). No braces, at signs or vertical bars: they are vue-i18n syntax.
  guide: {
    tab: 'MineRecycle guide',
    title: 'MineRecycle guide',
    intro: 'How the system is organized, where the data comes from and the rules that apply to everyone.',
    goToImport: 'See how to import the lot spreadsheet',
    sections: {
      overview: {
        title: 'What MineRecycle is',
        intro:
          'A temporary platform that connects sellers and buyers of the assets of a halted mining project. Buyers find the packages in the catalog or through an access link and negotiate directly with the sales team.',
        items: {
          a: 'There are no prices on the platform: no field, no screen, no public file with a value.',
          b: 'The site is in English, with Portuguese as an option. Names, descriptions and lots are not translated.',
          c: 'A single team of sellers: everyone can edit every package and lot, each with their own login.'
        }
      },
      source: {
        title: 'Where the data comes from',
        intro:
          'The source is the client inventory workbook, sheet "Matriz de lotes". The system reads only the lot columns of that sheet; the other columns and sheets, including price and value, are ignored.',
        items: {
          a: 'The spreadsheet is still kept outside the system. Importing again updates the lots; nothing is saved before you confirm.',
          b: 'Data that comes from the spreadsheet changes only through the import. Sellers add their own description, photos and files, which the import never deletes.'
        }
      },
      lots: {
        title: 'Lots',
        intro: 'The lot is the smallest unit: each spreadsheet row is a lot, identified by its lot number.',
        rows: {
          number: { term: 'Lot', text: 'Lot number in the spreadsheet. Unique; it is the key of the re-import.' },
          data: { term: 'Spreadsheet data', text: 'Site (as in the spreadsheet), description, supplier, linked system, commercial family and subfamily.' },
          available: { term: 'Available', text: 'On sale in the packages it is in.' },
          sold: { term: 'Sold', text: 'By the spreadsheet (STATUS "Sold") or by the sale of a package that contains it. Shows with the sold badge in every package. The spreadsheet never takes a lot back from sold.' },
          unavailable: { term: 'Off sale', text: 'STATUS "Collected by court officer". Hidden from the public side; sellers still see it.' },
          withdrawn: { term: 'Withdrawn', text: 'Left the spreadsheet. Not deleted (keeps files and history) and comes back if it reappears in an import.' }
        }
      },
      packages: {
        title: 'Packages',
        intro: 'The package is what gets sold: it groups lots, and a lot can be in several packages.',
        rows: {
          automatic: {
            term: 'Automatic',
            text: 'One per value of the Linked system, Commercial family and Subfamily columns, created by the import as a draft, named after the value. Its lots follow the spreadsheet; sellers edit the name, description and the rest, but not the lots.'
          },
          manual: { term: 'Manual', text: 'Built by a seller with any lots. Includes the single-lot package ("Create package from this lot").' },
          id: { term: 'ID', text: 'Package number, generated on creation and fixed afterwards. It is the public address ("#12") and everyone sees it.' },
          name: { term: 'Name and description', text: 'What the buyer sees. In English, like the rest of the site.' },
          origin: { term: 'Origin', text: 'Where the assets came from (registry in Settings). Optional.' }
        },
        items: {
          a: 'An automatic package left with no lots (its value left the spreadsheet) does not show in the catalog and can be deleted.',
          b: 'A sold package cannot change its lots and cannot be deleted.'
        }
      },
      sale: {
        title: 'Sale',
        items: {
          a: 'Marking a package as Sold marks all its lots as sold, in every package.',
          b: 'If a lot was already sold, the system lists it and asks for confirmation.',
          c: 'Undoing the sale releases only the lots sold by this package. Lots sold by the spreadsheet or by another package stay sold.',
          d: 'Lots off sale or withdrawn are not sold with the package.',
          e: 'After the sale, update the STATUS column of the spreadsheet. The import warns when the system and the spreadsheet disagree.'
        }
      },
      files: {
        title: 'Photos and files',
        rows: {
          public: { term: 'Public', text: 'Any visitor sees it while the package is in the catalog.' },
          restricted: { term: 'Restricted', text: 'Only people with an access link to the package, plus sellers.' },
          internal: { term: 'Internal', text: 'Logged-in sellers only.' }
        },
        items: {
          a: 'Photos get a web version and a thumbnail, without metadata. The public never gets the original photo file, which may carry GPS location.',
          b: 'Proposals are never public: restricted or internal.',
          c: 'A file belongs to the package (gallery and catalog cover) or to a lot. A lot file follows the lot into every package; who sees it depends on the best access among those packages.',
          d: 'Before uploading a PDF, check it for prices, values or buyer names. If it has any, use Internal.',
          e: 'To upload: click Add files, drag the files onto the page, or paste an image with Ctrl+V (a screenshot, for example); all three open the upload window. Check the list and click Upload. Cancel discards the list.'
        }
      },
      access: {
        title: 'Who sees what',
        rows: {
          visitor: {
            term: 'Visitor',
            text: 'The catalog: active packages and, with the "Show packages under negotiation" box checked, those under negotiation, with the lots on offer and public files. Sold packages and drafts never show.'
          },
          buyer: {
            term: 'Buyer with a link',
            text: 'The link packages, except draft and inactive (sold ones show: they may be theirs), with the public and restricted files of the package and its lots. The link is valid until the chosen date (one year at most) and can be revoked at any time.'
          },
          seller: { term: 'Seller', text: 'Everything: all packages and statuses, all lots (including withdrawn and off sale) and internal files.' },
          admin: { term: 'Administrator', text: 'The same as a seller, plus user management, the origin registry and the sales contact (Settings).' }
        }
      },
      inquiries: {
        title: 'Buyer requests',
        intro:
          'Buyers ask for information on the package page: with the request form, by email or by WhatsApp. The email and WhatsApp are the team ones, set in Settings.',
        rows: {
          form: {
            term: 'Request form',
            text: 'Name, company, email, phone, country and "More information". No field is required on its own, but the buyer leaves an email or a phone. One package per request. There is no price or offer field.'
          },
          where: {
            term: 'Who can ask',
            text: 'Visitors (catalog) and buyers with a link. A sold package, or one whose lots are all sold, takes no requests. A request sent through a link shows the link name.'
          },
          panel: {
            term: 'Requests tab',
            text: 'Every request lands there, with a counter of new ones on the tab. There is no email notice yet: check the tab every day.'
          },
          take: {
            term: 'Take',
            text: 'Makes you the owner and moves a new request to In progress. The owner can be changed to anyone on the team.'
          },
          direct: {
            term: 'Direct contact',
            text: 'A request that came by email, WhatsApp or phone is recorded by hand in "New request", with the channel. It starts In progress, with you as the owner.'
          },
          outcome: {
            term: 'Outcome',
            text: 'With the request Done, choose the outcome: sold to this buyer, did not move forward or no answer. Choosing the outcome closes the request. No value or price.'
          },
          status: {
            term: 'Status',
            text: 'New (nobody took it), In progress, Done (answered) or Discarded (spam or nonsense). The internal note records what was done; the last change shows who and when.'
          }
        },
        items: {
          a: 'Answer in the language the buyer was using on the site (shown on the request).',
          b: 'Requests hold personal data: use it only to answer, and delete spam.',
          c: 'Emails and WhatsApp messages sent directly only show in the Requests tab after someone records them in New request.'
        }
      },
      rules: {
        title: 'Rules that always apply',
        items: {
          a: 'No price, value or buyer name goes into the records, the lots or a public file.',
          b: 'Client data is confidential. The spreadsheet and documents enter only through the system screens.',
          c: 'The spreadsheet rules the lot data and the lots of automatic packages; the system rules the sale of packages.',
          d: 'When in doubt about a lot or a grouping, fix the spreadsheet and import again instead of working around it in the system.'
        }
      }
    }
  },
  help: {
    menu: 'Help',
    tab: 'Import lots',
    title: 'Help: importing the lot spreadsheet',
    intro: 'How the lot spreadsheet is read, what each column becomes in the system and what happens when you import again.',
    contents: 'On this page',
    sheet: {
      title: '1. The spreadsheet',
      intro: 'Use the client inventory workbook (.xlsx, .xlsm or .xls). The system opens the "Matriz de lotes" sheet; if there is none, the first sheet, and you can pick another in the preview.',
      items: {
        a: 'The header can be on any of the first 30 rows and the columns in any order: the system finds each column by its name.',
        b: 'The 8 columns in the table below are required. A missing column blocks the import, so a field is never wiped from every lot.',
        c: 'All other columns are ignored, including price and value.'
      }
    },
    upload: {
      title: '2. Import',
      steps: {
        s1: 'In Lots, click Import lots and choose the file.',
        s2: 'Check the preview: new, changed and withdrawn lots, status changes and new or changed automatic packages.',
        s3: 'If the preview shows errors (repeated or empty lot number, unknown STATUS, missing column), fix the spreadsheet and upload it again.',
        s4: 'Click Import. If someone changed the lots after the preview, the system asks you to review again.'
      },
      goToLots: 'Go to Lots'
    },
    fields: {
      title: 'Columns read',
      colColumn: 'Spreadsheet column',
      colField: 'In the system',
      colNotes: 'Notes',
      notes: {
        lotNumber: 'Lot key: cannot be empty or repeated. The re-import finds the lot by it.',
        siteName: 'Shown as in the spreadsheet, to buyers too.',
        title: 'Required on every row.',
        masterSupplier: 'Optional.',
        linkedSystem: 'Each value becomes an automatic package.',
        commercialFamily: 'Each value becomes an automatic package.',
        subfamily: 'Each value becomes an automatic package.',
        status: 'Empty or "Available": available. "Sold": sold. "Collected by court officer": off sale. Any other value blocks the import.'
      },
      discarded: 'Column names are compared ignoring accents, case and punctuation, and a few English and Portuguese synonyms are accepted too.'
    },
    after: {
      title: '3. Importing again',
      items: {
        a: 'Importing the same spreadsheet changes nothing. A lot changed in the spreadsheet is updated; a new lot is created.',
        b: 'A lot that left the spreadsheet stays as withdrawn (hidden from the public side) and comes back if it reappears.',
        c: 'The spreadsheet only marks a lot as sold, never undoes it: if the system has a sold lot the spreadsheet does not, the preview warns and it stays sold.',
        d: 'Automatic packages follow the spreadsheet: they gain and lose lots. One left with no lots leaves the catalog and can be deleted. A new lot in an automatic package that is already sold comes in sold.',
        e: 'Seller descriptions, photos, files and manual packages are never deleted by the import.',
        f: 'Export lots (Lots screen) produces a spreadsheet of every lot in this same format. STATUS comes out as the spreadsheet said, not as the system has it; the system status and the packages come in separate columns, which the import ignores.'
      }
    }
  },
  errors: {
    PACKAGE_SALE_CONFIRM: 'Some lots of this package were already sold. Confirm to mark the package as sold.',
    PACKAGE_LOTS_AUTOMATIC: 'The lots of this package come from the spreadsheet: change them through the lot import.',
    PACKAGE_SOLD_LOCKED: 'A sold package cannot change its lots or be deleted.',
    PACKAGE_AUTOMATIC_NOT_EMPTY: 'An automatic package can only be deleted when the spreadsheet no longer has lots for it.',
    PACKAGE_EMPTY: 'A package with no lots cannot be sold.',
    IMPORT_STALE: 'The lots changed after the preview. Review the import again.',
    INQUIRY_CONTACT_REQUIRED: 'Enter an email or a phone number so we can answer you.',
    INQUIRY_NOT_ALLOWED: 'This package no longer takes requests.',
    EMAIL_INVALID: 'Check the email address.',
    WHATSAPP_INVALID: 'Enter the full WhatsApp number with country code.',
    generic: 'Something went wrong. Please try again.',
    network: 'Could not reach the server.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait a few minutes.',
    UNAUTHORIZED: 'Your session has expired. Please log in again.',
    FORBIDDEN: 'You do not have permission for this action.',
    NOT_FOUND: 'Not found.',
    LINK_INVALID: 'This access link is not valid. Check that you used the complete link.',
    LINK_EXPIRED: 'This access link has expired. Please contact the seller for a new one.',
    LINK_REVOKED: 'This access link has been revoked. Please contact the seller.',
    NUMBER_TAKEN: 'A package with this ID already exists.',
    NUMBER_LOCKED: 'The package ID cannot be changed.',
    PACKAGE_IMPORT_STALE: 'The packages changed after the check. Check the file again.',
    PACKAGE_IMPORT_HAS_ERRORS: 'The file has problems that prevent the import.',
    PACKAGE_IMPORT_CONFIRM: 'Confirm all warnings before importing.',
    STOR_FOLDER_TAKEN: 'Another package already uses this STOR folder.',
    IMPORT_DOCUMENT_PENDING: 'This spreadsheet is pending validation. Confirm to import it anyway.',
    ITEM_NO_TAKEN: 'This item number already exists in the package.',
    USER_DELETE_SELF: 'You cannot delete your own user.',
    ORIGIN_CODE_TAKEN: 'Another origin already uses this code.',
    ORIGIN_INACTIVE: 'This origin is inactive. Choose an active origin.',
    ORIGIN_INVALID: 'Choose the package origin.',
    EMAIL_TAKEN: 'A user with this email already exists.',
    PAYLOAD_TOO_LARGE: 'File too large.',
    IMPORT_FILE_TYPE: 'Send an Excel file (.xlsx, .xlsm or .xls).',
    IMPORT_UNREADABLE: 'The spreadsheet could not be read.',
    IMPORT_NOT_FOUND: 'This import has expired. Please upload the file again.',
    IMPORT_MAPPING_INVALID: 'Check the columns: a required field has no column, or the same column is used for two fields.',
    IMPORT_HAS_ERRORS: 'The spreadsheet has problems that prevent the import.',
    IMPORT_EMPTY: 'There are no valid rows to import.'
  },
  notFound: {
    title: 'Page not found',
    back: 'Back to catalog'
  }
}
