
'use strict';

// NovaStore: loja demonstrativa sem pagamentos reais.
const products = [
  { id: 1, name: 'Fone Bluetooth Wave', category: 'tecnologia', description: 'Som e liberdade para acompanhar sua rotina.', price: 149.90, icon: '🎧', badge: 'Mais vendido' },
  { id: 2, name: 'Luminária Aurora', category: 'casa', description: 'Iluminação acolhedora para qualquer ambiente.', price: 119.90, icon: '💡', badge: 'Novidade' },
  { id: 3, name: 'Bolsa Urban', category: 'acessorios', description: 'Estilo versátil para levar seus essenciais.', price: 189.00, icon: '👜', badge: '' },
  { id: 4, name: 'Garrafa Térmica Daily', category: 'lifestyle', description: 'Sua bebida favorita sempre por perto.', price: 79.90, icon: '🥤', badge: 'Favorito' },
  { id: 5, name: 'Teclado Compact', category: 'tecnologia', description: 'Conforto e praticidade para estudar ou trabalhar.', price: 229.90, icon: '⌨️', badge: '' },
  { id: 6, name: 'Vaso Minimal', category: 'casa', description: 'Um toque contemporâneo para a decoração.', price: 69.90, icon: '🏺', badge: '' },
  { id: 7, name: 'Óculos Solar Classic', category: 'acessorios', description: 'Design atemporal para compor seu visual.', price: 129.90, icon: '🕶️', badge: '' },
  { id: 8, name: 'Caderno Criativo', category: 'lifestyle', description: 'Um espaço especial para ideias e planos.', price: 49.90, icon: '📓', badge: '' }
];

const $ = selector => document.querySelector(selector);
const grid = $('#productsGrid');
const searchInput = $('#searchInput');
const sortSelect = $('#sortSelect');
const filterButtons = [...document.querySelectorAll('[data-category]')];
const cartDrawer = $('#cartDrawer');
const overlay = $('#cartOverlay');
const cartItems = $('#cartItems');
const cartCount = $('#cartCount');
const subtotal = $('#cartSubtotal');
const checkoutButton = $('#checkoutButton');
const toast = $('#toast');

const storageKey = 'novastore-cart-v1';
const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

let selectedCategory = 'todos';
let cart = loadCart();
let toastTimer;
let previousFocus = null;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      return {};
    }

    const cleaned = {};

    for (const product of products) {
      const quantity = saved[product.id];

      if (Number.isInteger(quantity) && quantity > 0) {
        cleaned[product.id] = Math.min(quantity, 99);
      }
    }

    return cleaned;
  } catch {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch {
    showToast('Não foi possível salvar o carrinho neste navegador.');
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function filteredProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase('pt-BR');

  const filtered = products.filter(product =>
    (selectedCategory === 'todos' || product.category === selectedCategory) &&
    `${product.name} ${product.description} ${product.category}`
      .toLocaleLowerCase('pt-BR')
      .includes(term)
  );

  switch (sortSelect.value) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;

    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;

    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      break;
  }

  return filtered;
}

