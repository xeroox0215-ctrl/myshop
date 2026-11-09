const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Данные профиля
    if (user) {
        document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.getElementById('user-tag').innerText = user.username ? '@' + user.username : '';
        
        if (user.photo_url) {
            const avatar = document.getElementById('user-avatar');
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.innerText = ''; 
        }

        const MY_ADMIN_ID = 123456789; 
        if (user.id === MY_ADMIN_ID) {
            document.getElementById('admin-tab').style.display = 'flex';
        }
    }

    // 2. Генерация фона и лепестков
    createSpaceBlocks();
    createPetals();

    // 3. Запуск карусели
    startCarousel();

    // 4. Скрытие заставки
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
    }, 2500);
});

// Космические блоки
function createSpaceBlocks() {
    const bgContainer = document.getElementById('bg-animations');
    const blocks = [
        'https://i.ibb.co/L5mYj8Y/grass.png',
        'https://i.ibb.co/2q6Y4yK/diamond.png',
        'https://i.ibb.co/9mN1Y2t/gold.png',
        'https://i.ibb.co/6P4q6g2/redstone.png'
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

// Лепестки сакуры
function createPetals() {
    const container = document.getElementById('petals-1');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 8 + 6;
        petal.style.width = size + 'px'; 
        petal.style.height = size + 'px';
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (Math.random() * 3 + 3) + 's';
        petal.style.animationDelay = (Math.random() * 5) + 's';
        container.appendChild(petal);
    }
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
    const totalSlides = dots.length;

    // Функция обновления позиции
    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // Автопрокрутка (каждые 6 секунд)
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 6000);

    // Клик по точкам
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(carouselInterval);
            startCarousel();
        });
    });

    // --- СВАЙП ПАЛЬЦЕМ ---
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        clearInterval(carouselInterval); // Останавливаем автопрокрутку при касании
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        let endX = e.changedTouches[0].clientX;
        let diff = startX - endX;

        // Если свайп больше 40 пикселей
        if (diff > 40) {
            // Свайп влево (следующий слайд)
            currentSlide = (currentSlide + 1) % totalSlides;
        } else if (diff < -40) {
            // Свайп вправо (предыдущий слайд)
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        }
        
        updateCarousel();
        startCarousel(); // Перезапускаем таймер
    });
}

// Заглушки для кнопок
function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function openPanel(panelName) {
    console.log('Открытие панели:', panelName);
}
