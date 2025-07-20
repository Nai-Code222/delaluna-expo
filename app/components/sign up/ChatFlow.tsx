import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LocationAutocomplete from './LocationAutocomplete';
import { checkEmailExists } from '@/app/service/Auth.service';
import { auth } from '../../../firebaseConfig'
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import PolicyModal from './PolicyModals';
import { termsAndConditions, privacyPolicy } from '../../assets/legal/legalTexts';



export interface AnswerRecord {
  firstName: string;
  lastName: string;
  pronouns: string;
  birthday: Date;
  birthtime: Date;
  birthtimeUnknown: boolean;
  placeOfBirth: string;
  placeOfBirthUnknown: boolean;
  email: string;
  password: string;
}

export type StepConfig = {
  key: keyof AnswerRecord | 'final';
  renderQuestion: (answers: AnswerRecord) => string;
  inputType: 'text' | 'location' | 'secure' | 'choices' | 'date' | 'time' | 'email' | 'final';
  placeholder?: string;
  choices?: string[];
  hasUnknownSwitch?: boolean;
};

type ChatFlowProps = {
  steps: StepConfig[];
  onComplete: (answers: AnswerRecord) => void;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export default function ChatFlow({ steps, onComplete, step, setStep }: ChatFlowProps) {
  const defaultMidnight = new Date();
  defaultMidnight.setHours(0, 0, 0, 0);
  const defaultPlaceOfBirth = 'Greenwich, London, England, United Kingdom';
  const [answers, setAnswers] = useState<AnswerRecord>({
    firstName: '',
    lastName: '',
    pronouns: '',
    birthday: new Date(),
    birthtime: defaultMidnight,
    birthtimeUnknown: false,
    placeOfBirth: '',
    placeOfBirthUnknown: false,
    email: '',
    password: '',
  });
  const emailInputRef = useRef<TextInput>(null);
  const [textInput, setTextInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [checkedPolicy, setCheckedPolicy] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [showSendButton, setShowSendButton] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false);
  const [policyModalContent, setPolicyModalContent] = useState<'Privacy Policy' | 'Terms & Conditions'>('Privacy Policy');
  const [emailValidating, setEmailValidating] = useState(false);
  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  const current = steps[step];
  

  useEffect(() => {
    if (current.inputType === 'location') {
      setTextInput(answers.placeOfBirth || '');
    } else if (current.inputType === 'email') {
      setTextInput(answers.email || '');
    } else {
      setTextInput('');
    }
  }, [current.key]);

  useEffect(() => {
    if (current.inputType !== 'email') {
      setError(null);
      setEmailValidating(false);
      return;
    }

    if (!textInput) {
      setError(null);
      setEmailValidating(false);
      return;
    }
    if (!isValidEmail(textInput)) {
      setError('Invalid email address');
      setEmailValidating(false);
      return;
    }

    let active = true;
    setEmailValidating(true);

    const timer = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(textInput);
        if (!active) return;
        setError(exists ? 'Email already in use' : null);
      } catch {
        if (active) setError('Error checking email');
      } finally {
        if (active) setEmailValidating(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [textInput, current.inputType]);

  const openPolicyModal = (content: 'Privacy Policy' | 'Terms & Conditions') => {
    setPolicyModalContent(content);
    setIsPolicyModalVisible(true);
  };

  const closePolicyModal = () => {
    setIsPolicyModalVisible(false);
  };

  const handleContentSizeChange = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime = (date: unknown) => {
    return date instanceof Date
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Select birth time';
  };

  useEffect(() => {
    if (
      steps[step]?.inputType === 'email' &&
      error &&
      emailInputRef.current
    ) {
      emailInputRef.current.focus();
    }
  }, [error, step]);

  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const saveAndNext = (value?: any) => {
    switch (current.inputType) {
      case 'text':
        if (current.key === 'firstName' || current.key === 'lastName') {
          setAnswers((a) => ({ ...a, [current.key]: capitalizeName(textInput) }));
        } else {
          setAnswers((a) => ({ ...a, [current.key]: textInput }));
        }
        setTextInput('');
        break;
      case 'secure':
        setAnswers((a) => ({ ...a, [current.key]: textInput }));
        setTextInput('');
        break;
      case 'choices':
        setAnswers((a) => ({ ...a, [current.key]: value }));
        break;
      case 'date':
        setAnswers((a) => ({ ...a, birthday: value }));
        setShowDatePicker(false);
        break;
      case 'time':
        setAnswers((a) => ({ ...a, birthtime: value }));
        setShowTimePicker(false);
        break;
      case 'location':
        setAnswers(a => ({
          ...a,
          placeOfBirth: value === defaultPlaceOfBirth ? defaultPlaceOfBirth : value,
          placeOfBirthUnknown: value === defaultPlaceOfBirth,
        }));
        setTextInput('');
        break;
    }
    if (step === steps.length - 1) {
      onComplete(answers);
    } else {
      setStep((s) => s + 1);
    }
  };

  const renderAnswerBubble = (s: StepConfig, idx: number) => {
    if (idx >= step || s.inputType === 'final') return null;
    const raw = (answers as any)[s.key];
    let display = raw;

    if (s.key === 'placeOfBirth' && raw === null) {
      display = "I don't know";
    }
    if (s.inputType === 'date' && raw instanceof Date) {
      display = raw.toLocaleDateString();
    }
    if (s.inputType === 'time') {
      display = answers.birthtimeUnknown
        ? "I don't know"
        : raw instanceof Date
          ? raw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : raw;
    }

    if (s.inputType === 'secure') {
      display = raw ? '******' : '';
    }
    if (!display) {
      display = "I don't know";
    }

    return (
      <View style={styles.answerBubble}>
        <Text style={styles.answerText}>{display}</Text>
      </View>
    );
  };

  const renderInputArea = () => {
    return (
      <View>
        {(() => {
          switch (current.inputType) {
            case 'text':
              return (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={current.placeholder}
                    placeholderTextColor="#fff"
                    value={textInput}
                    onChangeText={setTextInput}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: textInput ? 1 : 0.5 }]}
                    disabled={!textInput}
                    onPress={() => saveAndNext(textInput)}
                  >
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>
              );
            case 'secure': {
              const handleSend = () => {
                if (!textInput) {
                  setError('Please enter a valid password.');
                } else if (textInput.length < 8 && /[A-Z]/.test(textInput)) {
                  setError('Password must be at least 8 characters.');
                } else if (textInput.length >= 8 && !/[A-Z]/.test(textInput)) {
                  setError('Password must contain at least one capital letter.');
                } else if (textInput.length < 8) {
                  setError('Password must be at least 8 characters.');
                } else {
                  setError(null);
                  setAnswers((a) => ({ ...a, password: textInput }));
                  saveAndNext(textInput);
                }
              };
              return (
                <View style={styles.inputContainer}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={current.placeholder}
                      placeholderTextColor="#fff"
                      secureTextEntry={true}
                      value={textInput}
                      onChangeText={setTextInput}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, { opacity: 1 }]}
                      onPress={handleSend}
                    >
                      <Text style={styles.sendText}>➔</Text>
                    </TouchableOpacity>
                  </View>
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                </View>
              );
            }
            case 'choices':
              return (
                <View style={styles.choiceRow}>
                  {current.choices!.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.choiceButton,
                        (answers as any)[current.key] === opt && styles.choiceSelected,
                      ]}
                      onPress={() => saveAndNext(opt)}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          (answers as any)[current.key] === opt && { color: '#fff' },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            case 'date': {
              const today = new Date();
              const selected: Date | null = answers.birthday;
              const isFuture = selected ? selected > today : false;
              const isUnder18 = selected
                ? today.getFullYear() - selected.getFullYear() < 18 ||
                  (today.getFullYear() - selected.getFullYear() === 18 &&
                    (today.getMonth() < selected.getMonth() ||
                      (today.getMonth() === selected.getMonth() &&
                        today.getDate() < selected.getDate())))
                : false;
              return (
                <View style={styles.inputContainer}>
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.datePickerText}>
                        {answers.birthday
                          ? answers.birthday.toLocaleDateString()
                          : 'Select your birthdate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sendButton, { opacity: selected && !isFuture ? 1 : 0.5 }]}
                      disabled={!selected || isFuture}
                      onPress={() => saveAndNext(selected!)}
                    >
                      <Text style={styles.sendText}>➔</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    date={answers.birthday || today}
                    onConfirm={date => {
                      setAnswers(a => ({ ...a, birthday: date }));
                      setShowDatePicker(false);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                  />
                  {isFuture && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        Please select a valid date not in the future.
                      </Text>
                    </View>
                  )}
                  {isUnder18 && !isFuture && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        You must be at least 18 years old to register.
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
            case 'location': {
              const canSendLocation =
                !answers.placeOfBirthUnknown &&
                suggestions.includes(textInput.trim());

              const handleSend = () => {
                if (!canSendLocation) {
                  setLocationError('Please pick a location from the list or tap “I don’t know.”');
                  return;
                }
                setLocationError(null);
                setAnswers(a => ({
                  ...a,
                  placeOfBirth: textInput,
                  placeOfBirthUnknown: false,
                }));
                saveAndNext(textInput.trim());
              };

              const handleUnknown = () => {
                setTextInput('');
                setSuggestions([]);
                setLocationError(null);
                setAnswers(a => ({
                  ...a,
                  placeOfBirth: defaultPlaceOfBirth,
                  placeOfBirthUnknown: true,
                }));
                saveAndNext('I don’t know');
              };
              return (
                <View style={styles.inputContainer}>
                  {!!locationError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{locationError}</Text>
                    </View>
                  )}

                  <View style={styles.inputRow}>
                    <LocationAutocomplete
                      value={textInput}
                      onInputChange={text => {
                        setTextInput(text);
                        setAnswers(a => ({ ...a, placeOfBirthUnknown: false }));
                        setLocationError(null);
                      }}
                      onResultsVisibilityChange={visible =>
                        setShowSendButton(!visible && !!textInput.trim())
                      }
                      onSelect={item => {
                        const { name, city, state, country } = item.properties;
                        const label = [name, city, state, country]
                          .filter(Boolean)
                          .join(', ');
                        setTextInput(label);
                        setSuggestions([label]);
                        setLocationError(null);
                        setAnswers(a => ({
                          ...a,
                          placeOfBirth: label,
                          placeOfBirthUnknown: false,
                        }));
                      }}
                    />

                    {/* Always render the arrow, but disable it when !canSendLocation */}
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        { opacity: canSendLocation ? 1 : 0.5 },
                      ]}
                      disabled={!canSendLocation || !textInput.trim()}
                      onPress={handleSend}
                    >
                      <Text style={styles.sendText}>➔</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]}
                    onPress={handleUnknown}
                  >
                    <Text style={[styles.choiceText, { color: '#fff' }]}>
                      I don’t know
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }

            case 'time': {
              const now = new Date();
              const birthDate = answers.birthday;
              const birthTime = answers.birthtime;
              const isBirthdayToday = birthDate?.toDateString() === now.toDateString();
              const isFutureTime = birthTime != null && isBirthdayToday &&
                (birthTime.getHours() > now.getHours() ||
                  (birthTime.getHours() === now.getHours() && birthTime.getMinutes() > now.getMinutes()));

              return (
                <View style={styles.inputContainer}>
                  {isFutureTime && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        Please select a valid time not in the future.
                      </Text>
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.datePickerText}>{formatTime(birthTime)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sendButton, { opacity: birthTime && !isFutureTime ? 1 : 0.5 }]}
                      disabled={!birthTime || isFutureTime}
                      onPress={() => saveAndNext(birthTime!)}
                    >
                      <Text style={styles.sendText}>➔</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.choiceButton,
                      { alignSelf: 'center', marginTop: 16 },
                    ]}
                    onPress={() => {

                      saveAndNext('I don’t know');

                      setAnswers(a => ({
                        ...a,
                        birthtime: defaultMidnight,
                        birthtimeUnknown: true,
                      }));

                    }}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        birthTime === undefined && { color: '#fff' },
                      ]}
                    >
                      I don’t know
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    date={birthTime || new Date()}
                    onConfirm={time => {
                      setAnswers(a => ({ ...a, birthtime: time }));
                      setShowTimePicker(false);
                    }}
                    onCancel={() => setShowTimePicker(false)}
                  />
                </View>
              );
            }
            case 'email': {
              const isValidEmail = (email: string) =>
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

              const handleSend = async () => {
                if (!isValidEmail(textInput)) {
                  setError('Please enter a valid email address.');
                  return;
                }

                setError(null);
                try {
                  const methods = await fetchSignInMethodsForEmail(auth, textInput);
                  if (methods.length > 0) {
                    setError(
                      'That email is already registered. Please sign in or use a different address.'
                    );
                    return;
                  }
                  setAnswers(a => ({ ...a, email: textInput }));
                  saveAndNext(textInput);
                } catch (firebaseErr: any) {
                  console.error(firebaseErr);
                  setError('Network error—please try again.');
                }
              };

              return (
                <View style={styles.inputContainer}>
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={current.placeholder}
                      placeholderTextColor="#fff"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={textInput}
                      onChangeText={setTextInput}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, { opacity: textInput ? 1 : 0.5 }]}
                      disabled={!textInput}
                      onPress={handleSend}
                    >
                      <Text style={styles.sendText}>➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            case 'final': {
              const isDisabled = !checkedPolicy || !checkedTerms;
              return (
                <View style={styles.finalArea}>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={{ marginRight: 8 }}
                      onPress={() => setCheckedTerms(!checkedTerms)}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: '#6FFFE9',
                          backgroundColor: checkedTerms ? '#6FFFE9' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {checkedTerms && (
                          <Text style={{ color: '#1C2541', fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>
                      I agree to the{' '}
                      <Text
                        style={styles.link}
                        onPress={() => openPolicyModal('Terms & Conditions')}
                      >
                        Terms & Conditions
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={{ marginRight: 8 }}
                      onPress={() => setCheckedPolicy(!checkedPolicy)}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: '#6FFFE9',
                          backgroundColor: checkedPolicy ? '#6FFFE9' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {checkedPolicy && (
                          <Text style={{ color: '#1C2541', fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>
                      I agree to the{' '}
                      <Text
                        style={styles.link}
                        onPress={() => openPolicyModal('Privacy Policy')}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      onComplete(answers);
                    }}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                    style={[
                      styles.continueButton,
                      isDisabled && styles.continueButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.continueText,
                        isDisabled && styles.continueTextDisabled,
                      ]}
                    >
                      Continue
                    </Text>
                  </TouchableOpacity>
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                </View>
              );
            }
            default:
              return null;
          }
        })()}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        onContentSizeChange={handleContentSizeChange}
      >
        {steps.slice(0, step + 1).map((s, i) => (
          <View key={i} style={styles.bubbleContainer}>
            <Text style={styles.bubbleText}>{s.renderQuestion(answers)}</Text>
            {renderAnswerBubble(s, i)}
          </View>
        ))}
      </ScrollView>
      {renderInputArea()}
      <PolicyModal
        visible={isPolicyModalVisible}
        onClose={closePolicyModal}
        title={policyModalContent}
        textContent={
          policyModalContent === 'Terms & Conditions'
            ? termsAndConditions
            : privacyPolicy
        }
      />

    </>
  );
}

