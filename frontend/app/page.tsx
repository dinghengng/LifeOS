"use client";

import { useState, useEffect } from "react";
import NewTaskForm from "../components/NewTaskForm";
import TaskList from "../components/TaskList";
import EditTaskForm from "../components/EditTaskForm";
import { useRouter } from "next/navigation";
import TaskCalendar from "../components/TaskCalendar";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import PageHeader from "../components/layout/PageHeader";
import { useTranslation } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

// Import types and unified API functions from the shared folder
import { Task, Priority } from "../../shared/types";
import {
  fetchTasks,
  addTask as apiAddTask,
  toggleTask as apiToggleTask,
  deleteTask as apiDeleteTask,
  editTask as apiEditTask,
} from "../../shared/api";



const priorityRank: Record<Priority, number> = {
  critical: 1,
  high: 2,
  low: 3,
  none: 4,
};

const hasDueTime = (dueDate: string | null) => !!dueDate;

export default function TasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Fetch tasks only when an authenticated user is active
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchTasks();
        setTasks(data);
      } catch (err: unknown) {
        console.error(err);
        setError(t("tasks.errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [user, t]);

  // Task Handlers using API
  const handleAddTask = async (
    titleString: string,
    dueDate: string | null,
    priority: Priority = "none",
  ) => {
    try {
      setError(null);
      const newTask = await apiAddTask(titleString, dueDate, priority);
      setTasks([...tasks, newTask]);
    } catch (err: unknown) {
      console.error(err);
      setError(t("tasks.errorAdd"));
    }
  };

  const handleToggleTask = async (taskId: number) => {
    const taskToToggle = tasks.find((t) => t.id === taskId);
    if (!taskToToggle) return;
    const newStatus = !taskToToggle.isCompleted;

    try {
      setError(null);
      await apiToggleTask(taskId, newStatus);
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, isCompleted: newStatus } : task,
        ),
      );
    } catch (err: unknown) {
      console.error(err);
      setError(t("tasks.errorUpdate"));
    }
  };

  const handleDeleteTask = async (idToDelete: number) => {
    try {
      setError(null);
      await apiDeleteTask(idToDelete);
      setTasks(tasks.filter((task) => task.id !== idToDelete));
    } catch (err: unknown) {
      console.error(err);
      setError(t("tasks.errorDelete"));
    }
  };

  const saveTaskEdits = async (
    id: number,
    updates: { title: string; dueDate: string | null; priority: Priority },
  ) => {
    try {
      setError(null);
      const updatedTask = await apiEditTask(id, updates);
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? updatedTask : t)),
      );
      setEditingTask(null);
    } catch (err: unknown) {
      console.error(err);
      setError(t("tasks.errorUpdate"));
    }
  };

  const handleLogout = async () => {
    await logout();
    setTasks([]);
    router.push("/login");
  };

  // Sorting and structural presentation filtering logic
  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter === "all") return true;
    return task.priority === priorityFilter;
  });

  const visibleTasks = [...filteredTasks].sort((a, b) => {
    const aHasTime = hasDueTime(a.dueDate);
    const bHasTime = hasDueTime(b.dueDate);
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;

    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.id - b.id;
  });


  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white text-lg font-medium drop-shadow">{t("tasks.loading")}</p>
      </main>
    );
  }

// Display Core App Dashboard Interface
 return (
    <AppShell>
      <AppHeader
        rightActions={
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t("common.logout")}
          </button>
        }
      />

      <PageHeader
        eyebrow={t("tasks.welcomeBack", { name: user.name || user.email })}
        title={t("tasks.title")}
        description={t("tasks.description")}
      />

      {error && (
        <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-500 text-center mt-4">{t("tasks.loadingTasks")}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section id="tour-tasks" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div id="tour-priority-filter" className="flex gap-2 mb-6 flex-wrap">
              {(["all", "critical", "high", "low", "none"] as const).map((level) => {
                const count =
                  level === "all"
                    ? tasks.length
                    : tasks.filter((t) => t.priority === level).length;
                const isActive = priorityFilter === level;

                return (
                  <button
                    key={level}
                    onClick={() => setPriorityFilter(level)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 capitalize ${
                      isActive
                        ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-300 ring-offset-1"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="uppercase tracking-wider">
                      {t(`tasks.filter.${level}` as const)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <TaskList
              tasks={visibleTasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={setEditingTask}
            />
          </section>

          <div className="flex flex-col gap-6">
            <section id="tour-add-task" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">
                {editingTask ? t("tasks.editTask") : t("tasks.addTask")}
              </h2>
              {editingTask ? (
                <EditTaskForm
                  task={editingTask}
                  onSave={(updates) => saveTaskEdits(editingTask.id, updates)}
                  onCancel={() => setEditingTask(null)}
                />
              ) : (
                <NewTaskForm onAddTask={handleAddTask} />
              )}
            </section>

            <TaskCalendar tasks={tasks} />
          </div>
        </div>
      )}
    </AppShell>
  );
}