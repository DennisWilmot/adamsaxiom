import supabase from './supabase';
import { Quiz, QuizQuestion, QuizAttempt } from '../types/quiz';
import NetInfo from '@react-native-community/netinfo';
import * as OfflineStorage from './offlineStorage';

/**
 * Fetches a quiz for a specific article, with offline support
 * @param articleId - The ID of the article
 * @returns Quiz with questions
 */
export const fetchQuizByArticleId = async (articleId: string): Promise<Quiz | null> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      // If online, fetch from API
      // First fetch the quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('article_id', articleId)
        .single();
      
      if (quizError) {
        if (quizError.code === 'PGRST116') {
          // No quiz found for this article
          return null;
        }
        throw quizError;
      }
      
      if (!quizData) return null;
      
      // Then fetch the questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('question_order', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      // Combine the quiz with questions
      const completeQuiz: Quiz = {
        ...quizData,
        questions: questionsData as QuizQuestion[]
      };
      
      // Cache the quiz for offline use
      await OfflineStorage.saveQuizzesOffline([completeQuiz]);
      
      return completeQuiz;
    } else {
      // If offline, get from local storage
      return await OfflineStorage.getOfflineQuizByArticleId(articleId);
    }
  } catch (error: any) {
    console.error('Error fetching quiz:', error.message);
    
    // On error, try to get from local storage
    return await OfflineStorage.getOfflineQuizByArticleId(articleId);
  }
};

/**
 * Saves a quiz attempt, with offline handling
 * @param userId - The user ID
 * @param quizId - The quiz ID
 * @param score - The score (percentage)
 * @param answers - Array of user answers (question_id, selected_option)
 * @returns The saved quiz attempt
 */
export const saveQuizAttempt = async (
  userId: string,
  quizId: string,
  score: number,
  answers: { questionId: string; selectedOption: number }[]
): Promise<QuizAttempt> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // If offline, store locally to sync later (in a real app)
      console.log('Offline: Quiz attempt saved locally for later sync');
      
      // Return a placeholder
      return {
        id: 'offline-' + Date.now(),
        user_id: userId,
        quiz_id: quizId,
        score,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }
    
    // If online, save to database
    // Create the quiz attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert([
        {
          user_id: userId,
          quiz_id: quizId,
          score,
          completed_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
    
    if (attemptError) throw attemptError;
    
    // Store the user's answers
    const answersToInsert = answers.map(answer => ({
      attempt_id: attemptData.id,
      question_id: answer.questionId,
      selected_option: answer.selectedOption
    }));
    
    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answersToInsert);
    
    if (answersError) throw answersError;
    
    return attemptData as QuizAttempt;
  } catch (error: any) {
    console.error('Error saving quiz attempt:', error.message);
    throw error;
  }
};

/**
 * Fetches quiz attempts for a user, with offline support
 * @param userId - The user ID
 * @returns Array of quiz attempts
 */
export const fetchUserQuizAttempts = async (userId: string): Promise<QuizAttempt[]> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // If offline, return empty array (in a real app, you'd store attempts locally too)
      console.log('Offline: Unable to fetch quiz attempts');
      return [];
    }
    
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (
          id,
          title,
          article_id
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    
    return data as QuizAttempt[];
  } catch (error: any) {
    console.error('Error fetching user quiz attempts:', error.message);
    return [];
  }
};

/**
 * Fetches all quizzes available, with offline support
 * @returns Array of quizzes with basic info
 */
export const fetchQuizzes = async (): Promise<Quiz[]> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      // If online, fetch from API
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          articles (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cache quizzes for offline use
      await OfflineStorage.saveQuizzesOffline(data as Quiz[]);
      
      return data as Quiz[];
    } else {
      // If offline, get from local storage
      const offlineQuizzes = await OfflineStorage.getOfflineQuizzes();
      return offlineQuizzes as Quiz[];
    }
  } catch (error: any) {
    console.error('Error fetching quizzes:', error.message);
    
    // On error, try to get from local storage
    const offlineQuizzes = await OfflineStorage.getOfflineQuizzes();
    return offlineQuizzes as Quiz[];
  }
};