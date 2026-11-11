const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 

let promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
let userDiscount = parseInt(localStorage.getItem('userDiscount')) || 0;

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

        // ПРОВЕРКА НА АДМИНА
        if (user.id === ADMIN_ID) {
            document.getElementById('btn-admin-main').style.display = 'flex';
        }
    }

    createDecor('bg-decor', 10);        
    startCarousel();
    startTopBanner();
});

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

function createPromoCode() {
    const name = document.getElementById('admin-promo-name').value.toUpperCase().trim();
    const uses = parseInt(document.getElementById('admin-promo-uses').value);
    const discount = parseInt(document.getElementById('admin-promo-discount').value);

    if (!name || isNaN(uses) || isNaN(discount)) {
        alert('Заполните все поля!'); return;
    }

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
        } else {
            alert('Промокод закончился!');
        }
    } else {
        alert('Такого промокода нет!');
    }
}

function adminAction(action) {
    if (action === 'paid') alert('Оплачено!');
    else if (action === 'next') alert('В архив.');
    else if (action === 'reject') alert('Отклонено.');
}

let currentProduct = {};
function openBuyMenu(name, price) {
    currentProduct = { name: name, price: price };
    document.getElementById('buy-title').innerText = name;
    openModal('buy-modal');
}
function submitOrder() { alert('Заказ отправлен!'); closeModal('buy-modal'); }

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
