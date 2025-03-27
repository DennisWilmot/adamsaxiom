import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  Image, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchArticleById, updateArticleProgress } from '../../services/articleService';
import { Article } from '../../types/article';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';

type ArticleDetailRouteProp = RouteProp<MainStackParamList, 'ArticleDetail'>;
type ArticleDetailNavigationProp = StackNavigationProp<MainStackParamList, 'ArticleDetail'>;

const ArticleDetailScreen = () => {
  const route = useRoute<ArticleDetailRouteProp>();
  const navigation = useNavigation<ArticleDetailNavigationProp>();
  const { user } = useAuth();
  const { articleId } = route.params;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        const articleData = await fetchArticleById(articleId);
        setArticle(articleData);
        
        // Mark as read after 5 seconds - assuming user has started reading
        const timer = setTimeout(() => {
          if (user?.id) {
            handleMarkAsRead();
          }
        }, 5000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        Alert.alert('Error', 'Failed to load article. Please try again.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadArticle();
  }, [articleId, user?.id]);

  const handleMarkAsRead = async () => {
    if (!user?.id || !articleId) return;
    
    try {
      await updateArticleProgress(user.id, articleId, true);
      setCompleted(true);
    } catch (error) {
      console.error('Error marking article as read:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {article.image_url ? (
          <Image 
            source={{ uri: article.image_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="article" size={60} color="#ccc" />
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{article.title}</Text>
            
            <View style={styles.metaContainer}>
              {article.is_premium && (
                <View style={styles.premiumBadge}>
                  <MaterialIcons name="star" size={14} color="#fff" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
              
              <Text style={styles.date}>{formatDate(article.created_at)}</Text>
              
              {article.reading_time_minutes && (
                <View style={styles.readingTime}>
                  <MaterialIcons name="access-time" size={14} color="#666" />
                  <Text style={styles.readingTimeText}>
                    {article.reading_time_minutes} min read
                  </Text>
                </View>
              )}
            </View>
            
            {article.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>{article.category}</Text>
              </View>
            )}
          </View>
          
          {/* Render article content - this would be improved with proper HTML/Markdown rendering */}
          <Text style={styles.content}>{article.content}</Text>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.completeButton, completed && styles.completedButton]}
              onPress={handleMarkAsRead}
              disabled={completed}
            >
              <MaterialIcons 
                name={completed ? "check-circle" : "check"} 
                size={20} 
                color={completed ? "#fff" : "#0066CC"} 
              />
              <Text style={[styles.completeButtonText, completed && styles.completedButtonText]}>
                {completed ? "Completed" : "Mark as Completed"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quizButton}
              onPress={() => navigation.navigate('QuizScreen', { articleId: article.id })}
            >
              <MaterialIcons name="quiz" size={20} color="#fff" />
              <Text style={styles.quizButtonText}>Take Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  premiumText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  date: {
    color: '#666',
    fontSize: 12,
    marginRight: 10,
  },
  readingTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingTimeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryContainer: {
    marginTop: 5,
  },
  category: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
    flex: 1,
    marginRight: 10,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#0066CC',
    marginLeft: 5,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#fff',
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    flex: 1,
  },
  quizButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
});

export default ArticleDetailScreen;