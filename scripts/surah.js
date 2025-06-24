document.getElementById('back-btn').addEventListener('click', () => {
    window.history.back();
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const surahNumber = Number(urlParams.get('surah'));
    const ayahContainer = document.getElementById('ayah-list');
    const surahDetail = document.getElementById('surah-detail');

    let currentAudio = null;
    let isLoop = false;

    async function fetchSurah(number) {
        const cacheKey = `surah-${number}`;
        if (!navigator.onLine && localStorage.getItem(cacheKey)) {
            return JSON.parse(localStorage.getItem(cacheKey));
        }

        const response = await fetch(`https://quran-api-idn.vercel.app/surahs/${number}`);
        const surah = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(surah));
        return surah;
    }

    function renderSurah(surah) {

        surahDetail.innerHTML = `
            <h1 class="text-2xl font-bold">${surah.name} (${surah.translation})</h1>
            <p>${surah.description}</p>
        `;

        ayahContainer.innerHTML = '';
        surah.ayahs.forEach(ayah => {
            const ayahEl = document.createElement('div');
            ayahEl.id = `ayah-${ayah.number.inSurah}`;
            ayahEl.className = 'p-4 my-2 bg-white dark:bg-gray-800 shadow rounded cursor-pointer';

            ayahEl.innerHTML = `
                <p class="arabic-text text-right text-xl leading-loose">${applyTajwid(ayah.arab)}</p>
                <p>${ayah.translation}</p>
                <audio controls class="w-full mt-2 audio-player">
                    <source src="${ayah.audio.alafasy}">
                </audio>
                <button class="fav-btn mt-2">⭐ Favorit</button>
                <button class="tafsir-btn mt-2 ml-2">📖 Tafsir</button>
            `;

            // lanjutkan dengan listener seperti sebelumnya
            ayahContainer.appendChild(ayahEl);

            const favBtn = ayahEl.querySelector('.fav-btn');
            const ayahID = `${surah.number}:${ayah.number.inSurah}`;
            const favs = JSON.parse(localStorage.getItem('favs') || '[]');
            if (favs.includes(ayahID)) favBtn.textContent = '❌ Hapus Favorit';

            const audioEl = ayahEl.querySelector('audio');
            audioEl.playbackRate = 1;

            // Audio events
            audioEl.addEventListener('play', () => {
                if (currentAudio && currentAudio !== audioEl) currentAudio.pause();
                currentAudio = audioEl;
                ayahEl.scrollIntoView({ behavior: 'smooth' });
            });

            audioEl.addEventListener('ended', () => {
                if (isLoop) {
                    audioEl.play();
                } else {
                    const nextAudio = ayahEl.nextSibling?.querySelector('audio');
                    if (nextAudio) nextAudio.play();
                }
            });

            // Favorit
            ayahEl.querySelector('.fav-btn').addEventListener('click', (e) => {
                let favs = JSON.parse(localStorage.getItem('favs') || '[]');
                const ayahID = `${surah.number}:${ayah.number.inSurah}`;
                if (favs.includes(ayahID)) {
                    favs = favs.filter(f => f !== ayahID);
                    e.target.textContent = '⭐ Favorit';
                    alert('Bookmark dihapus.');
                } else {
                    favs.push(ayahID);
                    e.target.textContent = '❌ Hapus Favorit';
                    alert('Ditambahkan ke favorit.');
                }
                localStorage.setItem('favs', JSON.stringify(favs));
            });

            // Tafsir
            ayahEl.querySelector('.tafsir-btn').addEventListener('click', () => {
                showTafsirModal(ayah.tafsir, ayah);
            });
        });
    }

    function applyTajwid(arabText) {
        const rules = [
            // Nun Sukun & Tanwin
            { class: "izhar-halqi", regex: /(نْ|[ًٌٍ])(?=[ءعهحغخه])/g, desc: "Izhar Halqi" },
            { class: "idgham-bighunnah", regex: /(نْ|[ًٌٍ])(?=[ينمو])/g, desc: "Idgham Bighunnah" },
            { class: "idgham-bilaghunnah", regex: /(نْ|[ًٌٍ])(?=[لر])/g, desc: "Idgham Bilaghunnah" },
            { class: "iqlab", regex: /(نْ|[ًٌٍ])(?=ب)/g, desc: "Iqlab" },
            { class: "ikhfa-haqiqi", regex: /(نْ|[ًٌٍ])(?=[تثجدذزسشصضطظفقك])/g, desc: "Ikhfa Haqiqi" },

            // Mim Sukun
            { class: "ikhfa-syafawi", regex: /مْ(?=ب)/g, desc: "Ikhfa Syafawi" },
            { class: "idgham-mimi", regex: /مْ(?=م)/g, desc: "Idgham Mimi" },
            { class: "izhar-syafawi", regex: /مْ(?=[^مب\s])/g, desc: "Izhar Syafawi" },

            // Qalqalah
            { class: "qalqalah-sugra", regex: /[قطبجد]ْ(?!\s)/g, desc: "Qalqalah Sugra" },
            { class: "qalqalah-kubra", regex: /[قطبجد]ْ(?=\s|$)/g, desc: "Qalqalah Kubra" },

            // Ghunnah Musyaddah
            { class: "ghunnah-musyaddah", regex: /[نّمّ]/g, desc: "Ghunnah Musyaddah" },

            // Alif Lam
            { class: "idzhar-qamariyah", regex: /ال(?=[ءبجحخعغفقكموهي])/g, desc: "Idzhar Qamariyah" },
            { class: "idgham-syamsiyah", regex: /ال(?=[تثدذرزسشصضطظلن])/g, desc: "Idgham Syamsiyah" },

            // Mad
            { class: "mad-wajib", regex: /[َُِ][اوي](?=ء)/g, desc: "Mad Wajib Muttashil" },
            { class: "mad-jaiz", regex: /[َُِ][اوي](?=\sء)/g, desc: "Mad Jaiz Munfashil" },
            { class: "mad-aridh", regex: /[َُِ][اوي](?=\s|$)/g, desc: "Mad Aridh Lissukun" },
            { class: "mad-thabii", regex: /[َُِ][اوي]/g, desc: "Mad Thabi'i" },
            { class: "mad-layyin", regex: /َ[وي]ْ/g, desc: "Mad Layyin" },
            { class: "mad-badal", regex: /ء[َُِ][اوي]/g, desc: "Mad Badal" },
            { class: "mad-iwad", regex: /ً(?=\s|$)/g, desc: "Mad Iwad" },

            // Idgham serupa
            { class: "idgham-mutajanisain", regex: /طْت|دْت|تْد/g, desc: "Idgham Mutajanisain" },
            { class: "idgham-mutamathilain", regex: /([^\s])ْ(?=\1)/g, desc: "Idgham Mutamathilain" },
            { class: "idgham-mutaqaribain", regex: /لْر|قْك/g, desc: "Idgham Mutaqaribain" },
        ];

        // Jalankan semua regex dan bungkus match dengan span
        for (const rule of rules) {
            arabText = arabText.replace(rule.regex, match =>
                `<span class="tajwid ${rule.class}" title="${rule.desc}">${match}</span>`
            );
        }

        return arabText;
    }



    // Navigation Surah
    document.getElementById('prev-surah').addEventListener('click', () => {
        if (surahNumber > 1) location.href = `result.html?surah=${surahNumber - 1}`;
    });

    document.getElementById('next-surah').addEventListener('click', () => {
        if (surahNumber < 114) location.href = `result.html?surah=${surahNumber + 1}`;
    });

    // Loop Control & Speed
    document.querySelector('.controls').insertAdjacentHTML('beforeend', `
        <button id="loop-btn">🔁 Loop</button>
        <select id="speed-control" class="border rounded p-1 ml-2">
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
        </select>
        <input id="goto-ayah" type="number" min="1" placeholder="Ke ayat..." class="border rounded p-1 ml-2 w-24">
        <button id="goto-btn" class="ml-1 p-1 border rounded">Go</button>
    `);

    document.getElementById('loop-btn').addEventListener('click', (e) => {
        isLoop = !isLoop;
        e.target.style.color = isLoop ? 'green' : 'black';
    });

    document.getElementById('speed-control').addEventListener('change', (e) => {
        const speed = parseFloat(e.target.value);
        document.querySelectorAll('audio').forEach(a => a.playbackRate = speed);
    });

    document.getElementById('goto-btn').addEventListener('click', () => {
        const ayatNum = document.getElementById('goto-ayah').value;
        const ayatEl = document.getElementById(`ayah-${ayatNum}`);
        if (ayatEl) ayatEl.scrollIntoView({ behavior: 'smooth' });
        else alert('Ayat tidak ditemukan.');
    });

    fetchSurah(surahNumber).then(renderSurah);
});

