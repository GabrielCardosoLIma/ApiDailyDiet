import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      name: string
      email: string
      avatar_url?: string
    }

    meals: {
      id: string
      user_id: string
      name: string
      description: string
      is_within_diet: boolean
      date: string // dateTime
      created_at: number
      updated_at: number | null
    }
  }
}