// profile screen
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, TextInput, Platform } from 'react-native'
import { useAuth } from '@/app/backend/AuthContext'
import { router } from 'expo-router'
import HeaderNav from '../components/headerNav'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import LoadingScreen from '@/app/components/utils/LoadingScreen'
import AlertModal from '@/app/components/alerts/AlertModal'
import PronounToggle from '../components/utils/pronounSwitch'
import { UserRecord } from '../model/UserRecord'
const PRONOUNS = ['She/Her', 'He/Him', 'Non Binary'];


export default function EditProfileScreen() {
  const { user, initializing } = useAuth();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [textInput, setTextInput] = useState('');
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const initialIndex = user
    ? PRONOUNS.findIndex((p) => p === user.displayName)
    : 0;

  const [selectedIdx, setSelectedIdx] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  useEffect(() => {
    if (initializing) return
    if (!user) {
      router.replace('/welcome')
    }
  }, [user, initializing])

  if (initializing) {
    return <LoadingScreen message="Loading profile..." progress={0} />
  }

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
          onLeftPress={() => { }}
          rightLabel="Edit"
          onRightPress={() => { }} />

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
                        <PronounToggle selectedIndex={selectedIdx} onChange={setSelectedIdx} />
                      </View>
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Place of Birth </Text>
                        <View style={styles.userDataContainer}>
                          <Text style={styles.userDataTextField}>{userRecord?.placeOfBirth || "Unknown"}</Text>
                        </View>
                      </View>
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Time of Birth </Text>
                        <View style={styles.userDataContainer}>
                          <Text style={styles.userDataTextField}>{userRecord?.birthtime}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

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
  container: { flex: 1, width: '100%', height: '100%', overflowX: 'hidden', overflowY: 'scroll' },
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
  userDataPronounContainer:{
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    paddingTop: 10,
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
  profileButtonWithIcons:{
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