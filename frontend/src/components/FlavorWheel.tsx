import React, { useState, useEffect, useRef } from 'react'
import { BeakerIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FlavorWheelProps {
  descriptors: Array<{
    descriptor: string
    intensity: number
    polarity: 'positive' | 'negative'
  }>
  sampleName: string
  onDescriptorClick?: (descriptor: string) => void
  onDescriptorAdd?: (descriptor: string, intensity: number, polarity: 'positive' | 'negative') => void
  onDescriptorRemove?: (descriptor: string) => void
  interactive?: boolean
}

export default function FlavorWheel({ 
  descriptors, 
  sampleName, 
  onDescriptorClick, 
  onDescriptorAdd, 
  onDescriptorRemove, 
  interactive = false 
}: FlavorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredDescriptor, setHoveredDescriptor] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // SCA Flavor Wheel structure
  const flavorCategories = [
    {
      name: 'Enzymatic',
      color: '#FFD700',
      subcategories: [
        { name: 'Floral', descriptors: ['Black Tea', 'Chamomile', 'Elderflower', 'Hibiscus', 'Jasmine', 'Lavender', 'Rose Hips', 'Rose Water'] },
        { name: 'Fruity', descriptors: ['Apple', 'Blackberry', 'Black Currant', 'Blueberry', 'Coconut', 'Cherry', 'Cranberry', 'Grape', 'Grapefruit', 'Lemon', 'Lime', 'Mango', 'Melon', 'Orange', 'Papaya', 'Passion Fruit', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Pomegranate', 'Raisin', 'Raspberry', 'Strawberry', 'Tangerine', 'Tomato'] },
        { name: 'Herbal', descriptors: ['Anise', 'Basil', 'Bay Leaves', 'Cilantro', 'Dill', 'Eucalyptus', 'Grass', 'Mint', 'Oregano', 'Parsley', 'Rosemary', 'Sage', 'Thyme'] }
      ]
    },
    {
      name: 'Sugar Browning',
      color: '#FFA500',
      subcategories: [
        { name: 'Caramel', descriptors: ['Butterscotch', 'Caramel', 'Honey', 'Maple Syrup', 'Molasses'] },
        { name: 'Brown Sugar', descriptors: ['Brown Sugar', 'Cane Sugar', 'Demerara Sugar', 'Jaggery', 'Muscovado'] },
        { name: 'Chocolate', descriptors: ['Cacao', 'Chocolate', 'Dark Chocolate', 'Milk Chocolate'] }
      ]
    },
    {
      name: 'Dry Distillation',
      color: '#8B4513',
      subcategories: [
        { name: 'Roasted', descriptors: ['Ashy', 'Burnt', 'Smoky', 'Charred'] },
        { name: 'Spices', descriptors: ['Allspice', 'Anise', 'Black Pepper', 'Cardamom', 'Cinnamon', 'Clove', 'Nutmeg', 'Star Anise'] },
        { name: 'Nutty/Cocoa', descriptors: ['Almond', 'Chestnut', 'Hazelnut', 'Peanut', 'Pecan', 'Walnut'] },
        { name: 'Cereal', descriptors: ['Barley', 'Malt', 'Oats', 'Rye', 'Wheat'] }
      ]
    },
    {
      name: 'Aromatic Taints',
      color: '#FF6B6B',
      subcategories: [
        { name: 'Chemical', descriptors: ['Chemical', 'Medicinal', 'Petroleum', 'Skunky'] },
        { name: 'Musty/Earthy', descriptors: ['Dirt', 'Dusty', 'Earthy', 'Moldy', 'Musty', 'Mushroom'] },
        { name: 'Papery/Musty', descriptors: ['Cardboard', 'Papery', 'Stale', 'Woody'] },
        { name: 'Fermented', descriptors: ['Fermented', 'Overripe', 'Sour', 'Vinegar'] }
      ]
    }
  ]

  // Calculate descriptor intensity for visualization
  const getDescriptorIntensity = (descriptor: string) => {
    const found = descriptors.find(d => d.descriptor.toLowerCase() === descriptor.toLowerCase())
    return found ? found.intensity : 0
  }

  // Draw the flavor wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw outer circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw categories
    let currentAngle = 0
    const categoryAngle = (2 * Math.PI) / flavorCategories.length

    flavorCategories.forEach((category, categoryIndex) => {
      const startAngle = currentAngle
      const endAngle = currentAngle + categoryAngle

      // Draw category arc
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.lineTo(centerX, centerY)
      ctx.fillStyle = category.color + '20'
      ctx.fill()
      ctx.strokeStyle = category.color
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw category name
      const textAngle = startAngle + categoryAngle / 2
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7)
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7)
      
      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.fillStyle = '#374151'
      ctx.fillText(category.name, 0, 0)
      ctx.restore()

      // Draw subcategories
      const subcategoryAngle = categoryAngle / category.subcategories.length
      category.subcategories.forEach((subcategory, subIndex) => {
        const subStartAngle = startAngle + subIndex * subcategoryAngle
        const subEndAngle = subStartAngle + subcategoryAngle

        // Draw subcategory arc
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.8, subStartAngle, subEndAngle)
        ctx.lineTo(centerX, centerY)
        ctx.fillStyle = category.color + '10'
        ctx.fill()
        ctx.strokeStyle = category.color
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw subcategory name
        const subTextAngle = subStartAngle + subcategoryAngle / 2
        const subTextX = centerX + Math.cos(subTextAngle) * (radius * 0.5)
        const subTextY = centerY + Math.sin(subTextAngle) * (radius * 0.5)
        
        ctx.save()
        ctx.translate(subTextX, subTextY)
        ctx.rotate(subTextAngle + Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.font = '12px Inter, sans-serif'
        ctx.fillStyle = '#6B7280'
        ctx.fillText(subcategory.name, 0, 0)
        ctx.restore()

        // Draw descriptors with intensity
        subcategory.descriptors.forEach((descriptor, descIndex) => {
          const descAngle = subStartAngle + (descIndex / subcategory.descriptors.length) * subcategoryAngle
          const intensity = getDescriptorIntensity(descriptor)
          const descX = centerX + Math.cos(descAngle) * (radius * 0.3)
          const descY = centerY + Math.sin(descAngle) * (radius * 0.3)
          
          // Draw descriptor circle (always visible if interactive)
          if (intensity > 0 || interactive) {
            const circleRadius = interactive ? 8 : intensity * 2
            const opacity = intensity > 0 ? 0.8 : 0.3
            
            ctx.beginPath()
            ctx.arc(descX, descY, circleRadius, 0, 2 * Math.PI)
            ctx.fillStyle = category.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
            ctx.fill()
            
            // Draw border for interactive mode
            if (interactive) {
              ctx.strokeStyle = category.color
              ctx.lineWidth = 1
              ctx.stroke()
            }
            
            // Draw descriptor text
            ctx.save()
            ctx.translate(descX, descY)
            ctx.textAlign = 'center'
            ctx.font = interactive ? '8px Inter, sans-serif' : '10px Inter, sans-serif'
            ctx.fillStyle = intensity > 0 ? '#FFFFFF' : '#666666'
            ctx.fillText(descriptor, 0, 0)
            ctx.restore()
          }
        })
      })

      currentAngle += categoryAngle
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#F3F4F6'
    ctx.fill()
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw sample name in center
    ctx.textAlign = 'center'
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.fillStyle = '#374151'
    ctx.fillText(sampleName, centerX, centerY - 5)
    ctx.font = '10px Inter, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('Flavor Wheel', centerX, centerY + 10)
  }, [descriptors, sampleName])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onDescriptorAdd) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20
    
    // Check if click is within descriptor area
    const clickRadius = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    if (clickRadius > radius * 0.2 && clickRadius < radius * 0.4) {
      // Find closest descriptor
      const clickAngle = Math.atan2(y - centerY, x - centerX)
      let closestDescriptor = null
      let minDistance = Infinity
      
      flavorCategories.forEach(category => {
        category.subcategories.forEach(subcategory => {
          subcategory.descriptors.forEach((descriptor, descIndex) => {
            const subcategoryAngle = (2 * Math.PI) / flavorCategories.length / category.subcategories.length
            const descAngle = (descIndex / subcategory.descriptors.length) * subcategoryAngle
            const angleDiff = Math.abs(clickAngle - descAngle)
            const distance = Math.min(angleDiff, 2 * Math.PI - angleDiff)
            
            if (distance < minDistance) {
              minDistance = distance
              closestDescriptor = descriptor
            }
          })
        })
      })
      
      if (closestDescriptor && minDistance < 0.3) {
        onDescriptorAdd(closestDescriptor, 5, 'positive')
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Flavor Wheel - {sampleName}</h3>
        <div className="flex items-center space-x-4">
          {interactive && (
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Intensidad</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className={`border border-gray-200 rounded-lg ${interactive ? 'cursor-pointer' : ''}`}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Descriptor Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {flavorCategories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="font-medium text-gray-900">{category.name}</span>
            </div>
            <div className="space-y-1">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.name} className="ml-4">
                  <div className="text-sm font-medium text-gray-700">{subcategory.name}</div>
                  <div className="text-xs text-gray-500">
                    {subcategory.descriptors
                      .filter(desc => descriptors.some(d => d.descriptor.toLowerCase() === desc.toLowerCase()))
                      .join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Descriptors Menu */}
      {showAddMenu && interactive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Descriptor</h3>
              <button
                onClick={() => setShowAddMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flavorCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.name}
                  </h4>
                  <div className="space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.name}>
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          {subcategory.name}
                        </div>
                        <div className="space-y-1">
                          {subcategory.descriptors.map((descriptor) => (
                            <button
                              key={descriptor}
                              onClick={() => {
                                onDescriptorAdd?.(descriptor, 5, 'positive')
                                setShowAddMenu(false)
                              }}
                              className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center justify-between"
                            >
                              <span>{descriptor}</span>
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Descriptors */}
      {descriptors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Descriptores Actuales</h4>
          <div className="flex flex-wrap gap-2">
            {descriptors.map((descriptor, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  descriptor.polarity === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <span>{descriptor.descriptor}</span>
                <span className="font-medium">({descriptor.intensity})</span>
                {interactive && onDescriptorRemove && (
                  <button
                    onClick={() => onDescriptorRemove(descriptor.descriptor)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intensity Scale */}
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
        <span>Intensidad:</span>
        <div className="flex items-center space-x-2">
          {[1, 3, 5, 7, 9].map(intensity => (
            <div key={intensity} className="flex flex-col items-center">
              <div 
                className="w-4 h-4 rounded-full bg-yellow-400"
                style={{ opacity: intensity / 10 }}
              ></div>
              <span className="text-xs">{intensity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
