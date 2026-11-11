const tg = window.Telegram.WebApp;
tg.expand();

setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const container = document.getElementById('app-container');
    if (splash) splash.classList.add('hidden');
    if (container) container.classList.add('visible');
}, 2000);

const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 
const BOT_TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk";

const socket = io("https://myshop-o4pl.onrender.com"); 

let currentUser = user || { id: 123456789, first_name: "Гость", username: "guest", photo_url: "" };
const isAdmin = (currentUser.id === ADMIN_ID);

let orders = JSON.parse(localStorage.getItem('orders')) || [];
let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let currentTicketId = null;
let currentProduct = {};
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;

socket.on('receive_msg', (data) => {
    if (currentTicketId == data.ticket_id) renderSingleMessage(data);
});

socket.on('ticket_history', (messages) => {
    const box = document.getElementById('ticket-chat-box');
    box.innerHTML = '';
    messages.forEach(msg => renderSingleMessage(msg));
});

async function sendToBot(text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_ID, text: text, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Ошибка отправки в бота: ", e); }
}

document.addEventListener('DOMContentLoaded', () => {
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

    if (isAdmin) document.getElementById('btn-admin-main').style.display = 'flex';
    else document.getElementById('btn-admin-main').style.display = 'none';

    renderProfileOrders();
    applyDiscountToPrices();
    startCarousel();
    
    const savedNews = localStorage.getItem('newsText');
    if (savedNews) document.getElementById('news-text').innerText = savedNews;
});

// --- КАРУСЕЛЬ ---
let currentSlide = 0;
let carouselInterval;
let startX = 0;
let isDragging = false;

function startCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    const container = document.getElementById('carousel');
    if(!track || !container) return;
    const totalSlides = dots.length;

    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 50}%)`;
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
    }

    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);

    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        clearInterval(carouselInterval);
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        let endX = e.changedTouches[0].clientX;
        let diff = startX - endX;
        if (diff > 40) currentSlide = (currentSlide + 1) % totalSlides;
        else if (diff < -40) currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
        startCarousel();
    });
}

// --- НАВИГАЦИЯ И МОДАЛКИ ---
function switchTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

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
    const txCode = 'XR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newOrder = {
        id: Date.now(), userName: currentUser.first_name, userId: currentUser.id,
        item: currentProduct.name, price: currentProduct.price, status: 'Ожидает проверки', date: new Date().toLocaleString(), txCode: txCode
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders)); 

    sendToBot(`🛒 *НОВЫЙ ЗАКАЗ!*\nОт: ${currentUser.first_name}\nТовар: ${newOrder.item}\nКод: *${txCode}*`);
    alert(`Заказ отправлен!\nВАШ КОД: ${txCode}\nОтправьте чек и код в ЛС @xeroox9.`);
    
    closeModal('confirm-modal');
    renderProfileOrders();
}

function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === currentUser.id);
    
    if (myOrders.length === 0) { 
        container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">Заказов нет.</p>'; 
        return; 
    }
    
    myOrders.forEach(o => {
        let statusClass = 'status-pending';
        if (o.status === 'Оплачено') statusClass = 'status-paid';
        if (o.status === 'Отказано') statusClass = 'status-rejected';

        container.innerHTML += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #fff; font-weight: 600; font-size: 14px;">${o.item}</span>
                    <span class="status-badge ${statusClass}">${o.status}</span>
                </div>
                <span style="color: #ffb7c5; font-size: 12px; font-family: 'Press Start 2P', cursive;">Код: ${o.txCode || 'N/A'}</span>
            </div>
        `;
    });
}

