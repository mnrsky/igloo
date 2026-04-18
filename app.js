/*
 * app.js
 *
 * Este script implementa a lógica de funcionamento tanto da vitrine
 * quanto do painel administrativo da I‑gloo. Ele manipula a lista
 * de produtos usando localStorage para persistir dados entre sessões,
 * gerencia o carrinho de compras, controla o fluxo de pagamento e
 * atualiza indicadores no painel admin.
 */

(function () {
  /**
   * Carrega os produtos do localStorage ou inicializa com um conjunto
   * padrão caso não existam dados salvos. Cada produto possui um
   * identificador único, nome, preço, estoque atual, estoque inicial,
   * URL da imagem e um badge opcional para destacar categorias.
   * @returns {Array} lista de produtos
   */
  function loadProducts() {
    let products = JSON.parse(localStorage.getItem('igloo_products'));
    if (!products) {
      products = [
        {
          id: 1,
          name: 'Água Mineral 500ml',
          price: 2.0,
          stock: 10,
          initialStock: 10,
          image: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Water_bottle.png',
          badge: 'Clássico'
        },
        {
          id: 2,
          name: 'Refrigerante Lata 350ml',
          price: 3.0,
          stock: 8,
          initialStock: 8,
          image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Diet-Coke-Can.png',
          badge: 'Clássico'
        },
        {
          id: 3,
          name: 'Suco Natural 300ml',
          price: 4.0,
          stock: 6,
          initialStock: 6,
          image: '',
          badge: 'Natural'
        },
        {
          id: 4,
          name: 'Chocolate em Barra',
          price: 4.5,
          stock: 6,
          initialStock: 6,
          image: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Chocolate_bar.png',
          badge: 'Mais vendido'
        },
        {
          id: 5,
          name: 'Iogurte Grego',
          price: 3.5,
          stock: 5,
          initialStock: 5,
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Greek_yoghurt_with_honey.jpg/960px-Greek_yoghurt_with_honey.jpg',
          badge: 'Natural'
        },
        {
          id: 6,
          name: 'Sanduíche Natural',
          price: 6.0,
          stock: 4,
          initialStock: 4,
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Club_sandwich.png/960px-Club_sandwich.png',
          badge: 'Clássico'
        }
      ];
      localStorage.setItem('igloo_products', JSON.stringify(products));
    }
    return products;
  }

  /**
   * Salva a lista de produtos no localStorage.
   * @param {Array} prods
   */
  function saveProducts(prods) {
    localStorage.setItem('igloo_products', JSON.stringify(prods));
  }

  /**
   * Formata um número para o padrão monetário brasileiro.
   * @param {number} val
   * @returns {string}
   */
  function formatPrice(val) {
    return val.toFixed(2).replace('.', ',');
  }

  // Carrinho de compras (memória temporária)
  let cart = [];

  /**
   * Renderiza a vitrine de produtos na página principal. Caso a
   * vitrine não exista (por exemplo, no painel admin), a função
   * retorna sem realizar nenhuma ação. Cada cartão apresenta o
   * nome, preço, badge e imagem do produto. Um botão permite
   * adicionar o item ao carrinho, respeitando o estoque disponível.
   */
  function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    const products = loadProducts();
    grid.innerHTML = '';
    products.forEach((product) => {
      // Se o produto estiver sem estoque, não o exiba na vitrine. Essa abordagem
      // evita frustração ao mostrar itens indisponíveis. Caso prefira
      // exibir o cartão, basta remover esta condição e ajustar o botão
      // desabilitado (já estilizado no CSS).
      if (product.stock <= 0) {
        return;
      }

      const card = document.createElement('div');
      card.className = 'product-card';
      // badge
      if (product.badge) {
        const badge = document.createElement('div');
        badge.className = 'product-badge';
        badge.textContent = product.badge;
        card.appendChild(badge);
      }
      // imagem
      const img = document.createElement('img');
      img.alt = product.name;
      if (product.image) {
        img.src = product.image;
      } else {
        img.src = 'placeholder_light_gray_block.png';
      }
      card.appendChild(img);
      // nome
      const nameEl = document.createElement('h4');
      nameEl.textContent = product.name;
      card.appendChild(nameEl);
      // preço
      const priceEl = document.createElement('div');
      priceEl.className = 'price';
      priceEl.textContent = `R$ ${formatPrice(product.price)}`;
      card.appendChild(priceEl);
      // botão
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      // Sempre habilitado, pois somente produtos em estoque são renderizados
      btn.textContent = 'Adicionar';
      btn.disabled = false;
      btn.addEventListener('click', () => addToCart(product.id));
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  /**
   * Atualiza o badge numérico do botão de carrinho no cabeçalho
   * com a quantidade total de itens no carrinho.
   */
  function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = count;
  }

  /**
   * Adiciona um produto ao carrinho. Se já existir, apenas aumenta a
   * quantidade respeitando o limite do estoque atual. Após adicionar
   * o item, atualiza o contador de itens.
   * @param {number} productId
   */
  function addToCart(productId) {
    const products = loadProducts();
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity += 1;
      }
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    updateCartCount();
    renderCart();
  }

  /**
   * Alterna a exibição do painel do carrinho na vitrine. O carrinho
   * aparece ou desaparece sem alterar a navegação principal.
   */
  function toggleCart() {
    const cartCard = document.getElementById('cart-card');
    if (!cartCard) return;
    cartCard.classList.toggle('hidden');
    // Se cartCard estiver aberto, também renderiza os itens
    if (!cartCard.classList.contains('hidden')) {
      renderCart();
    }
  }

  /**
   * Renderiza os itens do carrinho, exibindo o nome, controles de
   * quantidade e o subtotal. Também calcula o total geral e habilita
   * ou desabilita o botão de checkout conforme o carrinho estiver
   * vazio ou não.
   */
  function renderCart() {
    const listEl = document.getElementById('cart-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!listEl || !subtotalEl || !totalEl || !checkoutBtn) return;
    listEl.innerHTML = '';
    let subtotal = 0;
    cart.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = item.name;
      row.appendChild(nameDiv);
      // quantity controls
      const controls = document.createElement('div');
      controls.className = 'quantity-controls';
      const minusBtn = document.createElement('button');
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // remove item
          const idx = cart.indexOf(item);
          cart.splice(idx, 1);
        }
        updateCartCount();
        renderCart();
      });
      const qtySpan = document.createElement('span');
      qtySpan.textContent = item.quantity;
      const plusBtn = document.createElement('button');
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => {
        const products = loadProducts();
        const prod = products.find((p) => p.id === item.id);
        if (prod && item.quantity < prod.stock) {
          item.quantity += 1;
          updateCartCount();
          renderCart();
        }
      });
      controls.appendChild(minusBtn);
      controls.appendChild(qtySpan);
      controls.appendChild(plusBtn);
      row.appendChild(controls);
      subtotal += item.price * item.quantity;
      listEl.appendChild(row);
    });
    subtotalEl.textContent = `R$ ${formatPrice(subtotal)}`;
    totalEl.textContent = `R$ ${formatPrice(subtotal)}`;
    checkoutBtn.disabled = cart.length === 0;
  }

  /**
   * Abre o modal de pagamento, listando os itens do carrinho e o total.
   */
  function openCheckout() {
    if (cart.length === 0) return;
    const overlay = document.getElementById('payment-overlay');
    const listEl = document.getElementById('checkout-list');
    const totalEl = document.getElementById('payment-total');
    if (!overlay || !listEl || !totalEl) return;
    // popula lista
    listEl.innerHTML = '';
    let total = 0;
    cart.forEach((item) => {
      const li = document.createElement('div');
      li.className = 'checkout-item';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${item.name} × ${item.quantity}`;
      const priceSpan = document.createElement('span');
      const subtotal = item.price * item.quantity;
      priceSpan.textContent = `R$ ${formatPrice(subtotal)}`;
      li.appendChild(nameSpan);
      li.appendChild(priceSpan);
      listEl.appendChild(li);
      total += subtotal;
    });
    totalEl.textContent = `R$ ${formatPrice(total)}`;
    overlay.classList.remove('hidden');
  }

  /**
   * Fecha o modal de pagamento sem efetivar a venda.
   */
  function closeCheckout() {
    const overlay = document.getElementById('payment-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /**
   * Confirma o pagamento. Atualiza o estoque, limpa o carrinho,
   * recalcula as estatísticas e atualiza a UI. Em seguida fecha o modal.
   */
  function confirmPayment() {
    const products = loadProducts();
    // Atualiza estoque reduzindo as quantidades vendidas
    cart.forEach((item) => {
      const prod = products.find((p) => p.id === item.id);
      if (prod) {
        prod.stock -= item.quantity;
        if (prod.stock < 0) prod.stock = 0;
      }
    });
    saveProducts(products);
    // Limpa o carrinho
    cart = [];
    updateCartCount();
    renderCart();
    // Atualiza UI (estatísticas e vitrine)
    renderProducts();
    updateStats();
    closeCheckout();
  }

  /**
   * Recalcula os indicadores de faturamento, itens vendidos e estoque
   * total com base no estado dos produtos. Exibe os valores no
   * painel administrativo caso existam os elementos correspondentes.
   */
  function updateStats() {
    const revenueEl = document.getElementById('admin-revenue');
    const soldEl = document.getElementById('admin-sold');
    const stockEl = document.getElementById('admin-stock');
    if (!revenueEl || !soldEl || !stockEl) return;
    const products = loadProducts();
    let revenue = 0;
    let sold = 0;
    let stock = 0;
    products.forEach((p) => {
      const soldQty = p.initialStock - p.stock;
      sold += soldQty;
      revenue += soldQty * p.price;
      stock += p.stock;
    });
    revenueEl.textContent = `R$ ${formatPrice(revenue)}`;
    soldEl.textContent = sold.toString();
    stockEl.textContent = stock.toString();
  }

  /**
   * Renderiza a tabela de produtos no painel admin. Cada linha
   * apresenta campos editáveis para nome, preço, estoque, badge e
   * imagem. Ao alterar um valor e sair do campo, os dados são
   * salvos automaticamente.
   */
  function renderAdminTable() {
    const bodyEl = document.getElementById('admin-table-body');
    if (!bodyEl) return;
    const products = loadProducts();
    bodyEl.innerHTML = '';
    products.forEach((product) => {
      const tr = document.createElement('tr');
      // ID
      const tdId = document.createElement('td');
      tdId.textContent = product.id;
      tr.appendChild(tdId);
      // Foto + URL de edição
      const tdImg = document.createElement('td');
      // contêiner para imagem e campo de edição
      const imgContainer = document.createElement('div');
      imgContainer.style.display = 'flex';
      imgContainer.style.flexDirection = 'column';
      imgContainer.style.alignItems = 'flex-start';
      // imagem de preview
      const img = document.createElement('img');
      img.width = 60;
      img.height = 60;
      img.style.objectFit = 'contain';
      img.style.marginBottom = '0.3rem';
      if (product.image) {
        img.src = product.image;
      } else {
        img.src = 'placeholder_light_gray_block.png';
      }
      img.alt = product.name;
      imgContainer.appendChild(img);
      // campo para editar a URL da foto
      const imageInput = document.createElement('input');
      imageInput.type = 'url';
      imageInput.placeholder = 'URL da foto';
      imageInput.value = product.image || '';
      imageInput.style.width = '100%';
      imageInput.style.fontSize = '0.7rem';
      imageInput.style.padding = '0.25rem';
      imageInput.style.border = '1px solid #e5cdb8';
      imageInput.style.borderRadius = '4px';
      imageInput.style.backgroundColor = '#fef7ef';
      imageInput.addEventListener('blur', () => {
        product.image = imageInput.value.trim();
        saveProducts(products);
        // re-render both admin and store to show updated preview
        renderAdminTable();
        renderProducts();
      });
      imgContainer.appendChild(imageInput);
      tdImg.appendChild(imgContainer);
      tr.appendChild(tdImg);
      // Nome
      const tdName = document.createElement('td');
      const inputName = document.createElement('input');
      inputName.type = 'text';
      inputName.value = product.name;
      inputName.addEventListener('blur', () => {
        product.name = inputName.value.trim();
        saveProducts(products);
        renderProducts();
      });
      tdName.appendChild(inputName);
      tr.appendChild(tdName);
      // Preço
      const tdPrice = document.createElement('td');
      const inputPrice = document.createElement('input');
      inputPrice.type = 'number';
      inputPrice.min = '0';
      inputPrice.step = '0.01';
      inputPrice.value = product.price;
      inputPrice.addEventListener('blur', () => {
        const val = parseFloat(inputPrice.value);
        product.price = isNaN(val) ? product.price : val;
        saveProducts(products);
        renderProducts();
        updateStats();
      });
      tdPrice.appendChild(inputPrice);
      tr.appendChild(tdPrice);
      // Estoque
      const tdStock = document.createElement('td');
      const inputStock = document.createElement('input');
      inputStock.type = 'number';
      inputStock.min = '0';
      inputStock.value = product.stock;
      inputStock.addEventListener('blur', () => {
        const val = parseInt(inputStock.value, 10);
        if (!isNaN(val) && val >= 0) {
          // Ajusta stock atual, mas não altera initialStock
          product.stock = val;
          saveProducts(products);
          renderProducts();
          updateStats();
        }
      });
      tdStock.appendChild(inputStock);
      tr.appendChild(tdStock);
      // Badge
      const tdBadge = document.createElement('td');
      const inputBadge = document.createElement('input');
      inputBadge.type = 'text';
      inputBadge.value = product.badge || '';
      inputBadge.addEventListener('blur', () => {
        product.badge = inputBadge.value.trim();
        saveProducts(products);
        renderProducts();
      });
      tdBadge.appendChild(inputBadge);
      tr.appendChild(tdBadge);
      // Ações
      const tdActions = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-ghost';
      delBtn.textContent = 'Remover';
      delBtn.addEventListener('click', () => {
        const idx = products.findIndex((p) => p.id === product.id);
        if (idx >= 0) {
          products.splice(idx, 1);
          saveProducts(products);
          renderAdminTable();
          renderProducts();
          updateStats();
        }
      });
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);
      bodyEl.appendChild(tr);
    });
  }

  /**
   * Configura o formulário de adição de novos produtos no painel admin.
   * Ao submeter, cria um novo objeto de produto com um ID sequencial,
   * salva no localStorage e atualiza a tabela.
   */
  function setupAddProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-name');
      const priceInput = document.getElementById('new-price');
      const stockInput = document.getElementById('new-stock');
      const badgeInput = document.getElementById('new-badge');
      const imageInput = document.getElementById('new-image');
      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value);
      const stock = parseInt(stockInput.value, 10);
      if (!name || isNaN(price) || isNaN(stock)) return;
      let products = loadProducts();
      const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
      const newProduct = {
        id: newId,
        name,
        price,
        stock,
        initialStock: stock,
        image: imageInput.value.trim(),
        badge: badgeInput.value.trim()
      };
      products.push(newProduct);
      saveProducts(products);
      // Limpa formulário
      nameInput.value = '';
      priceInput.value = '';
      stockInput.value = '';
      badgeInput.value = '';
      imageInput.value = '';
      renderAdminTable();
      renderProducts();
      updateStats();
    });
  }

  // Inicialização após carregamento do DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Renderiza vitrine e cart se existirem
    renderProducts();
    updateCartCount();
    renderCart();
    // Atualiza estatísticas no admin
    updateStats();
    // Renderiza tabela no admin e configura formulário de adição
    renderAdminTable();
    setupAddProductForm();
  });

  // Exponha algumas funções no escopo global para serem utilizadas em HTML
  window.addToCart = addToCart;
  window.toggleCart = toggleCart;
  window.openCheckout = openCheckout;
  window.closeCheckout = closeCheckout;
  window.confirmPayment = confirmPayment;
})();