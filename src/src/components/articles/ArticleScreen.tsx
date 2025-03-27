import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchArticles, fetchUserArticleProgress } from '../../services/articleService';
import ArticleCard from '../../components/articles/ArticleCard';
import { ArticleWithProgress, ArticleProgress } from '../../types/article';
import { useAuth } from '../../hooks/useAuth';

// Define a type for the Material Icon names we use
type MaterialIconName = 'list' | 'visibility-off' | 'check-circle' | 'article';

const ArticlesScreen = () => {
  const { user, isSubscribed } = useAuth();
  const [articles, setArticles] = useState<ArticleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'completed'>('all');

  // Load articles and user progress
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch articles - pass premium status if user is logged in and subscribed
      const articlesData = await fetchArticles(isSubscribed);
      
      // If user is logged in, fetch their progress
      let progressData: Record<string, ArticleProgress> = {};
      if (user?.id) {
        progressData = await fetchUserArticleProgress(user.id);
      }
      
      // Combine articles with progress data
      const articlesWithProgress = articlesData.map(article => {
        const progress = progressData[article.id];
        return {
          ...article,
          progress,
          isCompleted: progress?.completed || false
        };
      });
      
      setArticles(articlesWithProgress);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, isSubscribed]);

  // Load articles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [loadArticles])
  );

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  // Filter articles based on selected filter
  const getFilteredArticles = () => {
    switch (filter) {
      case 'unread':
        return articles.filter(article => !article.isCompleted);
      case 'completed':
        return articles.filter(article => article.isCompleted);
      default:
        return articles;
    }
  };

  // Render filter button with proper icon type
  const FilterButton = ({ 
    title, 
    value, 
    icon 
  }: { 
    title: string; 
    value: 'all' | 'unread' | 'completed'; 
    icon: MaterialIconName 
  }) => (
    <TouchableOpacity 
      style={[styles.filterButton, filter === value && styles.activeFilterButton]}
      onPress={() => setFilter(value)}
    >
      <MaterialIcons 
        name={icon} 
        size={16} 
        color={filter === value ? '#fff' : '#666'} 
      />
      <Text style={[styles.filterButtonText, filter === value && styles.activeFilterText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Articles</Text>
        
        {!user && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Sign in to track your progress and access premium content
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.filterContainer}>
        <FilterButton title="All" value="all" icon="list" />
        <FilterButton title="Unread" value="unread" icon="visibility-off" />
        <FilterButton title="Completed" value="completed" icon="check-circle" />
      </View>
      
      <FlatList
        data={getFilteredArticles()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="article" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No articles found</Text>
            {filter !== 'all' && (
              <TouchableOpacity onPress={() => setFilter('all')}>
                <Text style={styles.showAllText}>Show all articles</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loginPrompt: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  loginPromptText: {
    color: '#0066CC',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  showAllText: {
    fontSize: 14,
    color: '#0066CC',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});

export default ArticlesScreen;