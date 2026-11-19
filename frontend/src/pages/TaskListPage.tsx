import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Task } from "@/types/task";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

const TaskListPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  const load = () => api.getTasks().then(setTasks);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    await api.deleteTask(id);
    toast.success("Task deleted");
    load();
  };

  const handleComplete = async (id: string) => {
    await api.updateTask(id, { status: "completed" });
    toast.success("Task marked as completed");
    load();
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">My Tasks</h1>
          <Button onClick={() => navigate("/tasks/add")}>+ Add Task</Button>
        </div>

        {tasks.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No tasks found. Get started by adding one!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div key={task.id} className="glass-card flex flex-col rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-heading font-semibold text-lg leading-tight">{task.title}</h3>
                  <span className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${task.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {task.status === "completed" ? "Done" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {task.dueDate}
                </div>
                <div className="flex gap-2 pt-1">
                  {task.status === "pending" && (
                    <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => handleComplete(task.id)}>
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/tasks/edit/${task.id}`)}>
                    <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TaskListPage;
