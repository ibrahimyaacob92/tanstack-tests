import { useState, useCallback, useRef, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { HistoryState } from '../types'
import { MAX_HISTORY } from '../constants'

interface UseFlowHistoryOptions {
  onLabelChange: (id: string, label: string) => void
  onColorChange: (id: string, color: string) => void
}

interface UseFlowHistoryReturn {
  history: HistoryState[]
  historyIndex: number
  isUndoingRef: React.MutableRefObject<boolean>
  historyIndexRef: React.MutableRefObject<number>
  edgesRef: React.MutableRefObject<Edge[]>
  pushToHistory: (nodes: Node[], edges: Edge[]) => void
  undo: () => { nodes: Node[]; edges: Edge[] } | null
  redo: () => { nodes: Node[]; edges: Edge[] } | null
  resetHistory: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useFlowHistory({
  onLabelChange,
  onColorChange,
}: UseFlowHistoryOptions): UseFlowHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const isUndoingRef = useRef(false)
  const historyIndexRef = useRef(historyIndex)
  historyIndexRef.current = historyIndex
  const edgesRef = useRef<Edge[]>([])

  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (isUndoingRef.current) return

    const newState: HistoryState = {
      nodes: newNodes.map((n) => ({
        ...n,
        data: { label: n.data.label, color: n.data.color },
      })) as Node[],
      edges: newEdges.map((e) => ({ ...e })),
    }

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndexRef.current + 1)
      newHistory.push(newState)
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
        return newHistory
      }
      return newHistory
    })
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [])

  const undo = useCallback((): { nodes: Node[]; edges: Edge[] } | null => {
    if (historyIndex <= 0) return null

    isUndoingRef.current = true
    const prevState = history[historyIndex - 1]

    const restoredNodes = prevState.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange,
        onColorChange,
      },
    }))

    setHistoryIndex((prev) => prev - 1)

    setTimeout(() => {
      isUndoingRef.current = false
    }, 0)

    return { nodes: restoredNodes, edges: prevState.edges }
  }, [history, historyIndex, onLabelChange, onColorChange])

  const redo = useCallback((): { nodes: Node[]; edges: Edge[] } | null => {
    if (historyIndex >= history.length - 1) return null

    isUndoingRef.current = true
    const nextState = history[historyIndex + 1]

    const restoredNodes = nextState.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange,
        onColorChange,
      },
    }))

    setHistoryIndex((prev) => prev + 1)

    setTimeout(() => {
      isUndoingRef.current = false
    }, 0)

    return { nodes: restoredNodes, edges: nextState.edges }
  }, [history, historyIndex, onLabelChange, onColorChange])

  const resetHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          // Redo will be handled by the component
        } else {
          e.preventDefault()
          // Undo will be handled by the component
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        // Redo will be handled by the component
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    history,
    historyIndex,
    isUndoingRef,
    historyIndexRef,
    edgesRef,
    pushToHistory,
    undo,
    redo,
    resetHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  }
}
