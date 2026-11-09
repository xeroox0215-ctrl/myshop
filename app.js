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
    }

    createGlobalPetals();
    createBannerPetals();
    startCarousel();
});

// Лепестки на всем фоне
function createGlobalPetals() {
    const container = document.getElementById('petals-bg');
    for (let i = 0; i < 15; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal-global');
        const size = Math.random() * 6 + 4;
        petal.style.width = size + 'px'; petal.style.height = size + 'px';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 5 + 5) + 's';
        petal.style.animationDelay = (Math.random() * 5) + 's';
        container.appendChild(petal);
    }
}

// Лепестки внутри баннера
function createBannerPetals() {
    const container = document.getElementById('petals-1');
    if (!container) return;
    for (let i = 0; i < 10; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 8 + 5;
        petal.style.width = size + 'px'; petal.style.height = size + 'px';
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (Math.random() * 3 + 3) + 's';
        petal.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(petal);
    }
}

// Карусель
let currentSlide = 0;
let carouselInterval;
const track = document.getElementById('carousel-track');
const dots = document.querySelectorAll('.dot');
const totalSlides = dots.length;

function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 50}%)`;
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
}

function startCarousel() {
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(carouselInterval);
            startCarousel();
        });
    });
}
