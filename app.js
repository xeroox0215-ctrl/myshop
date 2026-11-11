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

let orders = [];
let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let currentTicketId = null;
let currentProduct = {};
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;

// === СОКЕТЫ ===
// Заказы
socket.on('receive_order', (data) => {
    if (isAdmin) {
        orders.push(data);
        renderAdminOrders();
    }
});
socket.on('all_orders', (data) => {
    if (isAdmin) {
        orders = data;
        renderAdminOrders();
    }
});

// Тикеты
socket.on('receive_ticket_msg', (data) => {
    if (currentTicketId == data.ticket_id) {
        renderSingleMessage(data);
    }
});
socket.on('ticket_history', (messages) => {
    const box = document.getElementById('ticket-chat-box');
    box.innerHTML = '';
    messages.forEach(msg => renderSingleMessage(msg));
});

// Подключение к комнате админов
if (isAdmin) {
    socket.emit('join_admin');
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

// --- ПОКУПКА (СОКЕТ) ---
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
    
    // Отправляем через сокет
    socket.emit('new_order', newOrder);
    
    alert(`Заказ отправлен!\nВАШ КОД: ${txCode}\nОтправьте чек и код в ЛС @xeroox9.`);
    closeModal('confirm-modal');
    renderProfileOrders();
}

function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === currentUser.id);
    if (myOrders.length === 0) { container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">Заказов нет.</p>'; return; }
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
function openAdminPanel() { 
    renderAdminOrders(); 
    openModal('admin-modal');
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const pending = orders.filter(o => o.status === 'Ожидает проверки');
    if (pending.length === 0) { container.innerHTML = '<p style="color:#b3b3b3;">Нет новых заказов.</p>'; return; }
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
                    <button onclick="updateOrderStatus('${o.txCode}', 'Оплачено')" class="send-btn" style="background: #4ade80; color: #000; padding: 8px;">Оплачено</button>
                    <button onclick="updateOrderStatus('${o.txCode}', 'Отказано')" class="send-btn" style="background: #f87171; color: #fff; padding: 8px;">Отказано</button>
                </div>
            </div>`;
    });
}
function updateOrderStatus(txCode, status) {
    // Находим заказ по коду
    const idx = orders.findIndex(o => o.txCode === txCode);
    if (idx !== -1) {
        orders[idx].status = status;
        renderAdminOrders();
        renderProfileOrders(); // Обновляем, если это заказ самого админа
    }
}

// --- ТИКЕТЫ (СОКЕТ) ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text) return alert('Напишите текст!');
    
    currentTicketId = Date.now();
    
    socket.emit('send_ticket_msg', {
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
    container.innerHTML = '<p style="color:#b3b3b3;">Загрузка...</p>';
    openModal('notify-modal');

    if (isAdmin) {
        fetch('https://myshop-o4pl.onrender.com/get_tickets')
            .then(res => res.json())
            .then(data => {
                container.innerHTML = '';
                const ticketIds = Object.keys(data);
                if (ticketIds.length === 0) { container.innerHTML = '<p style="color:#b3b3b3;">Пусто</p>'; return; }
                ticketIds.forEach(id => {
                    const t = data[id];
                    container.innerHTML += `<div onclick="openTicket('${id}')" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 5px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #fff; font-weight: 700;">Тикет #${id.slice(-4)}</p>
                        <p style="color: #ffb7c5; font-size: 12px;">От: ${t.user_name}</p>
                        <p style="color: #b3b3b3; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.messages[0].text}</p>
                    </div>`;
                });
            })
            .catch(err => {
                container.innerHTML = '<p style="color:#f87171;">Ошибка загрузки</p>';
            });
    } else {
        // Для юзера просто залушка, так как его тикеты в чате
        container.innerHTML = '<p style="color:#b3b3b3;">Ваши тикеты отображаются в чате.</p>';
    }
}

function openTicket(id) {
    currentTicketId = id;
    document.getElementById('ticket-title').innerText = `Тикет #${id.toString().slice(-4)}`;
    document.getElementById('ticket-chat-box').innerHTML = ''; 
    socket.emit('join', { ticket_id: id });
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
    socket.emit('send_ticket_msg', {
        ticket_id: currentTicketId,
        text: text,
        from: isAdmin ? 'Админ' : 'Пользователь',
        user_name: currentUser.first_name,
        user_id: currentUser.id
    });
    input.value = '';
}

// ... (функции userCloseTicket, adminDeleteTicket, createNews, createPromoCode, applyPromo, applyDiscountToPrices) ...
