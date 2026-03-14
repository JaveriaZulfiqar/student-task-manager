import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Paperclip, X } from "lucide-react";
import { Task } from "@/types/task";

interface TaskFormProps {
  onSubmit: (data: { title: string; description: string; dueDate: string; file?: File | null }) => void;
  loading: boolean;
  submitLabel: string;
  initial?: Task;
}

const TaskForm = ({ onSubmit, loading, submitLabel, initial }: TaskFormProps) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");

  // newFile: a File the user just picked this session (null = not changed yet)
  const [newFile, setNewFile] = useState<File | null>(null);
  // cleared: user explicitly removed the existing attachment
  const [cleared, setCleared] = useState(false);

  // What to show in the UI
  const existingFileName = initial?.fileName;
  const displayName = newFile
    ? newFile.name
    : !cleared && existingFileName
    ? existingFileName
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    setNewFile(picked);
    setCleared(!picked);
  };

  const handleClear = () => {
    setNewFile(null);
    setCleared(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass file=null when cleared (tells api.ts to send fileName: undefined → backend won't touch it... 
    // actually we want to clear it). Pass file=undefined when unchanged so api.ts skips the field.
    const file = newFile
      ? newFile           // new file picked → send new name
      : cleared
      ? null              // explicitly cleared → send fileName: undefined (removes it)
      : undefined;        // unchanged → omit from payload, backend keeps existing value
    onSubmit({ title, description, dueDate, file });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" placeholder="e.g. Complete Math Homework" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe what needs to be done..." className="min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Attachment (optional)</Label>
        <div className="flex items-center gap-3">
          <label
            htmlFor="file"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" />
            {displayName ? "Replace file" : "Choose file"}
          </label>
          <input id="file" type="file" className="hidden" onChange={handleFileChange} />

          {displayName && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[180px] truncate">{displayName}</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 rounded hover:text-destructive"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        <Save className="mr-2 h-4 w-4" />
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
};

export default TaskForm;
