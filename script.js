if (!window.supabase) {
  document.getElementById("product-grid").innerHTML =
    '<p class="no-products">Could not connect. Please refresh.</p>';
  throw new Error("Supabase library failed to load");
}
const supabaseUrl = "https://yhpefafeoavmhmgsfrsu.supabase.co";
const supabaseKey = "sb_publishable_M15nTSJNhAVKaVcpqibp-A_e6gK2wRl";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);
let products = [];
async function loadProducts() {
  productGrid.innerHTML = '<div class="product-loading" aria-live="polite"><span></span><span></span><span></span><p>Curating today\'s picks...</p></div>';

  const { data, error } = await supabaseClient
    .from("products")
    .select("*");

  if (error) {
    console.error("Error loading products:", error);
    productGrid.innerHTML = '<p class="no-products">We could not load products right now. Please refresh and try again.</p>';
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
const menuButton = document.getElementById("menu-button");
const mainNav = document.querySelector(".main-nav");
const checkoutButton = document.getElementById("checkout-button");
const checkoutSection = document.getElementById("checkout-section");
const closeCheckoutButton = document.getElementById("close-checkout-button");
const checkoutForm = document.getElementById("checkout-form");
const checkoutItems = document.getElementById("checkout-items");
const checkoutSubtotal = document.getElementById("checkout-subtotal");
const checkoutDelivery = document.getElementById("checkout-delivery");
const checkoutTotal = document.getElementById("checkout-total");
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

    const productIsAtStockLimit =
      cartProduct && cartProduct.quantity === product.stock;

    const productCard = `
      <article class="product-card">
        <img class="product-image" src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <p class="product-category">${product.category}</p>
          <h3>${product.name}</h3>
          <p class="product-brand">${product.brand}</p>
          <div class="product-bottom">
            <span class="product-price">${formatPrice(product.price)}</span>

            <button
              class="add-to-cart"
              type="button"
              data-id="${product.id}"
              ${productIsAtStockLimit ? "disabled" : ""}
            >
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
      const productId = Number(button.dataset.id);

      const cartProduct = cart.find(function (item) {
        return item.id === productId;
      });

      const product = products.find(function (item) {
        return item.id === productId;
      });

      // Stop if the available stock has been reached.
      if (cartProduct && cartProduct.quantity >= product.stock) {
        addToCart(productId);
        return;
      }

      // Add the product.
      addToCart(productId);

      // Show success state.
      button.classList.add("added");
      button.textContent = "✓ Added!";

      setTimeout(function () {
        button.classList.remove("added");
        button.textContent = "Add to Cart";
      }, 1000);
    });
  });

  observeRevealItems();
  setTimeout(function () {
  document.querySelectorAll(".product-card.reveal").forEach(function (card) {
    card.classList.add("is-visible");
  });
}, 600);
}
function displayCart() {
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="empty-cart">Your cart is empty.</p>';

    cartTotal.textContent = "₦0";
    return;
  }

  let total = 0;

  cart.forEach(function (item) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
      <img class="cart-item-image" src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)} each</span>
      </div>

      <div class="cart-item-actions">
        <button type="button" class="quantity-button" data-id="${item.id}" data-change="-1">−</button>
        <span class="cart-quantity">${item.quantity}</span>
        <button type="button" class="quantity-button" data-id="${item.id}" data-change="1">+</button>
        <button type="button" class="remove-item-button" data-id="${item.id}">
          Remove
        </button>
      </div>

      <strong class="cart-item-total">${formatPrice(itemTotal)}</strong>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  cartTotal.textContent = formatPrice(total);

  const quantityButtons =
    cartItemsContainer.querySelectorAll(".quantity-button");

  quantityButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const productId = Number(button.dataset.id);
      const amount = Number(button.dataset.change);

      changeQuantity(productId, amount);
    });
  });

  const removeButtons =
    cartItemsContainer.querySelectorAll(".remove-item-button");

  removeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const productId = Number(button.dataset.id);

      removeFromCart(productId);
    });
  });
}
function updateCart() {
  const totalItems = cart.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);

  cartCount.textContent = totalItems;

  cartCount.classList.remove("pop");

  void cartCount.offsetWidth;

  cartCount.classList.add("pop");

  displayCart();
}
function addToCart(productId) {
  const product = products.find(function (item) {
    return item.id === productId;
  });

  if (!product) {
    return;
  }

  const cartProduct = cart.find(function (item) {
    return item.id === productId;
  });

  if (cartProduct) {
    if (cartProduct.quantity < product.stock) {
      cartProduct.quantity += 1;
      cartMessage.textContent = product.name + " quantity increased.";
    } else {
      cartMessage.textContent =
        "You have reached the available stock for " + product.name + ".";
    }
  } else {
    cart.push({
      ...product,
      quantity: 1
    });

    cartMessage.textContent =
      product.name + " was added to your cart.";
  }

  updateCart();
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
});

continueShoppingButton.addEventListener("click", function () {
  cartSection.classList.remove("is-open");
});
menuButton.addEventListener("click", function () {
  const menuIsOpen = mainNav.classList.toggle("is-open");

  menuButton.textContent = menuIsOpen ? "✕" : "☰";
  menuButton.setAttribute("aria-expanded", menuIsOpen);
});
mainNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    mainNav.classList.remove("is-open");
    menuButton.textContent = "☰";
    menuButton.setAttribute("aria-expanded", "false");
  });
});
const heroMessage = document.getElementById("hero-message");

const heroMessages = [
  "Shop with ease.",
  "We're happy to have you.",
  "Fresh picks, everyday.",
  "Everything you need, closer to home.",
  "Your everyday essentials, all in one place."
];

let heroMessageIndex = 0;

setInterval(function () {
  heroMessage.classList.add("is-changing");

  setTimeout(function () {
    heroMessageIndex =
      (heroMessageIndex + 1) % heroMessages.length;

    heroMessage.textContent = heroMessages[heroMessageIndex];
    heroMessage.classList.remove("is-changing");
  }, 400);
}, 3000);
function calculateCartTotal() {
  return cart.reduce(function (total, item) {
    return total + item.price * item.quantity;
  }, 0);
}

function displayCheckout() {
  checkoutItems.innerHTML = "";

  if (cart.length === 0) {
    checkoutItems.innerHTML = "<p>Your cart is empty.</p>";
    checkoutSubtotal.textContent = "₦0";
    checkoutDelivery.textContent = "Free";
    checkoutTotal.textContent = "₦0";
    return;
  }

  cart.forEach(function (item) {
    const itemTotal = item.price * item.quantity;

    const checkoutItem = document.createElement("div");
    checkoutItem.className = "checkout-item";

    checkoutItem.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${item.quantity} × ${formatPrice(item.price)}</span>
      </div>

      <strong>${formatPrice(itemTotal)}</strong>
    `;

    checkoutItems.appendChild(checkoutItem);
  });

  const subtotal = calculateCartTotal();
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  checkoutSubtotal.textContent = formatPrice(subtotal);
  checkoutDelivery.textContent =
    deliveryFee === 0 ? "Free" : formatPrice(deliveryFee);
  checkoutTotal.textContent = formatPrice(total);
}
checkoutButton.addEventListener("click", function () {
  if (cart.length === 0) {
    cartMessage.textContent = "Your cart is empty.";
    return;
  }

  cartSection.classList.remove("is-open");
  checkoutSection.classList.add("is-open");

  displayCheckout();
});
closeCheckoutButton.addEventListener("click", function () {
  checkoutSection.classList.remove("is-open");
});
updateCart();
loadProducts();

/* Visual enhancements: these only add presentation classes and do not change cart or product data. */
const visualHeader = document.querySelector(".site-header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateHeaderStyle() {
  visualHeader.classList.toggle("is-scrolled", window.scrollY > 12);
}

function observeRevealItems() {
  const revealItems = document.querySelectorAll(".categories, .products-preview, .product-card");

  revealItems.forEach(function (item) {
    if (item.dataset.revealReady) {
      return;
    }

    item.dataset.revealReady = "true";
    item.classList.add("reveal");

    if (prefersReducedMotion) {
      item.classList.add("is-visible");
      return;
    }

    revealObserver.observe(item);
  });
}

const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -40px 0px" });

updateHeaderStyle();
window.addEventListener("scroll", updateHeaderStyle, { passive: true });
observeRevealItems();

