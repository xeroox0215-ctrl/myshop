const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;

document.addEventListener('DOMContentLoaded', () => {
    if (user) {
        document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.getElementById('user-tag').innerText = user.username ? '@' + user.username : '';
        if (user.photo_url) {
            const avatar = document.getElementById('user-avatar');
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.innerText = ''; 
        }
        
        // ТВОЙ ID (Админка)
        const MY_ADMIN_ID = 1494459013; 
        if (user.id === MY_ADMIN_ID) {
            document.getElementById('admin-nav-tab').style.display = 'flex';
            document.getElementById('admin-menu-btn').style.display = 'flex';
        }
    }

    createDecor('bg-decor', 15);        
    createDecor('banner-decor-1', 6);   
    createDecor('banner-decor-2', 6);   
    startCarousel();
});

function createDecor(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const images = ['listok.png', 'zvezda.png', 'derevo.png'];
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.classList.add('floating-decor');
        div.style.backgroundImage = `url('${images[Math.floor(Math.random() * images.length)]}')`;
        const size = containerId.includes('banner') ? (Math.random() * 15 + 10) : (Math.random() * 25 + 20);
        div.style.width = size + 'px'; div.style.height = size + 'px';
        div.style.left = Math.random() * 90 + '%';
        div.style.top = Math.random() * 80 + 'vh';
        div.style.animationDuration = (Math.random() * 15 + 15) + 's'; 
        div.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(div);
    }
}

let currentSlide = 0;
let carouselInterval;
let startX = 0;
let isDragging = false;

function startCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    const container = document.getElementById('carousel');
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

// --- ЛОГИКА МОДАЛЬНОГО ОКНА РЕКЛАМЫ ---
function openAdsModal() {
    document.getElementById('ads-modal').classList.add('active');
}

function closeAdsModal() {
    document.getElementById('ads-modal').classList.remove('active');
}

function selectAds(name, price) {
    alert(`Вы выбрали: ${name}\nЦена: ${price} звёзд\n(Тут будет логика оплаты)`);
}

function showPinPrice() {
    alert(`Закреп сообщения в ТГК стоит 100 звёзд.\n(Тут будет логика оплаты)`);
}

function openPanel(panelName) {
    console.log('Открытие панели:', panelName);
}
