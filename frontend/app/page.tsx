"use client";

import { useState, useEffect } from "react";
import NewTaskForm from "../components/NewTaskForm";
import TaskList from "../components/TaskList";
import EditTaskForm from "../components/EditTaskForm";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import HelpCentre from "../components/GuidedTour";

// Import types and unified API functions from the shared folder
import { Task, Priority, User } from "../../shared/types";
import {
  fetchTasks,
  addTask as apiAddTask,
  toggleTask as apiToggleTask,
  deleteTask as apiDeleteTask,
  editTask as apiEditTask,
  checkAuthStatus,
  loginUser,
  registerUser,
  logoutUser,
} from "../../shared/api";

const BACKGROUNDS = ["/bg-1.jpg", "/bg-2.jpg", "/bg-3.webp", "/bg-4.avif"];

const priorityRank: Record<Priority, number> = {
  critical: 1,
  high: 2,
  low: 3,
  none: 4,
};

const hasDueTime = (dueDate: string | null) => !!dueDate;

export default function Page() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Authentication & session management states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const [currentBg, setCurrentBg] = useState<string>("");
  useEffect(() => {
    setCurrentBg(BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);
  }, []);

  // Check if user has an active session cookie on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await checkAuthStatus();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch tasks only when an authenticated user is active
  useEffect(() => {
    if (!currentUser) {
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
        setError("Unable to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [currentUser]);

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
      setError("Could not add task. Please try again.");
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
      setError("Could not update task. Please try again.");
    }
  };

  const handleDeleteTask = async (idToDelete: number) => {
    try {
      setError(null);
      await apiDeleteTask(idToDelete);
      setTasks(tasks.filter((task) => task.id !== idToDelete));
    } catch (err: unknown) {
      console.error(err);
      setError("Could not delete task. Please try again.");
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
      setError("Could not update task. Please try again.");
    }
  };

  // Authentication Flow via Shared API Layer
  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => {
    setAuthError(null);
    try {
      const user = await loginUser(email, password, rememberMe);
      setCurrentUser(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Could not connect to server.");
      }
    }
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
  ) => {
    setAuthError(null);
    try {
      const user = await registerUser(email, password, name);
      setCurrentUser(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Could not connect to server.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setCurrentUser(null);
    setTasks([]);
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

  // Display verification loading block
  if (authLoading) {
    return (
      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{ backgroundImage: currentBg ? `url('${currentBg}')` : "none" }}
      >
        <p className="text-white text-lg font-medium drop-shadow">Loading...</p>
      </main>
    );
  }

  // Display registration or access authentication views
  if (!currentUser) {
    return (
      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: currentBg ? `url('${currentBg}')` : "none" }}
      >
        {authView === "login" ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => {
              setAuthView("register");
              setAuthError(null);
            }}
            error={authError}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => {
              setAuthView("login");
              setAuthError(null);
            }}
            error={authError}
          />
        )}
      </main>
    );
  }
// Display Core App Dashboard Interface
 return (
    <> 
      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center py-10 px-4 transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: currentBg ? `url('${currentBg}')` : "none" }}
      >
        {/* Dynamic Identity & Action Header Line Layout */}
        <div className="w-full max-w-3xl flex justify-between items-center mb-4 px-2">
          <span className="text-white/90 text-sm font-medium bg-slate-900/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 shadow-sm">
            Welcome back!{" "}
            <span className="font-semibold">
              {currentUser.name || currentUser.email}
            </span>
          </span>

          <div className="flex gap-2">
            <Navbar onLogout={handleLogout} />
          </div>
        </div>
        
       <div id="tour-tasks" className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-xl w-full max-w-3xl border border-white/20 max-h-[85vh] overflow-y-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-4 text-center">
            LifeOS Tasks
          </h1>
          {error && (
            <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
          )}

          {loading ? (
            <p className="text-slate-500 text-center mt-4">Loading tasks...</p>
          ) : (
            <>
              <div id="tour-add-task"><NewTaskForm onAddTask={handleAddTask} /></div>

              {/* Filter controls */}
              <div id="tour-priority-filter" className="flex gap-2 mb-6 flex-wrap justify-center">
                {(["all", "critical", "high", "low", "none"] as const).map(
                  (level) => {
                    const count =
                      level === "all"
                        ? tasks.length
                        : tasks.filter((t) => t.priority === level).length;
                    const isActive = priorityFilter === level;

                    return (
                      <button
                        key={level}
                        onClick={() => setPriorityFilter(level)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 ${
                          isActive
                            ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-300 ring-offset-1"
                            : "bg-white/80 backdrop-blur-sm text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="uppercase tracking-wider">
                          {level === "all" ? "All" : level}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {editingTask && (
                <EditTaskForm
                  task={editingTask}
                  onSave={(updates) => saveTaskEdits(editingTask.id, updates)}
                  onCancel={() => setEditingTask(null)}
                />
              )}

              <TaskList
                tasks={visibleTasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onEditTask={setEditingTask}
              />
            </>
          )}
        </div>
      </main>
      <HelpCentre />
    </> 
  );
}