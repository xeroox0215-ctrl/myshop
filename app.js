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

        // ВСТАВЬ СЮДА СВОЙ ID (узнать у @userinfobot)
        const MY_ADMIN_ID = 123456789; 
        if (user.id === MY_ADMIN_ID) {
            document.getElementById('admin-tab').style.display = 'flex';
        }
    }

    createBackgroundEmojis();
    startCarousel();
});

function createBackgroundEmojis() {
    const bgContainer = document.getElementById('bg-animations');
    const emojis = ['🎃', '👻', '🕸️', '🦇', '💀', '🍬', '🕷️', '🧙‍♂️', '🧹'];
    const count = 20; 

    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.classList.add('floating-emoji');
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        span.style.left = Math.random() * 100 + 'vw';
        span.style.animationDuration = (Math.random() * 8 + 8) + 's';
        span.style.animationDelay = (Math.random() * 5) + 's';
        
        const size = Math.random() * 30 + 20; 
        span.style.fontSize = size + 'px';
        
        bgContainer.appendChild(span);
    }
}

let currentSlide = 0;
let carouselInterval;

function startCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = dots.length;

    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 4000);
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    console.log('Переключение на вкладку:', tabName);
}

function openPanel(panelName) {
    console.log('Открытие панели:', panelName);
}
