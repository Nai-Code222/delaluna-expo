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
const PRONOUNS = ['She/Her', 'He/Him', 'Non Binary'];


export default function EditProfileScreen() {
  const { user, initializing } = useAuth();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [textInput, setTextInput] = useState('');
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

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace('/welcome')
    } catch (error) {
      setErrorMessage('Logout failed. Please try again.')
      setShowErrorModal(true)
    }
  }

  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
            <Text style={styles.title}> Your Account</Text>
          </View>
          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Email: </Text>
            <TextInput
              style={styles.textInput}
              placeholder={user?.email || 'Email'}
              placeholderTextColor="#fff"
              secureTextEntry={true}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>

          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Pronouns:</Text>
            <PronounToggle
            selectedIndex={selectedIdx}
            onChange={setSelectedIdx}
          />
          </View>

          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Date of Birth: {user?.displayName || 'N/A'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={user?.email || 'Email'}
              placeholderTextColor="#fff"
              secureTextEntry={true}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>

          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Sun Sign: </Text>
            <TextInput
              style={styles.textInput}
              placeholder={user?.email || 'Email'}
              placeholderTextColor="#fff"
              secureTextEntry={true}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>

          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Place of Birth: </Text>
            <TextInput
              style={styles.textInput}
              placeholder={user?.email || 'Email'}
              placeholderTextColor="#fff"
              secureTextEntry={true}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>

          <View style={styles.profileInformationContainer}>
            <Text style={styles.username}>Time of Birth: {user?.displayName || 'N/A'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={user?.email || 'Email'}
              placeholderTextColor="#fff"
              secureTextEntry={true}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>
        </View>
        

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
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
  container: { flex: 1 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '95%',
    marginVertical: 5,
    marginHorizontal: 5,
    alignSelf: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,

  },
  textInput: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: 24,
    paddingHorizontal: 15,
    color: '#fff', // ✅ white input text
    height: 50,
    marginBottom: Platform.OS === 'ios' ? 10 : 5,
    alignSelf: 'center',
  },
  blurContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    padding: 20,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff4757',
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});