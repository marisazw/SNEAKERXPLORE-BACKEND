const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    maxlength: 100,
    required: true,
    unique: true
  },
  password: {
    type: String,
    maxlength: 100,
    required: true
  },
  email: {
    type: String,
    maxlength: 50,
    unique: true,
    match: /\@/,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);
