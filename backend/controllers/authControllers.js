// backend/controllers/authControllers.js

const User = require("../models/User");
const bcrypt = require("bcrypt");
const { createAccessToken } = require("../utils/token");
const { validateEmail } = require("../utils/validation");

exports.signup = async (req, res) => {

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ msg: "Please fill all the fields" });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ msg: "Please send string values only" });
    }

    if (password.length < 4) {
      return res.status(400).json({ msg: "Password length must be at least 4 characters" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid Email" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "This email is already registered" });
    }

    const PhoneUser = await User.findOne({ phone });
    if (PhoneUser) {
      return res.status(400).json({ msg: "This phone number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ name, email, phone, password: hashedPassword });

    res.status(200).json({ msg: "Congratulations!! Account has been created for you.." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

exports.login = async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please fill all the fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: false, msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: false, msg: "Invalid email or password" });
    }

    const token = createAccessToken({ id: user._id });
    delete user.password;
    res.status(200).json({ token, user, status: true, msg: "Login successful.." });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
