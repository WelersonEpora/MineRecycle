import axios from 'axios'

// Mesma origem (o nginx repassa /api ao backend): os cookies httpOnly de vendedor e comprador vão sozinhos.
const http = axios.create({ baseURL: '/api/v1', timeout: 60000, withCredentials: true })

const data = (p) => p.then((r) => r.data)

export const api = {
  // Sessão
  me: () => data(http.get('/auth/me')),
  login: (email, password) => data(http.post('/auth/login', { email, password })),
  logout: () => http.post('/auth/logout'),

  // Vitrine e comprador
  catalog: (params) => data(http.get('/catalog/packages', { params })),
  packageDetail: (number) => data(http.get(`/catalog/packages/${number}`)),
  packageLines: (number, params) => data(http.get(`/catalog/packages/${number}/lines`, { params })),
  redeem: (token) => http.post('/access/redeem', { token }),
  buyerSession: () => data(http.get('/access/session')),
  buyerPackages: (params) => data(http.get('/access/packages', { params })),
  buyerLogout: () => http.post('/access/logout'),
  contact: () => data(http.get('/contact')),
  sendInquiry: (number, body) => data(http.post(`/catalog/packages/${number}/inquiries`, body)),

  // Vendedor: pedidos de informação
  inquiries: (params) => data(http.get('/seller/inquiries', { params })),
  inquiryCounts: () => data(http.get('/seller/inquiries/counts')),
  updateInquiry: (id, body) => data(http.patch(`/seller/inquiries/${id}`, body)),
  deleteInquiry: (id) => http.delete(`/seller/inquiries/${id}`),
  setContact: (body) => data(http.put('/seller/contact', body)),

  // Vendedor: pacotes
  sellerPackages: (params) => data(http.get('/seller/packages', { params })),
  sellerPackage: (id) => data(http.get(`/seller/packages/${id}`)),
  createPackage: (body) => data(http.post('/seller/packages', body)),
  updatePackage: (id, body) => data(http.patch(`/seller/packages/${id}`, body)),
  setStatus: (id, status) => data(http.put(`/seller/packages/${id}/status`, { status })),
  deletePackage: (id) => http.delete(`/seller/packages/${id}`),

  // Linhas
  sellerLines: (id, params) => data(http.get(`/seller/packages/${id}/lines`, { params })),
  createLine: (id, body) => data(http.post(`/seller/packages/${id}/lines`, body)),
  updateLine: (lineId, body) => data(http.patch(`/seller/lines/${lineId}`, body)),
  deleteLine: (lineId) => http.delete(`/seller/lines/${lineId}`),

  // Importação
  startImport: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return data(http.post(`/seller/packages/${id}/imports`, form, { timeout: 180000 }))
  },
  importLayout: (id, importId, body) => data(http.post(`/seller/packages/${id}/imports/${importId}/layout`, body)),
  importPreview: (id, importId, body) => data(http.post(`/seller/packages/${id}/imports/${importId}/preview`, body, { timeout: 180000 })),
  importCommit: (id, importId, body) => data(http.post(`/seller/packages/${id}/imports/${importId}/commit`, body, { timeout: 180000 })),
  cancelImport: (id, importId) => http.delete(`/seller/packages/${id}/imports/${importId}`),

  // Anexos
  attachments: (id) => data(http.get(`/seller/packages/${id}/attachments`)),
  uploadAttachments: (id, files, fields, onProgress) => {
    const form = new FormData()
    for (const [k, v] of Object.entries(fields)) if (v !== null && v !== undefined && v !== '') form.append(k, v)
    for (const f of files) form.append('files', f)
    return data(
      http.post(`/seller/packages/${id}/attachments`, form, {
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
