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
    lines: 'no items | 1 item | {n} items',
    viewPackage: 'View package',
    highlight: { weight: 'total weight', units: 'unit | unit | units', items: 'item | item | items' }
  },
  package: {
    number: 'Package {number}',
    description: 'Description',
    photos: 'Photos',
    documents: 'Documents',
    noDocuments: 'No documents available.',
    items: 'Items',
    restrictedHint:
      'There is restricted documentation for this package ({n} file) available to qualified buyers through an access link. | There is restricted documentation for this package ({n} files) available to qualified buyers through an access link.',
    buyerBanner: 'You are viewing this package through the access link “{label}”, valid until {date}. Restricted documents are included.',
    sellerBanner: 'You are logged in as a seller: everything is visible, including restricted files.',
    editInSellerArea: 'Edit in seller area',
    restricted: 'Restricted',
    lineFiles: 'Files for this item',
    noPhotos: 'No photos yet.'
  },
  lines: {
    itemNo: 'Item',
    description: 'Description',
    quantity: 'Qty',
    unit: 'Unit',
    storCode: 'STOR code',
    tag: 'Tag',
    warehouseLocation: 'Warehouse location',
    parent: 'Parent item',
    files: 'Files',
    searchPlaceholder: 'Search description, item, STOR code or tag',
    empty: 'No items.',
    total: '{n} items'
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
    packages: 'Packages',
    accessLinks: 'Access links',
    settings: 'Settings',
    users: 'Users',
    account: 'My account',
    newPackage: 'New package',
    storShort: 'STOR',
    pendingShort: 'pending',
    lineCount: 'Items',
    attachmentCount: 'Files',
    updated: 'Updated',
    noPackages: 'No packages yet.',
    viewPublic: 'View page',
    tabs: { details: 'Details', lines: 'Items', attachments: 'Photos and files', links: 'Access links' },
    fields: {
      number: 'Catalog no.',
      numberHint: 'Used in the public page address. Filled in automatically; buyers do not see it.',
      name: 'Public name (English)',
      nameHint: 'Shown in the catalog and to buyers with a link.',
      storFolder: 'STOR folder',
      storFolderHint: 'Name of the package folder in STOR, written exactly the same. Sellers only.',
      storNumbers: 'Package numbers',
      storNumbersShort: 'STOR no.',
      storNumbersHint: 'IDs in the asset sale strategy spreadsheet, e.g. 1, 6. They order the lists; buyers do not see them.',
      storDocumentsPending: 'Pending validation (do not import yet):',
      storDocumentsPendingHint: 'Importing a ticked spreadsheet asks for confirmation.',
      type: 'Type',
      category: 'Category',
      origin: 'Origin',
      originChoose: 'Choose the origin',
      originHint: 'Where the assets came from. Unlike Location, which says where they are now.',
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
    deletePackageConfirm: 'Package “{name}” will be deleted with all its items, photos and files. This cannot be undone.',
    addLine: 'Add item',
    editLine: 'Edit item',
    importSpreadsheet: 'Import spreadsheet',
    deleteLineTitle: 'Delete item',
    deleteLineConfirm: 'Delete item {itemNo}?',
    unitHint: 'Normalized automatically (UN, pç → PC; MT → M…)'
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
  import: {
    title: 'Import spreadsheet',
    step1: '1. File',
    step2: '2. Columns',
    step3: '3. Review',
    chooseFile: 'Choose an Excel file (.xlsx or .xls). The current items of this package will be replaced.',
    readFile: 'Read file',
    sheet: 'Sheet',
    headerRow: 'Header row',
    headerRowHint: 'Spreadsheet row that holds the column titles (rows above it are ignored).',
    previewTitle: 'First rows of the sheet',
    mapping: 'Which column holds each field?',
    fieldHelp: 'What goes in the {field} field',
    required: 'required',
    notMapped: '— not used —',
    inferHierarchy: 'Detect kits from item numbering (1.1 and 1.2 belong to 1)',
    numberRows: 'The spreadsheet has no item number: number items by row order (1, 2, 3…)',
    numberRowsHint: 'On re-import, files linked to items follow the number. If the row order changes, the photo of item 5 moves to the new row 5.',
    mappingMissing: 'Choose the column for: {fields}.',
    mappingMissingItem: 'Choose the column for: {fields}. If the spreadsheet has no item number, tick “number items by row order”.',
    mappingDuplicate: 'The same column is set for “{a}” and “{b}”. Choose a different column for each field.',
    keepFile: 'Keep the spreadsheet as an internal file of the package (sellers only, never buyers)',
    check: 'Check',
    summary: '{valid} valid rows of {total}. {invalid} rows with errors. {children} sub-items.',
    unknownUnits: 'Units not recognized (kept as written):',
    replaceWarning: 'This package has {n} items today. They will all be replaced.',
    linkedWarning: '{n} files are linked to items: they are kept on the same item number when it still exists.',
    errors: 'Errors',
    warnings: 'Warnings',
    row: 'Row',
    field: 'Field',
    problem: 'Problem',
    moreNotShown: '… and {n} more',
    skipInvalid: 'Import the valid rows and skip the rows with errors',
    commit: 'Import {n} items',
    done: '{n} items imported.',
    sampleLines: 'Preview of the imported items',
    stor: {
      thisPackage: 'Spreadsheet {code}: belongs to this package ({name}).',
      otherPackage: 'Spreadsheet {code} is registered in another package: {packages}. Check you opened the right package.',
      confirmOther: 'Import into this package anyway',
      pending: 'Spreadsheet {code} is marked as pending validation: it should not be imported yet.',
      confirmPending: 'I know it is pending and want to import it anyway',
      notLinked: 'Spreadsheet {code} is not linked to any package yet.',
      addToPackage: 'Link code {code} to this package on import',
      noCode: 'The file name does not start with a STOR code. Check that the spreadsheet belongs to this package.'
    },
    codes: {
      item_no_missing: 'Item number missing',
      item_no_duplicate: 'Item number repeated',
      description_missing: 'Description missing',
      quantity_invalid: 'Quantity is not a number',
      quantity_negative: 'Negative quantity',
      quantity_too_large: 'Quantity too large',
      quantity_missing: 'Quantity missing',
      quantity_rounded: 'Quantity rounded to 4 decimals',
      quantity_ambiguous: 'Ambiguous number (read as Brazilian format)',
      unit_missing: 'Unit missing',
      unit_unknown: 'Unit not recognized',
      too_long: 'Value too long',
      truncated: 'Value truncated',
      too_many_rows: 'Too many rows'
    }
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
    intro: 'From the package in STOR to the sale: who does each step, where in the system, and what the buyer sees.',
    expandAll: 'Open all',
    collapseAll: 'Close all',
    where: 'Where:',
    who: { outside: 'Outside the system', seller: 'Seller', buyer: 'Buyer' },
    lanes: { prepare: 'Preparation', publish: 'Publication', serve: 'Requests', close: 'Outcome' },
    steps: {
      stor: {
        title: 'Package in STOR',
        items: {
          a: 'Each package has a folder in STOR, with the item spreadsheet and the photos.',
          b: 'The 7-digit code at the start of the spreadsheet name identifies the document.',
          c: 'Spreadsheets with prices or values stay on your computer: they never go into the system.'
        }
      },
      register: {
        title: 'Package register',
        intro: 'The 22 packages already come registered as Draft, with public name, STOR folder, numbers, type, category, origin, locations and STOR codes.',
        items: { a: 'The seller checks the data and writes the description.', b: 'A package outside the list: "New package" button.' },
        where: 'Packages → Details tab'
      },
      import: {
        title: 'Import the items',
        items: {
          a: 'Download the spreadsheet from STOR and import it into the package. The system reads the code in the file name and checks the spreadsheet belongs to this package.',
          b: 'Check the header, the columns and the report before saving.',
          c: 'One spreadsheet per package. Importing again replaces the items.',
          d: 'A spreadsheet pending validation asks for confirmation. A package without a spreadsheet (Steel Structure): items by hand.'
        },
        where: 'Packages → Items tab → Import spreadsheet'
      },
      files: {
        title: 'Photos and files',
        items: {
          a: 'Photos, datasheet, drawing, list and proposal, on the package or on an item.',
          b: 'Each file has a visibility: Public (everyone), Restricted (buyer with a link) or Internal (sellers only).',
          c: 'A proposal is never public. The first public photo becomes the catalog cover.'
        },
        where: 'Packages → Photos and files tab'
      },
      activate: {
        title: 'Publish: status Active',
        items: {
          a: 'Once Active, the package is in the public catalog: anyone sees it, without logging in.',
          b: 'The catalog shows name, description, items, photos and public files. Never a price.'
        },
        where: 'Packages → Change status'
      },
      browse: {
        title: 'Visitor finds the package',
        items: {
          a: 'Searches by name, description or item; filters by type, origin and location.',
          b: 'Sees that there are restricted documents (without seeing which) and can ask for access.'
        },
        where: 'Catalog (home page)'
      },
      link: {
        title: 'Buyer access link',
        intro: 'Optional, for a qualified buyer. It can come before or during the conversation.',
        items: {
          a: 'Choose the packages and the expiry (up to one year). The buyer sees restricted files and the proposal.',
          b: 'Every access is logged. The link can be revoked at any time.'
        },
        where: 'Access links'
      },
      ask: {
        title: 'Buyer asks for information',
        items: {
          a: 'Form on the package page: becomes a New request in the Requests tab.',
          b: 'Team email or WhatsApp, with the package already in the text: the conversation happens outside the system.',
          c: 'Sold packages do not take requests.'
        },
        where: 'Package page → "Interested in this package?"'
      },
      direct: {
        title: 'Register a direct contact',
        items: {
          a: 'Contact by email, WhatsApp or phone: the seller registers it with "New request", choosing the package and the channel.',
          b: 'This way every request is in the same place.'
        },
        where: 'Requests → New request'
      },
      take: {
        title: 'Take the request',
        items: {
          a: '"Take it" makes you responsible and moves the request to In progress.',
          b: 'The responsible person is a system user and can be changed. The internal note records what was done.'
        },
        where: 'Requests'
      },
      negotiate: {
        title: 'Package under negotiation',
        items: {
          a: 'When the conversation moves forward, change the package status to Under negotiation.',
          b: 'In the catalog it only shows with "Show packages under negotiation" ticked. Other buyers can still ask for information.'
        },
        where: 'Packages → Change status'
      },
      outcome: {
        title: 'Record the outcome',
        items: {
          a: 'Choose the outcome: sold to this buyer, did not go ahead, or no reply. The request becomes Done.',
          b: 'No value or price: just the outcome and the note.'
        },
        where: 'Requests → Outcome'
      },
      package: {
        title: 'Update the package',
        items: {
          a: 'Sold: leaves the catalog and stops taking requests. A buyer with a link still sees it.',
          b: 'Active: the negotiation did not go ahead and the package is back in the catalog.',
          c: 'Inactive: withdrawn for another reason. Nobody outside the team sees it.'
        },
        where: 'Packages → Change status'
      },
      others: {
        title: 'Close the other requests',
        items: {
          a: 'Package sold: answer and close the other open requests about it.',
          b: 'Revoke buyer links that no longer make sense.'
        },
        where: 'Requests (search by package) and Access links'
      }
    },
    states: {
      title: 'Package status: who sees what',
      intro: 'The status decides whether the package is in the catalog, for a buyer with a link, and whether it takes requests.',
      status: 'Status',
      catalog: 'Catalog',
      link: 'Buyer link',
      requests: 'Requests',
      withToggle: 'With the box ticked',
      path: 'Usual path: Draft → Active → Under negotiation → Sold. If the negotiation does not go ahead, back to Active.'
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
    searchPlaceholder: 'Search by package, item or description',
    clearSearch: 'Clear search',
    button: 'Filters',
    type: 'Type',
    origin: 'Origin',
    location: 'Location',
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
    intro: 'How the system is organized, where the package data comes from and the rules that apply to everyone.',
    goToImport: 'See the step-by-step spreadsheet loading',
    sections: {
      overview: {
        title: 'What MineRecycle is',
        intro:
          'A temporary platform that connects sellers and buyers of the assets of a halted mining project. Buyers learn about the packages through the catalog or an access link and negotiate directly with the sales team.',
        items: {
          a: 'There are no prices on the platform: no price field, no price on screen and no public file with values.',
          b: 'The site is in English, with Portuguese as an option. Names, descriptions and items are not translated.',
          c: 'A single sales team: every seller can edit every package, each with their own login.'
        }
      },
      scope: {
        title: 'Why it is not 60 thousand items',
        conclusion:
          'The site shows the 22 sales packages, each with its own item list. It does not show the roughly 60 thousand items of the project.',
        status: 'This conclusion is backed by evidence but not yet confirmed by the client.',
        startTitle: 'Starting point',
        start:
          'The initial information was that the client had a spreadsheet with about 60 thousand items, forming about a thousand lots, and that the most reliable data would be in STOR.',
        evidenceTitle: 'Evidence, in the order it came up',
        evidence: {
          e1: 'The 60 thousand are the project, not the stock. The number shows up in the item register (61,246) and in the Process Plant tree (61,835 rows). These bases hold about 36 thousand items at the "Initial" stage (specified and never finalized), about 2 thousand services, about 3,600 raw-material rows and catalog items created in 2015, before the project. There is no stock quantity and no location.',
          e2: 'Far less was received. The "Materials Receiving" branch (item 443815) has about 3,650 items, organized by supplier and contract. The project stopped halfway through construction.',
          e3: 'The physical inventory confirms the order of magnitude. The "Warehouse Inventory" spreadsheet (document 1810554) has 14,144 counted rows, with a storage address and the "STOR no." key.',
          e4: 'The sale is organized in packages. Under Document > Suprimentos/Supply > Projeto Araguaia - ANM > Assets Sales > Packages there are 24 package folders. The client responsibility matrix (document 1808732) describes the process as organizing the assets into packages and compiling a materials list per package.',
          e5: 'Steel structure is sold by weight. The package spreadsheet (1809537) is a single row, in tonnes. Most of the inventory is steel structure, which does not need to be listed piece by piece.',
          e6: 'The sales lists are independent of STOR. The electrical materials list (1809601) has 561 rows, was written by hand, has no STOR code, and none of its descriptions match the register, the inventory or the ERP.'
        },
        factsTitle: 'Fact and inference',
        colClaim: 'Statement',
        colBasis: 'Basis',
        facts: {
          f1: { claim: 'The 60 thousand include items never bought, services and raw material', basis: 'Seen in the data' },
          f2: { claim: 'About 14 thousand rows physically exist', basis: 'Client inventory' },
          f3: { claim: 'The sale is by package', basis: 'Folders and client process document' },
          f4: {
            claim: 'Each package has its own list, independent of STOR',
            basis: 'Tested on one package; for the others, by the spreadsheet format'
          },
          f5: { claim: 'The client does not expect to see the 60 thousand on the site', basis: 'Inference, to be confirmed' }
        },
        ambiguityTitle: 'Known ambiguity',
        ambiguity:
          'Three bases have about 60 thousand rows: the item register, the Process Plant tree and the "Analítico" tab of the "Lista de materiais e Ativos" (1808778), with 61,726 accounting entries. It is not known which one the initial information referred to.',
        source:
          'Source of the numbers: STOR exploration on 2026-11-16. The exports behind these numbers are not stored with the project files.',
        consequencesTitle: 'Consequences in the system',
        consequences: {
          c1: 'The catalog unit is the package. Items are package lines, imported from each package spreadsheet, and importing again replaces the list (see Packages and Items).',
          c2: 'Two package types: bulk and equipment (see Packages, Type field).',
          c3: 'STOR code, tag and warehouse location are optional reference fields, not keys. An item is identified by the package and the item number (see Items).',
          c4: 'The package number is not a key: the same number appears in more than one folder. The package is identified by its STOR folder (see Package numbers and list order).'
        },
        questionTitle: 'Open question for the client',
        question:
          'Should the site show the sales packages with their lists, or is it expected to browse the 60 thousand project items? If the latter, the data has already been exported from STOR and the change is in volume, not in the model.'
      },
      stor: {
        title: 'How STOR is organized',
        intro:
          "STOR Global is the client's document and materials repository. It has no package register: what exists are folders and hand-made spreadsheets.",
        items: {
          a: 'Each sales package is a folder under Packages. Folder names mix numbers and text, for example 7-8-11 Crushers or 28-Pipping.',
          b: 'Each document has a 7-digit code at the start of the downloaded file name (for example 1809438_REV0_VER0_...).',
          c: 'The STOR material code is something else: it sits inside the spreadsheet, on the item row, and can repeat across rows.',
          d: 'Each package has its own spreadsheet, each in its own format: the header row moves, column names vary and some have no item number or unit.',
          e: 'Some packages have no spreadsheet, only PDFs and photos. Their items are entered by hand.',
          f: 'STOR only has photos of the substation transformers, the office furniture and Niquelândia. The other packages need new photos.',
          g: 'Not every folder is a package: the auction contract (Superbid), the sale of the whole project (32-Project) and the joint negotiation (32-BULK Sale) are left out.'
        }
      },
      packages: {
        title: 'Packages',
        intro: 'Each package header holds what buyers see and the STOR identification, which only sellers see.',
        rows: {
          name: { term: 'Public name', text: 'English name shown in the catalog and on the buyer link.' },
          folder: { term: 'STOR folder', text: 'Folder name, spelled as in STOR. Identifies the package and is unique. Sellers only.' },
          numbers: { term: 'STOR no.', text: 'Asset IDs in the sales strategy spreadsheet. Used to sort the list. Sellers only.' },
          origin: {
            term: 'Origin',
            text: 'Where the assets came from (Araguaia Nickel Project, Niquelândia...). Unlike Locations, which say where they are now: the Uberaba Dry Port refractories have origin Araguaia and location Uberaba. Chosen from a list kept in Settings; shows as a catalog filter when there are packages from more than one origin.'
          },
          category: {
            term: 'Category',
            text: 'Refractories, electrical, piping, process equipment, office or other. In the catalog, a package without a photo shows as a tag in the category color and icon, with one highlighted number: units (equipment), total weight (bulk, with items in kg or t) or number of items.'
          },
          type: {
            term: 'Type',
            text: 'Bulk, when the lot is sold as a whole (refractories, cables, piping), or equipment, sold per item or set.'
          },
          locations: { term: 'Locations', text: 'Where the goods are. A package can have several. To be confirmed can sit next to a known location.' },
          documents: {
            term: 'STOR documents',
            text: "Codes of the package's spreadsheets. A code marked as pending still awaits the client's validation. Sellers only."
          },
          status: { term: 'Status', text: 'Draft, active, under negotiation, sold or inactive. Draft and inactive never show to buyers.' }
        },
        items: {
          a: 'One spreadsheet per package: importing again replaces all items. When a folder has one spreadsheet per location, it becomes one package per location, like the Conceição do Araguaia and Uberaba refractories.',
          b: 'The initial package register came from the STOR survey. What is edited here is kept: system updates do not overwrite seller changes.',
          c: 'Why the catalog is made of packages, not of project items: see Why it is not 60 thousand items.'
        }
      },
      numbers: {
        title: 'Package numbers and list order',
        items: {
          a: 'Numbers come from the sales strategy spreadsheet, not from the folder name.',
          b: 'In folder names the hyphen means "and", not a range: 1-6 are assets 1 and 6.',
          c: 'The same number can be in more than one package. For example, 10 and 12 are in both the dryer and the kiln.',
          d: 'When the spreadsheet has no ID that clearly matches the package, the number is left empty. Sellers can fill it in on the package header.',
          e: 'Lists are sorted by the lowest package number, then by name. Packages without a number go last.',
          f: 'Buyers see no numbers at all: neither the STOR no. nor the catalog no., which only appears in the page address.'
        },
        note: 'The sales strategy spreadsheet has values and buyer contacts. It is a reference only and is never imported or attached.'
      },
      locations: {
        title: 'Locations',
        intro: 'A location is only added when a document points to it. When in doubt, use To be confirmed.',
        rows: {
          cda: { term: 'Conceição do Araguaia', text: 'The project site.' },
          uberaba: { term: 'Uberaba', text: 'The Uberaba Dry Port (EADI), where equipment and materials are stored.' },
          niquelandia: { term: 'Niquelândia', text: 'The Niquelândia refinery.' },
          bh: { term: 'Belo Horizonte', text: 'Office furniture and equipment.' },
          supplier: { term: 'At supplier', text: 'Goods still held by the supplier.' },
          tbc: { term: 'To be confirmed', text: 'No document yet, or parts of the package at an unknown location.' }
        }
      },
      items: {
        title: 'Items',
        items: {
          a: 'Each item is identified by the package and the item number, which is text (1, 1.2, 10A). If the spreadsheet has no item number, the import can number items by row order.',
          b: 'Kits: 1.1 and 1.2 become sub-items of item 1 when item 1 is in the same spreadsheet.',
          c: 'Quantity is the total quantity in the row unit, not the number of packs.',
          d: 'Numbers are read in Brazilian format first (1.234,5). When a value is ambiguous, the review warns.',
          e: 'Units are standardized by a synonym table (pç, Peça and un become PC). Unknown units are kept as written.',
          f: 'Columns with no field in the system, such as supplier, weight, category and values, do not become item data. They stay in the original spreadsheet kept in the package, which only sellers see.',
          g: 'Hidden and filtered rows are imported too. If they should not go in, delete them in a copy before uploading.',
          h: 'A spreadsheet with a code pending validation is only imported after confirmation.',
          i: 'STOR code, tag and location are references, not keys: see Why it is not 60 thousand items.'
        }
      },
      files: {
        title: 'Photos and files',
        rows: {
          public: { term: 'Public', text: 'Any visitor sees it when the package is in the catalog.' },
          restricted: { term: 'Restricted', text: 'Only people with an access link to the package, plus sellers.' },
          internal: { term: 'Internal', text: 'Logged-in sellers only. Used for the original import spreadsheet, which may contain values.' }
        },
        items: {
          a: 'Photos get a web version and a thumbnail, without metadata. The public never receives the original photo file, which may carry GPS location.',
          b: 'Proposals are never public: they are restricted or internal.',
          c: 'A file can belong to the whole package (gallery and catalog cover) or to an item (shown only on the item row). A file linked to an item stays on the same item number after a re-import.',
          d: 'Before uploading a PDF, check whether it has prices, values or buyer names. If it does, use Internal.',
          e: 'To upload: click Add files, drag the files onto the page or paste an image with Ctrl+V (a screenshot, for example); all three open the upload window. Check the list and click Upload. Cancel discards the list.'
        }
      },
      access: {
        title: 'Who sees what',
        rows: {
          visitor: {
            term: 'Visitor',
            text: 'The catalog: active packages and, with "Show packages under negotiation" ticked, those under negotiation, with their public files. Sold and draft packages never appear.'
          },
          buyer: {
            term: 'Buyer with a link',
            text: 'The packages on the link, except draft and inactive (sold ones show: they may be theirs), with public and restricted files and the same filters as the catalog. The link is valid until the set date (one year at most) and can be revoked at any time.'
          },
          seller: { term: 'Seller', text: 'Everything: all packages and statuses, the STOR identification and internal files.' },
          admin: { term: 'Administrator', text: 'Same as a seller, plus user management, the origin list and the sales contact (Settings).' }
        }
      },
      inquiries: {
        title: 'Buyer requests',
        intro:
          'The buyer asks for information from the package page: by the request form, by email or by WhatsApp. The email and WhatsApp are the team ones, set under Settings.',
        rows: {
          form: {
            term: 'Request form',
            text: 'Name, company, email, phone, country and "More information". No field is required on its own, but the buyer leaves an email or a phone. One package per request. There is no price or offer field.'
          },
          where: {
            term: 'Who can ask',
            text: 'Visitors (catalog) and buyers with a link. Sold packages do not take requests. A request sent through a link shows the link name.'
          },
          panel: {
            term: 'Requests tab',
            text: 'Every request lands there, with a counter of new ones on the tab. There is no email notice yet: check the tab every day.'
          },
          take: {
            term: 'Take it',
            text: 'Makes you responsible and moves a new request to In progress. The responsible person can be changed to anyone on the team.'
          },
          direct: {
            term: 'Direct contact',
            text: 'A request that came by email, WhatsApp or phone is registered by hand with "New request", with the channel. It starts In progress, with you as the responsible person.'
          },
          outcome: {
            term: 'Outcome',
            text: 'When a request is Done, choose the outcome: sold to this buyer, did not go ahead, or no reply. Choosing an outcome marks the request as Done. No value or price.'
          },
          status: {
            term: 'Status',
            text: 'New (nobody took it), In progress, Done (answered) or Discarded (spam or nonsense). The internal note records what was done; the last change shows who and when.'
          }
        },
        items: {
          a: 'Answer in the language the buyer used on the site (shown on the request).',
          b: 'Requests hold personal data: use them only to answer, and delete spam.',
          c: 'Emails and WhatsApp messages sent directly only appear in the Requests tab once someone registers them with New request.'
        }
      },
      rules: {
        title: 'Rules that always apply',
        items: {
          a: 'No price, value or buyer name goes into the package register, the items or a public file.',
          b: 'Client data is confidential. Spreadsheets and documents go in only through the system screens.',
          c: 'One package, one spreadsheet. Importing again replaces the items; it does not add to them.',
          d: 'Locations only with a document as source.',
          e: 'When unsure about a number, a location or whether a spreadsheet should be imported, leave it open and confirm with the client.'
        }
      }
    }
  },
  help: {
    menu: 'Help',
    tab: 'Spreadsheet loading',
    title: 'Help: loading spreadsheets',
    intro: 'How to download the package spreadsheets from STOR and import them into MineRecycle, one spreadsheet per package.',
    contents: 'On this page',
    export: {
      title: '1. Download the spreadsheet from STOR',
      intro:
        "The sales lists are kept in STOR Global, the client's document and materials system. Each package has its own spreadsheet, made by hand and with its own layout; there is no single master list.",
      whereLabels: { site: 'Address', project: 'Project', folder: 'Packages folder' },
      where: {
        site: 'stor.storglobal.com/storweb',
        project: 'ANM - Araguaia Nickel Project',
        folder: 'Suprimentos/Supply › Projeto Araguaia - ANM › Assets Sales › Packages'
      },
      steps: {
        s1: 'Open Documento › Gestão de Documentos.',
        s2: 'In the folder tree, select Assets Sales.',
        s3: 'Type the document code in the search box and click the magnifier. Search only works with a folder selected and also looks in subfolders.',
        s4: 'Tick the document row and click Download.',
        s5: 'Save the file on your computer. The file name already starts with the document code.'
      },
      careTitle: 'Take care in STOR',
      care: {
        c1: 'Use Download only. Do not use Novo, Importar, Salvar or Enviar.',
        c2: 'On a document detail screen, always leave through Cancelar.',
        c3: 'Spreadsheets with prices or values are confidential: keep them on your computer only and do not forward them by email or chat.'
      }
    },
    prepare: {
      title: '2. Check the spreadsheet before uploading',
      intro: 'Open the file in Excel and check the points below. If something needs changing, work on a copy.',
      items: {
        i1: 'Format: .xlsx or .xls. If it comes as .xlsm, save a copy as .xlsx.',
        i2: 'If the file has several sheets, you pick the right sheet during the import.',
        i3: 'The item number is required. If the spreadsheet has no such column, tick “number items by row order” (1, 2, 3…). On re-import, keep the row order so photos stay with the right item.',
        i4: 'If the unit only appears in the column title (for example, Quantity (meters)), insert a unit column with m, kg etc.',
        i5: 'Hidden rows, or rows hidden by a filter, are imported like any other. Delete the ones not for sale in the copy.',
        i6: 'Total or subtotal rows at the end of the sheet show up as errors: delete them or skip them during the review.'
      }
    },
    upload: {
      title: '3. Import into MineRecycle',
      steps: {
        s1: 'In Packages, open the package. If it does not exist yet, create it with New package: the public name in English (what buyers see), the STOR folder written exactly the same (e.g. 1-6 Refractories), the package numbers in the strategy spreadsheet, the type and every location. Keep it as a draft while you check.',
        s2: 'On the Items tab, click Import spreadsheet, choose the file and click Read file. The system checks the STOR code in the file name and warns if the spreadsheet belongs to another package.',
        s3: 'Check the sheet and the header row (the row with the column titles). The preview highlights the chosen row; change the number if it is wrong.',
        s4: 'For each field, choose the matching column. The system suggests columns by their title: check them. The ? next to each field explains what goes in it. Price or value columns (including total value) stay as "not used".',
        s5: 'Click Check. Nothing is saved yet: see how many rows are valid, the errors and warnings per spreadsheet row and a preview of the items.',
        s6: 'If there are errors, fix the spreadsheet and upload it again, or tick the option to skip the rows with errors.',
        s7: "Click Import. The package's current items are replaced by the spreadsheet's.",
        s8: 'Check the items on the Items tab and, when everything is right, change the package status.'
      },
      goToPackages: 'Go to Packages'
    },
    fields: {
      title: 'Import fields',
      colField: 'Field',
      colRequired: 'Required',
      colNotes: 'Notes',
      yes: 'yes',
      no: 'no',
      notes: {
        itemNo: 'Item number in the spreadsheet, such as 1, 1.2 or 10A. Cannot repeat within the package, and 1.2 becomes a sub-item of 1. If the spreadsheet has no such column, tick the option to number by row order.',
        description: 'What the item is, as the buyer will read it (e.g. Refractory brick 230 x 114 x 64 mm). Up to 4,000 characters.',
        quantity: 'Quantity in the unit chosen under Unit. If the unit is KG or T, use the total weight column, not the number of boxes or pallets. Accepts decimals with comma or point (12,5 or 12.5). An empty cell only gives a warning.',
        unit: 'Unit of the quantity. Standardized: UN, pç and PEÇ become PC; MT becomes M; kg becomes KG. Unknown units are kept and flagged during the review.',
        storCode: 'Material code in STOR (e.g. 100245). A reference, not a key: it may repeat across rows. Optional; included in the item search.',
        tag: 'Equipment identifier in the plant design, the same as in equipment lists and on the nameplate (e.g. MO-101, TR-01). Meant for equipment packages; bulk material usually has none. Optional; included in the item search.',
        warehouseLocation: 'Where the item is stored in the warehouse or yard (e.g. Shed 2 - Box 3, A3-R2). Optional.'
      },
      discarded: 'Columns not used (supplier, category, price, value etc.) are not saved in the items.'
    },
    after: {
      title: '4. After the import',
      items: {
        i1: "Importing again replaces all the package's items: it does not add up or duplicate. Photos linked to an item stay linked if the item number is kept.",
        i2: 'There is no undo button. To fix a mistake, import the right spreadsheet again or edit the items one by one.',
        i3: 'With the keep-spreadsheet option ticked, the original file stays under Photos and files as Internal: only logged-in sellers see it, never buyers with a link or the public.',
        i4: 'Packages without a spreadsheet in STOR are entered by hand, item by item, on the Items tab.'
      }
    }
  },
  errors: {
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
    NUMBER_TAKEN: 'A package with this number already exists.',
    STOR_FOLDER_TAKEN: 'Another package already uses this STOR folder.',
    IMPORT_DOCUMENT_PENDING: 'This spreadsheet is pending validation. Confirm to import it anyway.',
    ITEM_NO_TAKEN: 'This item number already exists in the package.',
    USER_DELETE_SELF: 'You cannot delete your own user.',
    ORIGIN_CODE_TAKEN: 'Another origin already uses this code.',
    ORIGIN_INACTIVE: 'This origin is inactive. Choose an active origin.',
    ORIGIN_INVALID: 'Choose the package origin.',
    EMAIL_TAKEN: 'A user with this email already exists.',
    PAYLOAD_TOO_LARGE: 'File too large.',
    IMPORT_FILE_TYPE: 'Upload an Excel file (.xlsx or .xls).',
    IMPORT_UNREADABLE: 'The spreadsheet could not be read.',
    IMPORT_NOT_FOUND: 'This import has expired. Please upload the file again.',
    IMPORT_MAPPING_INVALID: 'Check the columns: a required field has no column, or the same column is used for two fields.',
    IMPORT_HAS_ERRORS: 'The spreadsheet has rows with errors. Fix them or choose to skip them.',
    IMPORT_EMPTY: 'There are no valid rows to import.'
  },
  notFound: {
    title: 'Page not found',
    back: 'Back to catalog'
  }
}
