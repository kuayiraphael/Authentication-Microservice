const CustomerService = require("../services/customer-service");
const auth = require("./middlewares/auth");
const { SubscribeMessage } = require("../utils");

customerRoutes = (app, channel, redisClient) => {
  const service = new CustomerService(redisClient);

  // To listen
  SubscribeMessage(channel, service);

  // Signup Route
  app.post("/signup", async (req, res, next) => {
    try {
      const { email, password, phone, role } = req.body;
      const response = await service.SignUp({ email, password, phone, role });

      if (response.statusCode && response.statusCode !== 200) {
        return res
          .status(response.statusCode)
          .json({ message: response.message });
      }

      return res.json(response.data);
    } catch (error) {
      console.error("Error during signup:", error);
      return res.status(500).json({
        message: "An error occurred during signup. Please try again.",
      });
    }
  });
  // Update Profile Route
  app.put("/profile", auth, async (req, res) => {
    try {
      const userId = req.user._id;
      const updateData = req.body;

      // Validate allowed fields
      const allowedFields = [
        "firstName",
        "lastName",
        "gender",
        "dob",
        "profilePicture",
      ];
      const isValidOperation = Object.keys(updateData).every((field) =>
        allowedFields.includes(field)
      );

      if (!isValidOperation) {
        return res.status(400).json({ message: "Invalid update fields!" });
      }

      const result = await service.UpdateProfile(userId, updateData);

      if (result.statusCode && result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
      }

      res.json(result.data);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        message: error.message || "Error updating profile",
      });
    }
  });
  // Get user's role by ID
  app.get("/role/:id", auth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await service.GetUserRole(id);

      if (result.statusCode && result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
      }

      return res.json(result.data);
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user's role
  app.put("/role/:id", auth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const result = await service.UpdateUserRole(id, role);

      if (result.statusCode && result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
      }

      return res.json(result.data);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.put("/update-password", auth, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user._id; // From auth middleware

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Both passwords are required" });
      }

      const result = await service.UpdatePassword(
        userId,
        oldPassword,
        newPassword
      );

      if (result.statusCode && result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
      }

      res.json(result.data);
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  });

  // Login Route
  app.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const { data, statusCode, message } = await service.SignIn({
        email,
        password,
      });

      if (statusCode && statusCode !== 200) {
        return res
          .status(statusCode)
          .json({ message: message || "Invalid email or password." });
      }

      return res.json(data);
    } catch (error) {
      console.error("Error during login:", error);
      return res
        .status(500)
        .json({ message: "An error occurred during login. Please try again." });
    }
  });

  // Logout Route
  app.post("/logout", auth, async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      await redisClient.del(`refresh_token:${refreshToken}`);
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during logout:", error);
      return res.status(500).json({
        message: "An error occurred during logout. Please try again.",
      });
    }
  });

  // Refresh Token Route
  app.post("/refresh-token", async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const storedRefreshToken = await redisClient.get(
        `refresh_token:${refreshToken}`
      );

      if (!storedRefreshToken) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }

      const { newAccessToken } = await service.RefreshToken(refreshToken);
      return res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Error during token refresh:", error);
      return res.status(500).json({
        message: "An error occurred during token refresh. Please try again.",
      });
    }
  });
};

module.exports = customerRoutes;
