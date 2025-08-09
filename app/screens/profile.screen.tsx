// profile screen
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, TextInput, Platform, ScrollView, Alert } from 'react-native'
import { useAuth } from '@/app/backend/AuthContext'
import { router } from 'expo-router'
import HeaderNav from '../components/utils/headerNav'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { StatusBar } from 'expo-status-bar'
import LoadingScreen from '@/app/components/utils/LoadingScreen'
import AlertModal from '@/app/components/alerts/AlertModal'
import { getUserDocRef } from '../service/userService'
import { deleteDoc, getDoc } from 'firebase/firestore'
import { UserRecord } from '@/app/model/UserRecord'
import EditProfileScreen from './edit-profile.screen'
import type { DocumentData } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'Non Binary'];

export default function ProfileScreen() {
  const { user, initializing } = useAuth();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [textInput, setTextInput] = useState('');
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const isFocused = useIsFocused();
  let userData: DocumentData;

  const { theme } = useContext(ThemeContext);

  const initialIndex = user
    ? PRONOUNS.findIndex((p) => p === user.displayName)
    : 0;

  const [selectedIdx, setSelectedIdx] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const getUserRecord = async () => {
    if (!user?.uid) return;

    try {
      console.log("Current auth UID:", auth.currentUser?.email);
      const ref = getUserDocRef(user.uid);
      console.log("Fetching user doc from:", ref.path);
      const docSnap = await getDoc(ref);
      console.log("doc: ", docSnap)

      if (!docSnap.exists()) {
        throw new Error("User profile does not exist in Firestore.");
      }

      const data = docSnap.data() as UserRecord;
      setUserRecord(data);

      const idx = PRONOUNS.findIndex(p => p === data.pronouns);
      if (idx >= 0) setSelectedIdx(idx);
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
      router.replace('/welcome');
    } else {
      setProfileLoading(true);
      getUserRecord();
    }
  }, [user, initializing]);

  if (initializing || !userRecord) {
    return <LoadingScreen message="Loading profile..." progress={0} />;
  }

  const goToEditProfile = () => {
    router.replace({
      pathname: '/screens/edit-profile.screen',
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
    router.replace('/screens/update-theme.screen');
  }
  const goToChangePassword = () => {
    router.replace('/screens/update-password.screen');
  };
  const backToPreviousPage = () => {
    router.replace('/home')
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
              router.replace('/welcome')
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
              router.replace('/welcome')
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

  return renderBackground(
    <View style={styles.container}>
      <StatusBar style="light" />
      <HeaderNav
        title="Profile"
        leftIconName={"arrow-back"}
        onLeftPress={backToPreviousPage}
        rightLabel="Edit"
        onRightPress={goToEditProfile}
      />
      <View style={styles.flexFill}>
        <View
          style={styles.profileContentContainer}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Your Profile</Text>
          </View>
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
            <Image source={require('../assets/icons/changeThemeIcon.png')} style={styles.leftIconContainer} />
            <Text style={styles.buttonText}>Change Color Theme</Text>
            <Image source={require('../assets/icons/arrowRightIcon.png')} style={styles.rightIconContainer} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButtonWithIcons} onPress={goToChangePassword}>
            <Image source={require('../assets/icons/changePasseordIcon.png')} style={styles.leftIconContainer} />
            <Text style={styles.buttonText}>Change Password</Text>
            <Image source={require('../assets/icons/arrowRightIcon.png')} style={styles.rightIconContainer} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
            <Image source={require('../assets/icons/logOutIcon.png')} style={styles.leftIconContainer} />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Image source={require('../assets/icons/deleteAccountIcon.png')} style={styles.leftIconContainer} />
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      <AlertModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'center' },
  background: { flex: 1 },
  flexFill: { flex: 1, paddingBottom: 10, width: '100%' },
  profileContentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
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