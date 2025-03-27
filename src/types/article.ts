export interface Article {
    id: string;
    title: string;
    content: string;
    summary: string;
    is_premium: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
    category?: string;
    reading_time_minutes?: number;
  }
  
  export interface ArticleProgress {
    id: string;
    user_id: string;
    article_id: string;
    completed: boolean;
    last_read_at: string;
    created_at: string;
  }
  
  export interface ArticleWithProgress extends Article {
    progress?: ArticleProgress;
    isCompleted?: boolean;
  }