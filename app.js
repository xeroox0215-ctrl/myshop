const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
    }, 2000);

    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        document.getElementById('user-tag').innerText = user.username ? '@' + user.username : 'нет юзернейма';
        
        if (user.photo_url) {
            const avatar = document.getElementById('user-avatar');
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.innerText = ''; 
            const profileAvatar = document.getElementById('profile-page-avatar');
            profileAvatar.style.backgroundImage = `url(${user.photo_url})`;
            profileAvatar.innerText = '';
        }
        document.getElementById('profile-page-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.getElementById('profile-page-id').innerText = `ID: ${user.id}`;

        // Админка
        const MY_ADMIN_ID = 1494459013; 
        if (user.id === MY_ADMIN_ID) {
            // Тут можно включить кнопку админки, если она нужна
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

// Модалки
function openNotificationsModal() { document.getElementById('notify-modal').classList.add('active'); }
function closeNotificationsModal() { document.getElementById('notify-modal').classList.remove('active'); }
function openAdsModal() { document.getElementById('ads-modal').classList.add('active'); }
function closeAdsModal() { document.getElementById('ads-modal').classList.remove('active'); }
function openSupportModal() { document.getElementById('support-modal').classList.add('active'); }
function closeSupportModal() { document.getElementById('support-modal').classList.remove('active'); }

// НОВЫЕ МОДАЛКИ
function openAboutModal() { document.getElementById('about-modal').classList.add('active'); }
function closeAboutModal() { document.getElementById('about-modal').classList.remove('active'); }
function openRulesModal() { document.getElementById('rules-modal').classList.add('active'); }
function closeRulesModal() { document.getElementById('rules-modal').classList.remove('active'); }

function toggleFaq(button) {
    const item = button.parentElement;
    item.classList.toggle('active');
}

function sendSupportMessage() {
    const text = document.getElementById('support-message').value;
    if (text.trim() === '') { alert('Напишите текст сообщения!'); return; }
    alert('Сообщение отправлено в поддержку!');
    document.getElementById('support-message').value = '';
    closeSupportModal();
}

// КАРУСЕЛЬ
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
