const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CustomerSchema = new Schema(
  {
    email: String,
    password: String,
    phone: String,
    address: [{ type: Schema.Types.ObjectId, ref: "address", require: true }],
    // User Profile Fields (all optional)
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    profilePicture: { type: String },
    cart: [
      {
        product: {
          _id: { type: String, require: true },
          name: { type: String },
          banner: { type: String },
          price: { type: Number },
        },
        unit: { type: Number, require: true },
      },
    ],
    wishlist: [
      {
        _id: { type: String, require: true },
        name: { type: String },
        description: { type: String },
        banner: { type: String },
        avalable: { type: Boolean },
        price: { type: Number },
      },
    ],
    orders: [
      {
        _id: { type: String, required: true },
        amount: { type: String },
        date: { type: Date, default: Date.now() },
      },
    ],
    // New role field added here
    role: {
      type: String,
      enum: ["seller", "buyer", "admin"],
      default: "buyer", // default value can be set as needed
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

module.exports = mongoose.model("customer", CustomerSchema);
