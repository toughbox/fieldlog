import React from 'react';
import { Box, HStack, Text, Pressable, Center } from '@gluestack-ui/themed';
import { Home, List, Building, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface BottomNavigationProps {
  navigation: any;
  currentScreen?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ navigation, currentScreen = 'Home' }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const getIconColor = (screenName: string) => {
    return currentScreen === screenName ? '#6366f1' : '#9ca3af';
  };

  const getTextColor = (screenName: string) => {
    return currentScreen === screenName ? '$primary600' : '$gray500';
  };

  const getTextWeight = (screenName: string) => {
    return currentScreen === screenName ? 'medium' : 'normal';
  };

  return (
    <Box 
      bg="white" 
      px="$4" 
      py="$2" 
      shadowOpacity={0.1} 
      shadowRadius={8} 
      shadowOffset={{ width: 0, height: -2 }}
      borderTopWidth={1}
      borderTopColor="$gray200"
    >
      <HStack justifyContent="space-around" alignItems="center">
        <Pressable 
          alignItems="center" 
          p="$2" 
          flex={1}
          onPress={() => navigation.navigate('Home')}
        >
          <Center mb="$1">
            <Home size={24} color={getIconColor('Home')} />
          </Center>
          <Text 
            size="xs" 
            color={getTextColor('Home')} 
            fontWeight={getTextWeight('Home')} 
            fontFamily="NotoSansKR_400Regular"
          >
            홈
          </Text>
        </Pressable>
        
        <Pressable 
          alignItems="center" 
          p="$2" 
          flex={1}
          onPress={() => navigation.navigate('RecordsList')}
        >
          <Center mb="$1">
            <List size={24} color={getIconColor('RecordsList')} />
          </Center>
          <Text 
            size="xs" 
            color={getTextColor('RecordsList')} 
            fontWeight={getTextWeight('RecordsList')} 
            fontFamily="NotoSansKR_400Regular"
          >
            기록
          </Text>
        </Pressable>
        
        <Pressable 
          alignItems="center" 
          p="$2" 
          flex={1}
          onPress={() => navigation.navigate('FieldList')}
        >
          <Center mb="$1">
            <Building size={24} color={getIconColor('FieldList')} />
          </Center>
          <Text 
            size="xs" 
            color={getTextColor('FieldList')} 
            fontWeight={getTextWeight('FieldList')} 
            fontFamily="NotoSansKR_400Regular"
          >
            현장
          </Text>
        </Pressable>
        
        <Pressable 
          alignItems="center" 
          p="$2" 
          flex={1}
          onPress={handleLogout}
        >
          <Center mb="$1">
            <LogOut size={24} color="#ef4444" />
          </Center>
          <Text 
            size="xs" 
            color="$red500" 
            fontFamily="NotoSansKR_400Regular"
          >
            로그아웃
          </Text>
        </Pressable>
      </HStack>
    </Box>
  );
};

export default BottomNavigation;
