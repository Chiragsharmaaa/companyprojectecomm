const path = require("path");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");

const errorController = require("./controllers/error");
const sequelize = require("./util/database");
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/orders");
const OrderItem = require("./models/order-item");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(cors());
app.use(helmet());
dotenv.config();

const shopRoutes = require("./routes/shop");
const userRoutes = require("./routes/user");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(shopRoutes);
app.use('/user', userRoutes);
app.use(errorController.get404);


Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);

Order.belongsToMany(Product, { through: OrderItem });
Product.belongsToMany(Order, { through: OrderItem });

sequelize
  // .sync({ force: true }) //use this to reset db.
  .sync()

  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });
