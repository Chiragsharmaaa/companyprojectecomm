const Product = require("../models/product");
const Cart = require("../models/cart");

let limit_items = 3;

// const productsArr = [
//   {
//     id: 1,
//     title: "shirt",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
//   {
//     id: 2,
//     title: "trouser",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
//   {
//     id: 3,
//     title: "belt",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
//   {
//     id: 4,
//     title: "hat",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
//   {
//     id: 5,
//     title: "coat",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
//   {
//     id: 6,
//     title: "jacket",
//     price: 22,
//     imageUrl: "../assets/img/big_sean.png",
//     description: "great comfort",
//   },
// ];

exports.getProducts = (req, res, next) => {
  let page = req.query.page || 1;
  let totalItems;

  Product.count()
    .then((totalProducts) => {
      totalItems = totalProducts;
      return Product.findAll({
        offset: (page - 1) * limit_items,
        limit: limit_items,
      });
    })
    .then((products) => {
      res.status(200).json({
        products,
        success: true,
        data: {
          currentPage: page,
          hasNextPage: totalItems > page * limit_items,
          hasPreviousPage: page > 1,
          nextPage: +page + 1,
          previousPage: +page - 1,
          lastPage: Math.ceil(totalItems / limit_items),
        },
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "Error getting products" });
    });
};

exports.getIndex = (req, res, next) => {
  const page = req.query.page || 1;
  let totalItems;

  Product.count()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.findAll({
        offset: (page - 1) * limit_items,
        limit: limit_items,
      });
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: totalItems > page * limit_items,
        hasPreviousPage: page > 1,
        nextPage: +page + 1,
        previousPage: +page - 1,
        lastPage: Math.ceil(totalItems / limit_items),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findByPk(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await req.user.getCart();
    console.log('cart', cart)
    // if (!cart) {
    //   cart = await req.user.createCart();
    // }
    const products = await cart.getProducts();
    res.status(200).json({ products });
  } catch (err) {
    res.status(400).json({ error: true, message: "Error getting cart items" });
  }
};

//adds product to cartItems in DB
exports.postCart = async (req, res, next) => {
  if (!req.body.productId) {
    return res.status(400).json({
      success: false,
      message: "Product Id is missing!",
    });
  }
  let fetchedCart;
  let newQuantity = 1;
  const prodId = req.body.productId;
  const cart = await req.user.getCart()
  console.log(cart)
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      console.log(fetchedCart)
      return cart.getProducts({
        where: {
          id: prodId,
        },
      });
    })
    .then((products) => {
      let product;
      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findByPk(prodId);
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        through: {
          quantity: newQuantity,
        },
      });
    })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "Successfully added the product",
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: "Error Occured",
      });
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts({
        where: {
          id: prodId,
        },
      });
    })
    .then((products) => {
      const product = products[0];
      product.cartItem.destroy();
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

//what it does is sequelize's magically created fxn getOrders is called
// with req.user to get orders that response includes a [product array]
// then the orders array is shown in json format with a status of 200
//  else the catch block runs.

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ["products"] })
    .then((orders) => {
      res.status(200).json(orders);
    })
    .catch((err) => {
      res.status(400).json("Unable to fetch products!");
    });
};

/* 

*/
exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then((products) => {
      return req.user
        .createOrder()
        .then((order) => {
          order.addProducts(
            products.map((product) => {
              product.orderItem = { quantity: product.cartItem.quantity };
              return product;
            })
          );
        })
        .catch((err) => console.log(err));
    })
    .then((result) => {
      fetchedCart.setProducts();
      res.status(200).json({ message: "Successfully Posted Orders!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "error posting orders" });
    });
};

exports.postDeleteProduct = (req, res, next) => {
  let prodId = req.body.productId;
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts({ where: { id: prodId } });
    })
    .then((products) => {
      const product = products[0];
      return product.cartItem.destroy();
    })
    .then(() => {
      res.status(200).json("successfully deleted product from cart");
    })
    .catch((err) => {
      res.status(500).json("Error deleting product");
    });
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/checkout", {
    path: "/checkout",
    pageTitle: "Checkout",
  });
};
