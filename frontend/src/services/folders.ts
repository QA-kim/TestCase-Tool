import api from '../lib/axios'

export interface Folder {
  id: string
  name: string
  description?: string
  project_id: string
  parent_id?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface FolderCreate {
  name: string
  description?: string
  project_id: string
  parent_id?: string
}

export interface FolderUpdate {
  name?: string
  description?: string
  parent_id?: string
}

export const foldersApi = {
  // Get all folders for a project
  list: async (projectId?: string, parentId?: string): Promise<Folder[]> => {
    const params: any = {}
    if (projectId) params.project_id = projectId
    if (parentId !== undefined) params.parent_id = parentId
    const response = await api.get('/folders', { params })
    return response.data
  },

  // Get a specific folder
  get: async (folderId: string): Promise<Folder> => {
    const response = await api.get(`/folders/${folderId}`)
    return response.data
  },

  // Create a new folder
  create: async (folder: FolderCreate): Promise<Folder> => {
    const response = await api.post('/folders', folder)
    return response.data
  },

  // Update a folder
  update: async (folderId: string, folder: FolderUpdate): Promise<Folder> => {
    const response = await api.put(`/folders/${folderId}`, folder)
    return response.data
  },

  // Delete a folder
  delete: async (folderId: string): Promise<void> => {
    await api.delete(`/folders/${folderId}`)
  }
}
