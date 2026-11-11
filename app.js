const tg = window.Telegram.WebApp;
tg.expand();

// --- ПРОВЕРКА ДАННЫХ ОТ ТЕЛЕГРАМА ---
console.log("=== TELEGRAM DATA ===");
console.log("initDataUnsafe:", tg.initDataUnsafe);
console.log("User:", tg.initDataUnsafe?.user);

const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013;

// Если данные пришли, используем их. Если нет — "Гость"
let currentUser = user || { id: 123456789, first_name: "Гость", username: "guest", photo_url: "" };
const isAdmin = (currentUser.id === ADMIN_ID);

// --- ПОДКЛЮЧЕНИЕ К СОКЕТАМ (RENDER) ---
const socket = io("https://myshop-o4pl.onrender.com");
let currentTicketId = null;

// --- ПЕРЕМЕННЫЕ ---
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let currentProduct = {};
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('app-container').classList.add('visible'); 
    }, 1500);

    // Данные профиля
    document.getElementById('user-name').innerText = currentUser.first_name;
    document.getElementById('user-tag').innerText = currentUser.username ? '@' + currentUser.username : '';
    document.getElementById('profile-page-name').innerText = currentUser.first_name;
    document.getElementById('profile-page-id').innerText = `ID: ${currentUser.id}`;
    
    if (currentUser.photo_url) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${currentUser.photo_url})`;
        document.getElementById('user-avatar').innerText = '';
        document.getElementById('profile-page-avatar').style.backgroundImage = `url(${currentUser.photo_url})`;
        document.getElementById('profile-page-avatar').innerText = '';
    }

    // Админка (только для тебя)
    if (isAdmin) {
        document.getElementById('btn-admin-main').style.display = 'flex';
    } else {
        document.getElementById('btn-admin-main').style.display = 'none';
    }

    renderProfileOrders();
    checkTickets();
    applyDiscountToPrices();
    
    // Новости
    const savedNews = localStorage.getItem('newsText');
    if (savedNews) document.getElementById('news-text').innerText = savedNews;

    // Слушаем сообщения от сервера (Сокеты)
    socket.on('receive_msg', (data) => {
        // Если пришло сообщение в открытый тикет, добавляем его на экран
        if (currentTicketId == data.ticket_id) {
            renderSingleMessage(data);
        }
    });
});

// --- НАВИГАЦИЯ ---
function switchTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

// --- МОДАЛКИ ---
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleFaq(element) {
    let item = element.classList.contains('faq-item') ? element : element.closest('.faq-item');
    if (item) item.classList.toggle('active');
}
function openSupportModal() { openModal('support-modal'); }
function openAboutModal() { openModal('about-modal'); }
function openRulesModal() { openModal('rules-modal'); }

// --- ПОКУПКА ---
function openBuyMenu(name, price) {
    currentProduct = { name, price };
    document.getElementById('buy-title').innerText = name;
    openModal('buy-modal');
}

function showConfirmModal() {
    closeModal('buy-modal');
    openModal('confirm-modal');
}

function confirmOrder() {
    if (userDiscount > 0) {
        userDiscount = 0;
        localStorage.removeItem('userDiscount');
        alert('Промокод сгорел, так как заказ был оформлен.');
    }

    const newOrder = {
        id: Date.now(), userName: currentUser.first_name, userId: currentUser.id,
        item: currentProduct.name, price: currentProduct.price, status: 'Ожидает проверки', date: new Date().toLocaleString()
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders)); 
    
    alert('Заказ отправлен администратору!');
    closeModal('confirm-modal');
    renderProfileOrders();
}

function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === currentUser.id);
    if (myOrders.length === 0) { container.innerHTML = '<p style="color:#b3b3b3;">Заказов нет.</p>'; return; }
    myOrders.forEach(o => {
        container.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; color: #fff; margin-bottom:5px; display:flex; justify-content:space-between;">
            <span>${o.item}</span>
            <span style="color:#fbbf24;">${o.status}</span>
        </div>`;
    });
}

// --- АДМИНКА ---
function openAdminPanel() {
    renderAdminOrders(); 
    openModal('admin-modal');
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const pending = orders.filter(o => o.status === 'Ожидает проверки');
    if (pending.length === 0) { container.innerHTML = '<p style="color:#b3b3b3;">Нет заказов.</p>'; return; }
    pending.forEach(o => {
        container.innerHTML += `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <p style="color: #fff;">${o.item} (${o.userName})</p>
                <button onclick="updateOrderStatus(${o.id}, 'Оплачено')" style="background: #4ade80; color: #000; padding: 5px; border: none; border-radius: 5px; margin-right: 5px;">Оплачено</button>
                <button onclick="updateOrderStatus(${o.id}, 'Отказано')" style="background: #f87171; color: #fff; padding: 5px; border: none; border-radius: 5px;">Отказано</button>
            </div>`;
    });
}

