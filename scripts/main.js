document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toggleThemeBtn = document.getElementById('toggle-theme');

    // Inisialisasi tema dari localStorage
    function initTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            html.classList.add('dark');
            toggleThemeBtn.textContent = '☀️';
        } else {
            toggleThemeBtn.textContent = '🌙';
        }
    }

    toggleThemeBtn.addEventListener('click', () => {
        html.classList.toggle('dark');
        const isDark = html.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleThemeBtn.textContent = isDark ? '☀️' : '🌙';
    });

    initTheme();

    // Font Size Control
    function initFontSize() {
        const savedSize = localStorage.getItem('font-size') || 16;
        document.documentElement.style.fontSize = `${savedSize}px`;
    }

    function setFontSize(size) {
        document.documentElement.style.fontSize = `${size}px`;
        localStorage.setItem('font-size', size);
    }

    // Simple UI for font-size control (optional, can be added later)
    // Example usage: setFontSize(18);

    initFontSize();

    // Tema Warna Tambahan (Contoh: Biru/Hijau)
    function setThemeColor(color) {
        document.documentElement.style.setProperty('--theme-color', color);
        localStorage.setItem('theme-color', color);
    }

    function initThemeColor() {
        const color = localStorage.getItem('theme-color') || '#3b82f6';
        setThemeColor(color);
    }

    initThemeColor();

    // Simple caching untuk offline mode (Preferensi pengguna)
    window.addEventListener('online', () => {
        console.log('Koneksi internet tersedia.');
    });

    window.addEventListener('offline', () => {
        console.log('Koneksi internet terputus, mode offline aktif.');
    });

    // Daftar file untuk cache sederhana (bisa diperluas)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('ServiceWorker terdaftar: ', registration.scope);
        })
        .catch(err => {
            console.log('Gagal registrasi ServiceWorker: ', err);
        });
    }
});
