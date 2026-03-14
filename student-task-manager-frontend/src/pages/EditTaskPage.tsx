import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { Task } from "@/types/task";
import AppLayout from "@/components/AppLayout";
import TaskForm from "@/components/TaskForm";
import { toast } from "sonner";

const EditTaskPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTasks().then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) setTask(found);
      else navigate("/tasks");
    });
  }, [id, navigate]);

  const handleSubmit = async (data: { title: string; description: string; dueDate: string; file?: File | null }) => {
    if (!id) return;
    setLoading(true);
    try {
      await api.updateTask(id, data);
      toast.success("Task updated!");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  if (!task) return <AppLayout><p>Loading...</p></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <h1 className="font-heading text-3xl font-bold mb-6">Edit Task</h1>
        <TaskForm onSubmit={handleSubmit} loading={loading} submitLabel="Update Task" initial={task} />
      </div>
    </AppLayout>
  );
};

export default EditTaskPage;
