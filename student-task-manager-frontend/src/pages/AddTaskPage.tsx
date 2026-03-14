import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import AppLayout from "@/components/AppLayout";
import TaskForm from "@/components/TaskForm";
import { toast } from "sonner";

const AddTaskPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { title: string; description: string; dueDate: string; file?: File | null }) => {
    setLoading(true);
    try {
      await api.createTask(data);
      toast.success("Task created!");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <h1 className="font-heading text-3xl font-bold mb-6">Add New Task</h1>
        <TaskForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Task" />
      </div>
    </AppLayout>
  );
};

export default AddTaskPage;
