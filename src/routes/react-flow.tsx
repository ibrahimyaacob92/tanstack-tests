import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ArrowLeft, GitBranch } from 'lucide-react'

// Local imports
import { nodeColors } from './react-flow/constants'
import { useFlowHistory } from './react-flow/hooks'
import {
  CustomNode,
  EdgeEditorPopup,
  FlowToolbar,
  SaveDialog,
  LoadDialog,
} from './react-flow/components'

export const Route = createFileRoute('/react-flow')({
  component: ReactFlowPage,
})

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
  const [currentFlowId, setCurrentFlowId] = useState<Id<'flows'> | null>(null)
  const [flowName, setFlowName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [showEdgeEditor, setShowEdgeEditor] = useState(false)
  const [edgeEditorPosition, setEdgeEditorPosition] = useState({ x: 0, y: 0 })

  const { fitView } = useReactFlow()

  // Handlers for node updates (defined before useFlowHistory)
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

  // Use the extracted history hook
  const {
    edgesRef,
    pushToHistory,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  } = useFlowHistory({ onLabelChange, onColorChange })

  // Convex queries and mutations
  const savedFlows = useQuery(api.flows.listFlows)
  const createFlow = useMutation(api.flows.createFlow)
  const updateFlow = useMutation(api.flows.updateFlow)
  const deleteFlow = useMutation(api.flows.deleteFlow)

  const [nodes, setNodes] = useState<Node[]>(() =>
    createInitialNodes(onLabelChange, onColorChange)
  )
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  // Keep edgesRef in sync for callbacks
  useEffect(() => {
    edgesRef.current = edges
  }, [edges, edgesRef])

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
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
          },
          eds
        )
        setTimeout(() => pushToHistory(nodes, newEdges), 0)
        return newEdges
      })
    },
    [nodes, pushToHistory]
  )

  // Handle edge click to show editor
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()
      setSelectedEdgeId(edge.id)
      setEdgeEditorPosition({ x: event.clientX, y: event.clientY })
      setShowEdgeEditor(true)
    },
    []
  )

  // Update edge color
  const updateEdgeColor = useCallback(
    (edgeId: string, color: string) => {
      setEdges((eds) => {
        const newEdges = eds.map((edge) =>
          edge.id === edgeId
            ? { ...edge, style: { ...edge.style, stroke: color } }
            : edge
        )
        setTimeout(() => pushToHistory(nodes, newEdges), 0)
        return newEdges
      })
    },
    [nodes, pushToHistory]
  )

  // Toggle edge dashed/solid
  const toggleEdgeDashed = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const newEdges = eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          const currentDash = edge.style?.strokeDasharray
          return {
            ...edge,
            style: {
              ...edge.style,
              strokeDasharray: currentDash ? undefined : '5 5',
            },
          }
        })
        setTimeout(() => pushToHistory(nodes, newEdges), 0)
        return newEdges
      })
    },
    [nodes, pushToHistory]
  )

  // Toggle edge animation
  const toggleEdgeAnimation = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const newEdges = eds.map((edge) =>
          edge.id === edgeId ? { ...edge, animated: !edge.animated } : edge
        )
        setTimeout(() => pushToHistory(nodes, newEdges), 0)
        return newEdges
      })
    },
    [nodes, pushToHistory]
  )

  // Close edge editor when clicking elsewhere
  const onPaneClick = useCallback(() => {
    setShowEdgeEditor(false)
    setSelectedEdgeId(null)
  }, [])

  // Undo action handler
  const handleUndo = useCallback(() => {
    const result = undo()
    if (result) {
      setNodes(result.nodes)
      setEdges(result.edges)
    }
  }, [undo])

  // Redo action handler
  const handleRedo = useCallback(() => {
    const result = redo()
    if (result) {
      setNodes(result.nodes)
      setEdges(result.edges)
    }
  }, [redo])

  // Initialize history with initial state
  useEffect(() => {
    pushToHistory(nodes, edges)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          handleRedo()
        } else {
          e.preventDefault()
          handleUndo()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const addNode = () => {
    const label = nodeName.trim() || `Node ${nodeCount}`
    const newNode: Node = {
      id: `node-${nodeCount}`,
      type: 'custom',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
      data: { label, color: selectedColor, onLabelChange, onColorChange },
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    setNodeCount((c) => c + 1)
    setNodeName('')
    pushToHistory(newNodes, edges)
  }

  const deleteSelected = () => {
    const selectedNodeIds = selectedNodes.map((n) => n.id)
    const newNodes = nodes.filter((n) => !n.selected)
    const newEdges = edges.filter(
      (e) =>
        !e.selected &&
        !selectedNodeIds.includes(e.source) &&
        !selectedNodeIds.includes(e.target)
    )
    setNodes(newNodes)
    setEdges(newEdges)
    pushToHistory(newNodes, newEdges)
  }

  const clearSelection = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
  }

  const resetFlow = () => {
    const newNodes = createInitialNodes(onLabelChange, onColorChange)
    setNodes(newNodes)
    setEdges(initialEdges)
    setNodeCount(4)
    setNodeName('')
    setCurrentFlowId(null)
    setFlowName('')
    resetHistory()
    setTimeout(() => {
      fitView()
      pushToHistory(newNodes, initialEdges)
    }, 50)
  }

  // Prepare nodes for saving (strip callback functions)
  const prepareNodesForSave = () => {
    return nodes.map((node) => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: {
        label: node.data.label as string,
        color: node.data.color as string,
      },
    }))
  }

  // Prepare edges for saving
  const prepareEdgesForSave = () => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      style: edge.style
        ? {
            stroke: edge.style.stroke as string | undefined,
            strokeDasharray: edge.style.strokeDasharray as string | undefined,
            strokeWidth: edge.style.strokeWidth as number | undefined,
          }
        : undefined,
    }))
  }

  // Save current flow
  const handleSave = async () => {
    if (!flowName.trim()) return

    setIsSaving(true)
    try {
      if (currentFlowId) {
        await updateFlow({
          id: currentFlowId,
          nodes: prepareNodesForSave(),
          edges: prepareEdgesForSave(),
        })
      } else {
        const newId = await createFlow({
          name: flowName.trim(),
          nodes: prepareNodesForSave(),
          edges: prepareEdgesForSave(),
        })
        setCurrentFlowId(newId)
      }
      setShowSaveDialog(false)
    } catch (error) {
      console.error('Failed to save flow:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Quick save (update existing flow)
  const handleQuickSave = async () => {
    if (!currentFlowId) {
      setShowSaveDialog(true)
      return
    }

    setIsSaving(true)
    try {
      await updateFlow({
        id: currentFlowId,
        nodes: prepareNodesForSave(),
        edges: prepareEdgesForSave(),
      })
    } catch (error) {
      console.error('Failed to save flow:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Load a saved flow
  const loadFlow = (flow: NonNullable<typeof savedFlows>[number]) => {
    const loadedNodes: Node[] = flow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange,
        onColorChange,
      },
    }))

    const loadedEdges: Edge[] = flow.edges.map((edge) => ({
      ...edge,
      style: edge.style
        ? { ...edge.style, strokeWidth: edge.style.strokeWidth ?? 2 }
        : { stroke: '#64748b', strokeWidth: 2 },
    }))

    setNodes(loadedNodes)
    setEdges(loadedEdges)
    setCurrentFlowId(flow._id)
    setFlowName(flow.name)
    setNodeCount(
      Math.max(
        4,
        ...flow.nodes.map((n) => {
          const match = n.id.match(/node-(\d+)/)
          return match ? parseInt(match[1], 10) + 1 : 0
        })
      )
    )
    setShowLoadDialog(false)
    setTimeout(() => fitView(), 50)
  }

  // Delete a saved flow
  const handleDeleteFlow = async (flowId: Id<'flows'>) => {
    try {
      await deleteFlow({ id: flowId })
      if (currentFlowId === flowId) {
        resetFlow()
      }
    } catch (error) {
      console.error('Failed to delete flow:', error)
    }
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
        <FlowToolbar
          nodeName={nodeName}
          onNodeNameChange={setNodeName}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          onAddNode={addNode}
          onDeleteSelected={deleteSelected}
          onClearSelection={clearSelection}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleQuickSave}
          onLoad={() => setShowLoadDialog(true)}
          onReset={resetFlow}
          isSaving={isSaving}
          hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
          nodesCount={nodes.length}
          edgesCount={edges.length}
          selectedNodesCount={selectedNodes.length}
          selectedEdgesCount={selectedEdges.length}
          currentFlowName={currentFlowId ? flowName : null}
          hasCurrentFlow={!!currentFlowId}
        />

        {/* Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs text-gray-400">
            <div>
              <span className="text-cyan-400 font-medium">Edit Node:</span>{' '}
              Double-click to rename
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Node Color:</span>{' '}
              Select, click palette
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Edit Edge:</span>{' '}
              Click line for options
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Connect:</span> Drag
              handle to handle
            </div>
            <div>
              <span className="text-cyan-400 font-medium">Undo/Redo:</span>{' '}
              Ctrl+Z / Ctrl+Shift+Z
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
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              selectNodesOnDrag={false}
              selectionOnDrag
              panOnDrag={[1, 2]}
              selectionMode={SelectionMode.Partial}
              elementsSelectable={true}
              edgesFocusable={true}
              className="bg-slate-900"
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#64748b', strokeWidth: 2 },
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

      {/* Save Dialog */}
      {showSaveDialog && (
        <SaveDialog
          flowName={flowName}
          onFlowNameChange={setFlowName}
          onSave={handleSave}
          onCancel={() => setShowSaveDialog(false)}
          isSaving={isSaving}
        />
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <LoadDialog
          savedFlows={savedFlows}
          currentFlowId={currentFlowId}
          onLoadFlow={loadFlow}
          onDeleteFlow={handleDeleteFlow}
          onClose={() => setShowLoadDialog(false)}
        />
      )}

      {/* Edge Editor Popup */}
      {showEdgeEditor && selectedEdgeId && (
        <EdgeEditorPopup
          selectedEdgeId={selectedEdgeId}
          edges={edges}
          position={edgeEditorPosition}
          onClose={() => {
            setShowEdgeEditor(false)
            setSelectedEdgeId(null)
          }}
          onColorChange={updateEdgeColor}
          onToggleDashed={toggleEdgeDashed}
          onToggleAnimation={toggleEdgeAnimation}
        />
      )}
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
