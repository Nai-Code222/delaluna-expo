// profile screen
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, TextInput, Platform } from 'react-native'
import { useAuth } from '@/app/backend/AuthContext'
import { router } from 'expo-router'
import HeaderNav from '../components/headerNav'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { StatusBar } from 'expo-status-bar'
import LoadingScreen from '@/app/components/utils/LoadingScreen'
import AlertModal from '@/app/components/alerts/AlertModal'
import PronounToggle from '../components/utils/pronounSwitch'
import { getUserDocRef } from '../service/userService'
import { deleteDoc, getDoc } from 'firebase/firestore'
import { UserRecord } from '@/app/model/UserRecord'
import EditProfileScreen from './edit-profile.screen'
import type { DocumentData } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
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
    router.back()
  };

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace('/welcome')
    } catch (error) {
      setErrorMessage('Logout failed. Please try again.')
      setShowErrorModal(true)
    }
  };

  const handleDeleteAccount = async () => {
    try {
      deleteDoc(getUserDocRef(user?.uid || ''))
      await user?.delete()
      router.replace('/welcome')
    } catch (error) {
      setErrorMessage('Account deletion failed. Please try again.')
      setShowErrorModal(true)
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../assets/images/mainBackground.png')}
        style={styles.background}
        resizeMode="cover">

        <HeaderNav
          title="Profile"
          leftIconName={"arrow-back"}
          onLeftPress={backToPreviousPage}
          rightLabel="Edit"
          onRightPress={goToEditProfile} />

        <View style={styles.profileContentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Your Profile</Text>
          </View>
          <View style={styles.profileInformationContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email </Text>
              <View style={styles.userDataContainer}>
                <Text style={styles.userDataTextField}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date of Birth </Text>
              <View style={styles.userDataContainer}>
                <Text style={styles.userDataTextField}>{userRecord?.birthday}</Text>
              </View>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Pronouns </Text>
              <PronounToggle
                selectedIndex={selectedIdx}
                onChange={setSelectedIdx}
                clickable={false}
                style={{ width: '70%' }} />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Place of Birth </Text>
              <View style={styles.userDataContainer}>
                <Text style={styles.userDataTextField}>{!userRecord?.isPlaceOfBirthUnknown ? userRecord?.placeOfBirth : "Unknown"}</Text>
              </View>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Time of Birth </Text>
              <View style={styles.userDataContainer}>
                <Text style={styles.userDataTextField}>{!userRecord?.isBirthTimeUnknown ? userRecord.birthtime : "Unknown"}</Text>
              </View>
            </View>
          </View>
        </View>

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

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Image source={require('../assets/icons/deleteAccountIcon.png')} style={styles.leftIconContainer} />
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>

        <AlertModal
          visible={showErrorModal}
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', alignSelf: 'center', },
  background: { flex: 1 },
  profileContentContainer: {
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 1,
    flexDirection: 'column',
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
    gap: 5,
    paddingVertical: 5,
  },
  userDataContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8e44ad',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '70%',
    paddingHorizontal: 10,
    paddingVertical: 5,

  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  userDataTextField: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 5,
    width: '100%',
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
    width: '30%',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  profileButton: {
    display: 'flex',
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    color: '#fff',
    height: 70,
  },
  profileButtonWithIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    display: 'flex',
    padding: 16,
    width: '100%',
    color: '#fff',
    height: 70,
    alignItems: 'center',
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
    marginTop: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff4757',
    borderRadius: 5,
    flexDirection: 'row',
    display: 'flex',
    justifyContent: 'center',
    height: 70,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});