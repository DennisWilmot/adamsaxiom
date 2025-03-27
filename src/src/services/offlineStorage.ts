import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types/article';
import { Quiz } from '../types/quiz';

// Keys for storage
const KEYS = {
  ARTICLES: 'econquiz_articles',
  ARTICLE_PREFIX: 'econquiz_article_',
  QUIZZES: 'econquiz_quizzes',
  QUIZ_PREFIX: 'econquiz_quiz_',
  LAST_SYNC: 'econquiz_last_sync',
};

/**
 * Saves articles list to local storage
 * @param articles - Array of articles
 */
export const saveArticlesOffline = async (articles: Article[]): Promise<void> => {
  try {
    // Save article IDs and basic info for listing
    const articlesList = articles.map(article => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      is_premium: article.is_premium,
      created_at: article.created_at,
      updated_at: article.updated_at,
      category: article.category,
      reading_time_minutes: article.reading_time_minutes,
    }));
    
    await AsyncStorage.setItem(KEYS.ARTICLES, JSON.stringify(articlesList));
    
    // Save each article's full content separately
    await Promise.all(
      articles.map(article => 
        AsyncStorage.setItem(KEYS.ARTICLE_PREFIX + article.id, JSON.stringify(article))
      )
    );
    
    // Update last sync time
    await saveLastSyncTime();
  } catch (error) {
    console.error('Error saving articles offline:', error);
  }
};

/**
 * Retrieves article list from local storage
 * @returns Array of articles (without full content)
 */
export const getOfflineArticles = async (): Promise<Partial<Article>[]> => {
  try {
    const articlesJson = await AsyncStorage.getItem(KEYS.ARTICLES);
    if (!articlesJson) return [];
    
    return JSON.parse(articlesJson);
  } catch (error) {
    console.error('Error getting offline articles:', error);
    return [];
  }
};

/**
 * Retrieves a single article with full content from local storage
 * @param articleId - ID of the article to fetch
 * @returns Article or null if not found
 */
export const getOfflineArticle = async (articleId: string): Promise<Article | null> => {
  try {
    const articleJson = await AsyncStorage.getItem(KEYS.ARTICLE_PREFIX + articleId);
    if (!articleJson) return null;
    
    return JSON.parse(articleJson);
  } catch (error) {
    console.error('Error getting offline article:', error);
    return null;
  }
};

/**
 * Saves quizzes to local storage
 * @param quizzes - Array of quizzes
 */
export const saveQuizzesOffline = async (quizzes: Quiz[]): Promise<void> => {
  try {
    // Save quiz IDs and basic info for listing
    const quizzesList = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      article_id: quiz.article_id,
      time_limit_minutes: quiz.time_limit_minutes,
      passing_score: quiz.passing_score,
      created_at: quiz.created_at,
      updated_at: quiz.updated_at,
      articles: quiz.articles,
    }));
    
    await AsyncStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzesList));
    
    // Save each quiz with questions separately
    await Promise.all(
      quizzes.map(quiz => 
        AsyncStorage.setItem(KEYS.QUIZ_PREFIX + quiz.id, JSON.stringify(quiz))
      )
    );
    
    // Update last sync time
    await saveLastSyncTime();
  } catch (error) {
    console.error('Error saving quizzes offline:', error);
  }
};

/**
 * Retrieves quiz list from local storage
 * @returns Array of quizzes (without questions)
 */
export const getOfflineQuizzes = async (): Promise<Partial<Quiz>[]> => {
  try {
    const quizzesJson = await AsyncStorage.getItem(KEYS.QUIZZES);
    if (!quizzesJson) return [];
    
    return JSON.parse(quizzesJson);
  } catch (error) {
    console.error('Error getting offline quizzes:', error);
    return [];
  }
};

/**
 * Retrieves a single quiz with questions from local storage
 * @param quizId - ID of the quiz to fetch
 * @returns Quiz or null if not found
 */
export const getOfflineQuiz = async (quizId: string): Promise<Quiz | null> => {
  try {
    const quizJson = await AsyncStorage.getItem(KEYS.QUIZ_PREFIX + quizId);
    if (!quizJson) return null;
    
    return JSON.parse(quizJson);
  } catch (error) {
    console.error('Error getting offline quiz:', error);
    return null;
  }
};

/**
 * Gets a quiz by article ID from local storage
 * @param articleId - Article ID
 * @returns Quiz or null if not found
 */
export const getOfflineQuizByArticleId = async (articleId: string): Promise<Quiz | null> => {
  try {
    const quizzes = await getOfflineQuizzes();
    const quiz = quizzes.find(q => q.article_id === articleId);
    
    if (!quiz || !quiz.id) return null;
    
    return getOfflineQuiz(quiz.id);
  } catch (error) {
    console.error('Error getting offline quiz by article ID:', error);
    return null;
  }
};

/**
 * Saves the last sync time
 */
export const saveLastSyncTime = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving last sync time:', error);
  }
};

/**
 * Gets the last sync time
 * @returns ISO date string or null if never synced
 */
export const getLastSyncTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Checks if content needs to be synced (over 24 hours since last sync)
 * @returns True if sync is needed
 */
export const isSyncNeeded = async (): Promise<boolean> => {
  const lastSync = await getLastSyncTime();
  
  if (!lastSync) return true;
  
  const lastSyncDate = new Date(lastSync);
  const now = new Date();
  
  // Calculate difference in hours
  const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
  
  // Sync if more than 24 hours
  return diffHours > 24;
};

/**
 * Clears all offline data
 */
export const clearOfflineData = async (): Promise<void> => {
  try {
    // Get keys to remove
    const keys = await AsyncStorage.getAllKeys();
    const econquizKeys = keys.filter(key => key.startsWith('econquiz_'));
    
    // Remove all keys
    await AsyncStorage.multiRemove(econquizKeys);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};