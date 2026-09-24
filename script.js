const supabaseUrl = "https://yhpefafeoavmhmgsfrsu.supabase.co";
const supabaseKey = "sb_publishable_M15nTSJNhAVKaVcpqibp-A_e6gK2wRl";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);
let products = [];
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*");

  if (error) {
    console.error("Error loading products:", error);
    return;
  }

  products = data;

  filterProducts();
}

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const cartCount = document.getElementById("cart-count");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartSection = document.getElementById("cart-section");
const openCartButton = document.getElementById("open-cart-button");
const continueShoppingButton = document.getElementById("continue-shopping-button");
const cartMessage = document.getElementById("cart-message");
let selectedCategory = "All";
let cart = [];

function formatPrice(price) {
  return "₦" + price.toLocaleString();
}

function displayProducts(productsToShow) {
  productGrid.innerHTML = "";

  if (productsToShow.length === 0) {
    productGrid.innerHTML = '<p class="no-products">No products found.</p>';
    return;
  }

  productsToShow.forEach(function (product) {
    const cartProduct = cart.find(function (item) {
      return item.id === product.id;
    });
    const productIsAtStockLimit = cartProduct && cartProduct.quantity === product.stock;

    const productCard = `
      <article class="product-card">
        <img class="product-image" src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <p class="product-category">${product.category}</p>
          <h3>${product.name}</h3>
          <p class="product-brand">${product.brand}</p>
          <div class="product-bottom">
            <span class="product-price">${formatPrice(product.price)}</span>
            <button class="add-to-cart" type="button" data-id="${product.id}" ${productIsAtStockLimit ? "disabled" : ""}>
              ${productIsAtStockLimit ? "Maximum added" : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    `;

    productGrid.innerHTML += productCard;
  });

  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      addToCart(Number(button.dataset.id));
    });
  });
}

function addToCart(productId) {
  const product = products.find(function (item) {
    return item.id === productId;
  });

  const cartProduct = cart.find(function (item) {
    return item.id === productId;
  });

  if (cartProduct) {
    if (cartProduct.quantity < product.stock) {
      cartProduct.quantity += 1;
      cartMessage.textContent = product.name + " quantity increased.";
    } else {
      cartMessage.textContent = "You have reached the available stock for " + product.name + ".";
    }
  } else {
    cart.push({ ...product, quantity: 1 });
    cartMessage.textContent = product.name + " was added to your cart.";
  }

  updateCart();
  filterProducts();
}

function updateCart() {
  let numberOfItems = 0;

  cart.forEach(function (product) {
    numberOfItems += product.quantity;
  });

  cartCount.textContent = numberOfItems;
  displayCart();
}

function displayCart() {
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. Add a few products to get started.</p>';
    cartTotal.textContent = formatPrice(0);
    return;
  }

  let total = 0;

  cart.forEach(function (product) {
    const subtotal = product.price * product.quantity;
    total += subtotal;

    const cartItem = `
      <article class="cart-item">
        <img class="cart-item-image" src="${product.image}" alt="${product.name}">
        <div>
          <h3>${product.name}</h3>
          <p class="cart-item-brand">${product.brand}</p>
          <p class="cart-item-price">${formatPrice(product.price)} each</p>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls" aria-label="Quantity controls for ${product.name}">
            <button class="quantity-button" type="button" data-action="decrease" data-id="${product.id}" aria-label="Decrease quantity">−</button>
            <span class="quantity-number">${product.quantity}</span>
            <button class="quantity-button" type="button" data-action="increase" data-id="${product.id}" aria-label="Increase quantity" ${product.quantity === product.stock ? "disabled" : ""}>+</button>
          </div>
          <button class="remove-button" type="button" data-action="remove" data-id="${product.id}">Remove</button>
          <span class="cart-subtotal">${formatPrice(subtotal)}</span>
        </div>
      </article>
    `;

    cartItemsContainer.innerHTML += cartItem;
  });

  cartTotal.textContent = formatPrice(total);
  addCartItemButtonEvents();
}

function addCartItemButtonEvents() {
  const cartButtons = document.querySelectorAll(".quantity-button, .remove-button");

  cartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const productId = Number(button.dataset.id);

      if (button.dataset.action === "increase") {
        changeQuantity(productId, 1);
      } else if (button.dataset.action === "decrease") {
        changeQuantity(productId, -1);
      } else {
        removeFromCart(productId);
      }
    });
  });
}

function changeQuantity(productId, amount) {
  const cartProduct = cart.find(function (item) {
    return item.id === productId;
  });

  if (amount === 1 && cartProduct.quantity < cartProduct.stock) {
    cartProduct.quantity += 1;
  }

  if (amount === -1) {
    cartProduct.quantity -= 1;

    if (cartProduct.quantity === 0) {
      removeFromCart(productId);
      return;
    }
  }

  updateCart();
  filterProducts();
}

function removeFromCart(productId) {
  cart = cart.filter(function (product) {
    return product.id !== productId;
  });

  cartMessage.textContent = "Product removed from your cart.";
  updateCart();
  filterProducts();
}

function filterProducts() {
  const searchText = searchInput.value.toLowerCase();

  const matchingProducts = products.filter(function (product) {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchText) || product.brand.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  displayProducts(matchingProducts);
}

searchInput.addEventListener("input", filterProducts);

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    selectedCategory = button.dataset.category;

    filterButtons.forEach(function (filterButton) {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");
    filterProducts();
  });
});

openCartButton.addEventListener("click", function () {
  cartSection.classList.add("is-open");
  cartSection.scrollIntoView({ behavior: "smooth" });
});

continueShoppingButton.addEventListener("click", function () {
  cartSection.classList.remove("is-open");
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

updateCart();
loadProducts();