function updateOrderStatus(id, status) {
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
        orders[idx].status = status;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderAdminOrders();
        renderProfileOrders();
    }
}

// --- НОВОСТИ ---
function createNews() {
    const text = document.getElementById('admin-news-text').value;
    if (!text.trim()) { alert('Напишите текст!'); return; }
    localStorage.setItem('newsText', text);
    document.getElementById('news-text').innerText = text;
    alert('Новость опубликована!');
    document.getElementById('admin-news-text').value = '';
    closeModal('admin-modal');
}

// --- ПРОМОКОДЫ ---
function createPromoCode() {
    const nameInput = document.getElementById('admin-promo-name');
    const usesInput = document.getElementById('admin-promo-uses');
    const discInput = document.getElementById('admin-promo-discount');
    const name = nameInput.value.toUpperCase().trim();
    const uses = parseInt(usesInput.value);
    const disc = parseInt(discInput.value);
    if (!name || isNaN(uses) || isNaN(disc)) { alert('Заполните все поля!'); return; }
    promoCodes.push({ code: name, uses: uses, discount: disc });
    localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
    alert(`Промокод ${name} создан!`);
    nameInput.value = ''; usesInput.value = ''; discInput.value = '';
}

function applyPromo() {
    const input = document.getElementById('promo-input').value.toUpperCase().trim();
    const statusText = document.getElementById('promo-status');
    if (!input) return;
    const promoIndex = promoCodes.findIndex(p => p.code === input);
    if (promoIndex !== -1) {
        const promo = promoCodes[promoIndex];
        if (promo.uses > 0) {
            userDiscount = promo.discount;
            localStorage.setItem('userDiscount', userDiscount);
            promoCodes[promoIndex].uses -= 1;
            localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
            statusText.style.display = 'block';
            statusText.innerText = `Промокод активирован! Скидка ${promo.discount}%.`;
            document.getElementById('promo-input').value = '';
            applyDiscountToPrices();
        } else { alert('Промокод закончился!'); }
    } else { alert('Такого промокода нет!'); }
}

function applyDiscountToPrices() {
    if (userDiscount === 0) return;
    document.querySelectorAll('.ads-price-item').forEach(item => {
        const basePrice = parseInt(item.getAttribute('data-base'));
        const priceVal = item.querySelector('.price-val');
        if (basePrice && priceVal) {
            const newPrice = Math.floor(basePrice - (basePrice * (userDiscount / 100)));
            priceVal.innerHTML = `<span style="text-decoration: line-through; color: #888; font-size: 12px;">${basePrice} ⭐</span> ${newPrice} ⭐<br><span style="color: #4ade80; font-size: 10px;">Скидка ${userDiscount}%</span>`;
        }
    });
    const privatePriceEl = document.getElementById('private-price');
    if (privatePriceEl) {
        const base = parseInt(privatePriceEl.getAttribute('data-base'));
        if (base) {
            const newPrice = Math.floor(base - (base * (userDiscount / 100)));
            privatePriceEl.innerHTML = `<span style="text-decoration: line-through; color: #888; font-size: 16px;">${base} ⭐</span> ${newPrice} ⭐<br><span style="color: #4ade80; font-size: 12px;">Скидка ${userDiscount}%</span>`;
        }
    }
}

// --- ТИКЕТЫ (СОКЕТЫ) ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text) return alert('Напишите текст!');
    tickets.push({ id: Date.now(), userName: currentUser.first_name, userId: currentUser.id, text: text, status: 'open', replies: [] });
    localStorage.setItem('tickets', JSON.stringify(tickets));
    alert('Сообщение отправлено! Зайдите в колокольчик.');
    document.getElementById('support-message').value = '';
    closeModal('support-modal');
    checkTickets();
}

function checkTickets() {
    const dot = document.getElementById('notify-dot');
    if (isAdmin) {
        if (tickets.filter(t => t.status === 'open').length > 0) dot.style.display = 'block';
        else dot.style.display = 'none';
    } else {
        if (tickets.filter(t => t.userId === currentUser.id && t.status === 'answered').length > 0) dot.style.display = 'block';
        else dot.style.display = 'none';
    }
}

