import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  StatusBar
} from "react-native";


import { Task, Priority } from "@shared/types";
import { fetchTasks, toggleTask, deleteTask } from "@shared/api";

const priorityColors: Record<Priority, string> = {
  critical: "#ef4444", // Red
  high: "#f97316",     // Orange
  low: "#3b82f6",      // Blue
  none: "#94a3b8",     // Slate Gray
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

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

  const handleToggle = async (id: number) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;
    const nextStatus = !currentTask.isCompleted;

    try {
      await toggleTask(id, nextStatus);
      setTasks(tasks.map((t) => (t.id === id ? { ...t, isCompleted: nextStatus } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>LifeOS Tasks</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#1e293b" style={styles.loader} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                {/* Priority Dot indicator */}
                <View style={[styles.priorityDot, { backgroundColor: priorityColors[item.priority] }]} />
                
                <TouchableOpacity style={styles.textWrapper} onPress={() => handleToggle(item.id)}>
                  <Text style={[styles.taskTitle, item.isCompleted && styles.completedText]}>
                    {item.title}
                  </Text>
                  {item.dueDate && <Text style={styles.dueDateText}>📅 {new Date(item.dueDate).toLocaleDateString()}</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tasks found. Add some from the web portal!</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
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
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
});