const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });
const isString = (v) => typeof v === "string";

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!isString(name) || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!isString(email) || !EMAIL_RE.test(email)) return res.status(400).json({ message: "A valid email is required" });
    if (!isString(password) || password.length < MIN_PASSWORD)
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email, password: hashed });
    res.status(201).json({ user: publicUser(user), token: signToken(user._id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isString(email) || !isString(password)) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ user: publicUser(user), token: signToken(user._id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