// --- АДМИНКА ---
function openAdminPanel() { renderAdminOrders(); openModal('admin-modal'); }

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const pending = orders.filter(o => o.status === 'Ожидает проверки');
    
    if (pending.length === 0) { 
        container.innerHTML = '<p style="color:#b3b3b3;">Нет новых заказов.</p>'; 
        return; 
    }
    
    pending.forEach(o => {
        container.innerHTML += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #fff; font-weight: 700;">${o.item}</span>
                    <span class="status-badge status-pending">${o.status}</span>
                </div>
                <p style="color: #b3b3b3; font-size: 12px; margin-bottom: 5px;">Клиент: ${o.userName}</p>
                <p style="color: #ffb7c5; font-size: 12px; margin-bottom: 10px; font-family: 'Press Start 2P', cursive;">Код: ${o.txCode || 'N/A'}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="updateOrderStatus(${o.id}, 'Оплачено')" class="send-btn" style="background: #4ade80; color: #000; padding: 8px;">Оплачено</button>
                    <button onclick="updateOrderStatus(${o.id}, 'Отказано')" class="send-btn" style="background: #f87171; color: #fff; padding: 8px;">Отказано</button>
                </div>
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

// --- НОВОСТИ И ПРОМОКОДЫ ---
function createNews() {
    const text = document.getElementById('admin-news-text').value;
    if (!text.trim()) { alert('Напишите текст!'); return; }
    localStorage.setItem('newsText', text);
    document.getElementById('news-text').innerText = text;
    alert('Новость опубликована!');
    document.getElementById('admin-news-text').value = '';
    closeModal('admin-modal');
}

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

// --- ТИКЕТЫ (ЛОКАЛЬНО + СОКЕТЫ) ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text) return alert('Напишите текст!');
    
    currentTicketId = Date.now();
    
    // Сохраняем локально
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets.push({ id: currentTicketId, userName: currentUser.first_name, userId: currentUser.id, text: text, status: 'open', replies: [] });
    localStorage.setItem('tickets', JSON.stringify(tickets));
    
    // Отправляем на сервер (сокет)
    socket.emit('send_msg', {
        ticket_id: currentTicketId,
        text: text,
        from: 'Пользователь',
        user_name: currentUser.first_name,
        user_id: currentUser.id
    });

    alert('Сообщение отправлено! Зайдите в колокольчик.');
    document.getElementById('support-message').value = '';
    closeModal('support-modal');
}

function openNotificationsModal() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = '';
    
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    let list = isAdmin ? tickets : tickets.filter(t => t.userId === currentUser.id);
    
    if (list.length === 0) {
        container.innerHTML = '<p style="color:#b3b3b3;">Пусто</p>';
    } else {
        list.forEach(t => {
            container.innerHTML += `<div onclick="openTicket(${t.id})" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 5px; cursor: pointer;">
                <p style="color: #fff;">Тикет #${t.id.toString().slice(-4)} (${t.status})</p>
            </div>`;
        });
    }
    openModal('notify-modal');
}

function openTicket(id) {
    currentTicketId = id;
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const t = tickets.find(x => x.id === id);
    if (!t) return;

    document.getElementById('ticket-title').innerText = `Тикет #${id.toString().slice(-4)}`;
    const box = document.getElementById('ticket-chat-box');
    box.innerHTML = `<div style="color: #fff; margin-bottom: 10px;">${t.text}</div>`;
    
    if (t.replies) {
        t.replies.forEach(r => {
            const senderName = r.from === 'Админ' ? 'Поддержка' : t.userName;
            box.innerHTML += `<div style="color: #fff; margin-bottom: 10px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;"><b>${senderName}:</b> ${r.text}</div>`;
        });
    }

    document.getElementById('btn-admin-delete-ticket').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('btn-user-close-ticket').style.display = isAdmin ? 'none' : 'block';
    
    closeModal('notify-modal');
    openModal('ticket-modal');
}

function sendTicketMsg() {
    const text = document.getElementById('ticket-chat-input').value;
    if (!text) return;
    
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const idx = tickets.findIndex(t => t.id === currentTicketId);
    
    if (idx !== -1) {
        if (!tickets[idx].replies) tickets[idx].replies = [];
        tickets[idx].replies.push({ from: isAdmin ? 'Админ' : 'Пользователь', text: text });
        tickets[idx].status = isAdmin ? 'answered' : 'open';
        localStorage.setItem('tickets', JSON.stringify(tickets));
        
        document.getElementById('ticket-chat-input').value = '';
        openTicket(currentTicketId); 
    }
}

// ... (функции userCloseTicket, adminDeleteTicket) ...
function userCloseTicket() {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const idx = tickets.findIndex(t => t.id === currentTicketId);
    if (idx !== -1) {
        tickets[idx].status = 'closed';
        localStorage.setItem('tickets', JSON.stringify(tickets));
        alert('Тикет закрыт');
        closeModal('ticket-modal');
    }
}
function adminDeleteTicket() {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets = tickets.filter(t => t.id !== currentTicketId);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    alert('Удалено');
    closeModal('ticket-modal');
}
