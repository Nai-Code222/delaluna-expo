// /screens/edit-profile.screen.tsx
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ImageBackground,
  Switch,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PronounToggle from '../components/utils/pronounSwitch';
import HeaderNav from '../components/headerNav';
import { GlassButton } from '../components/utils/GlassButton';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { updateUserDoc } from '../service/userService';
import UserRecordDefault from '../model/UserRecord'

const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'Non Binary'];

type Params = {
  firstName: string;
  lastName: string;
  pronouns: string;
  birthday: string;
  birthtime: string;
  isBirthTimeUnknown: string;
  placeOfBirth: string;
  isPlaceOfBirthUnknown: string;
  email: string;
  userID: string;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const original = {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    pronouns: params.pronouns,
    birthday: params.birthday,
    birthtime: params.birthtime,
    isBirthTimeUnknown: params.isBirthTimeUnknown === 'true',
    placeOfBirth: params.placeOfBirth,
    isPlaceOfBirthUnknown: params.isPlaceOfBirthUnknown === 'true',
  };

  // State for fields
  const [firstName, setFirstName] = useState(params.firstName);
  const [lastName, setLastName] = useState(params.lastName);
  const [email, setEmail] = useState(params.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [pronoun, setPronoun] = useState(params.pronouns);
  const [birthday, setBirthday] = useState(params.birthday);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [timeOfBirth, setTimeOfBirth] = useState(params.birthtime);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isBirthTimeUnknown, setisBirthTimeUnknown] = useState(params.isBirthTimeUnknown === 'true');
  const [placeOfBirth, setPlaceOfBirth] = useState(params.placeOfBirth);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeUnknown, setPlaceUnknown] = useState(params.isPlaceOfBirthUnknown === 'true');
  const [userID] = useState(params.userID);

  const current = {
    firstName,
    lastName,
    email,
    pronouns: pronoun,
    birthday,
    birthtime: timeOfBirth,
    isBirthTimeUnknown,
    placeOfBirth,
    isPlaceOfBirthUnknown: placeUnknown,
  };

  // Initialize state from params on mount
  useEffect(() => {
    setFirstName(params.firstName);
    setLastName(params.lastName);
    setEmail(params.email);
    setPronoun(params.pronouns);
    setBirthday(params.birthday);
    setTimeOfBirth(params.birthtime);
    setisBirthTimeUnknown(params.isBirthTimeUnknown === 'true');
    setPlaceOfBirth(params.placeOfBirth);
    setPlaceUnknown(params.isPlaceOfBirthUnknown === 'true');
    // clear errors
    setEmailError(null);
    setBirthdayError(null);
    setTimeError(null);
    setPlaceError(null);
  }, []);

  useEffect(() => {
    if (!email) {
      setEmailError(null);
      return;
    }
    const formatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!formatOk) {
      setEmailError('Invalid email address');
      return;
    }
    let active = true;
    setCheckingEmail(true);

    fetchSignInMethodsForEmail(auth, email)
      .then(methods => {
        if (!active) return;
        setEmailError(methods.length ? 'Email already in use' : null);
      })
      .catch(() => {
        if (active) setEmailError('Error checking email');
      })
      .finally(() => {
        if (active) setCheckingEmail(false);
      });
    return () => { active = false; };
  }, [email]);

  // Birthday validation: not future, at least 18
  useEffect(() => {
    if (!birthday) {
      setBirthdayError(null);
      return;
    }
    const date = new Date(birthday);
    const today = new Date();
    if (date > today) {
      setBirthdayError('Date cannot be in the future');
    } else {
      const age = today.getFullYear() - date.getFullYear() - (
        today.getMonth() < date.getMonth() ||
          (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
          ? 1 : 0);
      setBirthdayError(age < 18 ? 'You must be at least 18' : null);
    }
  }, [birthday]);

  // Time validation: not future if today
  useEffect(() => {
    if (isBirthTimeUnknown) {
      setTimeError(null);
      return;
    }
    if (!timeOfBirth) {
      setTimeError(null);
      return;
    }
    const bd = new Date(birthday);
    const now = new Date();
    if (bd.toDateString() === now.toDateString()) {
      const [h, m] = timeOfBirth.split(':').map(Number);
      if (h > now.getHours() || (h === now.getHours() && m > now.getMinutes())) {
        setTimeError('Time cannot be in the future');
        return;
      }
    }
    setTimeError(null);
  }, [timeOfBirth, birthday, isBirthTimeUnknown]);

  // Place validation: required unless unknown
  useEffect(() => {
    if (placeUnknown) {
      setPlaceError(null);
    } else if (!placeOfBirth.trim()) {
      setPlaceError('Place of birth is required');
    } else {
      setPlaceError(null);
    }
  }, [placeOfBirth, placeUnknown]);

  const hasUnsaved = () => {
    return Object.keys(current).some(key => {
      const k = key as keyof typeof original;
      return current[k] !== original[k];
    });
  };

  const handleCancel = () => {
    if (!hasUnsaved()) {
      router.back();
      return;
    }
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Save handler: block if any errors or email check pending
  const handleSave = async () => {
    if (emailError || checkingEmail || birthdayError || timeError || placeError) {
      return;
    }

    // 2. build a list of changed fields
    const changes = Object.keys(current).reduce(
      (acc, key) => {
        // TypeScript: key is keyof typeof original & keyof typeof current
        const k = key as keyof typeof original;
        if (current[k] !== original[k]) {
          acc.push({ field: k, value: current[k] });
        }
        return acc;
      },
      [] as { field: string; value: any }[]
    );

    // 3. if no changes, alert and go back
    if (changes.length === 0) {
      Alert.alert('No changes made', undefined, [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    // 4. otherwise turn into an update object
    const updateObj = Object.fromEntries(changes.map(c => [c.field, c.value]));
    console.log("object: ", updateObj)

    try {
      await updateUserDoc(userID, updateObj);
      router.back();
    } catch {
      Alert.alert('Save failed', 'Please try again.');
    }

  }

  return (
    <ImageBackground
      source={require('../assets/images/mainBackground.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <HeaderNav
        title="Edit Profile"
        leftLabel='Cancel'
        onLeftPress={handleCancel}
      />
      <ScrollView contentContainerStyle={styles.container}>

        {/* First Name */}
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        {/* Last Name */}
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {checkingEmail && <ActivityIndicator style={styles.loader} color="#fff" />}
        </View>
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        {/* Birthday */}
        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          placeholder="YYYY-MM-DD"
          onChangeText={setBirthday}
        />
        {birthdayError && <Text style={styles.errorText}>{birthdayError}</Text>}

        {/* Pronouns */}
        <Text style={styles.label}>Pronouns</Text>
        <PronounToggle
          selectedIndex={PRONOUNS.indexOf(pronoun)}
          onChange={i => setPronoun(PRONOUNS[i])}
          clickable={true}
          style={{ width: '100%' }}
        />

        {/* Place of Birth */}
        <Text style={styles.label}>Place of Birth</Text>
        {!placeUnknown ? (
          <>
            <TextInput style={styles.input} value={placeOfBirth} onChangeText={setPlaceOfBirth} />
            {placeError && <Text style={styles.errorText}>{placeError}</Text>}
          </>
        ) : (
          <Text style={styles.input}>Unknown</Text>
        )}
        <View style={styles.toggleRow}>
          <Switch
            value={placeUnknown}
            onValueChange={val=>{
              setPlaceUnknown(val);
              if(val) setPlaceOfBirth('Greenwich, London, United Kingdom');
            }}
          />
          <Text style={styles.toggleLabel}>I don’t know</Text>
        </View>

        {/* Time of Birth */}
        <Text style={styles.label}>Time of Birth</Text>
        {!isBirthTimeUnknown ? (
          <>
            <TextInput style={styles.input} value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder='HH:mm' />
            {timeError && <Text style={styles.errorText}>{timeError}</Text>}
          </>
        ) : (
          <Text style={styles.input}>Unknown</Text>
        )}
        <View style={styles.toggleRow}>
          <Switch
            value={isBirthTimeUnknown}
            onValueChange={val=>{
              setisBirthTimeUnknown(val);
              if(val) setTimeOfBirth('00:00');
            }}
          />
          <Text style={styles.toggleLabel}>I don’t know</Text>
        </View>
      </ScrollView>
      <View style={[styles.saveBttnContainer, { position: 'absolute', bottom: 40, left: 0, right: 0, alignSelf: 'center' }]}>
        <GlassButton
          title="Save Changes"
          onPress={handleSave}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%' },
  container: { padding: 20, paddingBottom: 60 },
  saveBttnContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel: { marginBottom: 20 },
  cancelText: { color: '#fff', fontSize: 18 },
  label: { color: '#fff', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  toggleLabel: { color: '#fff', marginLeft: 8 },
  emailRow: { flexDirection: 'row', alignItems: 'center' },
  loader: { marginLeft: 8 },
  errorText: { color: 'red', marginBottom: 16 },
});
