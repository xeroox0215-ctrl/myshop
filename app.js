const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 

// Проверка на админа
let isAdmin = false;
if (user && user.id === ADMIN_ID) {
    isAdmin = true;
}

let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let currentTicketId = null;

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

        // ПОКАЗЫВАЕМ АДМИНКУ ТОЛЬКО ТЕБЕ
        if (isAdmin) {
            document.getElementById('btn-admin-main').style.display = 'flex';
        }
        renderProfileOrders();
        checkTickets();
    }

    createDecor('bg-decor', 10);        
    startCarousel();
    startTopBanner();
});

// ... (функции createDecor, switchTab, openModal, closeModal, toggleFaq) ...
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

// --- ТИКЕТЫ ---
function createTicket() {
    const text = document.getElementById('support-message').value;
    if (!text.trim()) { alert('Напишите текст!'); return; }
    const newTicket = { id: Date.now(), userName: user.first_name, userId: user.id, text: text, status: 'open', replies: [] };
    tickets.push(newTicket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    alert('Тикет отправлен! Не забудьте ОБНОВИТЬ САЙТ, чтобы увидеть ответ.');
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
    let myTickets = isAdmin ? tickets.filter(t => t.status === 'open' || t.status === 'answered') : tickets.filter(t => t.userId === user.id);
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
    renderTicketChat(ticket);

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

function renderTicketChat(ticket) {
    const chatBox = document.getElementById('ticket-chat-box');
    chatBox.innerHTML = '';
    chatBox.innerHTML += `
        <div style="background: rgba(255, 20, 147, 0.15); border: 1px solid rgba(255, 20, 147, 0.3); padding: 10px; border-radius: 10px; align-self: flex-start; max-width: 80%;">
            <span style="font-size: 10px; color: #ffb7c5;">${ticket.userName}</span>
            <p style="color: #fff; font-size: 13px; margin-top: 3px;">${ticket.text}</p>
        </div>
    `;
    ticket.replies.forEach(reply => {
        const isAdm = reply.from === 'Админ';
        const align = isAdm ? 'flex-end' : 'flex-start';
        const bg = isAdm ? 'rgba(255,255,255,0.1)' : 'rgba(255, 20, 147, 0.15)';
        const border = isAdm ? 'rgba(255,255,255,0.2)' : 'rgba(255, 20, 147, 0.3)';
        chatBox.innerHTML += `
            <div style="background: ${bg}; border: 1px solid ${border}; padding: 10px; border-radius: 10px; align-self: ${align}; max-width: 80%;">
                <span style="font-size: 10px; color: ${isAdm ? '#4ade80' : '#ffb7c5'};">${reply.from}</span>
                <p style="color: #fff; font-size: 13px; margin-top: 3px;">${reply.text}</p>
            </div>
        `;
    });
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
}

function sendTicketMsg() {
    const input = document.getElementById('ticket-chat-input');
    const text = input.value.trim();
    if (!text) return;
    const ticketIndex = tickets.findIndex(t => t.id === currentTicketId);
    if (ticketIndex !== -1) {
        const from = isAdmin ? 'Админ' : 'Пользователь';
        tickets[ticketIndex].replies.push({ from: from, text: text });
        tickets[ticketIndex].status = isAdmin ? 'answered' : 'open'; 
        localStorage.setItem('tickets', JSON.stringify(tickets));
        input.value = '';
        renderTicketChat(tickets[ticketIndex]);
        checkTickets();
    }
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
    if(!user) { alert('Ошибка'); return; }
    const newOrder = {
        id: Date.now(), userName: user.first_name, userId: user.id,
        item: "Товар", price: 0, status: 'Ожидает проверки', date: new Date().toLocaleString()
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders)); 
    alert('Заказ отправлен администратору!');
    closeModal('buy-modal');
    renderProfileOrders();
}

function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === user.id);
    if (myOrders.length === 0) { container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">У вас пока нет заказов.</p>'; return; }
    myOrders.forEach(order => {
        let statusColor = '#fbbf24'; 
        if (order.status === 'Оплачено') statusColor = '#4ade80';
        if (order.status === 'Отказано') statusColor = '#f87171';
        container.innerHTML += `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                <p style="color: #fff; font-weight: 700;">${order.item}</p>
                <p style="color: #b3b3b3; font-size: 12px;">${order.date}</p>
                <p style="color: ${statusColor}; font-weight: 800; margin-top: 5px;">${order.status}</p>
            </div>
        `;
    });
}

function openAdminPanel() {
    renderAdminOrders(); 
    openModal('admin-modal');
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const pendingOrders = orders.filter(o => o.status === 'Ожидает проверки');
    if (pendingOrders.length === 0) { container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">Новых заказов нет.</p>'; return; }
    pendingOrders.forEach(order => {
        container.innerHTML += `
            <div class="admin-order-card glass-panel">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#fff; font-weight:800;">${order.item}</span>
                    <span style="color:var(--neon-pink); font-size:10px;">${order.userName}</span>
                </div>
                <div class="admin-actions" style="margin-top: 10px;">
                    <button class="glass-action-btn btn-paid" onclick="updateOrderStatus(${order.id}, 'Оплачено')">Оплачено</button>
                    <button class="glass-action-btn btn-reject" onclick="updateOrderStatus(${order.id}, 'Отказано')">Отказано</button>
                </div>
            </div>
        `;
    });
}

function updateOrderStatus(orderId, newStatus) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderAdminOrders(); 
        renderProfileOrders(); 
    }
}

// --- ПРОМОКОДЫ ---
function createPromoCode() {
    const name = document.getElementById('admin-promo-name').value.toUpperCase().trim();
    const uses = parseInt(document.getElementById('admin-promo-uses').value);
    const discount = parseInt(document.getElementById('admin-promo-discount').value);
    if (!name || isNaN(uses) || isNaN(discount)) { alert('Заполните все поля!'); return; }
    promoCodes.push({ code: name, uses: uses, discount: discount });
    localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
    alert(`Промокод ${name} создан!`);
    document.getElementById('admin-promo-name').value = '';
    document.getElementById('admin-promo-uses').value = '';
    document.getElementById('admin-promo-discount').value = '';
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
        } else { alert('Промокод закончился!'); }
    } else { alert('Такого промокода нет!'); }
}

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
    carouselInterval = setInterval(() => { currentSlide = (currentSlide + 1) % totalSlides; updateCarousel(); }, 6000);
    dots.forEach((dot, index) => { dot.addEventListener('click', () => { currentSlide = index; updateCarousel(); clearInterval(carouselInterval); startCarousel(); }); });
    container.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; clearInterval(carouselInterval); }, { passive: true });
    container.addEventListener('touchend', (e) => {
        if (!isDragging) return; isDragging = false;
        let endX = e.changedTouches[0].clientX; let diff = startX - endX;
        if (diff > 40) currentSlide = (currentSlide + 1) % totalSlides;
        else if (diff < -40) currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel(); startCarousel();
    });
}

function startTopBanner() {
    const track = document.getElementById('capsule-track');
    if(!track) return;
    let slide = 0;
    setInterval(() => {
        slide = (slide + 1) % 2;
        track.style.transform = `translateX(-${slide * 50}%)`;
    }, 4000);
}
