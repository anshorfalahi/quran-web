
document.addEventListener('DOMContentLoaded', () => {
    const surahList = document.getElementById('surah-list');
    const searchInput = document.getElementById('search');

    let surahs = [];

    // Fetch daftar surah dari API
    async function fetchSurahs() {
        try {
            const cacheKey = 'surah-list';
            if (!navigator.onLine && localStorage.getItem(cacheKey)) {
                surahs = JSON.parse(localStorage.getItem(cacheKey));
                renderSurahs();
                return;
            }

            const response = await fetch('https://quran-api-idn.vercel.app/surahs');
            surahs = await response.json();

            // Simpan ke cache (localStorage)
            localStorage.setItem(cacheKey, JSON.stringify(surahs));

            renderSurahs();
        } catch (error) {
            console.error('Gagal mengambil data surah:', error);
            surahList.innerHTML = '<p class="text-red-500">Gagal memuat data surah. Periksa koneksi internet.</p>';
        }
    }

    // Render daftar surah ke UI
    function renderSurahs(filter = '') {
        surahList.innerHTML = '';

        const filteredSurahs = surahs.filter(surah => {
            const query = filter.toLowerCase();
            return (
                surah.name.toLowerCase().includes(query) ||
                surah.translation.toLowerCase().includes(query)
            );
        });

        if (filteredSurahs.length === 0) {
            surahList.innerHTML = '<p>Tidak ditemukan surah dengan kata kunci tersebut.</p>';
            return;
        }

        filteredSurahs.forEach(surah => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700';
            card.innerHTML = `
                <h3 class="font-semibold">${surah.number}. ${surah.name} (${surah.translation})</h3>
                <p>Jumlah Ayat: ${surah.numberOfAyahs}</p>
                <p>Jenis: ${surah.revelation}</p>
            `;
            card.onclick = () => {
                window.location.href = `result.html?surah=${surah.number}`;
            };

            surahList.appendChild(card);
        });
    }

    // Event listener pencarian
    searchInput.addEventListener('input', (e) => {
        renderSurahs(e.target.value);
    });

    fetchSurahs();
});
