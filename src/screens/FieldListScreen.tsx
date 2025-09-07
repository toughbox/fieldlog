import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, RefreshControl, ScrollView, FlatList } from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  Surface,
  IconButton,
  Chip,
  FAB,
  Searchbar,
  Menu,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentFieldApi, Field } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';

interface FieldListScreenProps {
  navigation: any;
}

const FieldListScreen: React.FC<FieldListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('name');

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    filterAndSortFields();
  }, [fields, searchQuery, sortBy]);

  const loadFields = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const result = await currentFieldApi.getFields(accessToken);
      
      if (result.success && result.data) {
        setFields(result.data);
      } else {
        Alert.alert('오류', result.error || '현장 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('현장 목록 로드 오류:', error);
      Alert.alert('오류', '현장 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortFields = () => {
    let filtered = fields;

    // 검색 필터링
    if (searchQuery.trim()) {
      filtered = fields.filter(field => 
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredFields(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFields();
  };

  const handleCreateField = () => {
    navigation.navigate('CreateField');
  };

  const handleFieldPress = (field: Field) => {
    // 현장 상세보기 또는 해당 현장의 기록 목록으로 이동
    navigation.navigate('FieldDetail', { fieldId: field.id });
  };

  const handleFieldEdit = (field: Field) => {
    navigation.navigate('EditField', { fieldId: field.id });
  };

  const handleFieldDelete = async (field: Field) => {
    Alert.alert(
      '현장 삭제',
      `"${field.name}" 현장을 삭제하시겠습니까?\n\n이 현장에 연결된 기록이 있다면 현장이 비활성화되고, 기록이 없다면 완전히 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const accessToken = await TokenService.getAccessToken();
              if (!accessToken) return;

              const result = await currentFieldApi.deleteField(field.id, accessToken);
              
              if (result.success) {
                Alert.alert('성공', result.message || '현장이 삭제되었습니다.');
                loadFields(); // 목록 새로고침
              } else {
                Alert.alert('오류', result.error || '현장 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('현장 삭제 오류:', error);
              Alert.alert('오류', '현장 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const getFieldStats = (field: Field) => {
    const fieldCount = field.field_schema.fields.length;
    return `${fieldCount}개 필드`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderFieldItem = ({ item }: { item: Field }) => (
    <Card style={styles.fieldCard} onPress={() => handleFieldPress(item)}>
      <Card.Content>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldInfo}>
            <View style={styles.fieldTitleRow}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Title style={styles.fieldName}>{item.name}</Title>
            </View>
            {item.description && (
              <Paragraph style={styles.fieldDescription} numberOfLines={2}>
                {item.description}
              </Paragraph>
            )}
            <View style={styles.fieldMeta}>
              <Chip size="small" style={styles.fieldChip}>
                {getFieldStats(item)}
              </Chip>
              <Text style={styles.fieldDate}>
                생성: {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          
          <View style={styles.fieldActions}>
            <IconButton
              icon={item.icon}
              iconColor={item.color}
              size={24}
              style={[styles.fieldIcon, { backgroundColor: item.color + '20' }]}
            />
            <Menu
              visible={false}
              onDismiss={() => {}}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => {}}
                />
              }
            >
              <Menu.Item onPress={() => handleFieldEdit(item)} title="수정" />
              <Menu.Item onPress={() => handleFieldDelete(item)} title="삭제" />
            </Menu>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏗️</Text>
      <Title style={styles.emptyTitle}>현장이 없습니다</Title>
      <Paragraph style={styles.emptyDescription}>
        첫 번째 현장을 만들어 기록 관리를 시작해보세요
      </Paragraph>
      <Button
        mode="contained"
        onPress={handleCreateField}
        style={styles.emptyButton}
      >
        첫 현장 만들기
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Title style={styles.headerTitle}>현장 관리</Title>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                onPress={() => setSortMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('name');
                setSortMenuVisible(false);
              }}
              title="이름순"
              leadingIcon={sortBy === 'name' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('created');
                setSortMenuVisible(false);
              }}
              title="최신순"
              leadingIcon={sortBy === 'created' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('updated');
                setSortMenuVisible(false);
              }}
              title="수정순"
              leadingIcon={sortBy === 'updated' ? 'check' : undefined}
            />
          </Menu>
        </View>
      </Surface>

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="현장 검색..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* 통계 */}
      {fields.length > 0 && (
        <Surface style={styles.statsContainer}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{fields.length}</Text>
              <Text style={styles.statLabel}>전체 현장</Text>
            </View>
            <Divider style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredFields.length}</Text>
              <Text style={styles.statLabel}>검색 결과</Text>
            </View>
          </View>
        </Surface>
      )}

      {/* 현장 목록 */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>현장 목록을 불러오는 중...</Text>
          </View>
        ) : filteredFields.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredFields}
            renderItem={renderFieldItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* 플로팅 액션 버튼 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateField}
        label="새 현장"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
  },
  searchbar: {
    elevation: 2,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    height: 30,
    width: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // FAB를 위한 여백
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldCard: {
    marginBottom: 12,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldInfo: {
    flex: 1,
    marginRight: 12,
  },
  fieldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fieldDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  fieldMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldChip: {
    height: 24,
  },
  fieldDate: {
    fontSize: 12,
    color: '#999',
  },
  fieldActions: {
    alignItems: 'center',
  },
  fieldIcon: {
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FieldListScreen;
