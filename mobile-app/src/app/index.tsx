import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import LoginForm from "../components/LoginForm";
import AddTaskModal from "../components/AddTaskModal";
import { Task, Priority, User } from "@shared/types";
// Added registerUser to our shared API imports
import { fetchTasks, toggleTask, deleteTask, addTask, editTask, loginUser, registerUser, logoutUser } from "@shared/api";

const priorityColors: Record<Priority, string> = {
  critical: "#ef4444", // Red
  high: "#f97316", // Orange
  low: "#3b82f6", // Blue
  none: "#94a3b8", // Slate Gray
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // Feature Parity: State tracker for tracking active target edit tasks
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check login status on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          // Verify saved token status against server environment
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.6:5001"}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            await SecureStore.deleteItemAsync("userToken");
          }
        }
      } catch (err) {
        console.error("Error verification reading token on boot:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Fetch tasks immediately when user session state becomes active
  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Unable to load tasks from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await loginUser(email, password, false);
      
      if (data.token) {
        await SecureStore.setItemAsync("userToken", data.token);
      }
      
      setCurrentUser(data);
    } catch (err: any) {
      console.error("Login failure:", err);
      setAuthError(err.message || "Failed to authenticate.");
    }
  };

  // New Registration Handler Function
  const handleRegister = async (email: string, password: string, name: string) => {
    setAuthError(null);
    try {
      const data = await registerUser(email, password, name);
      
      // If server returns token successfully on sign up, store it locally
      if (data.token) {
        await SecureStore.setItemAsync("userToken", data.token);
      }
      
      setCurrentUser(data);
    } catch (err: any) {
      console.error("Registration failure:", err);
      setAuthError(err.message || "Failed to create account.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      await SecureStore.deleteItemAsync("userToken");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setCurrentUser(null);
      setTasks([]);
    }
  };

  const handleToggle = async (id: number) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;
    const nextStatus = !currentTask.isCompleted;

    try {
      await toggleTask(id, nextStatus);
      setTasks(
        tasks.map((t) => (t.id === id ? { ...t, isCompleted: nextStatus } : t)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (title: string, dueDate: string | null, priority: Priority) => {
    try {
      const newTask = await addTask(title, dueDate, priority);
      setTasks((prevTasks) => [...prevTasks, newTask]);
    } catch (err) {
      console.error("Failed to add task", err);
      alert("Could not add task. Check server connection.");
    }
  };

  // Feature Parity: Task modification handler interacting with shared PATCH endpoint routines
  const handleEditTask = async (id: number, title: string, dueDate: string | null, priority: Priority) => {
    try {
      const updatedTask = await editTask(id, { title, dueDate, priority });
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error("Failed to edit task detail parameters:", err);
      alert("Could not save changes to the database server.");
    }
  };

  // Feature Parity: Native confirmation safeguard alerts preventing accidental deletions
  const confirmDeleteTask = (id: number) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to permanently delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(id);
              setTasks(tasks.filter((t) => t.id !== id));
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  // Feature Parity: Calendar timestamp calculations isolating overdue assignments
  const isOverdue = (dueDateStr: string | null, isCompleted: boolean) => {
    if (!dueDateStr || isCompleted) return false;
    const target = new Date(dueDateStr);
    const today = new Date();
    // Neutralize standard hour values to perform pure date calculations
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return target < today;
  };

  // Feature Parity: Restructuring plain indices arrays into logical sorted priority sections
  const getGroupedSections = () => {
    const critical = tasks.filter((t) => t.priority === "critical");
    const high = tasks.filter((t) => t.priority === "high");
    const low = tasks.filter((t) => t.priority === "low");
    const none = tasks.filter((t) => t.priority === "none" || !t.priority);

    return [
      { title: "Critical Priority", data: critical, color: "#ef4444" },
      { title: "High Priority", data: high, color: "#f97316" },
      { title: "Low Priority", data: low, color: "#3b82f6" },
      { title: "No Priority", data: none, color: "#94a3b8" },
    ].filter((section) => section.data.length > 0); // Hide completely empty headers
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  // Gatekeeping Check: Render LoginForm with both login and registration support
  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        error={authError} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Profile identity verification headers row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>LifeOS Tasks</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tipText}>✍️ Long-press any task item container block to modify entries.</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1e293b"
            style={styles.loader}
          />
        ) : (
          <SectionList
            sections={getGroupedSections()}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderSectionHeader={({ section: { title, color } }) => (
              <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
                <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const overdue = isOverdue(item.dueDate, item.isCompleted);
              return (
                <TouchableOpacity
                  style={styles.taskCard}
                  onPress={() => handleToggle(item.id)}
                  onLongPress={() => {
                    setSelectedTaskToEdit(item);
                    setModalVisible(true);
                  }}
                  delayLongPress={250}
                >
                  {/* Priority Dot indicator */}
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityColors[item.priority] },
                    ]}
                  />

                  <View style={styles.textWrapper}>
                    <Text
                      style={[
                        styles.taskTitle,
                        item.isCompleted && styles.completedText,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.dueDate && (
                      <Text style={[styles.dueDateText, overdue && styles.overdueText]}>
                        {overdue ? "Overdue: " : "📅 "}
                        {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteTask(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No tasks found. Add some from the web portal!
              </Text>
            }
          />
        )}
        {/*Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setSelectedTaskToEdit(null); // Ensure creation mode initializes cleanly
            setModalVisible(true);
          }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* The Bottom Sheet Modal */}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  tipText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  taskCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  dueDateText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  overdueText: {
    color: "#ef4444",
    fontWeight: "700",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 40,
    fontSize: 15,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    marginTop: -2,
  },
});