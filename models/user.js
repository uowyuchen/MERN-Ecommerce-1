const mongoose = require("mongoose");
const crypto = require("crypto");
const uuidv1 = require("uuid/v1");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 32 },
    email: { type: String, trim: true, required: true, unique: 32 },
    hashed_password: { type: String, required: true },
    about: { type: String, trim: true },
    salt: String,
    role: { type: Number, default: 0 }, // 1 is admin; 0 is normal user
    history: { type: Array, default: [] }
  },
  { timestamps: true }
);

// virtual field
userSchema
  .virtual("password") // 这个psw要和前端输入的name=password一致。setter必须这样
  // 下面👇这个password 就是上面👆这个的值
  .set(function(password) {
    // this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
  });
// .get(function() {
//   return this._password;
// });

userSchema.methods = {
  encryptPassword: function(password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  // login authenticate
  authenticate: function(plainPassword) {
    return this.encryptPassword(plainPassword) === this.hashed_password;
  }
};

module.exports = mongoose.model("User", userSchema);
