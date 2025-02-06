const Address = require("../models/Address");
const Customer = require("../models/Customer");

class CustomerRepository {
  async CreateCustomer({ email, password, phone, role }) {
    const customer = new Customer({
      email,
      password,
      phone,
      address: [],
      role, //
    });

    const newCustomer = await customer.save();
    return newCustomer;
  }

  async CreateAddress({ _id, street, postalCode, city, country }) {
    const profile = await Customer.findById(_id);

    if (profile) {
      const newAddress = new Address({
        street,
        postalCode,
        city,
        country,
      });

      await newAddress.save();

      profile.address.push(newAddress);
    }

    return await profile.save();
  }
  async UpdatePassword(id, newPassword) {
    return Customer.findByIdAndUpdate(
      id,
      { password: newPassword },
      { new: true }
    );
  }
  async UpdateProfile(id, updateData) {
    return Customer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, select: "-password -__v" }
    );
  }
  async FindCustomer({ email }) {
    const existingCustomer = await Customer.findOne({ email: email });
    return existingCustomer;
  }

  async FindCustomerById({ id }) {
    const existingCustomer = await Customer.findById(id).populate("address");

    return existingCustomer;
  }

  async Wishlist(customerId) {
    const profile = await Customer.findById(customerId);

    return profile.wishlist;
  }

  async AddWishlistItem(
    customerId,
    { _id, name, desc, price, available, banner }
  ) {
    const product = {
      _id,
      name,
      desc,
      price,
      available,
      banner,
    };

    const profile = await Customer.findById(customerId);

    if (profile) {
      let wishlist = profile.wishlist;

      if (wishlist.length > 0) {
        let isExist = false;
        wishlist.map((item) => {
          if (item._id.toString() === product._id.toString()) {
            const index = wishlist.indexOf(item);
            wishlist.splice(index, 1);
            isExist = true;
          }
        });

        if (!isExist) {
          wishlist.push(product);
        }
      } else {
        wishlist.push(product);
      }

      profile.wishlist = wishlist;
    }

    const profileResult = await profile.save();

    return profileResult.wishlist;
  }

  async AddCartItem(customerId, { _id, name, price, banner }, qty, isRemove) {
    const profile = await Customer.findById(customerId);

    if (profile) {
      const cartItem = {
        product: { _id, name, price, banner },
        unit: qty,
      };

      let cartItems = profile.cart;

      if (cartItems.length > 0) {
        let isExist = false;
        cartItems.map((item) => {
          if (item.product._id.toString() === _id.toString()) {
            if (isRemove) {
              cartItems.splice(cartItems.indexOf(item), 1);
            } else {
              item.unit = qty;
            }
            isExist = true;
          }
        });

        if (!isExist) {
          cartItems.push(cartItem);
        }
      } else {
        cartItems.push(cartItem);
      }

      profile.cart = cartItems;

      return await profile.save();
    }

    throw new Error("Unable to add to cart!");
  }

  async AddOrderToProfile(customerId, order) {
    const profile = await Customer.findById(customerId);

    if (profile) {
      if (profile.orders == undefined) {
        profile.orders = [];
      }
      profile.orders.push(order);

      profile.cart = [];

      const profileResult = await profile.save();

      return profileResult;
    }

    throw new Error("Unable to add to order!");
  }
}

module.exports = CustomerRepository;
