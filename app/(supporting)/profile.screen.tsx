// profile screen
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, TextInput, Platform, ScrollView, Alert, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { signOut } from 'firebase/auth'
import { StatusBar } from 'expo-status-bar'
import { deleteDoc, getDoc, getFirestore, doc } from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '@/firebaseConfig'
import LoadingScreen from '@/src/components/component-utils/loading-screen'
import AlertModal from '@/src/components/alerts/alert-modal'
import { useAuth } from '../../src/backend/auth-context'
import { UserRecord } from '../../src/model/user-record'
import HeaderNav from '../../src/components/component-utils/header-nav'
import { ThemeContext } from '../theme-context'
import { getUserDocRef } from '../../src/services/user.service'


// Base canvas + scaling clamps
const BASE_W = 390;
const BASE_H = 900;    // adjust if your content needs more vertical room
const MIN_SCALE = 0.87;
const MAX_SCALE = 1.12;

const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'Non Binary'];

export default function ProfileScreen() {
  const { user, initializing } = useAuth();
  const { theme, setThemeKey } = useContext(ThemeContext);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const isFocused = useIsFocused();
  let userData: DocumentData;

  const initialIndex = user
    ? PRONOUNS.findIndex((p) => p === user.displayName)
    : 0;

  const [selectedIdx, setSelectedIdx] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const db = getFirestore();

  const getUserRecord = async () => {
    if (!user?.uid) return;

    try {
      const ref = getUserDocRef(auth.currentUser!.uid);
      const docSnap = await getDoc(ref);

      if (!docSnap.exists()) {
        throw new Error("User profile does not exist in Firestore.");
      } else {
        const data = docSnap.data() as UserRecord;
        setUserRecord(data);
        const idx = PRONOUNS.findIndex(p => p === data.pronouns);
        if (idx >= 0) setSelectedIdx(idx);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setErrorMessage('Failed to fetch user data.');
      setShowErrorModal(true);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace('/(auth)/welcome');
    } else {
      setProfileLoading(true);
      getUserRecord();
    }
  }, [user, initializing]);

  // Moved here: hooks must run before any early return
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (initializing || !userRecord) {
    return <LoadingScreen message="Loading profile..." progress={0} />;
  }

  const goToEditProfile = () => {
    router.replace({
      pathname: '/(supporting)/edit-profile.screen',
      params: {
        firstName: userRecord.firstName ?? '',
        lastName: userRecord.lastName ?? '',
        pronouns: userRecord.pronouns ?? '',
        birthday: userRecord.birthday ?? '',
        birthtime: userRecord.birthtime ?? '',
        isBirthTimeUnknown: String(userRecord.isBirthTimeUnknown),
        placeOfBirth: userRecord.placeOfBirth ?? '',
        isPlaceOfBirthUnknown: String(userRecord.isPlaceOfBirthUnknown),
        email: user?.email ?? '',
        userID: user?.uid ?? '',
      },
    });
  };

  const goToUpdateTheme = () => {
    router.replace({
      pathname: '/(supporting)/update-theme.screen',
      params: {
        userID: user?.uid ?? '',
      },
    });
  }
  const goToChangePassword = () => {
    router.replace('/(supporting)/update-password.screen');
  };
  const backToPreviousPage = () => {
    router.replace('/(main)')
  };
  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth)
              router.replace('/(auth)/welcome')
            } catch (error) {
              setErrorMessage('Logout failed. Please try again.')
              setShowErrorModal(true)
            }
          }
        }
      ]
    );
  };
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              deleteDoc(getUserDocRef(user?.uid || ''))
              await user?.delete()
              router.replace('/(auth)/welcome')
            } catch (error) {
              setErrorMessage('Account deletion failed. Please try again.')
              setShowErrorModal(true)
            }
          }
        }
      ]
    );
  };

  // Helper to render background
  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === 'gradient' && theme.gradient) {
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((theme.gradient.angle ?? 0) * Math.PI / 180),
            y: Math.sin((theme.gradient.angle ?? 0) * Math.PI / 180),
          }}
          style={styles.background}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.background, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    );
  }

  // Helper to format birthday
  function getFormattedBirthday(birthday?: string) {
    if (!birthday) return '';
    // Try to parse and format
    const dateObj = new Date(birthday);
    if (!isNaN(dateObj.getTime())) {
      return format(dateObj, 'MM/dd/yyyy');
    }
    // fallback: show as-is
    return birthday;
  }

  // scale calc (can stay here; not a hook)
  const availW = Math.max(0, width - insets.left - insets.right);
  const availH = Math.max(0, height - insets.top - insets.bottom);
  const sW = availW / BASE_W;
  const sH = availH / BASE_H;
  let scale = sW;
  if (BASE_H * scale > availH) scale = Math.min(sW, sH);
  scale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);

  return renderBackground(
    <ScrollView
      style={{ flex: 1, width: '100%' }}
  contentContainerStyle={{
    paddingTop: Math.max(insets.top, 40) + 60, // guarantees at least 100px top space
    paddingBottom: insets.bottom + 30,
  }}
  showsVerticalScrollIndicator={false}
    >
      <StatusBar style="light" />
      <HeaderNav
        title="Profile"
        leftIconName={"arrow-back"}
        onLeftPress={backToPreviousPage}
        rightLabel="Edit"
        onRightPress={goToEditProfile}
      />
      <View style={styles.container}>
        
        <View style={styles.flexFill}>
          <View
            style={styles.profileContentContainer}
          >
            <View style={styles.profileInformationContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <View style={styles.userDataContainer}>
                  <Text style={styles.userDataTextField}>{userRecord?.firstName}</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileInformationContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <View style={styles.userDataContainer}>
                  <Text style={styles.userDataTextField}>{userRecord?.lastName}</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileInformationContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email </Text>
                <View style={styles.userDataContainer}>
                  <Text style={styles.userDataTextField}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.profileInformationContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Date of Birth </Text>
                  <View style={styles.userDataContainer}>
                    <Text style={styles.userDataTextField}>
                      {getFormattedBirthday(userRecord?.birthday)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileInformationContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Pronouns </Text>
                  <View style={styles.userDataContainer}>
                    <Text style={styles.userDataTextField}>{userRecord?.pronouns}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileInformationContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Place of Birth </Text>
                  <View style={styles.userDataContainer}>
                    <Text style={styles.userDataTextField}>{!userRecord?.isPlaceOfBirthUnknown ? userRecord?.placeOfBirth : "Unknown"}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileInformationContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Time of Birth </Text>
                  <View style={styles.userDataContainer}>
                    <Text style={styles.userDataTextField}>{!userRecord?.isBirthTimeUnknown ? userRecord.birthtime : "Unknown"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.profileButtonWithIcons} onPress={goToUpdateTheme}>
              <Image source={require('../assets/icons/change-theme-icon.png')} style={styles.leftIconContainer} />
              <Text style={styles.buttonText}>Change Color Theme</Text>
              <Image source={require('../assets/icons/arrow-right-icon.png')} style={styles.rightIconContainer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButtonWithIcons} onPress={goToChangePassword}>
              <Image source={require('../assets/icons/change-password-icon.png')} style={styles.leftIconContainer} />
              <Text style={styles.buttonText}>Change Password</Text>
              <Image source={require('../assets/icons/arrow-right-icon.png')} style={styles.rightIconContainer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <Image source={require('../assets/icons/log-out-icon.png')} style={styles.leftIconContainer} />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Image source={require('../assets/icons/delete-account-icon.png')} style={styles.leftIconContainer} />
            <Text style={styles.buttonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        <AlertModal
          visible={showErrorModal}
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </View>
      {/* --- end unchanged content --- */}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'center' },
  background: { flex: 1 },
  flexFill: { flex: 1, paddingBottom: 10, width: '100%' },
  profileContentContainer: {
    flexGrow: 1,
    gap: 12,
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  titleContainer: {
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    width: '100%',
    paddingBottom: 10,
  },
  profileInformationContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  userDataContainer: {
    width: '70%',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  userDataTextField: {
    color: '#fff',
    marginVertical: 5,
    width: '100%',
    fontSize: 15,
    marginTop: 5,
    textAlign: 'center',
  },
  userDataPronounContainer: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    paddingTop: 15,
    paddingLeft: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: 24,
    paddingHorizontal: 15,
    color: '#fff',
    height: 50,
    marginBottom: Platform.OS === 'ios' ? 10 : 5,
    alignSelf: 'center',
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    width: '50%',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  profileButton: {
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    color: '#fff',
    height: 50,
  },
  profileButtonWithIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    display: 'flex',
    width: '100%',
    color: '#fff',
    height: 60,
    alignItems: 'center',
    gap: 10,
  },
  leftIconContainer: {
    width: 20,
    height: 20,
    marginRight: 8,

  },
  rightIconContainer: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  deleteAccountButton: {
    marginTop: 5,
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 50,
    height: undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});