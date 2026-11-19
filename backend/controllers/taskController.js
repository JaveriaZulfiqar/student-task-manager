const mongoose = require("mongoose");
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

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
const validId = (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) return true;
  res.status(400).json({ message: "Invalid task id" });
  return false;
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks.map(format));
  } catch (err) {
    fail(res, err);
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, fileName } = req.body || {};
    if (![title, description, dueDate].every((v) => typeof v === "string" && v.trim()))
      return res.status(400).json({ message: "title, description and dueDate are required" });

    const task = await Task.create({ title, description, dueDate, fileName, userId: req.userId });
    res.status(201).json(format(task));
  } catch (err) {
    fail(res, err);
  }
};

exports.updateTask = async (req, res) => {
  try {
    if (!validId(req, res)) return;
    const { title, description, dueDate, status, fileName } = req.body || {};
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (dueDate !== undefined) fields.dueDate = dueDate;
    if (status !== undefined) {
      if (!["pending", "completed"].includes(status))
        return res.status(400).json({ message: "status must be pending or completed" });
      fields.status = status;
    }
    // empty string means the user cleared the attachment
    if (fileName !== undefined) fields.fileName = fileName || null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: fields },
      { returnDocument: "after" }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(format(task));
  } catch (err) {
    fail(res, err);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    if (!validId(req, res)) return;
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    fail(res, err);
  }
};
