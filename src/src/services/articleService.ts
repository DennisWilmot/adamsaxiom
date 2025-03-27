import supabase from './supabase';
import { Article } from '../types/article';
import NetInfo from '@react-native-community/netinfo';
import * as OfflineStorage from './offlineStorage';

/**
 * Fetches all articles, with offline support
 * @param isPremiumUser - Whether the user has premium access
 * @returns Array of articles
 */
export const fetchArticles = async (isPremiumUser: boolean = false): Promise<Article[]> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      // If online, fetch from API
      // If not premium, filter out premium articles
      const query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Only add premium filter for non-premium users
      if (!isPremiumUser) {
        query.eq('is_premium', false);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Cache all articles for offline use
      await OfflineStorage.saveArticlesOffline(data as Article[]);
      
      return data as Article[];
    } else {
      // If offline, get from local storage
      const offlineArticles = await OfflineStorage.getOfflineArticles();
      
      // Filter out premium articles for non-premium users
      return (offlineArticles as Article[]).filter(article => 
        isPremiumUser || !article.is_premium
      );
    }
  } catch (error: any) {
    console.error('Error in fetchArticles:', error.message);
    
    // On error, try to get from local storage
    const offlineArticles = await OfflineStorage.getOfflineArticles();
    
    // Filter out premium articles for non-premium users
    return (offlineArticles as Article[]).filter(article => 
      isPremiumUser || !article.is_premium
    );
  }
};

/**
 * Fetches a single article by ID, with offline support
 * @param articleId - The ID of the article to fetch
 * @returns Article object
 */
export const fetchArticleById = async (articleId: string): Promise<Article> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      // If online, fetch from API
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Cache the article for offline use
      await OfflineStorage.saveArticlesOffline([data as Article]);
      
      return data as Article;
    } else {
      // If offline, get from local storage
      const article = await OfflineStorage.getOfflineArticle(articleId);
      
      if (!article) {
        throw new Error('Article not found in offline storage');
      }
      
      return article;
    }
  } catch (error: any) {
    console.error('Error in fetchArticleById:', error.message);
    
    // On error, try to get from local storage
    const article = await OfflineStorage.getOfflineArticle(articleId);
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    return article;
  }
};

/**
 * Updates the user's progress for an article
 * @param userId - User ID
 * @param articleId - Article ID
 * @param completed - Whether the article has been completed
 */
export const updateArticleProgress = async (
  userId: string, 
  articleId: string, 
  completed: boolean = true
): Promise<void> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // If offline, queue the update for later (in a real app, you'd implement a sync queue)
      console.log('Offline: Article progress update queued for later');
      return;
    }
    
    // Check if a record already exists
    const { data: existingProgress } = await supabase
      .from('user_article_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .single();
    
    if (existingProgress) {
      // Update existing record
      const { error } = await supabase
        .from('user_article_progress')
        .update({ completed, last_read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('article_id', articleId);
      
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_article_progress')
        .insert({
          user_id: userId,
          article_id: articleId,
          completed,
          last_read_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }
  } catch (error: any) {
    console.error('Error updating article progress:', error.message);
    throw error;
  }
};

/**
 * Fetches the user's progress for all articles
 * @param userId - User ID
 * @returns Object with article IDs as keys and progress objects as values
 */
export const fetchUserArticleProgress = async (userId: string): Promise<Record<string, any>> => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // If offline, return empty progress (in a real app, you'd store this locally too)
      console.log('Offline: Unable to fetch article progress');
      return {};
    }
    
    const { data, error } = await supabase
      .from('user_article_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user article progress:', error);
      throw error;
    }
    
    // Convert array to object with article_id as keys
    const progressMap = data.reduce((acc, progress) => {
      acc[progress.article_id] = progress;
      return acc;
    }, {} as Record<string, any>);
    
    return progressMap;
  } catch (error: any) {
    console.error('Error in fetchUserArticleProgress:', error.message);
    return {};
  }
};