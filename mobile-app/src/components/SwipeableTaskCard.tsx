import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Trash2 } from "lucide-react-native";
import { Task, Priority } from "@shared/types";
import { lightTheme } from "../theme/palettes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_WIDTH = 80; 

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  low:      "#3b82f6",
  none:     "#94a3b8",
};

function isTaskOverdue(dueDate: string | null | undefined, isCompleted: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

interface Props {
  item: Task;
  theme: typeof lightTheme;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onLongPress: (item: Task) => void;
}

export default function SwipeableTaskCard({ item, theme, onToggle, onDelete, onLongPress }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);
  const overdue = isTaskOverdue(item.dueDate, item.isCompleted);

  // Sync animation if item list refreshes externally
  useEffect(() => {
    if (!isOpen) {
      translateX.setValue(0);
    }
  }, [item]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        let newX = isOpen ? -BUTTON_WIDTH + g.dx : g.dx;
        // adjusted because swiping right alone is very hard to delete
        if (newX > 0) newX = 0;
        if (newX < -BUTTON_WIDTH) {
          newX = -BUTTON_WIDTH + (newX + BUTTON_WIDTH) * 0.2;
        }

        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, g) => {
        // High sensitivity release hook
        if (g.dx < -25) {
          Animated.spring(translateX, { toValue: -BUTTON_WIDTH, useNativeDriver: true, tension: 180, friction: 14 }).start();
          setIsOpen(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 180, friction: 14 }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const closeCard = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 180, friction: 14 }).start();
    setIsOpen(false);
  };

  const handleDeletePress = () => {
    onDelete(item.id);
    closeCard();
  };

  return (
    <View style={styles.container}>
      
      {/* Base delete layer for user to tap after slide */}
      <View style={[styles.backRow, { backgroundColor: theme.danger }]}>
        <TouchableOpacity 
          style={styles.deleteActionButton} 
          onPress={handleDeletePress}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#ffffff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Card Layer */}
      <Animated.View
        style={[styles.movingLayer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
          onPress={() => {
            if (isOpen) {
              closeCard();
            } else {
              onToggle(item.id);
            }
          }}
          onLongPress={() => !isOpen && onLongPress(item)}
          delayLongPress={250}
          activeOpacity={0.95}
        >
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />

          <View style={styles.textWrapper}>
            <Text
              style={[
                styles.title,
                { color: theme.text },
                item.isCompleted && { textDecorationLine: "line-through", color: theme.textMuted },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.dueDate && (
              <Text
                style={[
                  styles.dueDate,
                  { color: overdue ? theme.danger : theme.textSecondary },
                  overdue && { fontWeight: "700" },
                ]}
              >
                {overdue ? "⚠ Overdue: " : "📅 "}
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          {item.isCompleted && (
            <Text style={[styles.checkMark, { color: theme.success }]}>✓</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
    position: "relative",
  },
  backRow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1, // Locks interaction fields cleanly behind the top card layer
  },
  deleteActionButton: {
    width: BUTTON_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  deleteActionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  movingLayer: {
    zIndex: 2, // Keep the actual active task panel floating safely on top
  },
  card: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  priorityDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 12 
  },
  textWrapper: { 
    flex: 1 
  },
  title: { 
    fontSize: 16, 
    fontWeight: "500" 
  },
  dueDate: { 
    fontSize: 12, 
    marginTop: 4, 
    fontWeight: "500" 
  },
  checkMark: {
    fontSize: 18, 
    marginLeft: 8, 
    fontWeight: "bold"
  }
});
