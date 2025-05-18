// components/ChatFlow.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LocationAutocomplete } from './LocationAutocomplete';

export interface AnswerRecord {
  firstName?: string;
  lastName?: string;
  pronouns?: string;
  birthday?: Date;
  birthtime?: Date;
  birthtimeUnknown?: boolean;
  placeOfBirth?: string;
  location?: string;
  password?: string;
  email?: string;
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
};

export function ChatFlow({ steps, onComplete }: ChatFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [textInput, setTextInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [checkedPolicy, setCheckedPolicy] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [showSendButton, setShowSendButton] = useState(true); // Moved here
  const [isFocused, setIsFocused] = useState(false); // Track if the input is focused
  const [error, setError] = useState<string | null>(null); // Track error message
  const scrollRef = useRef<ScrollView>(null);
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false); // Track modal visibility
  const [policyModalContent, setPolicyModalContent] = useState<'Privacy Policy' | 'Terms & Conditions'>('Privacy Policy'); // Track which content to display

  const openPolicyModal = (content: 'Privacy Policy' | 'Terms & Conditions') => {
    setPolicyModalContent(content);
    setIsPolicyModalVisible(true);
  };

  const closePolicyModal = () => {
    setIsPolicyModalVisible(false);
  };

  // auto-scroll when step changes
  const handleContentSizeChange = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  // sync textInput when entering location step
  const current = steps[step];
  useEffect(() => {
    if (current.inputType === 'location') {
      setTextInput(answers.placeOfBirth || ''); // Pre-fill for location
    } else if (current.inputType === 'email') {
      setTextInput(answers.email || ''); // Pre-fill for email
    } else {
      setTextInput(''); // Clear for other steps
    }
  }, [current.key]);

  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
  };

  const saveAndNext = (value?: any) => {
    switch (current.inputType) {
      case 'text':
        if (current.key === 'firstName' || current.key === 'lastName') {
          // Format the name before saving
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
        setAnswers((a) => ({ ...a, placeOfBirth: textInput }));
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

    // Handle undefined value for placeOfBirth
    if (s.key === 'placeOfBirth' && raw === undefined) {
      display = "I don't know"; // Show "I don't know" for undefined placeOfBirth
    }

    // Handle date input type
    if (s.inputType === 'date' && raw instanceof Date) {
      display = raw.toLocaleDateString();
    }

    // Handle time input type
    if (s.inputType === 'time') {
      display = answers.birthtimeUnknown
        ? "I don't know"
        : raw instanceof Date
          ? raw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : raw;
    }

    // Handle secure input type (password)
    if (s.inputType === 'secure') {
      display = raw ? '******' : ''; // Display dots or leave blank
    }

    // Ensure display is not blank
    if (!display) {
      display = "I don't know"; // Fallback for any undefined or blank values
    }

    return (
      <View style={styles.answerBubble}>
        <Text style={styles.answerText}>{display}</Text>
      </View>
    );
  };

  const renderInputArea = () => {
    switch (current.inputType) {
      case 'text': {
        return (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={current.placeholder}
              placeholderTextColor="#aaa"
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
      }

      case 'secure': {
        const isValidPassword = (password: string) => {
          const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/; // At least 8 characters, one uppercase, one number
          return passwordRegex.test(password);
        };

        const handleSend = () => {
          if (!isValidPassword(textInput)) {
            setError('Password must be at least 8 characters long, contain one uppercase letter, and one number.'); // Set error message
          } else {
            setError(null); // Clear error message
            setAnswers((a) => ({ ...a, password: textInput })); // Save password to answers
            saveAndNext(textInput); // Proceed to the next step
          }
        };
        return (
          <View style={styles.inputContainer}>
            {/* Display error message if password is invalid */}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={current.placeholder}
                placeholderTextColor="#aaa"
                secureTextEntry={true} // Hide password input
                value={textInput}
                onChangeText={setTextInput}
              />
              <TouchableOpacity
                style={[styles.sendButton, { opacity: 1 }]} // Keep button always enabled
                onPress={handleSend} // Perform validation on press
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
        const selected = answers.birthday;
        const isFuture = selected ? selected > today : false;
        return (
          <View style={styles.inputContainer}>

            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {selected
                    ? selected.toLocaleDateString()
                    : 'Select date…'}
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
          </View>
        );
      }

      case 'location':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <LocationAutocomplete
                onSelect={(item) => {
                  const { name, city, state, country } = item.properties;
                  const label = [name, city, state, country].filter(Boolean).join(', ');
                  setTextInput(label);
                  setAnswers((a) => ({ ...a, placeOfBirth: label }));
                }}
                onResultsVisibilityChange={(visible) => setShowSendButton(!visible)}
                onInputChange={(text) => setTextInput(text)} // Update textInput state
              />

              {showSendButton && (
                <TouchableOpacity
                  style={[styles.sendButton, { opacity: textInput ? 1 : 0.5 }]}
                  disabled={!textInput}
                  onPress={() => saveAndNext(textInput)}
                >
                  <Text style={styles.sendText}>➔</Text>
                </TouchableOpacity>
              )}
            </View>


            <TouchableOpacity
              style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]}
              onPress={() => {
                setAnswers((a) => ({ ...a, placeOfBirth: undefined })); // Set value as undefined for location
                saveAndNext('I don’t know'); // Display "I don't know" in the chat
              }}
            >
              <Text style={[styles.choiceText, { color: '#fff' }]}>I don’t know</Text>
            </TouchableOpacity>
          </View>
        );
      case 'time': {
        const now = new Date();
        const birthDate = answers.birthday;
        const birthTime = answers.birthtime;
        const isBirthdayToday = birthDate?.toDateString() === now.toDateString();
        const isFutureTime = birthTime != null && isBirthdayToday &&
          (birthTime.getHours() > now.getHours() ||
            (birthTime.getHours() === now.getHours() && birthTime.getMinutes() > now.getMinutes()));

        // default 00:00
        const defaultTime = new Date(birthDate || now);
        defaultTime.setHours(0, 0, 0, 0);

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
                <Text style={styles.datePickerText}>
                  {birthTime
                    ? birthTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Select time…'}
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
              onPress={() => saveAndNext('I don’t know')}
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
              date={birthTime || now}
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


        const isValidEmail = (email: string) => {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailRegex.test(email);
        };

        const handleSend = () => {
          if (!isValidEmail(textInput)) {
            setError('Please enter a valid email address.'); // Set error message
          } else {
            setError(null); // Clear error message
            setAnswers((a) => ({ ...a, email: textInput })); // Save email to answers
            saveAndNext(textInput); // Proceed to the next step
          }
        };

        return (
          <View style={styles.inputContainer}>
            {/* Display error message if email is invalid */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={current.placeholder}
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={textInput}
                onChangeText={setTextInput}
              />
              <TouchableOpacity
                style={[styles.sendButton, { opacity: 1 }]} // Keep button always enabled
                onPress={handleSend} // Perform validation on press
              >
                <Text style={styles.sendText}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      case 'final':
        return (
          <View style={styles.finalArea}>
            <Text style={styles.footerText}>
              By signing up, you agree to our{' '}
              <Text
                style={styles.link}
                onPress={() => openPolicyModal('Terms & Conditions')}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.link}
                onPress={() => openPolicyModal('Privacy Policy')}
              >
                Privacy Policy
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                if (checkedPolicy && checkedTerms) {
                  onComplete(answers);
                } else {
                  setError('Please accept the terms and privacy policy.');
                }
              }}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        onContentSizeChange={handleContentSizeChange} // Auto-scroll when content changes
      >
        {steps.slice(0, step + 1).map((s, i) => (
          <View key={i} style={styles.bubbleContainer}>
            {/* Render the question bubble */}
            <Text style={styles.bubbleText}>{s.renderQuestion(answers)}</Text>

            {/* Render the user input bubble */}
            {renderAnswerBubble(s, i)}
          </View>
        ))}
      </ScrollView>

      {renderInputArea()}
      {/* Policy Modal */}

    </>
  );
}

const styles = StyleSheet.create({
  container: { // chat container
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  bubbleContainer: {
    marginBottom: 16,
  },
  bubbleText: { // Delaluna bubble
    alignSelf: 'flex-start',
    backgroundColor: '#3A506B',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    maxWidth: '75%',
  },
  answerBubble: { // user input bubble
    alignSelf: 'flex-end',
    backgroundColor: '#5BC0BE',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    maxWidth: '75%',
  },
  answerText: { color: '#000' },
  // input container
  inputContainer: {
    flexDirection: 'column',
    padding: 15,
    backgroundColor: '#1C2541',
  },
  // user input container
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1C2541',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: 24,
    paddingHorizontal: 16,
    color: '#fff',
    height: 50,
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
  },
  continueText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
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
    // height: Platform.OS === 'ios' ? 260 : 100,
  },
  picker: {
    flex: 1,
  },
  // error container
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
});