function renderProducts() {
  const filtered = filteredProducts();

  $('#resultsCount').textContent =
    `${filtered.length} ${filtered.length === 1
      ? 'produto encontrado'
      : 'produtos encontrados'}`;

  $('#emptyState').hidden = filtered.length !== 0;

  grid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image">
        ${product.badge
          ? `<span class="product-badge">${product.badge}</span>`
          : ''}

        <span class="placeholder-icon"
          role="img"
          aria-label="Ilustração de ${product.name}">
          ${product.icon}
        </span>
      </div>

      <div class="product-info">
        <span class="product-category">
          ${product.category === 'acessorios'
            ? 'Acessórios'
            : product.category}
        </span>

        <h3>${product.name}</h3>

        <p class="product-description">
          ${product.description}
        </p>

        <strong class="product-price">
          ${currency.format(product.price)}
        </strong>

        <button
          type="button"
          class="add-to-cart"
          data-add="${product.id}"
          aria-label="Adicionar ${product.name} ao carrinho">
          Adicionar ao carrinho +
        </button>
      </div>
    </article>
  `).join('');
}

function renderCart() {
  const entries = products.filter(product => cart[product.id]);

  const count = entries.reduce(
    (sum, product) => sum + cart[product.id],
    0
  );

  const total = entries.reduce(
    (sum, product) => sum + product.price * cart[product.id],
    0
  );

  cartCount.textContent = count;
  subtotal.textContent = currency.format(total);

  checkoutButton.disabled = count === 0;
  $('#clearCart').disabled = count === 0;

  cartItems.innerHTML = entries.length
    ? entries.map(product => `
      <div class="cart-item">
        <div class="cart-item-image" aria-hidden="true">
          ${product.icon}
        </div>

        <div>
          <strong>${product.name}</strong>
          <p>${currency.format(product.price)}</p>

          <div class="quantity-controls">
            <button type="button"
              data-decrease="${product.id}"
              aria-label="Diminuir quantidade de ${product.name}">
              −
            </button>

            <span>${cart[product.id]}</span>

            <button type="button"
              data-increase="${product.id}"
              aria-label="Aumentar quantidade de ${product.name}"
              ${cart[product.id] >= 99 ? 'disabled' : ''}>
              +
            </button>
          </div>

          <button type="button"
            class="remove-item"
            data-remove="${product.id}">
            Remover
          </button>
        </div>
      </div>
    `).join('')
    : `
      <div class="cart-empty">
        <span aria-hidden="true">🛍️</span>
        <h3>Seu carrinho está vazio</h3>
        <p>Explore a coleção e escolha seus favoritos.</p>
      </div>
    `;
}

function updateQuantity(id, delta) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  const quantity = Math.max(
    0,
    Math.min(99, (cart[id] || 0) + delta)
  );

  if (quantity === 0) {
    delete cart[id];
  } else {
    cart[id] = quantity;
  }

  saveCart();
  renderCart();
}

function openCart() {
  previousFocus = document.activeElement;

  overlay.hidden = false;
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');

  $('#openCart').setAttribute('aria-expanded', 'true');
  document.body.classList.add('cart-open');

  $('#closeCart').focus();
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');

  $('#openCart').setAttribute('aria-expanded', 'false');

  overlay.hidden = true;
  document.body.classList.remove('cart-open');

  if (previousFocus && previousFocus.isConnected) {
    previousFocus.focus();
  }
}

searchInput.addEventListener('input', renderProducts);
sortSelect.addEventListener('change', renderProducts);

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.category;

    filterButtons.forEach(item => {
      const active = item === button;

      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    renderProducts();
  });
});

$('#clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  sortSelect.value = 'featured';

  filterButtons
    .find(button => button.dataset.category === 'todos')
    .click();

  searchInput.focus();
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-add]');

  if (!button) return;

  updateQuantity(Number(button.dataset.add), 1);
  showToast('Produto adicionado ao carrinho!');
});

cartItems.addEventListener('click', event => {
  const button = event.target.closest('button');

  if (!button) return;

  if (button.dataset.increase) {
    updateQuantity(Number(button.dataset.increase), 1);
  }

  if (button.dataset.decrease) {
    updateQuantity(Number(button.dataset.decrease), -1);
  }

  if (button.dataset.remove) {
    delete cart[Number(button.dataset.remove)];

    saveCart();
    renderCart();

    showToast('Produto removido do carrinho.');
  }
});

$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

$('#clearCart').addEventListener('click', () => {
  cart = {};

  saveCart();
  renderCart();

  showToast('Carrinho esvaziado.');
});

checkoutButton.addEventListener('click', () => {
  showToast(
    'Esta é uma loja demonstrativa. Nenhuma compra será realizada.'
  );
});

document.addEventListener('keydown', event => {
  if (!cartDrawer.classList.contains('open')) return;

  if (event.key === 'Escape') {
    closeCart();
  }

  if (event.key === 'Tab') {
    const focusable = [
      ...cartDrawer.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled)'
      )
    ];

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }
});

renderProducts();
renderCart();
