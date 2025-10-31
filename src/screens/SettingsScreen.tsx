import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from '@gluestack-ui/themed';
import { SafeAreaView, Alert, StatusBar, ScrollView } from 'react-native';
import { LogOut, UserX, Settings, Check } from 'lucide-react-native';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout, user, deleteAccount } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      // 로그아웃 후 자동으로 로그인 화면으로 이동
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      Alert.alert('확인', '회원 탈퇴를 진행하려면 체크박스를 선택해주세요.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount();
      setShowDeleteDialog(false);
      Alert.alert('탈퇴 완료', '회원 탈퇴가 완료되었습니다.');
      // 탈퇴 후 자동으로 로그인 화면으로 이동
    } catch (error: any) {
      console.error('회원 탈퇴 오류:', error);
      Alert.alert(
        '오류',
        error?.message || '회원 탈퇴 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$4" shadowOpacity={0.05} shadowRadius={2}>
        <HStack alignItems="center" space="md">
          <Settings size={28} color="#6366f1" />
          <Heading size="xl" fontFamily="NotoSansKR_700Bold">
            설정
          </Heading>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }}>
        <VStack space="lg" p="$4">
          {/* 사용자 정보 카드 */}
          <Box bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.05} shadowRadius={4}>
            <VStack space="sm">
              <Text size="sm" color="$gray600" fontFamily="NotoSansKR_400Regular">
                로그인 정보
              </Text>
              <Text size="lg" fontWeight="$semibold" fontFamily="NotoSansKR_500Medium">
                {user?.name}
              </Text>
              <Text size="sm" color="$gray600" fontFamily="NotoSansKR_400Regular">
                {user?.email}
              </Text>
            </VStack>
          </Box>

          {/* 로그아웃 버튼 */}
          <Button
            size="lg"
            variant="outline"
            action="secondary"
            onPress={() => setShowLogoutDialog(true)}
            borderColor="$gray300"
          >
            <HStack space="sm" alignItems="center">
              <LogOut size={20} color="#6b7280" />
              <ButtonText
                color="$gray700"
                fontFamily="NotoSansKR_500Medium"
              >
                로그아웃
              </ButtonText>
            </HStack>
          </Button>

          {/* 회원 탈퇴 버튼 */}
          <Box mt="$8">
            <Button
              size="lg"
              variant="outline"
              action="negative"
              onPress={() => setShowDeleteDialog(true)}
              borderColor="$red300"
            >
              <HStack space="sm" alignItems="center">
                <UserX size={20} color="#ef4444" />
                <ButtonText
                  color="$red500"
                  fontFamily="NotoSansKR_500Medium"
                >
                  회원 탈퇴
                </ButtonText>
              </HStack>
            </Button>
            <VStack space="xs" mt="$2">
              <Text size="xs" color="$red600" textAlign="center" fontFamily="NotoSansKR_700Bold">
                ⚠️ 탈퇴 시 모든 데이터가 영구 삭제됩니다
              </Text>
              <Text size="xs" color="$gray500" textAlign="center" fontFamily="NotoSansKR_400Regular">
                삭제된 데이터는 절대 복구할 수 없습니다
              </Text>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      {/* 로그아웃 확인 다이얼로그 */}
      <AlertDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg" fontFamily="NotoSansKR_700Bold">
              로그아웃
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text fontFamily="NotoSansKR_400Regular">
              정말 로그아웃하시겠습니까?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" flex={1}>
              <Button
                variant="outline"
                action="secondary"
                onPress={() => setShowLogoutDialog(false)}
                flex={1}
              >
                <ButtonText fontFamily="NotoSansKR_500Medium">취소</ButtonText>
              </Button>
              <Button
                action="primary"
                onPress={handleLogout}
                flex={1}
                bg="$primary600"
              >
                <ButtonText fontFamily="NotoSansKR_500Medium">확인</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmed(false);
        }}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg" fontFamily="NotoSansKR_700Bold" color="$red600">
              회원 탈퇴
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack space="md">
              <Box bg="$red50" p="$3" borderRadius="$md" borderWidth={1} borderColor="$red200">
                <VStack space="xs">
                  <Text fontWeight="$bold" color="$red600" fontFamily="NotoSansKR_700Bold" size="md">
                    ⚠️ 경고: 영구 삭제됩니다
                  </Text>
                  <Text size="sm" color="$red600" fontFamily="NotoSansKR_500Medium">
                    탈퇴 후 모든 데이터는 즉시 삭제되며
                  </Text>
                  <Text size="sm" color="$red600" fontFamily="NotoSansKR_700Bold">
                    절대 복구할 수 없습니다
                  </Text>
                </VStack>
              </Box>
              
              <Text fontWeight="$medium" fontFamily="NotoSansKR_500Medium">
                삭제되는 데이터:
              </Text>
              <VStack space="xs" pl="$4">
                <Text size="sm" color="$gray700" fontFamily="NotoSansKR_400Regular">
                  • 모든 현장 정보
                </Text>
                <Text size="sm" color="$gray700" fontFamily="NotoSansKR_400Regular">
                  • 모든 작업 기록
                </Text>
                <Text size="sm" color="$gray700" fontFamily="NotoSansKR_400Regular">
                  • 업로드한 모든 이미지
                </Text>
                <Text size="sm" color="$gray700" fontFamily="NotoSansKR_400Regular">
                  • 계정 정보
                </Text>
              </VStack>
              
              <Box bg="$yellow50" p="$3" borderRadius="$md" borderWidth={1} borderColor="$yellow300">
                <Text size="sm" color="$amber800" fontFamily="NotoSansKR_700Bold" textAlign="center">
                  탈퇴 시 데이터를 복구할 수 없습니다!
                </Text>
              </Box>
              
              <Text size="sm" color="$gray700" fontFamily="NotoSansKR_500Medium" mt="$2">
                정말로 탈퇴하시겠습니까?
              </Text>
              
              <Box bg="$gray100" p="$4" borderRadius="$md" borderWidth={2} borderColor={deleteConfirmed ? "$red500" : "$gray300"}>
                <Checkbox
                  value="confirmed"
                  isChecked={deleteConfirmed}
                  onChange={setDeleteConfirmed}
                  size="md"
                >
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={Check} color="white" />
                  </CheckboxIndicator>
                  <CheckboxLabel>
                    <VStack space="xs">
                      <Text size="sm" fontFamily="NotoSansKR_700Bold" color="$gray900">
                        위 내용을 모두 확인했으며, 모든 데이터가 영구적으로 삭제됨을 이해했습니다.
                      </Text>
                      <Text size="xs" fontFamily="NotoSansKR_500Medium" color="$red600">
                        체크 시 되돌릴 수 없습니다.
                      </Text>
                    </VStack>
                  </CheckboxLabel>
                </Checkbox>
              </Box>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" flex={1}>
              <Button
                variant="outline"
                action="secondary"
                onPress={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmed(false);
                }}
                flex={1}
              >
                <ButtonText fontFamily="NotoSansKR_500Medium">취소</ButtonText>
              </Button>
              <Button
                action="negative"
                onPress={handleDeleteAccount}
                flex={1}
                bg="$red600"
                isDisabled={!deleteConfirmed || isDeleting}
              >
                <ButtonText fontFamily="NotoSansKR_500Medium">
                  {isDeleting ? '처리 중...' : '탈퇴하기'}
                </ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation navigation={navigation} currentScreen="Settings" />
    </SafeAreaView>
  );
};

export default SettingsScreen;

