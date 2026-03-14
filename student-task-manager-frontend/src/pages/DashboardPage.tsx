import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Task } from "@/types/task";
import AppLayout from "@/components/AppLayout";
import { CheckCircle2, Clock, ListTodo } from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.getTasks().then(setTasks);
  }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;

  const stats = [
    { label: "Total Tasks", value: total, icon: ListTodo, color: "bg-primary/10 text-primary" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "bg-success/10 text-success" },
    { label: "Pending", value: pending, icon: Clock, color: "bg-warning/10 text-warning" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, <span className="text-primary">{user?.name || "Student"}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Here's an overview of your tasks</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-card flex items-center gap-4 rounded-xl p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="font-heading text-2xl font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${task.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {task.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
