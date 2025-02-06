const CustomerRepository = require("../database/repository/customer-repository");

const {
  FormatData,
  GeneratePassword,
  GenerateSignature,
  ValidatePassword,
} = require("../utils");

class CustomerService {
  constructor(redisClient) {
    //~
    this.repository = new CustomerRepository();
    this.redisClient = redisClient; //~
  }
  async UpdatePassword(customerId, oldPassword, newPassword) {
    try {
      // Get customer with password
      const customer = await this.repository.FindCustomerById({
        id: customerId,
      });

      if (!customer) {
        return FormatData(null, "User not found", 404);
      }

      // Verify old password
      const isValid = await ValidatePassword(oldPassword, customer.password);
      if (!isValid) {
        return FormatData(null, "Old password is incorrect", 401);
      }

      // Hash and save new password
      const hashedPassword = await GeneratePassword(newPassword);
      await this.repository.UpdatePassword(customerId, hashedPassword);

      return FormatData({ message: "Password updated successfully" });
    } catch (error) {
      throw new Error(error);
    }
  }
  async SignIn(userInputs) {
    const { email, password } = userInputs;

    // Find customer by email
    const existingCustomer = await this.repository.FindCustomer({ email });

    if (!existingCustomer) {
      // If no customer exists with the given email, return error
      return FormatData(null, "Invalid email or password", 401); // Unauthorized
    }

    const validPassword = await ValidatePassword(
      password,
      existingCustomer.password
    );
    if (!validPassword) {
      // If password is invalid, return error
      return FormatData(null, "Invalid email or password", 401); // Unauthorized
    }

    // If credentials are valid, generate tokens
    const accessToken = await GenerateSignature({
      email: existingCustomer.email,
      _id: existingCustomer._id,
    });

    // Generate and store refresh token in Redis
    const refreshToken = await GenerateSignature(
      { email: existingCustomer.email, _id: existingCustomer._id },
      "7d"
    );

    await this.redisClient.set(
      `refresh_token:${refreshToken}`,
      JSON.stringify({
        email: existingCustomer.email,
        _id: existingCustomer._id,
      }),
      { EX: 60 * 60 * 24 * 7 } // expires in 7 days
    );

    return FormatData({
      id: existingCustomer._id,
      accessToken,
      refreshToken,
    });
  }
  async UpdateProfile(customerId, updateData) {
    try {
      const updatedCustomer = await this.repository.UpdateProfile(
        customerId,
        updateData
      );

      if (!updatedCustomer) {
        return FormatData(null, "User not found", 404);
      }

      return FormatData(updatedCustomer);
    } catch (error) {
      throw new Error(error);
    }
  }
  async RefreshToken(refreshToken) {
    const storedData = await this.redisClient.get(
      `refresh_token:${refreshToken}`
    );

    if (!storedData) {
      throw new Error("Invalid or expired refresh token");
    }

    const userData = JSON.parse(storedData);
    const newAccessToken = await GenerateSignature({
      email: userData.email,
      _id: userData._id,
    });
    return { newAccessToken };
  }

  async SignUp(userInputs) {
    const { email, password, phone } = userInputs;
    const role = userInputs.role || "buyer";

    // Check if the customer already exists
    const existingCustomer = await this.repository.FindCustomer({ email });

    if (existingCustomer) {
      // Return a structured response instead of throwing an error
      return FormatData(null, "User already exists", 400); // This will ensure the response is returned
    }

    let userPassword = await GeneratePassword(password);

    const newCustomer = await this.repository.CreateCustomer({
      email,
      password: userPassword,
      phone,
      role: role || "buyer",
    });

    const token = await GenerateSignature({
      email: newCustomer.email,
      _id: newCustomer._id,
    });

    return FormatData({ id: newCustomer._id, token });
  }

  async AddNewAddress(_id, userInputs) {
    const { street, postalCode, city, country } = userInputs;

    const addressResult = await this.repository.CreateAddress({
      _id,
      street,
      postalCode,
      city,
      country,
    });

    return FormatData(addressResult);
  }

  async GetProfile(id) {
    const existingCustomer = await this.repository.FindCustomerById({ id });
    return FormatData(existingCustomer);
  }
  async GetCart(id) {
    const existingCustomer = await this.repository.FindCustomerById({ id });
    return FormatData(existingCustomer.cart);
  }

  async GetShoppingDetails(id) {
    const existingCustomer = await this.repository.FindCustomerById({ id });

    if (existingCustomer) {
      return FormatData(existingCustomer);
    }
    return FormatData({ msg: "Error" });
  }
  // Get User Role
  async GetUserRole(id) {
    const existingCustomer = await this.repository.FindCustomerById({ id });

    if (!existingCustomer) {
      return FormatData(null, "User not found", 404); // Not found
    }

    return FormatData({ role: existingCustomer.role }); // Return the role only
  }

  // Update User Role
  async UpdateUserRole(id, role) {
    const existingCustomer = await this.repository.FindCustomerById({ id });

    if (!existingCustomer) {
      return FormatData(null, "User not found", 404); // Not found
    }

    // Validate if the role is valid (optional)
    const validRoles = ["buyer", "admin"];
    if (!validRoles.includes(role)) {
      return FormatData(null, "Invalid role", 400); // Bad request
    }

    existingCustomer.role = role;
    await existingCustomer.save();

    return FormatData({
      id: existingCustomer._id,
      role: existingCustomer.role,
    });
  }

  async GetWishList(customerId) {
    const wishListItems = await this.repository.Wishlist(customerId);
    return FormatData(wishListItems);
  }

  async AddToWishlist(customerId, product) {
    const wishlistResult = await this.repository.AddWishlistItem(
      customerId,
      product
    );
    return FormatData(wishlistResult);
  }

  async ManageCart(customerId, product, qty, isRemove) {
    const cartResult = await this.repository.AddCartItem(
      customerId,
      product,
      qty,
      isRemove
    );
    return FormatData(cartResult);
  }

  async ManageOrder(customerId, order) {
    const orderResult = await this.repository.AddOrderToProfile(
      customerId,
      order
    );
    return FormatData(orderResult);
  }

  async SubscribeEvents(payload) {
    console.log("Triggering.... Customer Events");

    payload = JSON.parse(payload);
    console.log(payload);

    const { event, data } = payload;
    console.log("EVENT AND DATA", event, data);

    const { userId, product, order, qty } = data;

    switch (event) {
      case "ADD_TO_WISHLIST":
      case "REMOVE_FROM_WISHLIST":
        this.AddToWishlist(userId, product);
        break;
      case "ADD_TO_CART":
        this.ManageCart(userId, product, qty, false);
        break;
      case "REMOVE_FROM_CART":
        this.ManageCart(userId, product, qty, true);
        break;
      case "CREATE_ORDER":
        this.ManageOrder(userId, order);
        break;
      case "TEST":
        console.log("Customer service up and running man");
        break;
      default:
        break;
    }
  }
}

module.exports = CustomerService;