function showTafsirModal(tafsir, ayah) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content relative">
            <span class="modal-close text-xl">&times;</span>
            <h2 class="font-bold text-xl mb-2">Tafsir Ayat ${ayah.number.inSurah}</h2>
            
            <h3 class="font-semibold mt-4">Kemenag:</h3>
            <p>${tafsir.kemenag.long}</p>

            <h3 class="font-semibold mt-4">Quraish Shihab:</h3>
            <p>${tafsir.quraish}</p>

            <h3 class="font-semibold mt-4">Jalalayn:</h3>
            <p>${tafsir.jalalayn}</p>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

document.getElementById('tajwid-info').onclick = () => {
    const tajwidDetail = `
        <table class="w-full text-left table-auto">
            <thead>
                <tr class="border-b">
                    <th class="py-2">Tajwid</th>
                    <th class="py-2">Huruf/Kondisi</th>
                    <th class="py-2">Warna</th>
                    <th class="py-2">Penjelasan</th>
                </tr>
            </thead>
            <tbody>
                <!-- Nun Sukun & Tanwin -->
                <tr>
                    <td>Izhar Halqi</td>
                    <td>نْ / tanwin bertemu ء ه ع ح غ خ</td>
                    <td><span style="color:#22c55e;">Hijau</span></td>
                    <td>Dibaca jelas tanpa dengung (jelas di tenggorokan).</td>
                </tr>
                <tr>
                    <td>Idgham Bighunnah</td>
                    <td>نْ / tanwin bertemu ي ن م و</td>
                    <td><span style="color:#facc15;">Kuning Cerah</span></td>
                    <td>Dilebur dengan dengung sempurna 2 harakat.</td>
                </tr>
                <tr>
                    <td>Idgham Bilaghunnah</td>
                    <td>نْ / tanwin bertemu ل ر</td>
                    <td><span style="color:#eab308;">Kuning Tua</span></td>
                    <td>Dilebur tanpa dengung.</td>
                </tr>
                <tr>
                    <td>Iqlab</td>
                    <td>نْ / tanwin bertemu ب</td>
                    <td><span style="color:#a855f7;">Ungu</span></td>
                    <td>Nun berubah menjadi mim dengan dengung.</td>
                </tr>
                <tr>
                    <td>Ikhfa Haqiqi</td>
                    <td>نْ / tanwin bertemu ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك</td>
                    <td><span style="color:#06b6d4;">Biru Muda</span></td>
                    <td>Dibaca samar dengan dengung ringan.</td>
                </tr>

                <!-- Mim Sukun -->
                <tr>
                    <td>Ikhfa Syafawi</td>
                    <td>مْ bertemu ب</td>
                    <td><span style="color:#0ea5e9;">Biru Langit</span></td>
                    <td>Dibaca samar di bibir dengan dengung.</td>
                </tr>
                <tr>
                    <td>Idgham Mimi</td>
                    <td>مْ bertemu م</td>
                    <td><span style="color:#ec4899;">Pink</span></td>
                    <td>Dilebur dengan dengung.</td>
                </tr>
                <tr>
                    <td>Izhar Syafawi</td>
                    <td>مْ bertemu selain م ب</td>
                    <td><span style="color:#10b981;">Hijau Emerald</span></td>
                    <td>Dibaca jelas di bibir tanpa dengung.</td>
                </tr>

                <!-- Qalqalah -->
                <tr>
                    <td>Qalqalah Sugra</td>
                    <td>ق ط ب ج د sukun di tengah kata</td>
                    <td><span style="color:#f97316;">Oranye Terang</span></td>
                    <td>Pantulan ringan di tengah bacaan.</td>
                </tr>
                <tr>
                    <td>Qalqalah Kubra</td>
                    <td>ق ط ب ج د sukun di akhir ayat</td>
                    <td><span style="color:#ea580c;">Oranye Gelap</span></td>
                    <td>Pantulan lebih kuat di akhir bacaan.</td>
                </tr>

                <!-- Ghunnah -->
                <tr>
                    <td>Ghunnah Musyaddah</td>
                    <td>نّ atau مّ (bertasydid)</td>
                    <td><span style="color:#ef4444;">Merah</span></td>
                    <td>Dibaca dengung sempurna 2 harakat.</td>
                </tr>

                <!-- Alif Lam -->
                <tr>
                    <td>Idzhar Qamariyah</td>
                    <td>ال bertemu huruf Qamariyah (ء ب ج ح خ ع غ ف ق ك م و ه ي)</td>
                    <td><span style="color:#84cc16;">Hijau Limau</span></td>
                    <td>Lam dibaca jelas.</td>
                </tr>
                <tr>
                    <td>Idgham Syamsiyah</td>
                    <td>ال bertemu huruf Syamsiyah (ت ث د ذ ر ز س ش ص ض ط ظ ل ن)</td>
                    <td><span style="color:#fb7185;">Rose</span></td>
                    <td>Lam dilebur ke huruf berikutnya.</td>
                </tr>

                <!-- Mad -->
                <tr>
                    <td>Mad Wajib Muttashil</td>
                    <td>Mad bertemu hamzah dalam satu kata</td>
                    <td><span style="color:#dc2626;">Merah Tua</span></td>
                    <td>Wajib panjang 4-6 harakat.</td>
                </tr>
                <tr>
                    <td>Mad Jaiz Munfashil</td>
                    <td>Mad bertemu hamzah beda kata</td>
                    <td><span style="color:#f43f5e;">Rose Tua</span></td>
                    <td>Boleh panjang 2-6 harakat.</td>
                </tr>
                <tr>
                    <td>Mad Aridh Lissukun</td>
                    <td>Mad sebelum huruf terakhir yang disukunkan (waqaf)</td>
                    <td><span style="color:#9333ea;">Violet</span></td>
                    <td>Boleh panjang 2-6 harakat.</td>
                </tr>
                <tr>
                    <td>Mad Thabi'i</td>
                    <td>ا و ي setelah harakat biasa</td>
                    <td><span style="color:#2563eb;">Biru Royal</span></td>
                    <td>Panjang asli 2 harakat.</td>
                </tr>

                <tr>
                    <td>Mad Layyin</td>
                    <td>Fathah bertemu وْ atau يْ</td>
                    <td><span style="color:#64748b;">Slate Abu-abu</span></td>
                    <td>Bacaan lembut 2 harakat.</td>
                </tr>

                <tr>
                    <td>Mad Badal</td>
                    <td>Hamzah diikuti mad (ءَا, ءُو, ءِي)</td>
                    <td><span style="color:#0d9488;">Teal</span></td>
                    <td>Panjang 2 harakat.</td>
                </tr>

                <tr>
                    <td>Mad Iwad</td>
                    <td>Tanwin fathah di akhir ayat (waqaf)</td>
                    <td><span style="color:#ca8a04;">Kuning Emas</span></td>
                    <td>Panjang 2 harakat.</td>
                </tr>

                <!-- Idgham lain -->
                <tr>
                    <td>Idgham Mutajanisain</td>
                    <td>Dua huruf berbeda sifat tapi satu makhraj (ط-ت, د-ت)</td>
                    <td><span style="color:#7c3aed;">Ungu Tua</span></td>
                    <td>Dileburkan.</td>
                </tr>

                <tr>
                    <td>Idgham Mutamathilain</td>
                    <td>Dua huruf sama bertemu, yang pertama sukun</td>
                    <td><span style="color:#0369a1;">Biru Gelap</span></td>
                    <td>Dileburkan jelas.</td>
                </tr>

                <tr>
                    <td>Idgham Mutaqaribain</td>
                    <td>Dua huruf makhraj/sifat mirip (ل-ر, ق-ك)</td>
                    <td><span style="color:#c026d3;">Fuchsia</span></td>
                    <td>Dileburkan ringan.</td>
                </tr>
            </tbody>
        </table>
    `;
    showTajwidInfoModal(tajwidDetail);
};




function showTajwidInfoModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close text-xl">&times;</span>
            <h2 class="font-bold text-xl mb-2">Penjelasan Hukum Tajwid</h2>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}
