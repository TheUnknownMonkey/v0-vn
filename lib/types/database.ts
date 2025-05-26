export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          workspace_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          workspace_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          workspace_id?: string | null
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      // Future tables for pins and pages
    }
  }
}
