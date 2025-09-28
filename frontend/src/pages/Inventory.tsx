import React, { useState } from 'react'
import { 
  CubeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TagIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  TruckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: number
  name: string
  description: string
  color: string
  createdAt: Date
  productCount: number
}

interface Product {
  id: number
  name: string
  description: string
  sku: string
  category: Category
  unit: string
  currentStock: number
  minStock: number
  supplier: string
  location: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: Date
  lastUpdated: Date
}

interface StockMovement {
  id: number
  product: Product
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference: string
  user: string
  createdAt: Date
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showStockMovementModal, setShowStockMovementModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])

  // Sample data
  const initialCategories: Category[] = [
    {
      id: 1,
      name: 'Café Verde',
      description: 'Café en grano sin procesar',
      color: 'bg-green-500',
      createdAt: new Date('2023-01-01'),
      productCount: 5
    },
    {
      id: 2,
      name: 'Café Tostado',
      description: 'Café procesado y tostado',
      color: 'bg-amber-500',
      createdAt: new Date('2023-01-01'),
      productCount: 3
    },
    {
      id: 3,
      name: 'Insumos',
      description: 'Materiales y suministros',
      color: 'bg-blue-500',
      createdAt: new Date('2023-01-01'),
      productCount: 8
    },
    {
      id: 4,
      name: 'Equipos',
      description: 'Maquinaria y equipos',
      color: 'bg-purple-500',
      createdAt: new Date('2023-01-01'),
      productCount: 2
    }
  ]

  const initialProducts: Product[] = [
    {
      id: 1,
      name: 'Café Arábica Premium',
      description: 'Café arábica de alta calidad',
      sku: 'CAF-001',
      category: initialCategories[0],
      unit: 'kg',
      currentStock: 150,
      minStock: 50,
      supplier: 'Finca El Paraíso',
      location: 'Almacén A',
      status: 'active',
      createdAt: new Date('2023-01-15'),
      lastUpdated: new Date('2023-12-01')
    },
    {
      id: 2,
      name: 'Café Robusta',
      description: 'Café robusta para mezclas',
      sku: 'CAF-002',
      category: initialCategories[0],
      unit: 'kg',
      currentStock: 80,
      minStock: 30,
      supplier: 'Finca La Esperanza',
      location: 'Almacén A',
      status: 'active',
      createdAt: new Date('2023-02-01'),
      lastUpdated: new Date('2023-12-01')
    },
    {
      id: 3,
      name: 'Café Tostado Medio',
      description: 'Café tostado a punto medio',
      sku: 'CAF-003',
      category: initialCategories[1],
      unit: 'kg',
      currentStock: 25,
      minStock: 10,
      supplier: 'Procesamiento Interno',
      location: 'Almacén B',
      status: 'active',
      createdAt: new Date('2023-03-01'),
      lastUpdated: new Date('2023-12-01')
    }
  ]

  // Initialize data
  React.useEffect(() => {
    setCategories(initialCategories)
    setProducts(initialProducts)
  }, [])

  // CRUD Functions
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const id = Math.max(...products.map(p => p.id), 0) + 1
    const product: Product = {
      ...newProduct,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    setProducts(prev => [...prev, product])
    setShowAddProductModal(false)
  }

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? { ...updatedProduct, lastUpdated: new Date() } : p
    ))
    setShowAddProductModal(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleAddCategory = (newCategory: Omit<Category, 'id' | 'createdAt' | 'productCount'>) => {
    const id = Math.max(...categories.map(c => c.id), 0) + 1
    const category: Category = {
      ...newCategory,
      id,
      createdAt: new Date(),
      productCount: 0
    }
    setCategories(prev => [...prev, category])
    setShowAddCategoryModal(false)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowAddCategoryModal(true)
  }

  const handleUpdateCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'productCount'>) => {
    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, ...categoryData }
          : c
      ))
      setEditingCategory(null)
      setShowAddCategoryModal(false)
    }
  }

  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.')) {
      // Verificar si hay productos usando esta categoría
      const productsUsingCategory = products.filter(p => p.category.id === categoryId)
      if (productsUsingCategory.length > 0) {
        alert(`No se puede eliminar la categoría porque ${productsUsingCategory.length} producto(s) la están usando. Primero mueve o elimina esos productos.`)
        return
      }
      
      setCategories(prev => prev.filter(c => c.id !== categoryId))
    }
  }

  const handleStockMovement = (movement: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const id = Math.max(...stockMovements.map(m => m.id), 0) + 1
    const newMovement: StockMovement = {
      ...movement,
      id,
      createdAt: new Date()
    }
    
    // Update product stock
    setProducts(prev => prev.map(p => {
      if (p.id === movement.product.id) {
        const newStock = movement.type === 'in' 
          ? p.currentStock + movement.quantity
          : movement.type === 'out'
          ? p.currentStock - movement.quantity
          : movement.quantity // adjustment
        
        return {
          ...p,
          currentStock: Math.max(0, newStock),
          lastUpdated: new Date()
        }
      }
      return p
    }))
    
    setStockMovements(prev => [...prev, newMovement])
    setShowStockMovementModal(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || product.category.id.toString() === selectedCategory
    const matchesStatus = selectedStatus === '' || product.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800'
      case 'discontinued':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { color: 'text-red-600', icon: ExclamationTriangleIcon, text: 'Sin Stock' }
    if (current <= min) return { color: 'text-yellow-600', icon: ExclamationTriangleIcon, text: 'Stock Bajo' }
    return { color: 'text-green-600', icon: CheckCircleIcon, text: 'En Stock' }
  }

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock)
  const outOfStockProducts = products.filter(p => p.currentStock === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-2">Gestión de productos, categorías y control de stock</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'products' && (
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Producto
            </button>
          )}
          {activeTab === 'categories' && (
            <button 
              onClick={() => setShowAddCategoryModal(true)}
              className="btn btn-primary"
            >
              <TagIcon className="h-5 w-5 mr-2" />
              Nueva Categoría
            </button>
          )}
          {activeTab === 'movements' && (
            <button 
              onClick={() => setShowStockMovementModal(true)}
              className="btn btn-primary"
            >
              <ArrowUpIcon className="h-5 w-5 mr-2" />
              Movimiento de Stock
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'products', name: 'Productos', icon: CubeIcon },
            { id: 'categories', name: 'Categorías', icon: TagIcon },
            { id: 'movements', name: 'Movimientos', icon: ArrowUpIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ArchiveBoxIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockProducts.length}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, SKU o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-48"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input w-48"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.currentStock, product.minStock)
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-lg ${product.category.color} flex items-center justify-center`}>
                                <CubeIcon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {product.sku}
                              </div>
                              <div className="text-xs text-gray-400">
                                {product.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${product.category.color}`}>
                            {product.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <stockStatus.icon className={`h-4 w-4 mr-2 ${stockStatus.color}`} />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.currentStock} {product.unit}
                              </div>
                              <div className={`text-xs ${stockStatus.color}`}>
                                {stockStatus.text}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                            {product.status === 'active' ? 'Activo' :
                             product.status === 'inactive' ? 'Inactivo' : 'Descontinuado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => setSelectedProduct(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setEditingProduct(product)}
                              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                              title="Editar producto"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Eliminar producto"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron productos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Intenta ajustar los filtros de búsqueda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`h-12 w-12 rounded-lg ${category.color} flex items-center justify-center`}>
                    <TagIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.productCount} productos</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Creada: {category.createdAt.toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                      title="Editar categoría"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar categoría"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'movements' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <ArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No hay movimientos de stock</p>
                      <p className="text-sm">Registra el primer movimiento para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {movement.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {movement.product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          movement.type === 'in' ? 'bg-green-100 text-green-800' :
                          movement.type === 'out' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {movement.type === 'in' ? 'Entrada' :
                           movement.type === 'out' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {movement.type === 'in' ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
                          ) : movement.type === 'out' ? (
                            <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
                          ) : (
                            <MinusIcon className="h-4 w-4 text-yellow-600 mr-1" />
                          )}
                          {movement.quantity} {movement.product.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.user}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddProductModal(false)
                    setEditingProduct(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const category = categories.find(c => c.id === Number(formData.get('categoryId')))
                  
                  if (category) {
                    const productData = {
                      name: formData.get('name') as string,
                      description: formData.get('description') as string,
                      sku: formData.get('sku') as string,
                      category,
                      unit: formData.get('unit') as string,
                      currentStock: Number(formData.get('currentStock')),
                      minStock: Number(formData.get('minStock')),
                      supplier: formData.get('supplier') as string,
                      location: formData.get('location') as string,
                      status: formData.get('status') as Product['status']
                    }
                    
                    if (editingProduct) {
                      handleEditProduct({ ...editingProduct, ...productData })
                    } else {
                      handleAddProduct(productData)
                    }
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre del Producto</label>
                    <input 
                      type="text" 
                      name="name"
                      defaultValue={editingProduct?.name || ''}
                      className="input" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">SKU</label>
                    <input 
                      type="text" 
                      name="sku"
                      defaultValue={editingProduct?.sku || ''}
                      className="input" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Categoría</label>
                    <select name="categoryId" className="input" required>
                      <option value="">Seleccionar categoría...</option>
                      {categories.map(category => (
                        <option 
                          key={category.id} 
                          value={category.id}
                          selected={editingProduct?.category.id === category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Unidad</label>
                    <select name="unit" className="input" required>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="unidad">Unidad</option>
                      <option value="litro">Litro</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Stock Actual</label>
                    <input 
                      type="number" 
                      name="currentStock"
                      defaultValue={editingProduct?.currentStock || 0}
                      className="input" 
                      min="0"
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Stock Mínimo</label>
                    <input 
                      type="number" 
                      name="minStock"
                      defaultValue={editingProduct?.minStock || 0}
                      className="input" 
                      min="0"
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Proveedor</label>
                    <input 
                      type="text" 
                      name="supplier"
                      defaultValue={editingProduct?.supplier || ''}
                      className="input" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Ubicación</label>
                    <input 
                      type="text" 
                      name="location"
                      defaultValue={editingProduct?.location || ''}
                      className="input" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select name="status" className="input" required>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="discontinued">Descontinuado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="label">Descripción</label>
                  <textarea 
                    name="description"
                    defaultValue={editingProduct?.description || ''}
                    className="input" 
                    rows={3} 
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddProductModal(false)
                      setEditingProduct(null)
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddCategoryModal(false)
                    setEditingCategory(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const categoryData = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    color: formData.get('color') as string
                  }
                  
                  if (editingCategory) {
                    handleUpdateCategory(categoryData)
                  } else {
                    handleAddCategory(categoryData)
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="label">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    name="name"
                    defaultValue={editingCategory?.name || ''}
                    className="input" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="label">Descripción</label>
                  <textarea 
                    name="description"
                    defaultValue={editingCategory?.description || ''}
                    className="input" 
                    rows={3} 
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="label">Color</label>
                  <select 
                    name="color" 
                    className="input" 
                    defaultValue={editingCategory?.color || 'bg-green-500'}
                    required
                  >
                    <option value="bg-blue-500">Azul</option>
                    <option value="bg-green-500">Verde</option>
                    <option value="bg-red-500">Rojo</option>
                    <option value="bg-yellow-500">Amarillo</option>
                    <option value="bg-purple-500">Morado</option>
                    <option value="bg-pink-500">Rosa</option>
                    <option value="bg-indigo-500">Índigo</option>
                    <option value="bg-gray-500">Gris</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddCategoryModal(false)
                      setEditingCategory(null)
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <TagIcon className="h-4 w-4 mr-2" />
                    {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showStockMovementModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Movimiento de Stock</h3>
                <button 
                  onClick={() => setShowStockMovementModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const product = products.find(p => p.id === Number(formData.get('productId')))
                  
                  if (product) {
                    const movementData = {
                      product,
                      type: formData.get('type') as StockMovement['type'],
                      quantity: Number(formData.get('quantity')),
                      reason: formData.get('reason') as string,
                      reference: formData.get('reference') as string,
                      user: 'Usuario Actual' // TODO: Get from auth context
                    }
                    handleStockMovement(movementData)
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Producto</label>
                    <select name="productId" className="input" required>
                      <option value="">Seleccionar producto...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tipo de Movimiento</label>
                    <select name="type" className="input" required>
                      <option value="in">Entrada</option>
                      <option value="out">Salida</option>
                      <option value="adjustment">Ajuste</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Cantidad</label>
                    <input 
                      type="number" 
                      name="quantity"
                      className="input" 
                      min="0.01"
                      step="0.01"
                      required 
                    />
                  </div>
                  <div>
                    <label className="label">Referencia</label>
                    <input 
                      type="text" 
                      name="reference"
                      className="input" 
                      placeholder="Número de factura, orden, etc."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">Motivo</label>
                  <textarea 
                    name="reason"
                    className="input" 
                    rows={3} 
                    placeholder="Describir el motivo del movimiento..."
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowStockMovementModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <ArrowUpIcon className="h-4 w-4 mr-2" />
                    Registrar Movimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