const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center', 
    marginTop: 16,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center', 
    marginTop: 12,
    marginBottom: 4,
  },
  strong: {
    fontWeight: 'bold',
  },
  paragraph: {
    textAlign: 'left',
    marginBottom: 12,
  },
};


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  bubbleContainer: {
    marginBottom: 16,
  },
  bubbleText: {
    alignSelf: 'flex-start',
    backgroundColor: '#3A506B',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    maxWidth: '75%',
  },
  answerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#5BC0BE',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    maxWidth: '75%',
  },
  answerText: { color: '#000' },
  inputContainer: {
    flexDirection: 'column',
    padding: 15,
    backgroundColor: '#1C2541',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1C2541',
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

  sendButton: {
    marginLeft: 12,
    alignSelf: 'center',
    padding: 12,
  },
  sendText: { fontSize: 18, color: '#fff' },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#5BC0BE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  choiceSelected: { backgroundColor: '#5BC0BE' },
  choiceText: { color: '#fff' },
  datePickerButton: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: 24,
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  datePickerText: { color: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  finalArea: {
    padding: 12,
    backgroundColor: '#1C2541',
  },
  footerText: { color: '#fff', marginLeft: 8 },
  link: { textDecorationLine: 'underline', color: '#6FFFE9' },
  continueButton: {
    marginTop: 12,
    backgroundColor: '#6FFFE9',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  continueText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  continueTextDisabled: {
    color: '#666',
  },
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  pickerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  picker: {
    flex: 1,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginHorizontal: 10,
    maxWidth: '75%',
    alignSelf: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
    marginLeft: 12,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 0,
    marginLeft: 8,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});