function openNotificationsModal() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = '';
    let list = isAdmin ? tickets : tickets.filter(t => t.userId === currentUser.id);
    if (list.length === 0) container.innerHTML = '<p style="color:#b3b3b3;">Пусто</p>';
    list.forEach(t => {
        container.innerHTML += `<div onclick="openTicket(${t.id})" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 5px; cursor: pointer;">
            <p style="color: #fff;">Тикет #${t.id.toString().slice(-4)} (${t.status})</p>
        </div>`;
    });
    openModal('notify-modal');
}

function openTicket(id) {
    currentTicketId = id;
    const t = tickets.find(x => x.id === id);
    document.getElementById('ticket-title').innerText = `Тикет #${id.toString().slice(-4)}`;
    
    // Подключаемся к комнате на сервере
    socket.emit('join', { ticket_id: id });

    // Очищаем и рендерим историю
    const box = document.getElementById('ticket-chat-box');
    box.innerHTML = '';
    renderSingleMessage({ text: t.text, from: t.userName, user_name: t.userName });
    t.replies.forEach(r => renderSingleMessage({ text: r.text, from: r.from, user_name: t.userName }));

    document.getElementById('btn-admin-delete-ticket').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('btn-user-close-ticket').style.display = isAdmin ? 'none' : 'block';
    closeModal('notify-modal');
    openModal('ticket-modal');
}

function renderSingleMessage(data) {
    const box = document.getElementById('ticket-chat-box');
    const isAdm = data.from === 'Админ';
    const align = isAdm ? 'flex-end' : 'flex-start';
    const bg = isAdm ? 'rgba(255,255,255,0.1)' : 'rgba(255, 20, 147, 0.15)';
    const border = isAdm ? 'rgba(255,255,255,0.2)' : 'rgba(255, 20, 147, 0.3)';
    
    box.innerHTML += `
        <div style="background: ${bg}; border: 1px solid ${border}; padding: 10px; border-radius: 10px; align-self: ${align}; max-width: 80%; margin-bottom: 8px;">
            <span style="font-size: 10px; color: ${isAdm ? '#4ade80' : '#ffb7c5'};">${data.from}</span>
            <p style="color: #fff; font-size: 13px; margin-top: 3px;">${data.text}</p>
        </div>
    `;
    box.scrollTop = box.scrollHeight;
}

function sendTicketMsg() {
    const input = document.getElementById('ticket-chat-input');
    const text = input.value.trim();
    if (!text) return;

    const msgData = {
        ticket_id: currentTicketId,
        text: text,
        from: isAdmin ? 'Админ' : 'Пользователь',
        user_name: currentUser.first_name
    };

    // Отправляем через сокет на Render
    socket.emit('send_msg', msgData);
    
    // Сохраняем в локальную память
    const idx = tickets.findIndex(t => t.id === currentTicketId);
    if (idx !== -1) {
        tickets[idx].replies.push({ from: msgData.from, text: text });
        tickets[idx].status = isAdmin ? 'answered' : 'open';
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }

    // Мгновенно отрисовываем
    renderSingleMessage(msgData);
    input.value = '';
    checkTickets();
}

function userCloseTicket() {
    const idx = tickets.findIndex(t => t.id === currentTicketId);
    if (idx !== -1) {
        tickets[idx].status = 'closed';
        localStorage.setItem('tickets', JSON.stringify(tickets));
        alert('Тикет закрыт');
        closeModal('ticket-modal');
        checkTickets();
    }
}

function adminDeleteTicket() {
    tickets = tickets.filter(t => t.id !== currentTicketId);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    alert('Удалено');
    closeModal('ticket-modal');
    checkTickets();
}

// --- ФОН И КАРУСЕЛЬ ---
function createDecor(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const images = ['listok.png', 'zvezda.png', 'derevo.png'];
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.classList.add('floating-decor');
        div.style.backgroundImage = `url('${images[Math.floor(Math.random() * images.length)]}')`;
        const size = Math.random() * 25 + 20;
        div.style.width = size + 'px'; div.style.height = size + 'px';
        div.style.left = Math.random() * 90 + '%';
        div.style.top = Math.random() * 80 + 'vh';
        div.style.animationDuration = (Math.random() * 15 + 15) + 's'; 
        div.style.animationDelay = (Math.random() * 3) + 's'; 
        container.appendChild(div);
    }
    }
