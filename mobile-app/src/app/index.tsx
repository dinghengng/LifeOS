import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sun, Moon } from "lucide-react-native"; //dark mode to override phone settings if user wants

import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";

// Components for better organisation
import LoginForm from "../components/LoginForm";
import AddTaskModal from "../components/AddTaskModal";
import SwipeableTaskCard from "../components/SwipeableTaskCard";

// themes
import { Task } from "@shared/types";
import { lightTheme, darkTheme } from "../theme/palettes";

export default function App() {
  // Manual Dark Mode State Control
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Initialize 
  const {
    currentUser,
    authLoading,
    authError,
    handleLogin,
    handleRegister,
    handleLogout,
  } = useAuth();
  const {
    tasks,
    loading,
    error,
    handleToggle,
    handleAddTask,
    handleEditTask,
    handleDelete,
    getGroupedSections,
  } = useTasks(!!currentUser);


  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);

  // (Loading & Auth)
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError}
      />
    );
  }

  // Main Render
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <View style={styles.container}>
        
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              LifeOS Tasks
            </Text>
            
            {/* The manual mode toggle Button */}
            <TouchableOpacity
              onPress={() => setIsDarkMode(!isDarkMode)}
              style={[styles.themeToggle, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
            >
              {isDarkMode ? (
                <Sun size={18} color={theme.accent} />
              ) : (
                <Moon size={18} color={theme.accent} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: theme.danger }]}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.tipText, { color: theme.textMuted }]}>
          Tap task to complete · ← Swipe left to delete · Long-press to edit
        </Text>

        {error && (
          <Text style={[styles.errorText, { color: theme.danger }]}>
            {error}
          </Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
        ) : (
          <SectionList
            sections={getGroupedSections()}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderSectionHeader={({ section: { title, color } }) => (
              <View
                style={[
                  styles.sectionHeader,
                  { backgroundColor: theme.surfaceAlt, borderLeftColor: color },
                ]}
              >
                <Text style={[styles.sectionHeaderText, { color }]}>
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <SwipeableTaskCard
                item={item}
                theme={theme}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onLongPress={(t) => {
                  setSelectedTaskToEdit(t);
                  setModalVisible(true);
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No tasks found. Add some from the web portal!
              </Text>
            }
          />
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={() => {
            setSelectedTaskToEdit(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* Bottom Sheet Modal */}
        <AddTaskModal
          visible={isModalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedTaskToEdit(null);
          }}
          onAdd={handleAddTask}
          onEdit={handleEditTask}
          taskToEdit={selectedTaskToEdit}
        />
      </View>
    </SafeAreaView>
  );
}

// styles for app 
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Header Layout
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  
  themeToggle: {
    padding: 8,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  
  logoutButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  logoutButtonText: { color: "#ffffff", fontWeight: "600", fontSize: 12 },

  // Instructions text
  tipText: { fontSize: 11, fontWeight: "500", marginBottom: 10 },

  // List Layout
  loader: { flex: 1, justifyContent: "center" },
  errorText: { textAlign: "center", marginBottom: 10, fontWeight: "600" },
  listContainer: { paddingBottom: 100 },
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 15 },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: { color: "#ffffff", fontSize: 32, fontWeight: "300", marginTop: -2 },
});