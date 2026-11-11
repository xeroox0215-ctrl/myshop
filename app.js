const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const ADMIN_ID = 1494459013; 

// Хранилище промокодов и скидки пользователя
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
        if (user.id === ADMIN_ID) document.getElementById('nav-admin').style.display = 'flex';
    }

    createDecor('bg-decor', 10);        
    startCarousel();
    startTopBanner();
    
    // Применяем скидку при загрузке, если она есть
    updatePricesWithDiscount();
});

// ... стандартные функции createDecor, switchTab, openModal, toggleFaq, startCarousel, startTopBanner ...

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

// ЛОГИКА ПРОМОКОДОВ
function createPromoCode() {
    const name = document.getElementById('admin-promo-name').value.toUpperCase().trim();
    const uses = parseInt(document.getElementById('admin-promo-uses').value);
    const discount = parseInt(document.getElementById('admin-promo-discount').value);

    if (!name || isNaN(uses) || isNaN(discount) || uses < 1 || uses > 1000 || discount < 1 || discount > 100) {
        alert('Заполните все поля корректно (активации 1-1000, скидка 1-100%)!');
        return;
    }

    promoCodes.push({ code: name, uses: uses, discount: discount });
    localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
    
    alert(`Промокод ${name} успешно создан!\nСкидка: ${discount}%\nАктиваций: ${uses}`);
    
    // Очистка
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
            // Применяем скидку
            userDiscount = promo.discount;
            localStorage.setItem('userDiscount', userDiscount);
            
            // Уменьшаем кол-во активаций
            promoCodes[promoIndex].uses -= 1;
            localStorage.setItem('promoCodes', JSON.stringify(promoCodes));

            statusText.style.display = 'block';
            statusText.innerText = `Промокод активирован! Скидка ${promo.discount}% на все товары.`;
            
            updatePricesWithDiscount();
            document.getElementById('promo-input').value = '';
        } else {
            alert('Этот промокод больше не действует (закончились активации).');
        }
    } else {
        alert('Такого промокода не существует!');
    }
}

// ОБНОВЛЕНИЕ ЦЕН НА САЙТЕ
function updatePricesWithDiscount() {
    if (userDiscount === 0) return;

    // Функция для пересчета цены
    function calcPrice(basePrice) {
        return Math.floor(basePrice - (basePrice * (userDiscount / 100)));
    }

    // Реклама
    document.querySelectorAll('.ads-price-item').forEach(item => {
        const basePrice = parseInt(item.getAttribute('data-base-price'));
        const priceText = item.querySelector('.price-text');
        
        if (basePrice && priceText) {
            const finalPrice = calcPrice(basePrice);
            priceText.innerHTML = `<span class="old-price">${basePrice} ⭐</span> <span class="new-price">${finalPrice} ⭐</span><span class="discount-badge">Скидка ${userDiscount}%</span>`;
        }
    });

    // Приватка (упрощенно)
    const privateItem = document.getElementById('private-price-item');
    if (privateItem) {
        const base = parseInt(privateItem.getAttribute('data-base-price'));
        const finalPrice = calcPrice(base);
        privateItem.querySelector('.price-text').innerHTML = `<span class="old-price">${base} ⭐</span> <span class="new-price">${finalPrice} ⭐</span><span class="discount-badge">Скидка ${userDiscount}%</span>`;
    }
}

// Кнопки админа (демо)
function adminAction(action) {
    if (action === 'paid') alert('Оплачено! Клиент уведомлен.');
    else if (action === 'next') alert('В архив.');
    else if (action === 'reject') alert('Отклонено. Клиент уведомлен.');
}

// Покупка
let currentProduct = {};
function openBuyMenu(name, starsPrice, uahPrice) {
    currentProduct = { name: name, stars: starsPrice, uah: uahPrice };
    document.getElementById('buy-title').innerText = name;
    openModal('buy-modal');
}
function selectPayment(type) {
    closeModal('buy-modal');
    if (type === 'stars') openModal('stars-modal');
    else if (type === 'uah') openModal('uah-modal');
}
function submitOrder() {
    alert('Заказ отправлен администратору!');
    closeModal('stars-modal');
    closeModal('uah-modal');
}

// Карусель
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
