// /screens/edit-profile.screen.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Alert, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import HeaderNav from '../components/utils/headerNav';
import { GlassButton } from '../components/buttons/GlassButton';
import { updateUserDoc } from '../service/userService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import EditProfileLocationAutocomplete from '../components/sign up/EditProfileLocationAutocomplete';
import { ThemeContext } from '../themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import PronounDropdown from '../components/buttons/PronounDropdown';
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
  userID: string;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { theme } = useContext(ThemeContext);

  const original = {
    firstName: params.firstName,
    lastName: params.lastName,
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
  const [nameError, setNameError] = useState<string | null>(null);
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
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [placeTextInput, setPlaceTextInput] = useState(placeOfBirth);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [askPassword, setAskPassword] = useState(false);
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);


  const current = {
    firstName,
    lastName,
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
    setPronoun(params.pronouns);
    setBirthday(params.birthday);
    setTimeOfBirth(params.birthtime);
    setisBirthTimeUnknown(params.isBirthTimeUnknown === 'true');
    setPlaceOfBirth(params.placeOfBirth);
    setPlaceUnknown(params.isPlaceOfBirthUnknown === 'true');
    // clear errors
    setBirthdayError(null);
    setNameError(null);
    setTimeError(null);
    setPlaceError(null);
  }, []);
  
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
    if (!birthday || !timeOfBirth || isBirthTimeUnknown) return;
    const today = new Date();
    const birthDate = new Date(birthday);
    const [h, m] = timeOfBirth.split(':').map(Number);
    const birthTimeDate = new Date();
    birthTimeDate.setHours(h);
    birthTimeDate.setMinutes(m);

    if (birthDate.toDateString() === today.toDateString() &&
      (h > today.getHours() || (h === today.getHours() && m > today.getMinutes()))) {
      setTimeError('Time cannot be in the future');
    } else {
      setTimeError(null);
    }
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

  // First name validation
  useEffect(() => {
    if (!firstName.trim()) {
      setNameError('First name is required');
    } else {
      setNameError(null);
    }
  }, [firstName]);

  // Last name validation
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  useEffect(() => {
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
    } else {
      setLastNameError(null);
    }
  }, [lastName]);

  const hasUnsaved = () => {
    return Object.keys(current).some(key => {
      const k = key as keyof typeof original;
      return current[k] !== original[k];
    });
  };

  interface LocationItem {
    properties: {
      name?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  }

  const handlePlaceSelect = (item: LocationItem) => {
    const { name, city, state, country } = item.properties;
    const label = [name, city, state, country].filter(Boolean).join(', ');
    setPlaceTextInput(label);
    setPlaceOfBirth(label);
    setSuggestions([label]);
    setPlaceError(null);
    setLocationError(null);
    setPlaceUnknown(false);
  };

  const handlePlaceUnknown = () => {
    setPlaceUnknown(true);
    setPlaceTextInput('Greenwich, London, United Kingdom');
    setPlaceOfBirth('Greenwich, London, United Kingdom');
    setPlaceError(null);
    setLocationError(null);
  };


  const handleCancel = () => {
    if (!hasUnsaved()) {
      router.replace('/screens/profile.screen');
      return;
    }
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => router.replace('/screens/profile.screen') },
      ]
    );
  };

  const handleSave = async () => {
    if (nameError || lastNameError || birthdayError || timeError || placeError) {
      return;
    }

    const changes = Object.keys(current).reduce((acc, key) => {
      const k = key as keyof typeof original;
      if (current[k] !== original[k]) acc.push({ field: k, value: current[k] });
      return acc;
    }, [] as { field: string; value: any }[]);

    if (!changes.length) {
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        router.replace('/screens/profile.screen');
      }, 1500);
      return;
    }

    try {
      setSaving(true);
      const updateObj = Object.fromEntries(changes.map(c => [c.field, c.value]));

      await updateUserDoc(userID, updateObj);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        router.replace('/screens/profile.screen');
      }, 1500);
    } catch (e) {
      console.error(e);
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to render background using theme
  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.bg}
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
          style={styles.bg}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.bg, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    );
  }

  return renderBackground(
    <React.Fragment>
      <HeaderNav
        title="Edit Profile"
        leftLabel='Cancel'
        onLeftPress={handleCancel}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        {/* First Name */}
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}

        {/* Last Name */}
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
        {lastNameError && <Text style={styles.errorText}>{lastNameError}</Text>}

        {/* Birthday */}
        <Text style={styles.label}>Birthday</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.input}>
            {birthday
              ? (() => {
                // Display as MM/dd/yyyy
                const dateObj = new Date(birthday);
                return format(dateObj, 'MM/dd/yyyy');
              })()
              : 'Select your birthdate'}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          date={birthday ? new Date(birthday) : new Date()}
          onConfirm={(date: Date) => {
            const isoFormatted = format(date, 'MM-dd-yyyy');
            setBirthday(isoFormatted);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
        {birthdayError && <Text style={styles.errorText}>{birthdayError}</Text>}

        {/* Pronouns */}
        <Text style={styles.label}>Pronouns</Text>
        <PronounDropdown
          value={pronoun}
          onChange={setPronoun}
        />


        {/* Place of Birth */}
        <Text style={styles.label}>Place of Birth</Text>
        {!placeUnknown ? (
          <EditProfileLocationAutocomplete
            value={placeTextInput}
            onChange={text => {
              setPlaceTextInput(text);
              setPlaceError(null);
              setLocationError(null);
            }}
            onSelect={handlePlaceSelect}
            fetchSuggestions={q =>
              fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
                .then(res => res.json())
                .then(json => json.features)
            }
            placeholder="Type your birth city…"
            containerStyle={styles.autocompleteContainer}
            inputStyle={styles.input}
            listStyle={styles.autocompleteList}
          />
        ) : (
          <Text style={styles.input}>Unknown</Text>
        )}
        <View style={styles.toggleRow}>
          <Switch
            value={placeUnknown}
            onValueChange={val => {
              if (val) {
                handlePlaceUnknown();
              } else {
                setPlaceUnknown(false);
                setPlaceTextInput('');
                setPlaceOfBirth('');
              }
            }}
          />
          <Text style={styles.toggleLabel}>I don’t know</Text>
        </View>
        {/* Time of Birth */}
        <Text style={styles.label}>Time of Birth</Text>
        {!isBirthTimeUnknown ? (
          <>
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <Text style={styles.input}>
                {timeOfBirth
                  ? (() => {
                    // Show time in hh:mm a format
                    const [h, m] = timeOfBirth.split(':').map(Number);
                    if (isNaN(h) || isNaN(m)) return timeOfBirth;
                    const date = new Date();
                    date.setHours(h);
                    date.setMinutes(m);
                    return format(date, 'hh:mm a');
                  })()
                  : 'Select time'}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              date={
                (() => {
                  // Parse timeOfBirth to Date if possible, else use now
                  if (timeOfBirth) {
                    const [h, m] = timeOfBirth.split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                      const d = new Date();
                      d.setHours(h);
                      d.setMinutes(m);
                      d.setSeconds(0);
                      d.setMilliseconds(0);
                      return d;
                    }
                  }
                  return new Date();
                })()
              }
              onConfirm={(date: Date) => {
                // Save as hh:mm a (12-hour with AM/PM)
                const formatted = format(date, 'hh:mm a');
                setTimeOfBirth(formatted);
                setShowTimePicker(false);
              }}
              onCancel={() => setShowTimePicker(false)}
            />
            {timeError && <Text style={styles.errorText}>{timeError}</Text>}
          </>
        ) : (
          <Text style={styles.input}>Unknown</Text>
        )}
        <View style={styles.toggleRow}>
          <Switch
            value={isBirthTimeUnknown}
            onValueChange={val => {
              setisBirthTimeUnknown(val);
              if (val) setTimeOfBirth('00:00');
            }}
          />
          <Text style={styles.toggleLabel}>I don’t know</Text>
        </View>
        <View style={styles.saveBttnContainer}>
          <GlassButton
            title="Save Changes"
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
      {showSuccessAlert && (
        <View style={styles.successAlertDefault}>
          <Text style={styles.successCheckDefault}>✓</Text>
          <Text style={styles.successAlertTextDefault}>
            Profile updated successfully!
          </Text>
        </View>
      )}
      {askPassword && (
  <View style={styles.pwdOverlay}>
    <View style={styles.pwdBox}>
      <Text style={styles.pwdTitle}>Re-authenticate</Text>
      <Text style={styles.pwdSubtitle}>Please enter your password to update your email.</Text>
      <TextInput
        style={styles.pwdInput}
        secureTextEntry
        placeholder="Password"
        value={pwd}
        onChangeText={setPwd}
      />
      <TouchableOpacity
        style={styles.pwdBtn}
        onPress={() => {
          setAskPassword(false);
          handleSave();
        }}
      >
        <Text style={styles.pwdBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%' },
  container: { 
    padding: 20, 
    width: '100%', 
    justifyContent: 'center', // Center vertically
    flex: 1,                  // Ensure container fills screen
  },
  saveBttnContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32, // Add more space above the button
    marginBottom: 16, // Add some space below the button
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
  autocompleteContainer: {
    marginBottom: 16,
    zIndex: 1000,
  },
  autocompleteList: {
    // optionally tweak width, shadows, etc.
  },
  pwdOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 999,
},
pwdBox: {
  width: '100%',
  maxWidth: 420,
  backgroundColor: 'rgba(0,0,0,0.85)',
  borderRadius: 12,
  padding: 16,
},
pwdTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
pwdSubtitle: { color: '#fff', opacity: 0.8, marginBottom: 10 },
pwdInput: {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 12,
  color: '#fff',
},
pwdBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
pwdBtnText: { color: '#fff', fontWeight: '700' },
  dropdown: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  placeholderStyle: {
    color: '#fff',
  },
  selectedTextStyle: {
    color: '#fff',
  },
  inputSearchStyle: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  searchContainerStyle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  searchTextInputStyle: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  successAlertDefault: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center', // Center horizontally
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 18,
    zIndex: 9999,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  successCheckDefault: {
    fontSize: 26,
    color: '#6FFFE9',
    fontWeight: 'bold',
    marginRight: 10,
  },
  successAlertTextDefault: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
