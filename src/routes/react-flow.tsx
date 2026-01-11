import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft,
  GitBranch,
  Plus,
  Trash2,
  RotateCcw,
  Circle,
  MousePointer,
  Palette,
  X,
} from 'lucide-react'

export const Route = createFileRoute('/react-flow')({
  component: ReactFlowPage,
})

// Node colors
const nodeColors = [
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
]

// Custom editable node component
function CustomNode({
  id,
  data,
  selected,
}: {
  id: string
  data: {
    label: string
    color: string
    onLabelChange: (id: string, label: string) => void
    onColorChange: (id: string, color: string) => void
  }
  selected: boolean
}) {
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

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const createInitialNodes = (
  onLabelChange: (id: string, label: string) => void,
  onColorChange: (id: string, color: string) => void
): Node[] => [
  {
    id: 'node-1',
    type: 'custom',
    position: { x: 250, y: 50 },
    data: { label: 'Start', color: '#22c55e', onLabelChange, onColorChange },
  },
  {
    id: 'node-2',
    type: 'custom',
    position: { x: 250, y: 150 },
    data: { label: 'Process', color: '#3b82f6', onLabelChange, onColorChange },
  },
  {
    id: 'node-3',
    type: 'custom',
    position: { x: 250, y: 250 },
    data: { label: 'End', color: '#ef4444', onLabelChange, onColorChange },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    animated: true,
    style: { stroke: '#64748b' },
  },
  {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    animated: true,
    style: { stroke: '#64748b' },
  },
]

function FlowEditor() {
  const [nodeCount, setNodeCount] = useState(4)
  const [selectedColor, setSelectedColor] = useState(nodeColors[1].value)
  const [nodeName, setNodeName] = useState('')

  const { fitView } = useReactFlow()

  // Handlers for node updates
  const onLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    )
  }, [])

  const onColorChange = useCallback((nodeId: string, newColor: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    )
  }, [])

  const [nodes, setNodes] = useState<Node[]>(() =>
    createInitialNodes(onLabelChange, onColorChange)
  )
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const selectedNodes = nodes.filter((n) => n.selected)
  const selectedEdges = edges.filter((e) => e.selected)

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#64748b' },
          },
          eds
        )
      ),
    []
  )

  const addNode = () => {
    const label = nodeName.trim() || `Node ${nodeCount}`
    const newNode: Node = {
      id: `node-${nodeCount}`,
      type: 'custom',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
      data: { label, color: selectedColor, onLabelChange, onColorChange },
    }
    setNodes((nds) => [...nds, newNode])
    setNodeCount((c) => c + 1)
    setNodeName('')
  }

  const deleteSelected = () => {
    const selectedNodeIds = selectedNodes.map((n) => n.id)
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !e.selected &&
          !selectedNodeIds.includes(e.source) &&
          !selectedNodeIds.includes(e.target)
      )
    )
  }

  const clearSelection = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
  }

  const resetFlow = () => {
    setNodes(createInitialNodes(onLabelChange, onColorChange))
    setEdges(initialEdges)
    setNodeCount(4)
    setNodeName('')
    setTimeout(() => fitView(), 50)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <GitBranch className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white">React Flow</h1>
        </div>

        <p className="text-gray-400 mb-6">
          Build interactive node-based diagrams. Add nodes, connect them, and
          create workflows.
        </p>

        {/* Toolbar */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Add Node Section */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Node name..."
                className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm w-32 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => e.key === 'Enter' && addNode()}
              />
              <div className="flex gap-1">
                {nodeColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      selectedColor === color.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                        : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                onClick={addNode}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Node
              </button>
            </div>

            <div className="w-px h-8 bg-slate-600" />

            {/* Selection Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={deleteSelected}
                disabled={
                  selectedNodes.length === 0 && selectedEdges.length === 0
                }
                className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={clearSelection}
                disabled={
                  selectedNodes.length === 0 && selectedEdges.length === 0
                }
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <MousePointer className="w-4 h-4" />
                Deselect
              </button>
            </div>

            <div className="w-px h-8 bg-slate-600" />

            {/* Reset */}
            <button
              onClick={resetFlow}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* Selection Info */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Circle className="w-3 h-3 fill-cyan-400 text-cyan-400" />
              {nodes.length} nodes
            </span>
            <span>|</span>
            <span>{edges.length} edges</span>
            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
              <>
                <span>|</span>
                <span className="text-cyan-400">
                  Selected: {selectedNodes.length} nodes, {selectedEdges.length}{' '}
                  edges
                </span>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
            <div>
              <span className="text-cyan-400 font-medium">Edit:</span>{' '}
              Double-click node to rename
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Color:</span> Select
              node, click palette icon
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Connect:</span> Drag
              handle to handle
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Delete:</span> Select
              + Backspace
            </div>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div style={{ width: '100%', height: '500px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              selectNodesOnDrag={false}
              selectionOnDrag
              panOnDrag={[1, 2]}
              selectionMode={SelectionMode.Partial}
              className="bg-slate-900"
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#64748b' },
              }}
            >
              <Controls className="!bg-slate-800 !border-slate-700 !rounded-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white [&>button:hover]:!bg-slate-600" />
              <Background color="#334155" gap={20} />
              <MiniMap
                nodeColor={(node) => (node.data?.color as string) || '#3b82f6'}
                maskColor="rgba(15, 23, 42, 0.8)"
                className="!bg-slate-800 !border-slate-700"
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReactFlowPage() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  )
}
