export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    options: string[];
    correct_option: number;
    explanation?: string;
    question_order: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Quiz {
    id: string;
    title: string;
    description?: string;
    article_id: string;
    time_limit_minutes?: number;
    passing_score: number;
    created_at: string;
    updated_at: string;
    questions?: QuizQuestion[];
    // Joined data from the articles table (when selected)
    articles?: {
      id: string;
      title: string;
    };
  }
  
  export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    completed_at: string;
    created_at: string;
    // Joined data from the quizzes table (when selected)
    quizzes?: {
      id: string;
      title: string;
      article_id: string;
    };
  }
  
  export interface QuizAnswer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_option: number;
    created_at: string;
  }
  
  export interface UserQuizAnswer {
    questionId: string;
    selectedOption: number;
  }