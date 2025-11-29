import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Text, TextInput } from 'react-native-paper';

export default function AuthScreen() {
  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View>
        <Text>Create account</Text>
        <TextInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="example@gmail.com"
        />
      </View>
    </KeyboardAvoidingView>
  );
}