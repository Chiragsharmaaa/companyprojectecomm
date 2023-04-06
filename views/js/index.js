
const cartItems = document.querySelector("#cart .cart-items");
const parentSection = document.getElementById("shopitems");
const pagination = document.getElementById("pagination");
const logoutBtn = document.getElementById('logout');
const orderHistoryBtn = document.querySelector('.order-items');

window.addEventListener("DOMContentLoaded", () => {
    let page = 1;
    getProducts(page);
});

logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    showNotification('User logged out', false);
    window.location.href = "../html/login.html";
});

function getProducts(page) {
    axios.get(`http://localhost:3000/products/?page=${page}`).then((products) => {
        showProductsOnScreen(products);
        showPagination(products.data.data);
    });
}

function showPagination({
    currentPage,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    lastPage,
}) {
    pagination.innerHTML = "";

    if (hasPreviousPage) {
        const button1 = document.createElement("button");
        button1.innerHTML = previousPage;
        button1.addEventListener("click", () => getProducts(previousPage));
        pagination.appendChild(button1);
    }

    const button2 = document.createElement("button");
    button2.classList.add("active");
    button2.innerHTML = currentPage;
    button2.addEventListener("click", () => getProducts(currentPage));
    pagination.appendChild(button2);

    if (hasNextPage) {
        const button3 = document.createElement("button");
        button3.innerHTML = nextPage;
        button3.addEventListener("click", () => getProducts(nextPage));
        pagination.appendChild(button3);
    }
}



function showProductsOnScreen(products) {
    parentSection.innerHTML = "";
    products.data.products.forEach((product) => {
        const productHtml = `
    <div class="col-md-4" id="album-${product.id}">
    <div class="blog-card blog-card-blog">
      <div class="blog-card-image">
        <a href="#">
          <img class="img" src="${product.imageUrl}" />
        </a>
        <div class="ripple-cont"></div>
      </div>
      <div class="blog-table">
          <h4 class="blog-card-caption">
            <a href="#">${product.title}</a>
          </h4>
          <p class="blog-card-description">$${product.price}</p>
          <button class="shop-item-button" type='button'>Add to Cart</button>
        </div>
    </div>
  </div>`;
        parentSection.innerHTML = parentSection.innerHTML + productHtml;
    });
}

document.addEventListener("click", (e) => {
    if (e.target.className == "order-items") {
        getCartItems();
    }
    if (e.target.className == "shop-item-button") {
        const prodId = Number(e.target.parentNode.parentNode.parentNode.id.split("-")[1]);
        console.log(prodId)
        axios
            .post("http://localhost:3000/cart", { productId: prodId })
            .then((data) => {
                if (data.data.error) {
                    throw new Error("Unable to add product");
                }
                showNotification(data.data.message, false);
            })
            .catch((err) => {
                console.log(err);
                showNotification(err, true);
            });
    }
    if (
        e.target.className == "cart-bottom" ||
        e.target.className == "cart-holder"
    ) {
        getCartItems();
    }
    if (e.target.className == "cancel") {
        document.querySelector("#cart").style = "display:none;";
    }
    if (e.target.className == "purchase-btn") {
        if (document.querySelector("#total-value").innerHTML == '$0') {
            showNotification('You have Nothing in Cart , Add some products to purchase !', true);
            return;
        }
        axios
            .post("http://localhost:3000/create-order")
            .then((response) => {
                getCartItems();
                console.log(response);
            })
            .catch((err) => {
                console.log(err);
            });
        showNotification('Thanks for shopping with us!', false);
    }
});

function getCartItems() {
    axios
        .get("http://localhost:3000/cart")
        .then((cartProducts) => {
            showProductsInCart(cartProducts.data.products);
            updateCartTotal();
            document.querySelector("#cart").style = "display:block;";
        })
        .catch((err) => {
            console.log(err);
        });
}

function showProductsInCart(listofproducts) {
    cartItems.innerHTML = "";
    listofproducts.forEach((product) => {
        const id = `album-${product.id}`;
        const name = product.title;
        const img_src = product.imageUrl;
        const price = product.price;
        document.querySelector(".cart-number").innerText = parseInt(document.querySelector(".cart-number").innerText) + 1;
        const cart_item = document.createElement("div");
        cart_item.classList.add("cart-row");
        cart_item.setAttribute("id", `in-cart-${id}`);
        cart_item.innerHTML = `
            <span class='cart-item cart-column'>
        <img class='cart-img' src="${img_src}" alt="">
            <span>${name}</span>
        </span>
        <span class='cart-price cart-column'>${price}</span>
        <form onsubmit='deleteCartItem(event, ${product.id})' class='cart-quantity cart-column'>
            <input onchange="updateCartTotal()" class="cart-quantity-input" type="number" min="1" value="1">
            <button>REMOVE</button>
        </form>`;
        cartItems.appendChild(cart_item);
    });
    updateCartTotal();
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName("cart-items")[0];
    var cartRows = cartItemContainer.getElementsByClassName("cart-row");
    var total = 0;
    for (let i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i];
        var priceElement = cartRow.getElementsByClassName("cart-price")[0];
        var quantityElement = cartRow.getElementsByClassName(
            "cart-quantity-input"
        )[0];
        var price = parseFloat(priceElement.innerText.replace("$", ""));
        var quantity = quantityElement.value;
        total = total + price * quantity;
    }
    total = Math.round(total * 100) / 100;
    document.getElementsByClassName("cart-total-price")[0].innerText =
        "$" + total;
}

function deleteCartItem(e, prodId) {
    e.preventDefault();
    axios
        .post("http://localhost:3000/cart-delete-item", { productId: prodId })
        .then(() => removeElementFromCartDom(prodId));
}

function showNotification(message, iserror) {
    let el = document.createElement('div');
    el.classList.add('popup');
    el.style.backgroundColor = iserror ? "red" : "green";
    el.innerHTML = message;
    document.body.appendChild(el)
    setTimeout(() => {
        el.remove();
    }, 2000)
}

function removeElementFromCartDom(prodId) {
    document.getElementById(`in-cart-album-${prodId}`).remove();
    showNotification("Succesfully removed product", false);
    updateCartTotal();
}
