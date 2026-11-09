// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на весь экран

// Получаем данные пользователя
const user = tg.initDataUnsafe?.user;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Установка данных профиля
    if (user) {
        document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.getElementById('user-tag').innerText = user.username ? '@' + user.username : '';
        
        // Если есть фото профиля
        if (user.photo_url) {
            const avatar = document.getElementById('user-avatar');
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.innerText = ''; // Убираем эмодзи
        }

        // Проверка на админа (ВСТАВЬ СЮДА СВОЙ TELEGRAM ID)
        // Узнать свой ID можно у бота @userinfobot
        const MY_ADMIN_ID = 123456789; // <--- ЗАМЕНИ НА СВОЙ ID
        if (user.id === MY_ADMIN_ID) {
            document.getElementById('admin-tab').style.display = 'flex';
        }
    }

    // 2. Генерация плавающих эмодзи на фоне (наши плюшки)
    createBackgroundEmojis();

    // 3. Запуск карусели
    startCarousel();
});

// --- ФУНКЦИЯ ДЛЯ ФОНА ---
function createBackgroundEmojis() {
    const bgContainer = document.getElementById('bg-animations');
    const emojis = ['🎃', '👻', '🕸️', '🦇', '💀', '🍬', '🕷️']; // Эмодзи
    const count = 15; // Количество эмодзи на экране

    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.classList.add('floating-emoji');
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Рандомное расположение и скорость
        span.style.left = Math.random() * 100 + 'vw';
        span.style.animationDuration = (Math.random() * 10 + 10) + 's'; // от 10 до 20 секунд
        span.style.animationDelay = (Math.random() * 5) + 's';
        span.style.fontSize = (Math.random() * 20 + 16) + 'px'; // от 16 до 36 px
        
        bgContainer.appendChild(span);
    }
}

// --- ФУНКЦИЯ ДЛЯ КАРУСЕЛИ ---
let currentSlide = 0;
let carouselInterval;

function startCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = dots.length;

    function updateCarousel() {
        // Двигаем ленту
        track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
        
        // Обновляем точки
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // Автопрокрутка каждые 4 секунды
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 4000);

    // Ручное переключение по клику на точку (можно добавить свайп)
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(carouselInterval); // Сброс таймера при клике
            startCarousel(); // Перезапуск таймера
        });
    });
}

// --- ФУНКЦИИ НАВИГАЦИИ (Заглушки) ---
function switchTab(tabName) {
    // Меняем активную кнопку в нижнем меню
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Тут в будущем будет загрузка контента для вкладки
    console.log('Переключение на вкладку:', tabName);
}

function openPanel(panelName) {
    // Тут в будущем будет открытие панелей (Реклама, Новости и т.д.)
    console.log('Открытие панели:', panelName);
}
