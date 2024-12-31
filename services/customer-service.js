const CustomerRepository = require("../database/repository/customer-repository");
const {
  FormatData,
  GeneratePassword,
  GenerateSignature,
  ValidatePassword,
} = require("../utils");

class CustomerService {
  constructor() {
    this.repository = new CustomerRepository();
  }

  async SignIn(userInputs) {
    const { email, password } = userInputs;

    const existingCustomer = await this.repository.FindCustomer({ email });

    if (existingCustomer) {
      const validPassword = await ValidatePassword(
        password,
        existingCustomer.password
      );
      if (validPassword) {
        const token = await GenerateSignature({
          email: existingCustomer.email,
          _id: existingCustomer._id,
        });
        return FormatData({ id: existingCustomer._id, token });
      }
    }

    return FormatData(null);
  }

  async SignUp(userInputs) {
    const { email, password, phone } = userInputs;

    let userPassword = await GeneratePassword(password);

    const existingCustomer = await this.repository.CreateCustomer({
      email,
      password: userPassword,
      phone,
    });

    const token = await GenerateSignature({
      email: email,
      _id: existingCustomer._id,
    });
    return FormatData({ id: existingCustomer._id, token });
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
