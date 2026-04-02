export type UserRole = 'user' | 'admin'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type MatchPhase = 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  payment_status: PaymentStatus
  payment_receipt_url: string | null
  payment_validated_at: string | null
  payment_rejection_reason: string | null
  created_at: string
}

export interface Match {
  id: string
  external_id: number
  home_team: string
  away_team: string
  home_team_flag: string
  away_team_flag: string
  match_date: string
  phase: MatchPhase
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  matchday: number | null
  group_name: string | null
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  points_earned: number | null
  created_at: string
  updated_at: string
  match?: Match
  profile?: Profile
}

export interface Standing {
  user_id: string
  full_name: string
  total_points: number
  perfect_scores: number
  partial_scores_7: number
  partial_scores_6: number
  partial_scores_5: number
  matches_predicted: number
  registration_date: string
}

export interface PaymentReceipt {
  id: string
  user_id: string
  receipt_url: string
  claude_analysis: string | null
  status: PaymentStatus
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  profile?: Profile
}

export interface ScoreBreakdown {
  result: number
  home_goals: number
  away_goals: number
  goal_diff: number
  total: number
}
