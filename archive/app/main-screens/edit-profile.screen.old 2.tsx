// /screens/edit-profile.screen.tsx
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  Switch,
  Platform,
  ActivityIndicator,
  FlatList,
  Pressable,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import HeaderNav from '../components/utils/headerNav';
import { GlassButton } from '../components/buttons/GlassButton';
import { updateUserDoc } from '../service/userService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, parse, parseISO, isValid } from 'date-fns';
import { ThemeContext } from '../themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import PronounDropdown from '../components/buttons/PronounDropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type PhotonFeature = {
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

const parseBirthday = (s?: string | null): Date | null => {
  if (!s) return null;
  let d = parseISO(s);
  if (isValid(d)) return d;
  const bases = ['MM-dd-yyyy', 'MM/dd/yyyy', 'M/d/yyyy'];
  for (const mask of bases) {
    d = parse(s, mask, new Date());
    if (isValid(d)) return d;
  }
  return null;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const window = Dimensions.get('window');

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

  // fields
  const [firstName, setFirstName] = useState(params.firstName);
  const [lastName, setLastName] = useState(params.lastName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // location input + suggestions
  const [placeTextInput, setPlaceTextInput] = useState(placeOfBirth);
  const [placeSelected, setPlaceSelected] = useState<boolean>(!(params.isPlaceOfBirthUnknown === 'true') && !!params.placeOfBirth);
  const [suggestions, setSuggestions] = useState<{ label: string; feature: PhotonFeature }[]>([]);
  const [loadingSugs, setLoadingSugs] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [askPassword, setAskPassword] = useState(false);
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);

  // keyboard + anchor measuring
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [anchor, setAnchor] = useState<{x:number;y:number;width:number;height:number}>({x:0,y:0,width:0,height:0});
  const inputAnchorRef = useRef<View>(null);
  const inputFocusedRef = useRef(false);

  // refs for quick focus
  const firstNameRef = useRef<TextInput | null>(null);
  const lastNameRef = useRef<TextInput | null>(null);
  const lastChosenLabelRef = useRef<string>('');

  // open panel tracker (date/time/pronoun)
  const [openPanel, setOpenPanel] = useState<'none'|'pronoun'|'date'|'time'>('none');

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: any) => setKeyboardInset(e?.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardInset(0);
    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // init
  useEffect(() => {
    setFirstName(params.firstName);
    setLastName(params.lastName);
    setPronoun(params.pronouns);
    const parsed = parseBirthday(params.birthday);
    setBirthday(parsed ? format(parsed, 'yyyy-MM-dd') : '');
    setTimeOfBirth(params.birthtime);
    setisBirthTimeUnknown(params.isBirthTimeUnknown === 'true');
    setPlaceOfBirth(params.placeOfBirth);
    setPlaceUnknown(params.isPlaceOfBirthUnknown === 'true');
    setBirthdayError(null);
    setNameError(null);
    setTimeError(null);
    setPlaceError(null);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!params.firstName?.trim()) firstNameRef.current?.focus?.();
      else if (!params.lastName?.trim()) lastNameRef.current?.focus?.();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // validations
  useEffect(() => {
    if (!birthday) return setBirthdayError(null);
    const d = parseBirthday(birthday);
    if (!d) return setBirthdayError('Invalid date');
    const today = new Date();
    if (d > today) return setBirthdayError('Date cannot be in the future');
    const age = today.getFullYear() - d.getFullYear() - (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate()) ? 1 : 0);
    setBirthdayError(age < 18 ? 'You must be at least 18' : null);
  }, [birthday]);

  useEffect(() => {
    if (!birthday || !timeOfBirth || isBirthTimeUnknown) return;
    const d = parseBirthday(birthday);
    if (!d) return;
    const [h, m] = timeOfBirth.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return setTimeError('Invalid time');
    const today = new Date();
    if (d.toDateString() === today.toDateString() && (h > today.getHours() || (h === today.getHours() && m > today.getMinutes()))) setTimeError('Time cannot be in the future');
    else setTimeError(null);
  }, [timeOfBirth, birthday, isBirthTimeUnknown]);

  useEffect(() => {
    if (placeUnknown) return setPlaceError(null);
    setPlaceError(placeSelected ? null : 'Please select a location from suggestions');
  }, [placeUnknown, placeSelected]);

  useEffect(() => {
    setNameError(firstName.trim() ? null : 'First name is required');
  }, [firstName]);

  useEffect(() => {
    setLastNameError(lastName.trim() ? null : 'Last name is required');
  }, [lastName]);

  const hasUnsaved = () =>
    Object.keys({
      firstName,
      lastName,
      pronouns: pronoun,
      birthday,
      birthtime: timeOfBirth,
      isBirthTimeUnknown,
      placeOfBirth,
      isPlaceOfBirthUnknown: placeUnknown,
    }).some((key) => {
      const k = key as keyof typeof original;
      const currentVal: any = ( {
        firstName,
        lastName,
        pronouns: pronoun,
        birthday,
        birthtime: timeOfBirth,
        isBirthTimeUnknown,
        placeOfBirth,
        isPlaceOfBirthUnknown: placeUnknown,
      } as any )[k];
      return currentVal !== original[k];
    });

  const formatLabel = (f: PhotonFeature) => {
    const { name, city, state, country } = f.properties || {};
    return [name, city, state, country].filter(Boolean).join(', ');
  };

  const fetchPhoton = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) { setSuggestions([]); return; }
    setLoadingSugs(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      const items: {label:string; feature:PhotonFeature}[] =
        (json?.features ?? [])
          .map((f: PhotonFeature) => ({ feature: f, label: formatLabel(f) }))
          .filter((x: any) => !!x.label);
      setSuggestions(items);
      setShowSuggestions(true);
    } catch (_e) {
      // swallow
    } finally {
      setLoadingSugs(false);
    }
  }, []);

  const handlePlaceSelect = (f: PhotonFeature) => {
    const label = formatLabel(f);
    lastChosenLabelRef.current = label;
    setPlaceTextInput(label);
    setPlaceOfBirth(label);
    setPlaceSelected(true);
    setPlaceUnknown(false);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handlePlaceUnknown = () => {
    setPlaceUnknown(true);
    lastChosenLabelRef.current = '';
    const fallback = 'Greenwich, London, United Kingdom';
    setPlaceTextInput(fallback);
    setPlaceOfBirth(fallback);
    setPlaceSelected(false);
    setShowSuggestions(false);
  };

  const onAnchorLayout = () => {
    // Measure the location input anchor in window coords
    requestAnimationFrame(() => {
      inputAnchorRef.current?.measureInWindow?.((x, y, width, height) => {
        setAnchor({ x, y, width, height });
      });
    });
  };

  const handleCancel = () => {
    if (!hasUnsaved()) return router.replace('/screens/profile.screen');
    Alert.alert('Discard changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => router.replace('/screens/profile.screen') },
    ]);
  };

  const handleSave = async () => {
    if (!placeUnknown && !placeSelected) {
      setPlaceError('Please select a location from suggestions');
      return;
    }
    if (nameError || lastNameError || birthdayError || timeError || placeError) return;

    const currentAll = {
      firstName,
      lastName,
      pronouns: pronoun,
      birthday,
      birthtime: timeOfBirth,
      isBirthTimeUnknown,
      placeOfBirth,
      isPlaceOfBirthUnknown: placeUnknown,
    };
    const changes = Object.entries(currentAll).reduce((acc, [k, v]) => {
      if ((original as any)[k] !== v) acc.push([k, v]);
      return acc;
    }, [] as [string, any][]);

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
      await updateUserDoc(userID, Object.fromEntries(changes));
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

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const birthdayDate = parseBirthday(birthday);

  const renderBackground = (children: React.ReactNode) => {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground source={theme.backgroundImage} style={styles.bg} resizeMode="cover">
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
    return <View style={[styles.bg, { backgroundColor: theme.colors.background }]}>{children}</View>;
  };

  // -------- SUGGESTION SHEET (smart position above/below input) ----------
  const SuggestionSheet = () => {
    if (!showSuggestions) return null;

    // available viewport (minus keyboard)
    const viewportBottom = window.height - keyboardInset - insets.bottom;
    const spaceBelow = Math.max(viewportBottom - (anchor.y + anchor.height), 0);
    const maxHeightBelow = Math.min(spaceBelow - 8, 260);
    const maxHeightAbove = Math.min(Math.max(anchor.y - insets.top - 12, 0), 260);

    const willFitBelow = maxHeightBelow >= 140 || maxHeightBelow > maxHeightAbove;
    const sheetHeight = Math.max(140, Math.min(260, willFitBelow ? maxHeightBelow : maxHeightAbove || 260));
    const top = willFitBelow ? anchor.y + anchor.height + 6 : Math.max(anchor.y - sheetHeight - 6, insets.top + 8);

    return (
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}
      >
        <View
          style={[
            styles.suggestionSheet,
            {
              top,
              left: Math.max(anchor.x, 16),
              width: Math.min(anchor.width, window.width - 32),
              maxHeight: sheetHeight,
            },
          ]}
        >
          {loadingSugs ? (
            <View style={styles.sugLoading}>
              <ActivityIndicator />
              <Text style={styles.suggestionText}>Searching…</Text>
            </View>
          ) : suggestions.length ? (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={suggestions}
              keyExtractor={(item) => item.label + Math.random().toString(36)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePlaceSelect(item.feature)}
                  style={({ pressed }) => [styles.suggestionItem, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.suggestionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          ) : (
            <View style={styles.sugEmpty}>
              <Text style={styles.suggestionTextDim}>No matches</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  // ----------------------------------------------------------------------

  return renderBackground(
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1C2541" />
      <HeaderNav title="Edit Profile" leftLabel="Cancel" onLeftPress={handleCancel} />

      <TouchableWithoutFeedback
        onPress={() => { Keyboard.dismiss(); setShowSuggestions(false); setOpenPanel('none'); }}
        accessible={false}
      >
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.top + 8}
          >
            <View style={[styles.container, { paddingBottom: insets.bottom + 96 }]}>
              {/* First Name */}
              <Text style={styles.label}>First Name</Text>
              <TextInput
                ref={firstNameRef}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => lastNameRef.current?.focus?.()}
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
              {nameError && <Text style={styles.errorText}>{nameError}</Text>}

              {/* Last Name */}
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                ref={lastNameRef}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  inputFocusedRef.current = true;
                  setShowSuggestions(!!placeTextInput);
                }}
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
              {lastNameError && <Text style={styles.errorText}>{lastNameError}</Text>}

              {/* Birthday */}
              <Text style={styles.label}>Birthday</Text>
              <TouchableOpacity
                onPressIn={() => {
                  Keyboard.dismiss();
                  setOpenPanel('date');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.input}>
                  {birthdayDate ? format(birthdayDate, 'MM/dd/yyyy') : 'Select your birthdate'}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                date={birthdayDate ?? new Date()}
                onConfirm={(date: Date) => {
                  setBirthday(format(date, 'yyyy-MM-dd'));
                  setShowDatePicker(false);
                  setOpenPanel('none');
                }}
                onCancel={() => { setShowDatePicker(false); setOpenPanel('none'); }}
              />
              {birthdayError && <Text style={styles.errorText}>{birthdayError}</Text>}

              {/* Pronouns */}
              <Text style={styles.label}>Pronouns</Text>
              <View onTouchStart={() => { Keyboard.dismiss(); setOpenPanel('pronoun'); }}>
                <PronounDropdown
                  key={`pronoun-${openPanel}`}
                  value={pronoun}
                  onChange={(val) => { setPronoun(val); setOpenPanel('none'); }}
                />
              </View>

              {/* Place of Birth */}
              <Text style={styles.label}>Place of Birth</Text>
              {!placeUnknown ? (
                <>
                  <View
                    ref={inputAnchorRef}
                    onLayout={onAnchorLayout}
                  >
                    <TextInput
                      placeholder="Type your birth city…"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={styles.input}
                      value={placeTextInput}
                      onFocus={() => {
                        inputFocusedRef.current = true;
                        onAnchorLayout();
                        if (placeTextInput.trim().length >= 2) setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        inputFocusedRef.current = false;
                        // keep sheet up only if keyboard still present (Android)
                        if (Platform.OS === 'ios') setShowSuggestions(false);
                      }}
                      onChangeText={(text) => {
                        setPlaceTextInput(text);
                        if (text !== lastChosenLabelRef.current) setPlaceSelected(false);
                        if (text.trim().length < 2) {
                          setSuggestions([]);
                          setShowSuggestions(false);
                        } else {
                          onAnchorLayout();
                          fetchPhoton(text);
                        }
                      }}
                      returnKeyType="search"
                      onSubmitEditing={() => {
                        // if user hits enter with one suggestion, auto-pick
                        if (suggestions.length === 1) handlePlaceSelect(suggestions[0].feature);
                      }}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <Switch
                      value={placeUnknown}
                      onValueChange={(val) => {
                        if (val) handlePlaceUnknown();
                        else {
                          setPlaceUnknown(false);
                          lastChosenLabelRef.current = '';
                          setPlaceTextInput('');
                          setPlaceOfBirth('');
                          setPlaceSelected(false);
                          setShowSuggestions(false);
                        }
                      }}
                    />
                    <Text style={styles.toggleLabel}>I don’t know</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.input}>Unknown</Text>
                  <View style={styles.toggleRow}>
                    <Switch
                      value={placeUnknown}
                      onValueChange={(val) => {
                        if (val) handlePlaceUnknown();
                        else {
                          setPlaceUnknown(false);
                          lastChosenLabelRef.current = '';
                          setPlaceTextInput('');
                          setPlaceOfBirth('');
                          setPlaceSelected(false);
                        }
                      }}
                    />
                    <Text style={styles.toggleLabel}>I don’t know</Text>
                  </View>
                </>
              )}
              {placeError && <Text style={styles.errorText}>{placeError}</Text>}

              {/* Time of Birth */}
              <Text style={styles.label}>Time of Birth</Text>
              {!isBirthTimeUnknown ? (
                <>
                  <TouchableOpacity
                    onPressIn={() => { Keyboard.dismiss(); setOpenPanel('time'); setShowTimePicker(true); }}
                  >
                    <Text style={styles.input}>
                      {(() => {
                        if (!timeOfBirth) return 'Select time';
                        const [h, m] = timeOfBirth.split(':').map(Number);
                        if (Number.isNaN(h) || Number.isNaN(m)) return timeOfBirth;
                        const d = new Date();
                        d.setHours(h, m, 0, 0);
                        return format(d, 'hh:mm a');
                      })()}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    date={(() => {
                      const [h, m] = (timeOfBirth ?? '00:00').split(':').map(Number);
                      const d = new Date();
                      if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m, 0, 0);
                      return d;
                    })()}
                    onConfirm={(date: Date) => {
                      setTimeOfBirth(format(date, 'HH:mm'));
                      setShowTimePicker(false);
                      setOpenPanel('none');
                    }}
                    onCancel={() => { setShowTimePicker(false); setOpenPanel('none'); }}
                  />
                  {timeError && <Text style={styles.errorText}>{timeError}</Text>}
                </>
              ) : (
                <Text style={styles.input}>Unknown</Text>
              )}

              <View style={styles.toggleRow}>
                <Switch
                  value={isBirthTimeUnknown}
                  onValueChange={(val) => {
                    setisBirthTimeUnknown(val);
                    if (val) { setTimeOfBirth('00:00'); setShowTimePicker(false); setOpenPanel('none'); }
                    else { setOpenPanel('time'); setShowTimePicker(true); }
                  }}
                />
                <Text style={styles.toggleLabel}>I don’t know</Text>
              </View>

              <View style={styles.saveBttnContainer}>
                <GlassButton title="Save Changes" onPress={handleSave} />
              </View>
              {saving && (
                <View style={{ alignItems:'center', paddingVertical:8 }}>
                  <ActivityIndicator />
                </View>
              )}
            </View>
          </KeyboardAvoidingView>

          {/* anchored suggestions (always on top; flips above when needed) */}
          <SuggestionSheet />

          {showSuccessAlert && (
            <View style={styles.successAlertDefault}>
              <Text style={styles.successCheckDefault}>✓</Text>
              <Text style={styles.successAlertTextDefault}>Profile updated successfully!</Text>
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
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={pwd}
                  onChangeText={setPwd}
                />
                <TouchableOpacity
                  style={styles.pwdBtn}
                  onPress={() => { setAskPassword(false); handleSave(); }}
                >
                  <Text style={styles.pwdBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%' },
  container: {
    padding: 20,
    paddingTop: 8,
    width: '100%',
    justifyContent: 'flex-start',
    flex: 1,
  },
  saveBttnContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  label: { color: '#fff', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  toggleLabel: { color: '#fff', marginLeft: 8 },
  errorText: { color: 'red', marginBottom: 12 },

  // Suggestion sheet
  suggestionSheet: {
    position: 'absolute',
    backgroundColor: '#1d1f25',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2c2f36',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2f3340',
  },
  suggestionText: { color: '#fff', fontSize: 16 },
  suggestionTextDim: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  sugLoading: { padding: 14, alignItems: 'center', justifyContent: 'center' },
  sugEmpty: { padding: 14, alignItems: 'center', justifyContent: 'center' },

  // pwd + success
  pwdOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999,
  },
  pwdBox: { width: '100%', maxWidth: 420, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 12, padding: 16 },
  pwdTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  pwdSubtitle: { color: '#fff', opacity: 0.8, marginBottom: 10 },
  pwdInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#fff' },
  pwdBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pwdBtnText: { color: '#fff', fontWeight: '700' },

  successAlertDefault: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#222', borderRadius: 16, padding: 18, zIndex: 9999, flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 8,
  },
  successCheckDefault: { fontSize: 26, color: '#6FFFE9', fontWeight: 'bold', marginRight: 10 },
  successAlertTextDefault: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
