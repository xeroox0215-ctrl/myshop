const tg = window.Telegram.WebApp;
tg.expand();

// Получаем данные от Telegram
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013;

// Если зашел через бота - берем данные ТГ. Если нет - делаем заглушку.
let currentUser = user || { id: Math.floor(Math.random() * 900000) + 100000, first_name: "Гость", username: "guest", photo_url: "" };
const isAdmin = (currentUser.id === ADMIN_ID);

let orders = JSON.parse(localStorage.getItem('orders')) || [];
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let currentTicketId = null;
let currentProduct = {};
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('app-container').classList.add('visible'); 
    }, 1500);

    // ЗАПОЛНЕНИЕ ПРОФИЛЯ
    document.getElementById('user-name').innerText = currentUser.first_name;
    document.getElementById('user-tag').innerText = currentUser.username ? '@' + currentUser.username : '';
    document.getElementById('profile-page-name').innerText = currentUser.first_name;
    document.getElementById('profile-page-id').innerText = `ID: ${currentUser.id}`;
    
    if (currentUser.photo_url) {
        const avatar = document.getElementById('user-avatar');
        avatar.style.backgroundImage = `url(${currentUser.photo_url})`;
        avatar.innerText = ''; 
        const pAvatar = document.getElementById('profile-page-avatar');
        pAvatar.style.backgroundImage = `url(${currentUser.photo_url})`;
        pAvatar.innerText = '';
    }

    // ПОКАЗ АДМИНКИ (ТОЛЬКО ДЛЯ ТЕБЯ)
    if (isAdmin) {
        document.getElementById('btn-admin-main').style.display = 'flex';
    } else {
        document.getElementById('btn-admin-main').style.display = 'none';
    }

    renderProfileOrders();
    checkTickets();
    applyDiscountToPrices();
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

function showConfirmModal() { closeModal('buy-modal'); openModal('confirm-modal'); }

function confirmOrder() {
    if (userDiscount > 0) {
        userDiscount = 0;
        localStorage.removeItem('userDiscount');
        alert('Промокод сгорел, так как заказ был оформлен.');
    }
    orders.push({
        id: Date.now(), userName: currentUser.first_name, userId: currentUser.id,
        item: currentProduct.name, price: currentProduct.price, status: 'Ожидает проверки', date: new Date().toLocaleString()
    });
    localStorage.setItem('orders', JSON.stringify(orders)); 
    alert('Заказ отправлен администратору!');
    closeModal('confirm-modal');
    renderProfileOrders();
    location.reload(); 
}

// --- ПРОФИЛЬ ---
function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === currentUser.id);
    if (myOrders.length === 0) { container.innerHTML = '<p style="color:#b3b3b3;">Заказов нет.</p>'; return; }
    myOrders.forEach(o => {
        container.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; color: #fff; margin-bottom:5px;">${o.item} - ${o.status}</div>`;
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

// --- ТИКЕТЫ (ТОЛЬКО СВОИ ИЛИ ВСЕ ДЛЯ АДМИНА) ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text) return alert('Напишите текст!');
    tickets.push({ id: Date.now(), userName: currentUser.first_name, userId: currentUser.id, text: text, status: 'open', replies: [] });
    localStorage.setItem('tickets', JSON.stringify(tickets));
    alert('Сообщение отправлено! Зайдите в колокольчик (уведомления) и там откроется чат.');
    document.getElementById('support-message').value = '';
    closeModal('support-modal');
    checkTickets();
}

function checkTickets() {
    const dot = document.getElementById('notify-dot');
    // Если ты админ - показываем точку, если есть открытые тикеты
    // Если юзер - показываем точку, если есть ответ на его тикет
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
    // Ты видишь все, юзер только свои
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
    const box = document.getElementById('ticket-chat-box');
    box.innerHTML = `<div style="color: #fff; margin-bottom: 10px;">${t.text}</div>`;
    t.replies.forEach(r => {
        const senderName = r.from === 'Админ' ? 'Поддержка' : t.userName;
        box.innerHTML += `<div style="color: #fff; margin-bottom: 10px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;"><b>${senderName}:</b> ${r.text}</div>`;
    });
    document.getElementById('btn-admin-delete-ticket').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('btn-user-close-ticket').style.display = isAdmin ? 'none' : 'block';
    closeModal('notify-modal');
    openModal('ticket-modal');
}

function sendTicketMsg() {
    const text = document.getElementById('ticket-chat-input').value;
    if (!text) return;
    const idx = tickets.findIndex(t => t.id === currentTicketId);
    if (idx !== -1) {
        tickets[idx].replies.push({ from: isAdmin ? 'Админ' : 'Пользователь', text: text });
        tickets[idx].status = isAdmin ? 'answered' : 'open';
        localStorage.setItem('tickets', JSON.stringify(tickets));
        document.getElementById('ticket-chat-input').value = '';
        openTicket(currentTicketId);
        checkTickets();
    }
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
