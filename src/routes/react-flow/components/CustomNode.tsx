import { useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Palette, X } from 'lucide-react'
import { nodeColors } from '../constants'
import type { CustomNodeData } from '../types'

interface CustomNodeProps {
  id: string
  data: CustomNodeData
  selected: boolean
}

export function CustomNode({ id, data, selected }: CustomNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(data.label)
  }, [data.label])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== data.label) {
      data.onLabelChange(id, editValue.trim())
    } else {
      setEditValue(data.label)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(data.label)
      setIsEditing(false)
    }
  }

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowColorPicker(!showColorPicker)
  }

  const handleColorSelect = (color: string) => {
    data.onColorChange(id, color)
    setShowColorPicker(false)
  }

  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 shadow-lg min-w-[100px] text-center transition-all ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
      }`}
      style={{
        backgroundColor: data.color + '20',
        borderColor: data.color,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-slate-900"
      />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-white font-medium text-sm text-center w-full outline-none border-b border-white/50"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-white font-medium text-sm block">
          {data.label}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-slate-900"
      />

      {/* Color picker button - only show when selected */}
      {selected && !isEditing && (
        <button
          onClick={handleColorClick}
          className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center border border-slate-500"
        >
          <Palette className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Color picker popup */}
      {showColorPicker && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-1 shadow-xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {nodeColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${
                data.color === color.value
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800'
                  : ''
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          <button
            onClick={() => setShowColorPicker(false)}
            className="w-5 h-5 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center ml-1"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
