const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 

// ПОДКЛЮЧЕНИЕ К RENDER (Замени на свой адрес)
const socket = io("https://myshop-o4pl.onrender.com"); 

let isAdmin = (user && user.id === ADMIN_ID);
let currentTicketId = null;
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('app-container').classList.add('visible'); 
    }, 2000);

    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        document.getElementById('user-tag').innerText = user.username ? '@' + user.username : '';
        document.getElementById('profile-page-name').innerText = user.first_name;
        document.getElementById('profile-page-id').innerText = `ID: ${user.id}`;
        
        if (user.photo_url) {
            const avatar = document.getElementById('user-avatar');
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.innerText = ''; 
            const pAvatar = document.getElementById('profile-page-avatar');
            pAvatar.style.backgroundImage = `url(${user.photo_url})`;
            pAvatar.innerText = '';
        }
    }

    // Подписка на сообщения с сервера
    socket.on('receive_msg', (data) => {
        if (currentTicketId == data.ticket_id) {
            renderTicketChatData(data);
        }
    });

    createDecor('bg-decor', 10);        
    startCarousel();
    startTopBanner();
    renderProfileOrders();
    checkTickets();
});

// ... (Функции createDecor, switchTab, openModal, closeModal, toggleFaq, openSupportModal, openAboutModal, openRulesModal) ...

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

// --- ТИКЕТЫ (С РЕАЛЬНЫМ ВРЕМЕНЕМ) ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text.trim()) { alert('Напишите текст!'); return; }
    
    const newTicket = { id: Date.now(), userName: user ? user.first_name : 'Гость', userId: user ? user.id : 0, text: text, status: 'open', replies: [] };
    tickets.push(newTicket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    
    alert('Тикет отправлен! Поддержка свяжется с вами.');
    document.getElementById('support-message').value = '';
    closeModal('support-modal');
    checkTickets();
}

function checkTickets() {
    const notifyDot = document.getElementById('notify-dot');
    const myTickets = tickets.filter(t => t.userId === user.id && t.status === 'answered');
    if (myTickets.length > 0 || (isAdmin && tickets.filter(t => t.status === 'open').length > 0)) {
        notifyDot.style.display = 'block';
    } else {
        notifyDot.style.display = 'none';
    }
}

function openNotificationsModal() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = '';
    let myTickets = [];
    if (isAdmin) {
        myTickets = tickets.filter(t => t.status === 'open' || t.status === 'answered');
    } else {
        myTickets = tickets.filter(t => t.userId === user.id);
    }
    if (myTickets.length === 0) {
        container.innerHTML = '<p style="color: #b3b3b3; text-align: center;">Уведомлений нет</p>';
    } else {
        myTickets.forEach(ticket => {
            const title = isAdmin ? `Тикет #${ticket.id.toString().slice(-4)} от ${ticket.userName}` : `Ваш тикет #${ticket.id.toString().slice(-4)}`;
            let statusText = ticket.status === 'open' ? 'Открыт' : (ticket.status === 'answered' ? 'Есть ответ' : 'Закрыт');
            container.innerHTML += `
                <div class="ticket-card" onclick="openTicket(${ticket.id})">
                    <h4>${title}</h4>
                    <p style="color: #ffb7c5;">${statusText}</p>
                    <p>${ticket.text}</p>
                </div>
            `;
        });
    }
    openModal('notify-modal');
}

function openTicket(id) {
    currentTicketId = id;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    document.getElementById('ticket-title').innerText = `Тикет #${id.toString().slice(-4)}`;
    
    // Подключаемся к комнате на сервере
    socket.emit('join', { ticket_id: id });

    // Рендерим историю
    const chatBox = document.getElementById('ticket-chat-box');
    chatBox.innerHTML = '';
    renderTicketChatData({text: ticket.text, from: ticket.userName, user_name: ticket.userName}); // Первое сообщение
    ticket.replies.forEach(r => renderTicketChatData({text: r.text, from: r.from, user_name: ticket.userName}));

    // Настройка кнопок
    const btnUserClose = document.getElementById('btn-user-close-ticket');
    const btnAdminDelete = document.getElementById('btn-admin-delete-ticket');
    if (isAdmin) {
        btnAdminDelete.style.display = 'block';
        btnUserClose.style.display = 'none';
    } else {
        btnUserClose.style.display = 'block';
        btnAdminDelete.style.display = 'none';
    }

    closeModal('notify-modal');
    openModal('ticket-modal');
}

function renderTicketChatData(data) {
    const chatBox = document.getElementById('ticket-chat-box');
    const isAdm = data.from === 'Админ';
    const align = isAdm ? 'flex-end' : 'flex-start';
    const bg = isAdm ? 'rgba(255,255,255,0.1)' : 'rgba(255, 20, 147, 0.15)';
    const border = isAdm ? 'rgba(255,255,255,0.2)' : 'rgba(255, 20, 147, 0.3)';
    
    chatBox.innerHTML += `
        <div style="background: ${bg}; border: 1px solid ${border}; padding: 10px; border-radius: 10px; align-self: ${align}; max-width: 80%; margin-bottom: 8px;">
            <span style="font-size: 10px; color: ${isAdm ? '#4ade80' : '#ffb7c5'};">${data.from}</span>
            <p style="color: #fff; font-size: 13px; margin-top: 3px;">${data.text}</p>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendTicketMsg() {
    const input = document.getElementById('ticket-chat-input');
    const text = input.value.trim();
    if (!text) return;

    const msgData = {
        ticket_id: currentTicketId,
        text: text,
        from: isAdmin ? 'Админ' : 'Пользователь',
        user_name: user ? user.first_name : 'Гость'
    };

    // Отправляем через Сокет
    socket.emit('send_msg', msgData);
    
    // Сохраняем локально
    const ticketIndex = tickets.findIndex(t => t.id === currentTicketId);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].replies.push({ from: msgData.from, text: text });
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }

    // Отрисовываем
    renderTicketChatData(msgData);
    input.value = '';
}

function userCloseTicket() {
    const ticketIndex = tickets.findIndex(t => t.id === currentTicketId);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = 'closed';
        localStorage.setItem('tickets', JSON.stringify(tickets));
        alert('Спасибо за обращение! Тикет закрыт.');
        closeModal('ticket-modal');
        checkTickets();
    }
}

function adminDeleteTicket() {
    if (!isAdmin) return;
    if (confirm('Удалить этот тикет?')) {
        tickets = tickets.filter(t => t.id !== currentTicketId);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        alert('Тикет удален.');
        closeModal('ticket-modal');
        checkTickets();
    }
}

// --- ЗАКАЗЫ ---
function submitOrder() {
    const newOrder = {
        id: Date.now(), userName: user ? user.first_name : 'Гость', userId: user ? user.id : 0,
        item: "Товар", price: 0, status: 'Ожидает проверки', date: new Date().toLocaleString()
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders)); 
    
    // Уведомление админу в ТГ (через сокет)
    socket.emit('send_msg', {
        ticket_id: 'order',
        text: `🛒 НОВЫЙ ЗАКАЗ от ${newOrder.userName}`,
        from: 'Система',
        user_name: 'System'
    });

    alert('Заказ отправлен администратору!');
    closeModal('buy-modal');
    renderProfileOrders();
}

// ... (Остальные функции: renderProfileOrders, openAdminPanel, renderAdminOrders, updateOrderStatus, createPromoCode, applyPromo, startCarousel, startTopBanner) ...
