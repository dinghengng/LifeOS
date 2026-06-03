import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  // Added onRegister interface action bridge
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  error: string | null;
}

export default function LoginForm({ onLogin, onRegister, error }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Added name registration parameter hook
  const [isRegistering, setIsRegistering] = useState(false); // Mode selection state switcher toggle
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isRegistering) {
      if (!email || !password || !name) return;
      setIsSubmitting(true);
      await onRegister(email, password, name);
    } else {
      if (!email || !password) return;
      setIsSubmitting(true);
      await onLogin(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? "Create Account" : "Welcome back"}</Text>
      <Text style={styles.subtitle}>
        {isRegistering ? "Join the LifeOS platform today" : "Sign in to your LifeOS account"}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.form}>
        {/* Render Name input optionally if registration mode state is flag-triggered */}
        {isRegistering && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!email || !password || (isRegistering && !name) || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!email || !password || (isRegistering && !name) || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isRegistering ? "Sign Up" : "Sign In"}</Text>
          )}
        </TouchableOpacity>

        {/* View Layout Mode Switcher Link Elements */}
        <TouchableOpacity 
          style={styles.toggleLink} 
          onPress={() => {
            setIsRegistering(!isRegistering);
            setName("");
          }}
        >
          <Text style={styles.toggleLinkText}>
            {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  errorText: {
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
    fontSize: 14,
  },
  form: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#334155",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Added the layout styling structures for the link toggle elements
  toggleLink: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleLinkText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "500",
  },
});