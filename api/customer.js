const CustomerService = require("../services/customer-service");
const auth = require("./middlewares/auth");
const { SubscribeMessage } = require("../utils");

// customerRoutes = (app, channel,) => {

//     const service = new CustomerService();

//     // To listen
//     SubscribeMessage(channel, service);

//     app.post('/signup', async (req,res,next) => {
//         const { email, password, phone } = req.body;
//         const { data } = await service.SignUp({ email, password, phone});
//         res.json(data);

//     });

//     app.post('/login',  async (req,res,next) => {

//         const { email, password } = req.body;

//         const { data } = await service.SignIn({ email, password});

//         res.json(data);

//     });

//     app.post('/address', auth, async (req,res,next) => {

//         const { _id } = req.user;

//         const { street, postalCode, city,country } = req.body;

//         const { data } = await service.AddNewAddress( _id ,{ street, postalCode, city,country});

//         res.json(data);

//     });

//     app.get('/profile', auth ,async (req,res,next) => {

//         const { _id } = req.user;
//         const { data } = await service.GetProfile({ _id });
//         res.json(data);
//     });

//     app.get('/shoping-details', auth, async (req,res,next) => {
//         const { _id } = req.user;
//        const { data } = await service.GetShoppingDetails(_id);

//        return res.json(data);
//     });

//     app.get('/cart', auth, async (req,res,next) => {
//         const { _id } = req.user;
//        const { data } = await service.GetCart(_id)

//        return res.json(data);
//     });

//     app.get('/wishlist', auth, async (req,res,next) => {
//         const { _id } = req.user;
//         const { data } = await service.GetWishList( _id);
//         return res.status(200).json(data);
//     });

//     app.get('/whoami', (req,res,next) => {
//         return res.status(200).json({msg: '/customer : I am Customer Service'})
//     })
// }

customerRoutes = (app, channel, redisClient) => {
  const service = new CustomerService(redisClient);

  // To listen
  SubscribeMessage(channel, service);

  // Signup Route
  app.post("/signup", async (req, res, next) => {
    const { email, password, phone } = req.body;
    const { data } = await service.SignUp({ email, password, phone });
    res.json(data);
  });

  // Login Route
  app.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    const { data } = await service.SignIn({ email, password });
    res.json(data);
  });

  // Logout Route
  app.post("/logout", auth, async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Delete refresh token from Redis
    await redisClient.del(`refresh_token:${refreshToken}`);
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Refresh Token Route
  app.post("/refresh-token", async (req, res, next) => {
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

    // Issue new access token
    const { newAccessToken } = await service.RefreshToken(refreshToken);
    res.json({ accessToken: newAccessToken });
  });

  // Restricted Route Example (Role-based access control)
  app.get("/admin", auth, async (req, res, next) => {
    req.allowedRoles = ["admin"]; // Only admin can access this route
    next();
  });
};

module.exports = customerRoutes;
