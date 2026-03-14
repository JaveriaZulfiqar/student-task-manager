const Task = require("../models/Task");

const format = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  dueDate: task.dueDate,
  fileName: task.fileName,
  createdAt: task.createdAt.toISOString().split("T")[0],
});

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks.map(format));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, fileName } = req.body;
    const task = await Task.create({ title, description, dueDate, fileName, userId: req.userId });
    res.status(201).json(format(task));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, status, fileName } = req.body;
    const fields = {};
    if (title !== undefined)       fields.title       = title;
    if (description !== undefined) fields.description = description;
    if (dueDate !== undefined)     fields.dueDate     = dueDate;
    if (status !== undefined)      fields.status      = status;
    // empty string means the user cleared the attachment
    if (fileName !== undefined)    fields.fileName    = fileName || null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: fields },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(format(task));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
