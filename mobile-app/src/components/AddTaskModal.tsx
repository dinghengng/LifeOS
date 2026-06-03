import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Priority, Task } from "@shared/types";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, dueDate: string | null, priority: Priority) => Promise<void>;
  onEdit?: (id: number, title: string, dueDate: string | null, priority: Priority) => Promise<void>;
  taskToEdit?: Task | null; // Pass a targeted task element context here to switch into edit mode
}

export default function AddTaskModal({ visible, onClose, onAdd, onEdit, taskToEdit }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Synchronize modal internal hook parameters whenever edit tracking changes toggle
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate) : null);
    } else {
      setTitle("");
      setPriority("none");
      setDueDate(null);
    }
  }, [taskToEdit, visible]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);

    const dateString = dueDate ? dueDate.toISOString() : null; // Convert Date object to ISO string for the backend, or leave as null
    
    if (taskToEdit && onEdit) {
      await onEdit(taskToEdit.id, title.trim(), dateString, priority);
    } else {
      await onAdd(title.trim(), dateString, priority);
    }
    
    // Reset form after successful submission
    setTitle("");
    setPriority("none");
    setDueDate(null);
    setIsSubmitting(false);
    onClose();
  };

  // Added handler function for the date changes
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const priorityOptions: { label: string; value: Priority; color: string }[] = [
    { label: "Critical", value: "critical", color: "#ef4444" },
    { label: "High", value: "high", color: "#f97316" },
    { label: "Low", value: "low", color: "#3b82f6" },
    { label: "None", value: "none", color: "#94a3b8" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tapping the dark overlay closes it */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{taskToEdit ? "Edit Task Details" : "New Task"}</Text>

          <TextInput
            style={styles.input}
            placeholder="What needs to be done?"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            maxLength={150}
            autoFocus
          />

          <Text style={styles.label}>Due Date (Optional)</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.dateText, !dueDate && styles.dateTextPlaceholder]}>
              {dueDate ? dueDate.toLocaleDateString() : "Select a due date..."}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={taskToEdit ? undefined : new Date()} // prevent ppl selecting dates in the past (unless modifying historically overdue dates)
            />
          )}

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.priorityButton,
                  priority === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
                onPress={() => setPriority(opt.value)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === opt.value && styles.priorityTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!title.trim() || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleAdd}
            disabled={!title.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Processing..." : taskToEdit ? "Save Changes" : "Add Task"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#334155",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 10,
  },
  // Re-added the layout styling structures for your date buttons
  dateButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: "#334155",
  },
  dateTextPlaceholder: {
    color: "#94a3b8",
  },
  priorityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  priorityTextActive: {
    color: "#ffffff",
  },
  submitButton: {
    backgroundColor: "#4f46e5", 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#a5b4fc", 
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});