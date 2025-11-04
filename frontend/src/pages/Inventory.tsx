import React, { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TagIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Category {
  id: number
  name: string
  description: string
  color: string
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}

interface Product {
  id: number
  name: string
  description: string
  category: number
  category_name?: string
  unit: string
  current_stock: number
  min_stock: number
  location: string
  status: 'active' | 'inactive' | 'discontinued'
  is_active: boolean
  is_low_stock?: boolean
  created_at: string
  updated_at: string
}

interface StockMovement {
  id: number
  product: number
  product_name?: string
  movement_type: 'in' | 'out' | 'adjustment'
  movement_type_display?: string
  quantity: number
  reference: string
  user: string
  notes: string
  created_at: string
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false)
  const [showStockMovementModal, setShowStockMovementModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 0,
    unit: 'kg',
    current_stock: 0,
    min_stock: 0,
    location: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued'
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  })

  const [movementForm, setMovementForm] = useState({
    product: 0,
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reference: '',
    user: '',
    notes: ''
  })

  useEffect(() => {
    fetchCategories()
    fetchProducts()
    fetchStockMovements()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/inventory/categories/')
      const data = response.data.results || response.data || []
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error al cargar categorías')
      setCategories([])
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/inventory/products/')
      const data = response.data.results || response.data || []
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStockMovements = async () => {
    try {
      const response = await api.get('/inventory/movements/')
      const data = response.data.results || response.data || []
      setStockMovements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      toast.error('Error al cargar movimientos')
      setStockMovements([])
    }
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0].id : 0,
      unit: 'kg',
      current_stock: 0,
      min_stock: 0,
      location: '',
      status: 'active'
    })
    setShowAddProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      unit: product.unit,
      current_stock: product.current_stock,
      min_stock: product.min_stock,
      location: product.location,
      status: product.status
    })
    setShowAddProductModal(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}/`, productForm)
        toast.success('Artículo actualizado exitosamente')
      } else {
        await api.post('/inventory/products/', productForm)
        toast.success('Artículo creado exitosamente')
      }
      fetchProducts()
    setShowAddProductModal(false)
    setEditingProduct(null)
    } catch (error: any) {
      console.error('Error guardando artículo:', error)
      const errorMessage = error.response?.data?.name?.[0] || 'Error al guardar artículo'
      toast.error(errorMessage)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return
    
    try {
      await api.delete(`/inventory/products/${productId}/`)
      toast.success('Artículo eliminado exitosamente')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar artículo')
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      color: 'bg-blue-500'
    })
    setShowAddCategoryModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
      color: category.color
    })
    setShowAddCategoryModal(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
    if (editingCategory) {
        await api.put(`/inventory/categories/${editingCategory.id}/`, categoryForm)
        toast.success('Categoría actualizada exitosamente')
      } else {
        await api.post('/inventory/categories/', categoryForm)
        toast.success('Categoría creada exitosamente')
      }
      fetchCategories()
      fetchProducts() // Refresh products to update category counts
      setShowAddCategoryModal(false)
      setEditingCategory(null)
    } catch (error: any) {
      console.error('Error guardando categoría:', error)
      const errorMessage = error.response?.data?.name?.[0] || 'Error al guardar categoría'
      toast.error(errorMessage)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esto también eliminará todos sus productos.')) return
    
    try {
      await api.delete(`/inventory/categories/${categoryId}/`)
      toast.success('Categoría eliminada exitosamente')
      fetchCategories()
      fetchProducts()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error al eliminar categoría')
    }
  }

  const handleOpenStockMovement = (product: Product) => {
    setSelectedProduct(product)
    setMovementForm({
      product: product.id,
      movement_type: 'in',
      quantity: 0,
      reference: '',
      user: '',
      notes: ''
    })
    setShowStockMovementModal(true)
  }

  const handleSaveStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await api.post('/inventory/movements/', movementForm)
      toast.success('Movimiento de stock registrado exitosamente')
      fetchProducts()
      fetchStockMovements()
      setShowStockMovementModal(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error guardando movimiento:', error)
      toast.error('Error al guardar movimiento')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            Activo
          </span>
        )
      case 'inactive':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
            <MinusIcon className="h-3 w-3" />
            Inactivo
          </span>
        )
      case 'discontinued':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XMarkIcon className="h-3 w-3" />
            Descontinuado
          </span>
        )
      default:
        return null
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownIcon className="h-4 w-4 text-green-600" />
      case 'out':
        return <ArrowUpIcon className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <MinusIcon className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category.toString() === selectedCategory
    const matchesStatus = !selectedStatus || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.current_stock, 0)
  const lowStockCount = products.filter(p => p.is_low_stock).length
  const activeProductsCount = products.filter(p => p.status === 'active').length

  if (loading) {
  return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
        <div>
              <h1 className="text-2xl font-bold mb-1">Gestión de Inventario</h1>
              <p className="text-purple-100">Control de productos y stock</p>
        </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <CubeIcon className="h-8 w-8 text-white" />
        </div>
      </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Artículos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Artículos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{activeProductsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <TagIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['products', 'categories', 'movements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                ${activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              `}
            >
              {tab === 'products' && 'Artículos'}
              {tab === 'categories' && 'Categorías'}
              {tab === 'movements' && 'Movimientos'}
            </button>
          ))}
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
                <button
                  onClick={() => setShowCategoryManagerModal(true)}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-amber-700 hover:to-orange-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  <TagIcon className="h-5 w-5" />
                  Categorías
                </button>
                <button
                  onClick={handleCreateProduct}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nuevo Artículo
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category_name}</p>
                              </div>
                  {product.is_low_stock && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" title="Stock bajo" />
                  )}
                            </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Stock Actual</span>
                    <span className="font-bold text-gray-900">
                      {product.current_stock} {product.unit}
                    </span>
                              </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock Mínimo</span>
                    <span className="text-gray-500">
                      {product.min_stock} {product.unit}
                          </span>
                              </div>
                              </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {getStatusBadge(product.status)}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category_name || `Cat ${product.category}`}
                          </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                            <button 
                    onClick={() => handleOpenStockMovement(product)}
                    className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                            >
                    Movimiento
                            </button>
                            <button 
                    onClick={() => handleEditProduct(product)}
                    className="py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                    className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
              </div>
            ))}
          </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
              <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay artículos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory || selectedStatus
                  ? 'No se encontraron resultados'
                  : 'Comienza creando un nuevo artículo'}
                  </p>
                </div>
              )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleCreateCategory}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center`}>
                      <TagIcon className="h-5 w-5 text-white" />
                  </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.product_count} productos</p>
                  </div>
                </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{category.description}</p>

                <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                    className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                    Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                    className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva categoría</p>
        </div>
          )}
        </>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(movement.created_at).toLocaleDateString('es-GT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{movement.product_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        <span className="text-sm text-gray-900">{movement.movement_type_display}</span>
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.quantity}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.reference || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.user || 'N/A'}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stockMovements.length === 0 && (
            <div className="text-center py-12">
              <MinusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay movimientos</h3>
              <p className="mt-1 text-sm text-gray-500">Los movimientos de stock aparecerán aquí</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Artículo */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
              <button onClick={() => setShowAddProductModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input 
                      type="text" 
                      required 
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                  <select
                    required
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="lb">Libras (lb)</option>
                    <option value="qq">Quintales (qq)</option>
                      <option value="unidad">Unidad</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                    </select>
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual *</label>
                    <input 
                      type="number" 
                      required 
                    min="0"
                    step="0.01"
                    value={productForm.current_stock}
                    onChange={(e) => setProductForm({ ...productForm, current_stock: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                    <input 
                      type="number" 
                      required 
                    min="0"
                    step="0.01"
                    value={productForm.min_stock}
                    onChange={(e) => setProductForm({ ...productForm, min_stock: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input 
                      type="text" 
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                      required 
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="discontinued">Descontinuado</option>
                    </select>
                  </div>
                </div>
                
              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'} Artículo
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Categoría */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input 
                    type="text" 
                    required 
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea 
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3} 
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                  <select 
                    required
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="bg-red-500">Rojo</option>
                  <option value="bg-orange-500">Naranja</option>
                    <option value="bg-yellow-500">Amarillo</option>
                  <option value="bg-green-500">Verde</option>
                  <option value="bg-blue-500">Azul</option>
                  <option value="bg-indigo-500">Índigo</option>
                    <option value="bg-purple-500">Morado</option>
                    <option value="bg-pink-500">Rosa</option>
                    <option value="bg-gray-500">Gris</option>
                  </select>
                </div>

              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento de Stock */}
      {showStockMovementModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">Movimiento de Stock</h2>
              <button onClick={() => setShowStockMovementModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Artículo</p>
                <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">Stock actual: {selectedProduct.current_stock} {selectedProduct.unit}</p>
              </div>

              <form onSubmit={handleSaveStockMovement} className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento *</label>
                  <select
                    required
                    value={movementForm.movement_type}
                    onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                      <option value="in">Entrada</option>
                      <option value="out">Salida</option>
                      <option value="adjustment">Ajuste</option>
                    </select>
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                    <input 
                      type="number" 
                      required 
                    min="0"
                    step="0.01"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                    <input 
                      type="text" 
                    value={movementForm.reference}
                    onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                    placeholder="Ej: Factura #123, Pedido #456"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={movementForm.user}
                    onChange={(e) => setMovementForm({ ...movementForm, user: e.target.value })}
                    placeholder="Nombre del usuario"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea 
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3} 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowStockMovementModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium"
                  >
                    Registrar Movimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestión de Categorías */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Gestión de Categorías</h2>
                <p className="text-amber-100 text-sm">Administra las categorías de inventario</p>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Botón para agregar nueva categoría */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({
                      name: '',
                      description: '',
                      color: 'bg-blue-500'
                    })
                    setShowAddCategoryModal(true)
                  }}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-amber-700 hover:to-orange-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nueva Categoría
                </button>
              </div>

              {/* Grid de categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center shadow-md`}>
                          <TagIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.product_count} artículos</p>
                        </div>
                      </div>
                    </div>

                    {category.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryForm({
                            name: category.name,
                            description: category.description,
                            color: category.color
                          })
                          setShowAddCategoryModal(true)
                        }}
                        className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva categoría</p>
                </div>
              )}

              {/* Botón cerrar */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCategoryManagerModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
