import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ArticleWithProgress } from '../../types/article';
import { MainStackParamList } from '../../navigation/types';

interface ArticleCardProps {
  article: ArticleWithProgress;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  const handlePress = () => {
    navigation.navigate('ArticleDetail', { articleId: article.id });
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.card}>
        {article.image_url ? (
          <Image source={{ uri: article.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialIcons name="article" size={40} color="#888" />
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
            {article.is_premium && (
              <MaterialIcons name="star" size={16} color="#FFD700" style={styles.premiumIcon} />
            )}
          </View>
          
          <Text style={styles.summary} numberOfLines={2}>{article.summary}</Text>
          
          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(article.created_at)}</Text>
            
            <View style={styles.metaInfo}>
              {article.reading_time_minutes && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="access-time" size={14} color="#666" />
                  <Text style={styles.metaText}>{article.reading_time_minutes} min</Text>
                </View>
              )}
              
              {article.isCompleted && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                  <Text style={[styles.metaText, { color: '#4CAF50' }]}>Read</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    height: 120,
  },
  image: {
    width: 100,
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  premiumIcon: {
    marginLeft: 4,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
});

export default ArticleCard;