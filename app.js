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
        // Твой ID для админки
        const MY_ADMIN_ID = 123456789; 
        if (user.id === MY_ADMIN_ID) {
            document.getElementById('admin-nav-tab').style.display = 'flex';
            document.getElementById('admin-menu-btn').style.display = 'flex';
        }
    }

    // Генерация декора
    createDecor('bg-decor', 20);        // На фоне (много)
    createDecor('banner-decor-1', 5);   // В 1 баннере
    createDecor('banner-decor-2', 5);   // Во 2 баннере

    startCarousel();
});

// Функция для создания летающих элементов
function createDecor(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const images = ['listok.png', 'zvezda.png', 'derevo.png'];

    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.classList.add('floating-decor');
        
        // Случайная картинка
        const randomImg = images[Math.floor(Math.random() * images.length)];
        div.style.backgroundImage = `url('${randomImg}')`;
        
        // Размер (маленькие для баннера, чуть больше для фона)
        const isBanner = containerId.includes('banner');
        const size = isBanner ? (Math.random() * 15 + 10) : (Math.random() * 25 + 15);
        div.style.width = size + 'px';
        div.style.height = size + 'px';
        
        // Позиция и скорость
        div.style.left = Math.random() * 100 + '%';
        div.style.animationDuration = (Math.random() * 10 + 15) + 's'; // Медленно летят
        div.style.animationDelay = (Math.random() * 10) + 's';
        
        container.appendChild(div);
    }
}

// Логика карусели
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

    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 6000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(carouselInterval);
            startCarousel();
        });
    });

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

function openPanel(panelName) {
    console.log('Открытие панели:', panelName);
}
