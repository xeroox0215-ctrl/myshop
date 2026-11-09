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
        // ВСТАВЬ СЮДА СВОЙ ID
        const MY_ADMIN_ID = 123456789; 
        if (user.id === MY_ADMIN_ID) document.getElementById('admin-tab').style.display = 'flex';
    }

    createSpaceBlocks();
    createPetals();
    startCarousel();
    setTimeout(skipSplash, 1500);
});

function skipSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash && !splash.classList.contains('hidden')) splash.classList.add('hidden');
}

function createSpaceBlocks() {
    const bgContainer = document.getElementById('bg-animations');
    // Красивые 3D-блоки травы и алмазов без фона (PNG)
    const blocks = [
        'https://cdn-icons-png.flaticon.com/512/6941/6941697.png', // Блок травы
        'https://cdn-icons-png.flaticon.com/512/6941/6941683.png'  // Блок алмаза
    ];
    for (let i = 0; i < 15; i++) {
        const div = document.createElement('div');
        div.classList.add('floating-block');
        div.style.backgroundImage = `url('${blocks[Math.floor(Math.random() * blocks.length)]}')`;
        div.style.left = Math.random() * 100 + 'vw';
        div.style.animationDuration = (Math.random() * 15 + 15) + 's';
        div.style.animationDelay = (Math.random() * 5) + 's';
        const size = Math.random() * 30 + 20;
        div.style.width = size + 'px'; 
        div.style.height = size + 'px';
        bgContainer.appendChild(div);
    }
}

// Маленькие и редкие лепестки сакуры
function createPetals() {
    const container = document.getElementById('petals-1');
    if (!container) return;
    
    // Всего 6 лепестков
    for (let i = 0; i < 6; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        
        // Очень маленький размер (от 3 до 6 пикселей)
        const size = Math.random() * 3 + 3; 
        petal.style.width = size + 'px'; 
        petal.style.height = size + 'px';
        
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (Math.random() * 4 + 4) + 's'; // Медленно падают
        petal.style.animationDelay = (Math.random() * 5) + 's';
        
        container.appendChild(petal);
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
        track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
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

function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function openPanel(panelName) {
    console.log('Открытие панели:', panelName);
}
