import axios from 'axios'

// Mesma origem (o nginx repassa /api ao backend): os cookies httpOnly de vendedor e comprador vão sozinhos.
const http = axios.create({ baseURL: '/api/v1', timeout: 60000, withCredentials: true })

const data = (p) => p.then((r) => r.data)
const ownerPath = (owner) => (owner.lotId ? `/seller/lots/${owner.lotId}/attachments` : `/seller/packages/${owner.packageId}/attachments`)

export const api = {
  // Sessão
  me: () => data(http.get('/auth/me')),
  login: (email, password) => data(http.post('/auth/login', { email, password })),
  logout: () => http.post('/auth/logout'),

  // Catálogo e comprador
  catalog: (params) => data(http.get('/catalog/packages', { params })),
  packageDetail: (number) => data(http.get(`/catalog/packages/${number}`)),
  packageLots: (number, params) => data(http.get(`/catalog/packages/${number}/lots`, { params })),
  packageLot: (number, lotId) => data(http.get(`/catalog/packages/${number}/lots/${lotId}`)),
  redeem: (token) => http.post('/access/redeem', { token }),
  buyerSession: () => data(http.get('/access/session')),
  buyerPackages: (params) => data(http.get('/access/packages', { params })),
  buyerLogout: () => http.post('/access/logout'),
  contact: () => data(http.get('/contact')),
  sendInquiry: (number, body) => data(http.post(`/catalog/packages/${number}/inquiries`, body)),

  // Vendedor: pedidos de informação
  inquiries: (params) => data(http.get('/seller/inquiries', { params })),
  createInquiry: (body) => data(http.post('/seller/inquiries', body)),
  inquiryCounts:() => data(http.get('/seller/inquiries/counts')),
  updateInquiry: (id, body) => data(http.patch(`/seller/inquiries/${id}`, body)),
  deleteInquiry: (id) => http.delete(`/seller/inquiries/${id}`),
  setContact: (body) => data(http.put('/seller/contact', body)),

  // Vendedor: pacotes
  sellerPackages: (params) => data(http.get('/seller/packages', { params })),
  sellerPackage: (id) => data(http.get(`/seller/packages/${id}`)),
  createPackage: (body) => data(http.post('/seller/packages', body)),
  updatePackage: (id, body) => data(http.patch(`/seller/packages/${id}`, body)),
  // Situação. confirm: vender mesmo com lotes já vendidos em outro pacote (erro PACKAGE_SALE_CONFIRM).
  setStatus: (id, status, confirm = false) => data(http.put(`/seller/packages/${id}/status`, { status, confirm })),
  deletePackage: (id) => http.delete(`/seller/packages/${id}`),
  packageSellerLots: (id, params) => data(http.get(`/seller/packages/${id}/lots`, { params })),
  addPackageLots: (id, lotIds) => data(http.post(`/seller/packages/${id}/lots`, { lotIds })),
  removePackageLots: (id, lotIds) => data(http.post(`/seller/packages/${id}/lots/remove`, { lotIds })),

  // Vendedor: lotes
  lots: (params) => data(http.get('/seller/lots', { params })),
  lotIds: (params) => data(http.get('/seller/lots/ids', { params })),
  lotFacets: () => data(http.get('/seller/lots/facets')),
  lot: (id) => data(http.get(`/seller/lots/${id}`)),
  updateLot: (id, body) => data(http.patch(`/seller/lots/${id}`, body)),
  packageFromLot: (id) => data(http.post(`/seller/lots/${id}/package`)),

  // Importação de lotes (planilha da Horizonte, aba "Matriz de lotes")
  startLotImport: (file) => {
    const form = new FormData()
    form.append('file', file)
    return data(http.post('/seller/lot-imports', form, { timeout: 180000 }))
  },
  lotImportPreview: (importId, body) => data(http.post(`/seller/lot-imports/${importId}/preview`, body, { timeout: 180000 })),
  lotImportCommit: (importId, body) => data(http.post(`/seller/lot-imports/${importId}/commit`, body, { timeout: 180000 })),
  cancelLotImport: (importId) => http.delete(`/seller/lot-imports/${importId}`),

  // Anexos
  // owner: { packageId } ou { lotId }.
  attachments: (owner) => data(http.get(ownerPath(owner))),
  uploadAttachments: (owner, files, fields, onProgress) => {
    const form = new FormData()
    for (const [k, v] of Object.entries(fields)) if (v !== null && v !== undefined && v !== '') form.append(k, v)
    for (const f of files) form.append('files', f)
    return data(
      http.post(ownerPath(owner), form, {
        timeout: 600000,
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
      })
    )
  },
  updateAttachment: (attId, body) => data(http.patch(`/seller/attachments/${attId}`, body)),
  deleteAttachment: (attId) => http.delete(`/seller/attachments/${attId}`),

  // Links de acesso
  accessLinks: (params) => data(http.get('/seller/access-links', { params })),
  createAccessLink: (body) => data(http.post('/seller/access-links', body)),
  updateAccessLink: (linkId, body) => data(http.patch(`/seller/access-links/${linkId}`, body)),
  revokeAccessLink: (linkId) => data(http.post(`/seller/access-links/${linkId}/revoke`)),
  accessLinkLogs: (linkId) => data(http.get(`/seller/access-links/${linkId}/logs`)),

  // Administração e conta
  origins: () => data(http.get('/seller/origins')),
  createOrigin: (body) => data(http.post('/seller/origins', body)),
  updateOrigin: (id, body) => data(http.patch(`/seller/origins/${id}`, body)),
  users: () => data(http.get('/seller/users')),
  createUser: (body) => data(http.post('/seller/users', body)),
  updateUser: (userId, body) => data(http.patch(`/seller/users/${userId}`, body)),
  deleteUser: (userId) => http.delete(`/seller/users/${userId}`),
  changePassword: (currentPassword, newPassword) => http.put('/seller/me/password', { currentPassword, newPassword })
}
