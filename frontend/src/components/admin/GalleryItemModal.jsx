import { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Loader2, Upload, X, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function GalleryItemModal({ isOpen, onClose, item = null, onSaveSuccess }) {
  const { getToken } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'sneakers',
    image: '',
    featured: false
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        category: item.category || 'sneakers',
        image: item.image || '',
        featured: item.featured || false
      })
      setPreview(item.image || null)
    } else {
      setFormData({
        title: '',
        category: 'sneakers',
        image: '',
        featured: false
      })
      setPreview(null)
      setFile(null)
    }
  }, [item, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const token = await getToken()
      let imageUrl = formData.image

      // Upload image if a new file was selected
      if (file) {
        const fileExtension = file.name.split('.').pop()
        const fileName = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
        const storageRef = ref(storage, fileName)
        
        const snapshot = await uploadBytes(storageRef, file)
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      if (!imageUrl && !file) {
        throw new Error("Please upload an image for the gallery.")
      }

      const payload = {
        ...formData,
        image: imageUrl
      }

      const url = item 
        ? `${API}/api/gallery/${item.id}` 
        : `${API}/api/gallery`
        
      const method = item ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('Failed to save gallery item')
      }

      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
                {item ? 'Edit Artwork' : 'Add New Artwork'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <form id="gallery-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Artwork Image</label>
              <div className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/5 hover:bg-secondary/20 transition-all overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Click to upload photo</span></p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
                  </div>
                )}
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Artwork Title</label>
              <input
                required
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Neon City Dream"
              />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                    <option value="sneakers">Sneakers</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="jackets">Jackets</option>
                    <option value="tees">Tees</option>
                </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="featured"
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                checked={formData.featured}
                onChange={e => setFormData({ ...formData, featured: e.target.checked })}
              />
              <label htmlFor="featured" className="text-sm font-medium cursor-pointer text-foreground">
                Feature this on the homepage?
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-4 bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="gallery-form" disabled={isLoading} className="gap-2 min-w-[100px]">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              item ? 'Save Changes' : 'Add Artwork'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
