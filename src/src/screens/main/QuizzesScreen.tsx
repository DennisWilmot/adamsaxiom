import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import { fetchQuizzes, fetchUserQuizAttempts } from '../../services/quizService';
import { Quiz, QuizAttempt } from '../../types/quiz';
import { useAuth } from '../../hooks/useAuth';

type QuizzesScreenNavigationProp = StackNavigationProp<MainStackParamList>;
type MaterialIconName = 'help' | 'access-time' | 'check-circle' | 'quiz' | 'play-arrow' | 'replay';

const QuizzesScreen = () => {
  const navigation = useNavigation<QuizzesScreenNavigationProp>();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all available quizzes
      const quizzesData = await fetchQuizzes();
      setQuizzes(quizzesData);
      
      // If user is logged in, fetch their quiz attempts
      if (user?.id) {
        const attemptsData = await fetchUserQuizAttempts(user.id);
        
        // Convert to object with quiz_id as keys for easy lookup
        const attemptsMap = attemptsData.reduce((acc, attempt) => {
          if (!acc[attempt.quiz_id] || new Date(attempt.completed_at) > new Date(acc[attempt.quiz_id].completed_at)) {
            acc[attempt.quiz_id] = attempt;
          }
          return acc;
        }, {} as Record<string, QuizAttempt>);
        
        setUserAttempts(attemptsMap);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [loadQuizzes])
  );
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizzes();
  };
  
  const hasAttemptedQuiz = (quizId: string) => {
    return !!userAttempts[quizId];
  };
  
  const getQuizScore = (quizId: string) => {
    return userAttempts[quizId]?.score || 0;
  };
  
  const hasPassedQuiz = (quiz: Quiz) => {
    const attempt = userAttempts[quiz.id];
    return attempt && attempt.score >= quiz.passing_score;
  };
  
  const renderQuizCard = ({ item: quiz }: { item: Quiz }) => {
    const hasAttempted = hasAttemptedQuiz(quiz.id);
    const hasPassed = hasPassedQuiz(quiz);
    const articleTitle = quiz.articles?.title || 'Unknown Article';
    
    return (
      <TouchableOpacity 
        style={styles.quizCard}
        onPress={() => navigation.navigate('QuizScreen', { articleId: quiz.article_id })}
      >
        <View style={styles.quizCardContent}>
          <View style={styles.quizCardHeader}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            {hasAttempted && (
              <View style={[
                styles.completedBadge,
                hasPassed ? styles.passedBadge : styles.failedBadge
              ]}>
                <MaterialIcons 
                  name={hasPassed ? "check-circle" : "warning"} 
                  size={16} 
                  color="#fff" 
                />
                <Text style={styles.completedText}>
                  {hasPassed ? 'Passed' : 'Failed'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.articleTitle}>Article: {articleTitle}</Text>
          
          {quiz.description && (
            <Text style={styles.quizDescription} numberOfLines={2}>
              {quiz.description}
            </Text>
          )}
          
          <View style={styles.quizMeta}>
            {quiz.questions && (
              <View style={styles.metaItem}>
                <MaterialIcons name="help" size={16} color="#666" />
                <Text style={styles.metaText}>
                  {quiz.questions.length} questions
                </Text>
              </View>
            )}
            
            {quiz.time_limit_minutes && (
              <View style={styles.metaItem}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text style={styles.metaText}>
                  {quiz.time_limit_minutes} min
                </Text>
              </View>
            )}
            
            {hasAttempted && (
              <View style={styles.metaItem}>
                <MaterialIcons 
                  name="stars" 
                  size={16} 
                  color={hasPassed ? "#4CAF50" : "#F44336"} 
                />
                <Text style={[
                  styles.metaText,
                  { color: hasPassed ? "#4CAF50" : "#F44336" }
                ]}>
                  {getQuizScore(quiz.id)}%
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.quizCardFooter}>
            <View style={styles.buttonContainer}>
              <MaterialIcons 
                name={hasAttempted ? "replay" : "play-arrow"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.buttonText}>
                {hasAttempted ? "Retake" : "Start"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>Quizzes</Text>
        <Text style={styles.subtitle}>Test your knowledge on economics concepts</Text>
      </View>
      
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuizCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="quiz" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No quizzes available yet</Text>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizCardContent: {
    padding: 16,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  completedBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  passedBadge: {
    backgroundColor: '#4CAF50',
  },
  failedBadge: {
    backgroundColor: '#F44336',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  quizMeta: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  quizCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  buttonContainer: {
    backgroundColor: '#0066CC',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
});

export default QuizzesScreen;