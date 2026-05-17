import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Contract, ChatMessage, RiskFilter } from './types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

interface AppState {
  // Current contract being viewed
  currentContractId: string | null
  setCurrentContractId: (id: string | null) => void

  // Selected clause ID for bidirectional sync
  selectedClauseId: string | null
  setSelectedClauseId: (id: string | null) => void

  // Risk filter
  riskFilter: RiskFilter
  setRiskFilter: (filter: RiskFilter) => void

  // Category filter
  categoryFilter: string
  setCategoryFilter: (cat: string) => void

  // Chat history per contract
  chatHistory: Record<string, ChatMessage[]>
  addChatMessage: (contractId: string, msg: ChatMessage) => void
  appendToChatMessage: (contractId: string, text: string) => void
  clearChatHistory: (contractId: string) => void

  // Sidebar collapsed state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  // Upload modal
  uploadModalOpen: boolean
  setUploadModalOpen: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lexguard_token', token)
          localStorage.setItem('lexguard_user', JSON.stringify(user))
        }
        set({ user, token })
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lexguard_token')
          localStorage.removeItem('lexguard_user')
          document.cookie = 'lexguard_token=; path=/; max-age=0'
        }
        set({ user: null, token: null })
      },
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'lexguard-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export const useAppStore = create<AppState>()((set) => ({
  currentContractId: null,
  setCurrentContractId: (id) => set({ currentContractId: id }),

  selectedClauseId: null,
  setSelectedClauseId: (id) => set({ selectedClauseId: id }),

  riskFilter: 'all',
  setRiskFilter: (filter) => set({ riskFilter: filter }),

  categoryFilter: 'all',
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  chatHistory: {},
  addChatMessage: (contractId, msg) =>
    set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        [contractId]: [...(state.chatHistory[contractId] || []), msg],
      },
    })),
  appendToChatMessage: (contractId, text) =>
    set((state) => {
      const history = state.chatHistory[contractId] || []
      if (!history.length) return state
      const updated = [...history]
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content: updated[updated.length - 1].content + text,
      }
      return { chatHistory: { ...state.chatHistory, [contractId]: updated } }
    }),
  clearChatHistory: (contractId) =>
    set((state) => ({
      chatHistory: { ...state.chatHistory, [contractId]: [] },
    })),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  uploadModalOpen: false,
  setUploadModalOpen: (v) => set({ uploadModalOpen: v }),
}))
