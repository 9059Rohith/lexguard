// All TypeScript types for LexGuard

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface Contract {
  id: string
  filename: string
  original_filename: string
  contract_type: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  page_count: number
  aggregate_risk_index: number
  risk_level: 'low' | 'moderate' | 'high' | 'unknown'
  high_count: number
  moderate_count: number
  low_count: number
  executive_summary: string
  created_at: string
}

export interface Clause {
  id: string
  contract_id: string
  clause_type: string
  raw_text: string
  plain_english: string
  risk_likelihood: number
  risk_severity: number
  risk_score: number
  risk_level: 'low' | 'moderate' | 'high'
  category: string
  page_estimate: number
  redline_suggestion: string
  why_risky: string
  is_accepted: boolean | null
  order_index: number
  // New fields from enhanced backend
  risk_score_adjusted?: number
  requires_legal_review?: boolean
  bounding_box_json?: { x_min: number; x_max: number; y_min: number; y_max: number; page: number } | null
  // Alias helpers (same as above, for component convenience)
  title?: string
  original_text?: string
  explanation?: string
  suggested_text?: string
  likelihood?: number
  severity?: number
}

export interface Scenario {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  financial_impact?: string
  mitigation?: string
}

export interface ContractDetail extends Contract {
  full_text: string
  scenarios: Scenario[]
  scenarios_json?: any[]
  clauses: Clause[]
  category_scores?: Record<string, number>
  counterparty?: string
  jurisdiction?: string
  contradictions_json?: any[]
}

export type ClauseCategory = 
  | 'Employment' 
  | 'Financial' 
  | 'IP' 
  | 'Privacy' 
  | 'Compliance' 
  | 'Operational'

export type RiskLevel = 'low' | 'moderate' | 'high' | 'unknown'
export type RiskFilter = 'all' | 'high' | 'moderate' | 'low'

export interface AnalysisStatus {
  contract_id: string
  status: string
  progress: number
  message: string
}

export interface Stats {
  total_contracts: number
  high_risk_contracts: number
  average_risk_score: number
  total_clauses_flagged: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface PlaybookRule {
  id: string
  rule_text: string
  category?: string
  enabled: boolean
  label?: string
  value?: string
}

export interface Playbook {
  id: string
  name: string
  description: string
  rules: PlaybookRule[]
  is_active: boolean
  created_at: string
}

export interface RadarDataPoint {
  category: string
  score: number
  fullMark?: number
}
