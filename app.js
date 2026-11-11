const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 

let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;
let orders = JSON.parse(localStorage.getItem('orders')) || [];

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
        if (user.id === ADMIN_ID) {
            document.getElementById('btn-admin-main').style.display = 'flex';
        }
        
        renderProfileOrders();
    }

    createDecor('bg-decor', 10);        
    startCarousel();
    startTopBanner();
});

// ... (все остальные функции как в прошлом сообщении) ...
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
function openNotificationsModal() { openModal('notify-modal'); }
function openSupportModal() { openModal('support-modal'); }
function openAboutModal() { openModal('about-modal'); }
function openRulesModal() { openModal('rules-modal'); }
function sendSupportMessage() { alert('Сообщение отправлено!'); closeModal('support-modal'); }

let currentProduct = {};
function openBuyMenu(name, price) {
    currentProduct = { name: name, price: price };
    document.getElementById('buy-title').innerText = name;
    openModal('buy-modal');
}

function submitOrder() {
    if(!user) { alert('Ошибка авторизации'); return; }
    const newOrder = {
        id: Date.now(),
        userName: user.first_name,
        userId: user.id,
        item: currentProduct.name,
        price: currentProduct.price,
        status: 'Ожидает проверки',
        date: new Date().toLocaleString()
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders)); 
    alert('Заказ отправлен администратору! Ожидайте проверки.');
    closeModal('buy-modal');
    renderProfileOrders();
}

function renderProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if(!container) return;
    container.innerHTML = ''; 
    const myOrders = orders.filter(o => o.userId === user.id);
    if (myOrders.length === 0) {
        container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">У вас пока нет заказов.</p>';
        return;
    }
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
    if (pendingOrders.length === 0) {
        container.innerHTML = '<p style="color:#b3b3b3; font-size:12px;">Новых заказов нет.</p>';
        return;
    }
    pendingOrders.forEach(order => {
        container.innerHTML += `
            <div class="admin-order-card glass-panel">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#fff; font-weight:800;">${order.item}</span>
                    <span style="color:var(--neon-pink); font-size:10px;">${order.userName}</span>
                </div>
                <p style="color:#b3b3b3; font-size:12px;">Сумма: ${order.price} ⭐</p>
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
        alert(`Статус заказа изменен на: ${newStatus}`);
    }
}

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
