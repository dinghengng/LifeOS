import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { Task, Priority } from "@shared/types";
import { fetchTasks, toggleTask, deleteTask, addTask, editTask } from "@shared/api";

export function useTasks(isAuthenticated: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) loadTasks();
    else setTasks([]);
  }, [isAuthenticated]);

  const loadTasks = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError("Unable to load tasks from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = useCallback(async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next = !task.isCompleted;
    try {
      await toggleTask(id, next);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: next } : t)));
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  }, [tasks]);

  const handleAddTask = async (title: string, dueDate: string | null, priority: Priority) => {
    try {
      const newTask = await addTask(title, dueDate, priority);
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      alert("Could not add task. Check server connection.");
    }
  };

  const handleEditTask = async (
    id: number,
    title: string,
    dueDate: string | null,
    priority: Priority
  ) => {
    try {
      const updated = await editTask(id, { title, dueDate, priority });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      alert("Could not save changes to the server.");
    }
  };

  // double confirm
const handleDelete = useCallback((id: number) => {
  Alert.alert(
    "Delete Task",
    "Are you sure you want to permanently delete this task?",
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          deleteTask(id)
            .then(() => setTasks((prev) => prev.filter((t) => t.id !== id)))
            .catch(console.error);
        } 
      },
    ]
  );
}, []);

  // Called by the delete button shows confirmation dialog first
  const confirmDeleteTask = (id: number) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to permanently delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
      ]
    );
  };

  // Groups tasks into priority sections for SectionList, filtering empty groups
  const getGroupedSections = () =>
    [
      { title: "Critical Priority", data: tasks.filter((t) => t.priority === "critical"), color: "#ef4444" },
      { title: "High Priority",     data: tasks.filter((t) => t.priority === "high"),     color: "#f97316" },
      { title: "Low Priority",      data: tasks.filter((t) => t.priority === "low"),      color: "#3b82f6" },
      { title: "No Priority",       data: tasks.filter((t) => t.priority === "none" || !t.priority), color: "#94a3b8" },
    ].filter((s) => s.data.length > 0);

  return {
    tasks,
    loading,
    error,
    handleToggle,
    handleAddTask,
    handleEditTask,
    handleDelete,
    confirmDeleteTask,
    getGroupedSections,
  };
}