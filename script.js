// --- HTML Elementleri ---
let oyunAlani = document.getElementById('oyunAlani');
let ctx = oyunAlani ? oyunAlani.getContext('2d') : null;
if (!oyunAlani) {
    window.addEventListener('DOMContentLoaded', () => {
        oyunAlani = document.getElementById('oyunAlani');
        if (oyunAlani) {
            ctx = oyunAlani.getContext('2d');
            try { canvasBoyutunuAyarla(); } catch (e) { }
            try { baslangicEkraniniCiz(); } catch (e) { }
        }
    });
} else {
    // Canvas zaten yüklü, hemen boyutlandır
    try { canvasBoyutunuAyarla(); } catch (e) { }
    try { baslangicEkraniniCiz(); } catch (e) { }
}
const skorGostergesi = document.getElementById('skorGostergesi');
const kelimeGostergesi = document.getElementById('kelimeGostergesi');
const kelimeMetni = document.getElementById('kelimeMetni');
const yeniOyunBtn = document.getElementById('yeniOyunBtn');
const bulunanKelimelerListesi = document.getElementById('bulunanKelimelerListesi');
const tamEkranBtn = document.getElementById('tamEkranBtn');

const seviyeGostergesi = document.getElementById('seviyeGostergesi');
const zamanGostergesi = document.getElementById('zamanGostergesi');
const ilerlemeBarı = document.getElementById('ilerlemeBarı');
const sesToggle = document.getElementById('sesToggle');
const pauseBtn = document.getElementById('pauseBtn');
const temaSelect = document.getElementById('temaSelect'); // Tema seçici (varsa)

// --- Portal İkonları ---
const portalIkonlari = {
    merkez: new Image(),
    geri: new Image(),
    zaman: new Image(),
    duvar: new Image(),
    x2: new Image(),
    levelSkip: new Image()
};

// İkonları yükle
portalIkonlari.merkez.src = 'assets/portal_icons/merkez.png';
portalIkonlari.geri.src = 'assets/portal_icons/geri.png';
portalIkonlari.zaman.src = 'assets/portal_icons/zaman.png';
portalIkonlari.duvar.src = 'assets/portal_icons/duvar.png';
portalIkonlari.x2.src = 'assets/portal_icons/x2.png';
portalIkonlari.levelSkip.src = 'assets/portal_icons/level_skip.png';


// --- Oyun Sabitleri ---
const GRID_BOYUTU = 23;
let KARE_BOYUTU = oyunAlani ? (oyunAlani.width / GRID_BOYUTU) : 20;

const SEVIYELER = {
    1: { hedef: 4, sure: 60 },   // 4 harf
    2: { hedef: 6, sure: 75 },   // 6 harf
    3: { hedef: 8, sure: 90 },   // 8 harf
    4: { hedef: 10, sure: 105 }, // 10 harf
    5: { hedef: 12, sure: 120 }, // 12 harf
    6: { hedef: 14, sure: 135 }, // 14 harf
    7: { hedef: 16, sure: 150 }, // 16 harf
    8: { hedef: 18, sure: 165 }, // 18 harf
    9: { hedef: 20, sure: 180 }, // 20 harf
    10: { hedef: 22, sure: 200 } // 22 harf
};

// --- Hız Ayarları ---
const spmToMs = (spm) => (60 * 1000) / spm;

const HIZLAR = {
    1: 200,      // Seviye 1 - Yavaş başlangıç
    2: 220,      // Seviye 2
    3: 240,      // Seviye 3
    4: 260,      // Seviye 4
    5: 280,      // Seviye 5
    6: 300,      // Seviye 6
    7: 320,      // Seviye 7
    8: 340,      // Seviye 8
    9: 360,      // Seviye 9
    10: 380,     // Seviye 10 - Maksimum hız!
    default: 200 // Varsayılan SPM
};

// --- Renk Paleti (Klasik Tema) ---
const RENKLER = {
    onayKaresi: '#fbb6ce',    // Pastel Pembe
    yilanKafa: '#E74C3C',     // Kırmızı
    govdeRenkleri: ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF6'],
    harf: '#FF1493',
    harfStroke: '#00BFFF',
    beyazKare: '#FAFAFA',
    kahverengiKare: '#BDBDBD',
    arkaplan: '#0f0c29',      // Oyun alanı içi koyu lacivert (Klasik)
    panel: '#2c4a70',
    vurgu: '#00d4ff'
};

// Renk al
function getTemaRengi(renkAdi) {
    return RENKLER[renkAdi];
}

// Her harf için rastgele renk paletleri - Daha canlı!
const HARF_RENKLERI = [
    { ic: '#FF80AB', dis: '#E91E63' },  // Parlak Pembe
    { ic: '#40C4FF', dis: '#0277BD' },  // Parlak Mavi
    { ic: '#FFAB40', dis: '#FF6F00' },  // Parlak Turuncu
    { ic: '#E040FB', dis: '#AA00FF' },  // Parlak Mor
    { ic: '#FF5252', dis: '#D50000' },  // Parlak Kırmızı
    { ic: '#536DFE', dis: '#304FFE' },  // Parlak İndigo
    { ic: '#FF6E40', dis: '#DD2C00' },  // Ateş Kırmızısı
];

function getHarfRengi(harf, x, y) {
    // Harf ve pozisyona göre deterministik rastgele renk
    const seed = harf.charCodeAt(0) + x * 7 + y * 13;
    const index = seed % HARF_RENKLERI.length;
    return HARF_RENKLERI[index];
}

// --- Parçacık Sistemi ---
class Parçacık {
    constructor(x, y, renk, hız = 2) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * hız + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.renk = renk;
        this.boyut = Math.random() * 6 + 3;
        this.yaşam = 1.0;
        this.azalmaHızı = Math.random() * 0.015 + 0.01;
        this.gravity = 0.1;
    }

    güncelle() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.99;
        this.yaşam -= this.azalmaHızı;
        this.boyut *= 0.97;
    }

    çiz(ctx) {
        ctx.save();
        ctx.globalAlpha = this.yaşam;

        // Parlama efekti
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.boyut);
        gradient.addColorStop(0, this.renk);
        gradient.addColorStop(0.5, this.renk + '80');
        gradient.addColorStop(1, this.renk + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.boyut, 0, Math.PI * 2);
        ctx.fill();

        // Ekstra parlama
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.renk;
        ctx.fill();

        ctx.restore();
    }
}

function parçacıkEkle(x, y, sayı = 20) {
    const renkler = [getTemaRengi('vurgu'), getTemaRengi('yilanKafa'), '#ffd700', '#c4b5fd', '#ff3366'];
    for (let i = 0; i < sayı; i++) {
        const renk = renkler[Math.floor(Math.random() * renkler.length)];
        parçacıklar.push(new Parçacık(x, y, renk, 3));
    }
}

function parçacıklarıGüncelle() {
    for (let i = parçaciklar.length - 1; i >= 0; i--) {
        parçaciklar[i].güncelle();
        if (parçaciklar[i].yaşam <= 0) {
            parçaciklar.splice(i, 1);
        }
    }
}

function parçacıklarıÇiz(ctx) {
    parçaciklar.forEach(parçacık => parçacık.çiz(ctx));
}

// --- Canvas Boyutlandırma ---
function canvasBoyutunuAyarla() {
    if (!oyunAlani) {
        console.warn('Canvas elementi bulunamadı');
        return;
    }

    const tamEkran = document.fullscreenElement !== null;

    if (tamEkran) {
        // Tam ekranda maksimum kare boyutu - ekranın %98'ini kullan
        const ekranGenislik = window.innerWidth;
        const ekranYukseklik = window.innerHeight;
        const kullanilabilirGenislik = ekranGenislik * 0.98;
        const kullanilabilirYukseklik = ekranYukseklik * 0.98;
        const enKucukBoyut = Math.min(kullanilabilirGenislik, kullanilabilirYukseklik);
        const kareBoyut = Math.floor(enKucukBoyut / GRID_BOYUTU);
        oyunAlani.width = kareBoyut * GRID_BOYUTU;
        oyunAlani.height = kareBoyut * GRID_BOYUTU;
        KARE_BOYUTU = kareBoyut;
    } else {
        const container = oyunAlani.parentElement;
        if (container) {
            // Normal modda container'ın mümkün olan en büyük alanını kullan
            const containerGenislik = container.clientWidth - 10; // border için
            const containerYukseklik = container.clientHeight - 10;
            // Her iki boyutu da kullan, kare şeklini koru
            const containerBoyut = Math.min(containerGenislik, containerYukseklik);
            // Canvas boyutunu container'a göre ayarla
            oyunAlani.width = containerBoyut;
            oyunAlani.height = containerBoyut;
            KARE_BOYUTU = oyunAlani.width / GRID_BOYUTU;
        } else {
            // Fallback: default size - çok daha büyük
            oyunAlani.width = 920;
            oyunAlani.height = 920;
            KARE_BOYUTU = oyunAlani.width / GRID_BOYUTU;
        }
    }

    if (oyunAktif) {
        tumunuCiz();
    } else {
        baslangicEkraniniCiz();
    }
}



const UNLU_FREKANSLARI = [
    { harf: 'E', yuzde: 12.70 }, { harf: 'A', yuzde: 8.17 }, { harf: 'I', yuzde: 6.97 },
    { harf: 'O', yuzde: 7.51 }, { harf: 'U', yuzde: 2.76 }
];
const UNSUZ_FREKANSLARI = [
    { harf: 'T', yuzde: 9.06 }, { harf: 'N', yuzde: 6.75 }, { harf: 'S', yuzde: 6.33 },
    { harf: 'H', yuzde: 6.09 }, { harf: 'R', yuzde: 5.99 }, { harf: 'D', yuzde: 4.25 },
    { harf: 'L', yuzde: 4.03 }, { harf: 'C', yuzde: 2.78 }, { harf: 'M', yuzde: 2.41 },
    { harf: 'W', yuzde: 2.36 }, { harf: 'F', yuzde: 2.23 }, { harf: 'G', yuzde: 2.02 },
    { harf: 'Y', yuzde: 1.97 }, { harf: 'P', yuzde: 1.93 }, { harf: 'B', yuzde: 1.49 },
    { harf: 'V', yuzde: 0.98 }, { harf: 'K', yuzde: 0.77 }, { harf: 'J', yuzde: 0.15 },
    { harf: 'X', yuzde: 0.15 }, { harf: 'Q', yuzde: 0.10 }, { harf: 'Z', yuzde: 0.07 }
];

// --- Oyun Durumu Değişkenleri ---
let yilan, yon, harfler, mevcutKelime, skor, oyunBitti, yonDegisiyor;
let bulunanKelimeler, eklenecekParcaSayisi, anaDonguTimeoutId, zamanlayiciId;
let mevcutSeviye, kalanSure;
let oyunAktif = false;
let oyunPause = false;  // Pause durumu
let seviyeTamamlandi = false;  // Seviye tamamlandı, START bekleniyor
let beklenenSeviye = null;  // Başlatılacak seviye
let tekrarSeviye = null;  // Yanınca aynı seviyeden devam için
let kelimeOnaylaniyorMu = false;  // Kelime onaylama kilidi
const onayKaresi = { x: 11, y: 11 }; // 23x23 grid'de merkez
let geriAlKaresi = null;  // Geri al portalı
let ekstraSureKaresi = null;  // Zaman portalı
let x2Karesi = null;  // x2 puan portalı
let levelSkipKaresi = null;  // Seviye atlama portalı
let kelimeAlimGecmisi = []; // [{harf, x, y}]
let duvarKareleri = []; // [{x, y}] - Ceza duvarları


// --- Kelime Listesi ---
let kelimeListesi = new Set(); // Hızlı arama için Set kullanıyoruz
let kelimeListesiYuklendi = false;

// --- Animasyon Değişkenleri ---
let yilanAnimasyonOffset = 0;
let parçaciklar = [];

let animasyonHızı = 1;
let crashEffectActive = false;

// Geri al portalı ikonunu çiz
function cizGeriAlKaresi() {
    if (!geriAlKaresi) return;

    const x = geriAlKaresi.x * KARE_BOYUTU;
    const y = geriAlKaresi.y * KARE_BOYUTU;

    // İkon yüklendiyse çiz
    if (portalIkonlari.geri && portalIkonlari.geri.complete && portalIkonlari.geri.naturalWidth !== 0) {
        ctx.save();
        // Hafif nefes alma efekti
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const cx = x + KARE_BOYUTU / 2;
        const cy = y + KARE_BOYUTU / 2;

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.drawImage(portalIkonlari.geri, -KARE_BOYUTU / 2, -KARE_BOYUTU / 2, KARE_BOYUTU, KARE_BOYUTU);
        ctx.restore();
    } else {
        // Fallback
        ctx.save();
        ctx.fillStyle = '#ffd700'; // Sarı
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + KARE_BOYUTU / 2, y + KARE_BOYUTU / 2, KARE_BOYUTU * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}



// Merkez portal ikonunu çiz
function cizOnayKaresiVurgusu() {
    const x = onayKaresi.x * KARE_BOYUTU;
    const y = onayKaresi.y * KARE_BOYUTU;

    // İkon yüklendiyse çiz
    if (portalIkonlari.merkez && portalIkonlari.merkez.complete && portalIkonlari.merkez.naturalWidth !== 0) {
        ctx.save();
        // Hafif nefes alma efekti
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const merkezX = x + KARE_BOYUTU / 2;
        const merkezY = y + KARE_BOYUTU / 2;

        ctx.translate(merkezX, merkezY);
        ctx.scale(scale, scale);
        ctx.drawImage(portalIkonlari.merkez, -KARE_BOYUTU / 2, -KARE_BOYUTU / 2, KARE_BOYUTU, KARE_BOYUTU);
        ctx.restore();
    } else {
        // Fallback: İkon yoksa eski basit çizim
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbb6ce';
        ctx.strokeStyle = '#fbb6ce';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, KARE_BOYUTU - 4, KARE_BOYUTU - 4);
        ctx.restore();
    }
}

// Zaman portalı (+30 saniye) çiz
function cizEkstraSureKaresi() {
    if (!ekstraSureKaresi) return;
    const x = ekstraSureKaresi.x * KARE_BOYUTU;
    const y = ekstraSureKaresi.y * KARE_BOYUTU;

    if (portalIkonlari.zaman && portalIkonlari.zaman.complete && portalIkonlari.zaman.naturalWidth !== 0) {
        ctx.save();
        // Hafif nefes alma efekti (dönme yok, kareye tam oturur)
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const cx = x + KARE_BOYUTU / 2;
        const cy = y + KARE_BOYUTU / 2;

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.drawImage(portalIkonlari.zaman, -KARE_BOYUTU / 2, -KARE_BOYUTU / 2, KARE_BOYUTU, KARE_BOYUTU);
        ctx.restore();
    } else {
        // Fallback
        ctx.save();
        ctx.fillStyle = '#00BFFF';
        ctx.fillRect(x + 2, y + 2, KARE_BOYUTU - 4, KARE_BOYUTU - 4);
        ctx.restore();
    }
}

// x2 Puan portalını çiz
function cizX2Karesi() {
    if (!x2Karesi) return;
    const x = x2Karesi.x * KARE_BOYUTU;
    const y = x2Karesi.y * KARE_BOYUTU;

    if (portalIkonlari.x2 && portalIkonlari.x2.complete && portalIkonlari.x2.naturalWidth !== 0) {
        ctx.save();
        // Hafif nefes alma efekti
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const cx = x + KARE_BOYUTU / 2;
        const cy = y + KARE_BOYUTU / 2;

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.drawImage(portalIkonlari.x2, -KARE_BOYUTU / 2, -KARE_BOYUTU / 2, KARE_BOYUTU, KARE_BOYUTU);
        ctx.restore();
    } else {
        // Fallback
        ctx.save();
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x + 2, y + 2, KARE_BOYUTU - 4, KARE_BOYUTU - 4);
        ctx.fillStyle = 'white';
        ctx.font = 'bold ' + (KARE_BOYUTU * 0.5) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', x + KARE_BOYUTU / 2, y + KARE_BOYUTU / 2);
        ctx.restore();
    }
}

// Seviye atlama portalını çiz
function cizLevelSkipKaresi() {
    if (!levelSkipKaresi) return;
    const x = levelSkipKaresi.x * KARE_BOYUTU;
    const y = levelSkipKaresi.y * KARE_BOYUTU;

    if (portalIkonlari.levelSkip && portalIkonlari.levelSkip.complete && portalIkonlari.levelSkip.naturalWidth !== 0) {
        ctx.save();
        // Hafif nefes alma efekti
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        const cx = x + KARE_BOYUTU / 2;
        const cy = y + KARE_BOYUTU / 2;

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.drawImage(portalIkonlari.levelSkip, -KARE_BOYUTU / 2, -KARE_BOYUTU / 2, KARE_BOYUTU, KARE_BOYUTU);
        ctx.restore();
    } else {
        // Fallback
        ctx.save();
        ctx.fillStyle = '#7B2FF7';
        ctx.fillRect(x + 2, y + 2, KARE_BOYUTU - 4, KARE_BOYUTU - 4);
        ctx.fillStyle = 'white';
        ctx.font = 'bold ' + (KARE_BOYUTU * 0.35) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SKIP', x + KARE_BOYUTU / 2, y + KARE_BOYUTU / 2);
        ctx.restore();
    }
}

// Duvar (Ceza) portallarını çiz
function duvarKareleriniCiz() {
    duvarKareleri.forEach(kare => {
        const x = kare.x * KARE_BOYUTU;
        const y = kare.y * KARE_BOYUTU;

        if (portalIkonlari.duvar && portalIkonlari.duvar.complete && portalIkonlari.duvar.naturalWidth !== 0) {
            ctx.drawImage(portalIkonlari.duvar, x, y, KARE_BOYUTU, KARE_BOYUTU);
        } else {
            // Fallback: Kırmızı/Gri çizgili duvar
            ctx.save();
            ctx.fillStyle = '#424242';
            ctx.fillRect(x, y, KARE_BOYUTU, KARE_BOYUTU);
            ctx.strokeStyle = '#ef5350';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, KARE_BOYUTU - 4, KARE_BOYUTU - 4);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + KARE_BOYUTU, y + KARE_BOYUTU);
            ctx.moveTo(x + KARE_BOYUTU, y);
            ctx.lineTo(x, y + KARE_BOYUTU);
            ctx.stroke();
            ctx.restore();
        }
    });
}

// --- KELİME LİSTESİ YÜKLEME ---
async function kelimeListesiniYukle() {
    try {
        const response = await fetch('assets/english_word_list.txt');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        // Satır satır okuma ve sadece kelimeleri alma
        const satirlar = text.split('\n');
        kelimeListesi.clear();

        satirlar.forEach(satir => {
            const trimmedSatir = satir.trim();
            if (trimmedSatir.length === 0) return; // Boş satırları atla

            // Satır formatı kontrol et: "sayı|kelime" veya sadece "kelime"
            let kelime;
            if (trimmedSatir.includes('|')) {
                // Format: "sayı|kelime"
                const parts = trimmedSatir.split('|');
                if (parts.length >= 2) {
                    kelime = parts[1].trim();
                }
            } else {
                // Format: sadece "kelime" 
                kelime = trimmedSatir;
            }

            if (kelime && kelime.length >= 4) {
                const kelimeBuyuk = kelime.toUpperCase();
                kelimeListesi.add(kelimeBuyuk);
            }
        });

        kelimeListesiYuklendi = true;
        console.log(`${kelimeListesi.size} adet kelime yüklendi.`);

    } catch (error) {
        console.error('Kelime listesi yüklenemedi:', error);
        kelimeListesiYuklendi = false;
    }
}

// --- 8-BIT SES SİSTEMİ (Atari Tarzı) ---
let audioContext = null;
let masterVolume = 0.4;
let sesAktif = true;

// Audio Context'i başlat
function sesSisteminiBaslat() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext oluşturuldu:', audioContext.state);
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
            console.log('AudioContext resumed:', audioContext.state);
        }
        console.log('8-bit ses sistemi başlatıldı - State:', audioContext.state);

        // Test sesi çal
        setTimeout(() => {
            console.log('Test sesi çalınıyor...');
            bit8SesEfekti('test', { frekans: 440, sure: 0.5, volume: 0.2, tip: 'square' });
        }, 1000);
    } catch (error) {
        console.warn('Ses sistemi başlatılamadı:', error);
        sesAktif = false;
    }
}

// 8-bit tarzı ses üretme fonksiyonu
function bit8SesUret(frekans, sure, tip = 'square', volume = 0.1, vibrato = false) {
    if (!sesAktif || !audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 8-bit karakteristik ayarları
        oscillator.type = tip;
        oscillator.frequency.setValueAtTime(frekans, audioContext.currentTime);

        // Vibrato efekti (8-bit oyunlarda yaygın)
        if (vibrato) {
            const vibratoOsc = audioContext.createOscillator();
            const vibratoGain = audioContext.createGain();
            vibratoOsc.connect(vibratoGain);
            vibratoGain.connect(oscillator.frequency);
            vibratoOsc.frequency.setValueAtTime(5, audioContext.currentTime); // 5Hz vibrato
            vibratoGain.gain.setValueAtTime(frekans * 0.05, audioContext.currentTime); // %5 vibrato
            vibratoOsc.start();
            vibratoOsc.stop(audioContext.currentTime + sure);
        }

        // 8-bit filtre (keskin, dijital)
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, audioContext.currentTime); // Daha keskin
        filterNode.Q.setValueAtTime(10, audioContext.currentTime); // Yüksek Q

        // 8-bit envelope (hızlı attack, keskin decay)
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * masterVolume, audioContext.currentTime + 0.005); // Çok hızlı attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sure);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sure);
    } catch (error) {
        console.warn('8-bit ses üretme hatası:', error);
    }
}

// 8-bit ses efektleri
function bit8SesEfekti(tip, parametreler = {}) {
    if (!sesAktif || !audioContext) {
        console.log(`Ses çalınamadı - sesAktif: ${sesAktif}, audioContext: ${!!audioContext}`);
        return;
    }

    const { frekans = 440, sure = 0.3, volume = 0.1, tip: waveType = 'square', vibrato = false } = parametreler;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frekans, audioContext.currentTime);

        // 8-bit filtre
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1500, audioContext.currentTime);
        filterNode.Q.setValueAtTime(8, audioContext.currentTime);

        // 8-bit envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * masterVolume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sure);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sure);
    } catch (error) {
        console.warn('8-bit ses efekti hatası:', error);
    }
}

// 8-bit Ses Efektleri (Atari Tarzı)
function sesOyunBitti() {
    // Atari game over sesi - dramatik düşüş
    bit8SesEfekti('gameover', { frekans: 200, sure: 0.8, volume: 0.2, tip: 'sawtooth' });
    setTimeout(() => bit8SesEfekti('gameover2', { frekans: 100, sure: 0.6, volume: 0.15, tip: 'square' }), 200);
    setTimeout(() => bit8SesEfekti('gameover3', { frekans: 50, sure: 1.0, volume: 0.1, tip: 'sawtooth' }), 400);
}

function sesGeriAl() {
    // Atari geri alma sesi - keskin bip
    bit8SesEfekti('undo', { frekans: 800, sure: 0.15, volume: 0.12, tip: 'square' });
    setTimeout(() => bit8SesEfekti('undo2', { frekans: 400, sure: 0.15, volume: 0.1, tip: 'square' }), 100);
}

function sesSureArtis() {
    // Atari power-up sesi - yükselen ton
    bit8SesEfekti('timeup', { frekans: 400, sure: 0.2, volume: 0.15, tip: 'square' });
    setTimeout(() => bit8SesEfekti('timeup2', { frekans: 600, sure: 0.2, volume: 0.12, tip: 'square' }), 100);
    setTimeout(() => bit8SesEfekti('timeup3', { frekans: 800, sure: 0.3, volume: 0.1, tip: 'square' }), 200);
}

function sesSeviyeAtlama() {
    // Atari seviye atlama melodisi - klasik 8-bit
    const notalar = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
    notalar.forEach((nota, index) => {
        setTimeout(() => {
            bit8SesEfekti('levelup', { frekans: nota, sure: 0.25, volume: 0.12, tip: 'square' });
        }, index * 120);
    });
}

function sesPowerUp() {
    // Atari power-up sesi - klasik yükselen ton
    bit8SesEfekti('powerup', { frekans: 200, sure: 0.1, volume: 0.15, tip: 'square' });
    setTimeout(() => bit8SesEfekti('powerup2', { frekans: 400, sure: 0.1, volume: 0.12, tip: 'square' }), 100);
    setTimeout(() => bit8SesEfekti('powerup3', { frekans: 800, sure: 0.2, volume: 0.1, tip: 'square' }), 200);
}

function sesUyarı() {
    // Atari uyarı sesi - keskin bip
    bit8SesEfekti('warning', { frekans: 1000, sure: 0.1, volume: 0.2, tip: 'square' });
    setTimeout(() => bit8SesEfekti('warning2', { frekans: 1000, sure: 0.1, volume: 0.15, tip: 'square' }), 150);
}

function sesKelimeTamamlandi() {
    // Atari başarı sesi - kısa melodi
    bit8SesEfekti('success', { frekans: 523, sure: 0.2, volume: 0.15, tip: 'square' });
    setTimeout(() => bit8SesEfekti('success2', { frekans: 659, sure: 0.2, volume: 0.12, tip: 'square' }), 100);
    setTimeout(() => bit8SesEfekti('success3', { frekans: 784, sure: 0.3, volume: 0.1, tip: 'square' }), 200);
}

function sesHata() {
    // Atari hata sesi - sert düşüş
    bit8SesEfekti('error', { frekans: 300, sure: 0.3, volume: 0.15, tip: 'sawtooth' });
    setTimeout(() => bit8SesEfekti('error2', { frekans: 150, sure: 0.3, volume: 0.1, tip: 'sawtooth' }), 150);
}

function sesBaşlangıç() {
    // Atari başlangıç melodisi - klasik 8-bit
    const notalar = [261, 329, 392, 523, 659]; // C, E, G, C, E
    notalar.forEach((nota, index) => {
        setTimeout(() => {
            bit8SesEfekti('start', { frekans: nota, sure: 0.3, volume: 0.1, tip: 'square' });
        }, index * 150);
    });
}

function sesAdim() {
    // Atari hareket sesi - adım hızıyla uyumlu kısık pib
    const hizFaktoru = (HIZLAR[mevcutSeviye] || HIZLAR.default) / 300; // Hız faktörü
    const frekans = 150 + (hizFaktoru * 100); // Hıza göre frekans değişimi
    const volume = 0.03 + (hizFaktoru * 0.02); // Hıza göre volume değişimi

    bit8SesEfekti('step', {
        frekans: frekans,
        sure: 0.08,
        volume: volume,
        tip: 'square'
    });
}

function sesHarfYeme() {
    // Atari harf yeme sesi - kısa pop
    bit8SesEfekti('eat', { frekans: 600, sure: 0.1, volume: 0.1, tip: 'square' });
}

function sesRed() {
    // Atari red sesi - düşük ton
    bit8SesEfekti('reject', { frekans: 150, sure: 0.2, volume: 0.12, tip: 'sawtooth' });
}

function sesKabul() {
    // Atari kabul sesi - yüksek ton
    bit8SesEfekti('accept', { frekans: 800, sure: 0.2, volume: 0.12, tip: 'square' });
}

// Yeni ses efektleri - kelime kabul/ret
function sesKelimeKabul() {
    // Kelime kabul edildiğinde - başarı melodisi
    const notalar = [523, 659, 784]; // C, E, G
    notalar.forEach((nota, index) => {
        setTimeout(() => {
            bit8SesEfekti('kelimeKabul', {
                frekans: nota,
                sure: 0.15,
                volume: 0.1,
                tip: 'square'
            });
        }, index * 100);
    });
}

function sesKelimeRet() {
    // Kelime ret edildiğinde - belirgin hata sesi
    console.log('sesKelimeRet() çağrıldı'); // Debug

    // Klasik 8-bit error sesi - 3 aşamalı düşüş
    bit8SesEfekti('kelimeRet1', { frekans: 800, sure: 0.2, volume: 0.3, tip: 'square' });
    setTimeout(() => {
        bit8SesEfekti('kelimeRet2', { frekans: 400, sure: 0.2, volume: 0.25, tip: 'square' });
    }, 150);
    setTimeout(() => {
        bit8SesEfekti('kelimeRet3', { frekans: 200, sure: 0.3, volume: 0.2, tip: 'sawtooth' });
    }, 300);
}

function sesCarpma() {
    // Çarpma sesi - patlama/gürültü
    bit8SesEfekti('crash', { frekans: 100, sure: 0.1, volume: 0.2, tip: 'sawtooth' });
    setTimeout(() => bit8SesEfekti('crash2', { frekans: 50, sure: 0.4, volume: 0.25, tip: 'sawtooth' }), 50);
}

// Müzik sistemi kaldırıldı - sadece ses efektleri

// --- OYUN YÖNETİMİ ---
function baslangicEkraniniCiz() {
    if (!ctx || !oyunAlani) {
        console.warn('Canvas context veya canvas elementi bulunamadı');
        return;
    }

    const centerX = oyunAlani.width / 2;
    const centerY = oyunAlani.height / 2;

    // Radial gradient arka plan (merkez açık mor, kenarlar koyu mor)
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, oyunAlani.width * 0.7);
    bgGradient.addColorStop(0, '#3d2d5a');  // Merkez - orta mor
    bgGradient.addColorStop(0.5, '#291e40'); // Orta - koyu mor
    bgGradient.addColorStop(1, '#190f24');   // Kenar - çok koyu mor
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, oyunAlani.width, oyunAlani.height);

    // Dekoratif arka plan harfleri (şeffaf)
    const decorativeLetters = ['S', 'N', 'A', 'K', 'E', 'W', 'O', 'R', 'D', 'S', '!'];
    ctx.save();
    ctx.font = 'bold 80px "Segoe UI"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rastgele yerleştirilmiş harfler
    const positions = [
        { x: centerX * 0.3, y: centerY * 0.4 },
        { x: centerX * 1.7, y: centerY * 0.5 },
        { x: centerX * 0.5, y: centerY * 1.6 },
        { x: centerX * 1.5, y: centerY * 1.5 },
        { x: centerX * 0.2, y: centerY * 1.2 },
        { x: centerX * 1.8, y: centerY * 1.2 },
        { x: centerX * 1.0, y: centerY * 0.3 },
        { x: centerX * 1.3, y: centerY * 0.7 },
        { x: centerX * 0.7, y: centerY * 0.8 },
        { x: centerX * 0.4, y: centerY * 1.8 },
        { x: centerX * 1.6, y: centerY * 1.8 }
    ];

    decorativeLetters.forEach((letter, i) => {
        if (positions[i]) {
            ctx.fillText(letter, positions[i].x, positions[i].y);
        }
    });
    ctx.restore();

    // Ana başlık - Oyun adı
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Başlık gölgesi
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Ana başlık
    ctx.font = 'bold 64px "Segoe UI"';
    const gradient = ctx.createLinearGradient(0, centerY - 100, 0, centerY - 20);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillText('🐍 Snake Word Hunt', centerX, centerY - 60);

    // Alt başlık
    ctx.shadowBlur = 10;
    ctx.font = '28px "Segoe UI"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Collect letters, build words!', centerX, centerY + 10);

    ctx.restore();

    // Talimat metni (daha aşağıda)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '22px "Segoe UI"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Click the button below to start', centerX, centerY + 80);
    ctx.restore();

    // Dekoratif çizgi
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 150, centerY + 40);
    ctx.lineTo(centerX + 150, centerY + 40);
    ctx.stroke();
    ctx.restore();

    // UI elementlerini güncelle
    seviyeGostergesi.textContent = "1";
    skorGostergesi.textContent = `0 / ${SEVIYELER[1].hedef}`;
    const dakika = Math.floor(SEVIYELER[1].sure / 60).toString().padStart(2, '0');
    const saniye = (SEVIYELER[1].sure % 60).toString().padStart(2, '0');
    zamanGostergesi.textContent = `${dakika}:${saniye}`;

    oyunAktif = false;
    oyunPause = false;
    seviyeTamamlandi = false;
    beklenenSeviye = null;
    document.body.classList.remove('oyun-aktif');

    // Pause butonunu başlangıç durumuna getir
    if (pauseBtn) {
        const pauseText = pauseBtn.querySelector('.pause-text');
        const pauseIcon = pauseBtn.querySelector('.buton-ikon');
        if (pauseText) pauseText.textContent = 'Pause';
        if (pauseIcon) pauseIcon.textContent = '⏸️';
    }
}

function oyunuBaslat(seviye = 1) {
    console.log('Oyun başlatılıyor, seviye:', seviye);

    try {
        clearTimeout(anaDonguTimeoutId);
        clearInterval(zamanlayiciId);

        // Ses sistemini başlat
        sesSisteminiBaslat();

        // Başlangıç sesi
        sesBaşlangıç();

        mevcutSeviye = seviye;
        const seviyeBilgisi = SEVIYELER[mevcutSeviye];
        if (!seviyeBilgisi) {
            console.error('Geçersiz seviye:', seviye);
            return;
        }
        kalanSure = seviyeBilgisi.sure;

        oyunAktif = true;
        oyunBitti = false;
        oyunPause = false;
        seviyeTamamlandi = false;
        beklenenSeviye = null;
        yonDegisiyor = false;
        kelimeOnaylaniyorMu = false;
        yilanAnimasyonOffset = 0;
        parçacıklar = [];
        eklenecekParcaSayisi = 0;
        kelimeAlimGecmisi = [];
        duvarKareleri = []; // Duvarları temizle

        // Portallar: seviye 1'de sıfırla, sonraki seviyelerde koru ve yeni pozisyona taşı
        if (mevcutSeviye === 1) {
            geriAlKaresi = null;
            ekstraSureKaresi = null;
            x2Karesi = null;
            levelSkipKaresi = null;
        }

        document.body.classList.add('oyun-aktif');

        // Gamepad button states'ini temizle
        if (typeof oncekiButonlar !== 'undefined') {
            oncekiButonlar = {};
        }

        yilan = [{ x: 11, y: 11 }]; // Merkez portaldan çıkış başlangıç
        yon = 'SAG';
        harfler = [];
        mevcutKelime = '';
        skor = 0; // Her seviyede skoru sıfırla
        if (mevcutSeviye === 1) {
            bulunanKelimeler = [];
        }

        guncelleUI();
        kelimePaneliniGuncelle();
        harfleriOlustur();

        // Portalları yeni seviyeye taşı (harfler oluştuktan sonra, çakışmasın diye)
        if (geriAlKaresi) {
            geriAlKaresiOlustur(); // Yeni boş pozisyona taşır
        }
        if (ekstraSureKaresi) {
            ekstraSureKaresiOlustur(); // Yeni boş pozisyona taşır
        }
        if (x2Karesi) {
            x2KaresiOlustur(); // Yeni boş pozisyona taşır
        }
        if (levelSkipKaresi) {
            levelSkipKaresiOlustur(); // Yeni boş pozisyona taşır
        }
        anaDongu();

        zamanlayiciId = setInterval(zamanlayiciyiGuncelle, 1000);

        console.log('Oyun başarıyla başlatıldı');

    } catch (error) {
        console.error('Oyun başlatma sırasında hata:', error);
        // Fallback: basit oyun başlatma
        try {
            oyunAktif = true;
            oyunBitti = false;
            yilan = [{ x: 11, y: 11 }];
            yon = 'SAG';
            harfler = [];
            mevcutKelime = '';
            skor = 0;
            bulunanKelimeler = [];
            guncelleUI();
            kelimePaneliniGuncelle();
            harfleriOlustur();
            anaDongu();
            zamanlayiciId = setInterval(zamanlayiciyiGuncelle, 1000);
            console.log('Fallback oyun başlatıldı');
        } catch (fallbackError) {
            console.error('Fallback oyun başlatma da başarısız:', fallbackError);
        }
    }
}

function zamanlayiciyiGuncelle() {
    kalanSure--;
    if (kalanSure < 0) {
        oyunuBitir("Time's Up!");
    } else {
        guncelleUI();
    }
}

function oyunuBitir(mesaj) {
    if (oyunBitti) return;
    oyunAktif = false;
    oyunBitti = true;
    oyunPause = false;
    // seviyeTamamlandi ve beklenenSeviye değişkenlerini sıfırlama (seviye atlama için)
    clearInterval(zamanlayiciId);
    document.body.classList.remove('oyun-aktif');
    clearTimeout(anaDonguTimeoutId);

    // Oyun bitirme sesi
    if (mesaj.includes("Crashed") || mesaj.includes("Time's Up")) {
        sesOyunBitti();
    }

    // Yanma/süre dolması durumunda aynı seviyeden devam seçeneği
    if (mesaj.includes("Crashed") || mesaj.includes("Time's Up")) {
        tekrarSeviye = mevcutSeviye;
        mesaj += `\n\nPress SPACE to continue from Level ${mevcutSeviye}.`;
    } else {
        tekrarSeviye = null;
    }

    // Çarpma efektini duvara/kendine çarpışta uygula; diğer durumlarda direkt ekranı göster
    const carpmaDurumu = /Crashed/.test(mesaj);
    if (carpmaDurumu && yilan && yilan.length > 0 && !crashEffectActive) {
        crashEffectActive = true;
        const hx = yilan[0].x * KARE_BOYUTU + KARE_BOYUTU / 2;
        const hy = yilan[0].y * KARE_BOYUTU + KARE_BOYUTU / 2;
        carpmaEfekti(hx, hy, () => {
            crashEffectActive = false;
            sonEkraniCiz(mesaj);
        });
    } else {
        sonEkraniCiz(mesaj);
    }
}

function guncelleUI() {
    if (!mevcutSeviye) mevcutSeviye = 1;
    const seviyeBilgisi = SEVIYELER[mevcutSeviye];
    skorGostergesi.textContent = `${skor} / ${seviyeBilgisi.hedef}`;
    seviyeGostergesi.textContent = mevcutSeviye;

    if (kalanSure) {
        const dakika = Math.floor(kalanSure / 60).toString().padStart(2, '0');
        const saniye = (kalanSure % 60).toString().padStart(2, '0');
        zamanGostergesi.textContent = `${dakika}:${saniye}`;
    }

    kelimeMetni.textContent = mevcutKelime;

    const ilerlemeYüzdesi = (skor / seviyeBilgisi.hedef) * 100;
    ilerlemeBarı.style.width = `${Math.min(ilerlemeYüzdesi, 100)}%`;
}

function kelimePaneliniGuncelle() {
    bulunanKelimelerListesi.innerHTML = '';
    bulunanKelimeler.forEach(item => {
        const li = document.createElement('li');
        if (item.gecerli) {
            li.innerHTML = `${item.kelime} <span>+${item.puan}</span>`;
        } else {
            li.classList.add('gecersiz');
            li.innerHTML = `${item.kelime} <span class="gecersiz-puan">${item.puan}</span>`;
        }
        bulunanKelimelerListesi.appendChild(li);
    });
}

function gecersizKelimeGeriBildirimi(renk = '#ef5350') {
    kelimeGostergesi.classList.add('invalid');
    setTimeout(() => {
        kelimeGostergesi.classList.remove('invalid');
    }, 600);
}

function gecersizKelimeyiIsle(kelime, renk) {
    gecersizKelimeGeriBildirimi(renk);
    if (kelime.length > 0) {
        // Geçersiz kelimede yılan uzamaz, sadece kayıt tutulur
        const puanKaybi = -kelime.length;
        skor += puanKaybi;
        bulunanKelimeler.push({ kelime: kelime, puan: puanKaybi, gecerli: false });
        kelimePaneliniGuncelle();
        guncelleUI();

        // CEZA: Duvar portalları oluştur (Kelime uzunluğu kadar)
        let olusturulanDuvarSayisi = 0;
        let deneme = 0;
        while (olusturulanDuvarSayisi < kelime.length && deneme < 200) {
            const rx = Math.floor(Math.random() * GRID_BOYUTU);
            const ry = Math.floor(Math.random() * GRID_BOYUTU);

            // Yılanın kafasına çok yakın olmasın (biraz adalet)
            const kafayaMesafe = Math.abs(rx - yilan[0].x) + Math.abs(ry - yilan[0].y);

            if (!pozisyonDoluMu(rx, ry) && kafayaMesafe > 3) {
                duvarKareleri.push({ x: rx, y: ry });
                olusturulanDuvarSayisi++;

                // Efekt: Duvar oluşma (küçük partikül veya ses olabilir, şimdilik sadece varlık)
            }
            deneme++;
        }
    }
}

// --- HARF YÖNETİMİ ---
function agirlikliRastgeleSec(liste) {
    const toplamAgirlik = liste.reduce((toplam, item) => toplam + item.yuzde, 0);
    let rastgeleSayi = Math.random() * toplamAgirlik;
    for (const item of liste) {
        rastgeleSayi -= item.yuzde;
        if (rastgeleSayi <= 0) { return item.harf; }
    }
}
function kuralaUygunHarfUret(unluMu) {
    while (true) {
        const kaynakListe = unluMu ? UNLU_FREKANSLARI : UNSUZ_FREKANSLARI;
        const adayHarf = agirlikliRastgeleSec(kaynakListe);
        const mevcutSayi = harfler.filter(h => h.harf === adayHarf).length;
        if (mevcutSayi < 2) { return adayHarf; }
    }
}
function yeniHarfYarat(unluMu, engelliSatir = null, engelliSutun = null) {
    const harf = kuralaUygunHarfUret(unluMu);
    let yeniPozisyon;
    const doluAlanlar = [...yilan, ...harfler, onayKaresi];

    let denemeSayisi = 0;
    const maxDeneme = 100;

    do {
        yeniPozisyon = {
            x: Math.floor(Math.random() * GRID_BOYUTU),
            y: Math.floor(Math.random() * GRID_BOYUTU)
        };
        denemeSayisi++;

        // Eğer çok fazla deneme yapıldıysa, engelleri gözardı et (sonsuz döngüyü önle)
        if (denemeSayisi > maxDeneme) {
            engelliSatir = null;
            engelliSutun = null;
        }

    } while (
        doluAlanlar.some(p => p.x === yeniPozisyon.x && p.y === yeniPozisyon.y) ||
        (engelliSatir !== null && yeniPozisyon.y === engelliSatir) ||
        (engelliSutun !== null && yeniPozisyon.x === engelliSutun) ||
        (geriAlKaresi && yeniPozisyon.x === geriAlKaresi.x && yeniPozisyon.y === geriAlKaresi.y) ||
        (ekstraSureKaresi && yeniPozisyon.x === ekstraSureKaresi.x && yeniPozisyon.y === ekstraSureKaresi.y) ||
        (x2Karesi && yeniPozisyon.x === x2Karesi.x && yeniPozisyon.y === x2Karesi.y) ||
        (levelSkipKaresi && yeniPozisyon.x === levelSkipKaresi.x && yeniPozisyon.y === levelSkipKaresi.y)
    );

    harfler.push({ ...yeniPozisyon, harf: harf });
}
function harfleriOlustur() {
    // Yılan başlangıç satırında (y=11) harf çıkmasın
    for (let i = 0; i < 5; i++) yeniHarfYarat(true, 11, null);  // 5 ünlü, y=11 satırını engelle
    for (let i = 0; i < 7; i++) yeniHarfYarat(false, 11, null); // 7 ünsüz, y=11 satırını engelle
}

// --- ANA OYUN DÖNGÜSÜ VE HAREKET ---
function anaDongu() {
    if (oyunBitti) {
        clearTimeout(anaDonguTimeoutId);
        return;
    }

    const loopStartTime = performance.now();

    // --- Run the game logic for one step ---
    yonDegisiyor = false;
    if (yilaniHareketEttir()) {
        yilanAnimasyonOffset += animasyonHızı * 0.1;
        parçacıklarıGüncelle();
        // Sadece oyun devam ediyorsa çiz (oyun bittiğinde sonEkraniCiz kullanılıyor)
        if (!oyunBitti) {
            tumunuCiz();
        }
    }
    // ------------------------------------

    const loopEndTime = performance.now();
    const executionTime = loopEndTime - loopStartTime;

    const hedefSpm = HIZLAR[mevcutSeviye] || HIZLAR.default;
    const targetDelay = spmToMs(hedefSpm);

    const correctedDelay = Math.max(0, targetDelay - executionTime);

    // Schedule the next run of anaDongu
    anaDonguTimeoutId = setTimeout(anaDongu, correctedDelay);
}

function yilaniHareketEttir() {
    const kafa = { x: yilan[0].x, y: yilan[0].y };
    if (yon === 'YUKARI') kafa.y--;
    else if (yon === 'ASAGI') kafa.y++;
    else if (yon === 'SOL') kafa.x--;
    else if (yon === 'SAG') kafa.x++;

    if (kafa.x < 0 || kafa.x >= GRID_BOYUTU || kafa.y < 0 || kafa.y >= GRID_BOYUTU) {
        oyunuBitir("Crashed into Wall!"); return false;
    }
    if (yilan.slice(1).some(p => p.x === kafa.x && p.y === kafa.y)) {
        oyunuBitir("Crashed into Yourself!"); return false;
    }
    // Duvar Portalı (Ceza) çarpışma kontrolü
    if (duvarKareleri.some(d => d.x === kafa.x && d.y === kafa.y)) {
        oyunuBitir("Crashed into Wall!");
        return false;
    }

    yilan.unshift(kafa);

    const yenenHarfIndex = harfler.findIndex(h => h.x === kafa.x && h.y === kafa.y);
    if (yenenHarfIndex > -1) {
        const [yenenHarf] = harfler.splice(yenenHarfIndex, 1);
        mevcutKelime += yenenHarf.harf;
        // Harf geçmişine ekle (geri alma için)
        kelimeAlimGecmisi.push({ harf: yenenHarf.harf, x: yenenHarf.x, y: yenenHarf.y });

        // Harf yeme sesi
        sesHarfYeme();
        const yenenHarfUnluMuydu = UNLU_FREKANSLARI.some(item => item.harf === yenenHarf.harf);

        let engelliSatir = null;
        let engelliSutun = null;

        if (yon === 'YUKARI' || yon === 'ASAGI') {
            engelliSutun = kafa.x;
        } else if (yon === 'SOL' || yon === 'SAG') {
            engelliSatir = kafa.y;
        }

        yeniHarfYarat(yenenHarfUnluMuydu, engelliSatir, engelliSutun);
        guncelleUI();
    }

    if (kafa.x === onayKaresi.x && kafa.y === onayKaresi.y && !kelimeOnaylaniyorMu) {
        kelimeyiOnayla();
    }

    // x2 Portalı çarpışma kontrolü (2 katı puan ile kelime onaylama)
    if (x2Karesi && kafa.x === x2Karesi.x && kafa.y === x2Karesi.y && !kelimeOnaylaniyorMu) {
        kelimeyiOnayla(2);
    }

    // Level Skip portalı çarpışma kontrolü (direkt seviye atlama)
    if (levelSkipKaresi && kafa.x === levelSkipKaresi.x && kafa.y === levelSkipKaresi.y) {
        const gx = (levelSkipKaresi.x * KARE_BOYUTU) + KARE_BOYUTU / 2;
        const gy = (levelSkipKaresi.y * KARE_BOYUTU) + KARE_BOYUTU / 2;
        parçacıkEkle(gx, gy, 30);
        levelSkipKaresi = null;

        const sonrakiSeviye = mevcutSeviye + 1;
        if (SEVIYELER[sonrakiSeviye]) {
            clearInterval(zamanlayiciId);
            sesSeviyeAtlama();
            seviyeTamamlandi = true;
            beklenenSeviye = sonrakiSeviye;
            oyunuBitir(`Level ${mevcutSeviye} Skipped!\n\nPress SPACE to continue to next level.`);
        } else {
            clearInterval(zamanlayiciId);
            sesSeviyeAtlama();
            oyunuBitir("Congratulations, You Beat the Game!");
        }
    }

    // Yılan hareket sesi - her adımda kısık pib
    sesAdim();

    // Geri Al karesi çarpışma kontrolü
    if (geriAlKaresi && kafa.x === geriAlKaresi.x && kafa.y === geriAlKaresi.y) {
        const kullanildi = geriAlKaresiniKullan();
        if (kullanildi) {
            // Kare tüketildi
            geriAlKaresi = null;

            // Geri alma sesi
            sesGeriAl();
        }
    }

    // Ekstra Süre karesi çarpışma kontrolü (+30 sn)
    if (ekstraSureKaresi && kafa.x === ekstraSureKaresi.x && kafa.y === ekstraSureKaresi.y) {
        kalanSure = (kalanSure || 0) + 30;
        // Efekt
        const gx = (ekstraSureKaresi.x * KARE_BOYUTU) + KARE_BOYUTU / 2;
        const gy = (ekstraSureKaresi.y * KARE_BOYUTU) + KARE_BOYUTU / 2;
        parçacıkEkle(gx, gy, 25);
        ekstraSureKaresi = null;
        guncelleUI();

        // Zaman ekleme sesi
        sesSureArtis();
    }

    if (eklenecekParcaSayisi > 0) {
        eklenecekParcaSayisi--;
    } else {
        yilan.pop();
    }

    return true;
}

async function kelimeyiOnayla(carpan = 1) {
    if (kelimeOnaylaniyorMu) return;
    kelimeOnaylaniyorMu = true;

    const kelime = mevcutKelime;
    mevcutKelime = '';
    guncelleUI();

    if (kelime.length < 4) {
        // Kısa kelime ret sesi
        sesKelimeRet();
        gecersizKelimeyiIsle(kelime);
        kelimeOnaylaniyorMu = false;
        return;
    }

    // Eğer kelime listesi henüz yüklenmemişse, yüklenmeye çalış
    if (!kelimeListesiYuklendi) {
        await kelimeListesiniYukle();
    }

    let kelimeGecerli = false;

    // Yerel kelime listesinden kontrol et
    if (kelimeListesiYuklendi) {
        const kelimeBuyukHarf = kelime.toUpperCase();
        kelimeGecerli = kelimeListesi.has(kelimeBuyukHarf);
    } else {
        // No word list available
        console.warn('Word list not loaded');
        kelimeGecerli = false;
    }

    console.log(`Kelime: "${kelime}" - Geçerli: ${kelimeGecerli}`); // Debug için

    if (kelimeGecerli) {
        const puan = kelime.length * carpan;
        skor += puan;
        bulunanKelimeler.push({ kelime: kelime, puan: puan, gecerli: true });

        // x2 portalı kullanıldıysa tüket
        if (carpan > 1 && x2Karesi) {
            const gx = (x2Karesi.x * KARE_BOYUTU) + KARE_BOYUTU / 2;
            const gy = (x2Karesi.y * KARE_BOYUTU) + KARE_BOYUTU / 2;
            parçacıkEkle(gx, gy, 30);
            x2Karesi = null;
        }

        eklenecekParcaSayisi += puan;

        const onayX = onayKaresi.x * KARE_BOYUTU + KARE_BOYUTU / 2;
        const onayY = onayKaresi.y * KARE_BOYUTU + KARE_BOYUTU / 2;
        parçacıkEkle(onayX, onayY, 20);

        guncelleUI();
        kelimePaneliniGuncelle();

        // Kelime tamamlama sesi
        sesKelimeTamamlandi();

        // Kelime kabul sesi
        sesKelimeKabul();

        // Portal spawn mantığı
        // Geri al portalı: 5 harfli kelimede (haritada yoksa yeni bir tane çıkar)
        if (kelime.length === 5 && !geriAlKaresi) {
            geriAlKaresiOlustur();
        }
        // Zaman portalı: 6+ harfli kelimede (haritada geri al ve zaman portalı yoksa)
        else if (kelime.length >= 6 && !geriAlKaresi && !ekstraSureKaresi) {
            ekstraSureKaresiOlustur();
        }
        // x2 portalı: 7+ harfli kelimede (haritada yoksa)
        if (kelime.length >= 7 && !x2Karesi) {
            x2KaresiOlustur();
        }
        // Level skip portalı: 8+ harfli kelimede (haritada yoksa)
        if (kelime.length >= 8 && !levelSkipKaresi) {
            levelSkipKaresiOlustur();
        }

        const seviyeBilgisi = SEVIYELER[mevcutSeviye];
        if (skor >= seviyeBilgisi.hedef) {
            clearInterval(zamanlayiciId);
            const sonrakiSeviye = mevcutSeviye + 1;
            if (SEVIYELER[sonrakiSeviye]) {
                // Seviye atlama sesi
                sesSeviyeAtlama();
                seviyeTamamlandi = true;
                beklenenSeviye = sonrakiSeviye;
                oyunuBitir(`Level ${mevcutSeviye} Complete!\n\nPress SPACE to continue to next level.`);
            } else {
                // Oyun bitirme sesi
                sesSeviyeAtlama();
                oyunuBitir("Congratulations, You Beat the Game!");
            }
        }
    } else {
        // Kelime geçersiz - ret sesi
        console.log('Kelime ret edildi, ses çalınıyor...'); // Debug
        sesKelimeRet();
        gecersizKelimeyiIsle(kelime);
    }

    kelimeOnaylaniyorMu = false;
}

// --- ÇİZİM FONKSİYONLARI ---
function sonEkraniCiz(mesaj) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, oyunAlani.width, oyunAlani.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Çok satırlı metin desteği
    const satirlar = mesaj.split('\n');
    const satirYuksekligi = 55;
    const baslangicY = oyunAlani.height / 2 - (satirlar.length - 1) * satirYuksekligi / 2;

    satirlar.forEach((satir, index) => {
        // İlk satır (başlık) 40px, diğer satırlar (talimat) 28px (%30 daha küçük)
        ctx.font = index === 0 ? '40px "Segoe UI"' : '28px "Segoe UI"';
        ctx.fillText(satir, oyunAlani.width / 2, baslangicY + index * satirYuksekligi);
    });

}

// Çarpma (yanma) efekti: kırmızı flaş + şok dalgası + ekran titreme + partiküller
function carpmaEfekti(cx, cy, bittiginde) {
    const start = performance.now();
    const sure = 800; // ms

    // Yılanın tüm gövdesinden kıvılcım parçacıkları üret
    try {
        const renkler = ['#ff1744', '#ff6d00', '#ffd740'];
        (yilan || []).forEach((seg, idx) => {
            const px = seg.x * KARE_BOYUTU + KARE_BOYUTU / 2;
            const py = seg.y * KARE_BOYUTU + KARE_BOYUTU / 2;
            for (let i = 0; i < Math.max(6 - Math.floor(idx / 3), 2); i++) {
                const renk = renkler[Math.floor(Math.random() * renkler.length)];
                parçaciklar.push(new Parçacık(px, py, renk, 3.5));
            }
        });
    } catch (e) { }

    function frame() {
        const now = performance.now();
        const t = Math.min(1, (now - start) / sure);
        const shake = (1 - t) * 10; // px
        const flash = (1 - t) * 0.6; // alpha
        const ringR = KARE_BOYUTU * (2 + 10 * t);

        // Arka planı ve sahneyi bir kez çiz
        ctx.save();
        // Ekran titreme
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        tumunuCiz();

        // Kırmızı flaş (radial gradient)
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR * 1.2);
        g.addColorStop(0, `rgba(255, 23, 68, ${Math.max(0, flash)})`);
        g.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, oyunAlani.width, oyunAlani.height);

        // Şok dalgası çemberi
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(2, 12 * (1 - t));
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
        ctx.stroke();

        // Parçacıkları güncelle/çiz
        parçacıklarıGüncelle();
        parçacıklarıÇiz(ctx);

        ctx.restore();

        if (t < 1) requestAnimationFrame(frame);
        else if (typeof bittiginde === 'function') bittiginde();
    }
    requestAnimationFrame(frame);
}

function tumunuCiz() {
    // Satranç tahtasını 3D efektlerle çiz
    for (let r = 0; r < GRID_BOYUTU; r++) {
        for (let c = 0; c < GRID_BOYUTU; c++) {
            const x = c * KARE_BOYUTU;
            const y = r * KARE_BOYUTU;
            const isLight = (r + c) % 2 === 0;

            ctx.save();

            const baseColor = isLight ? getTemaRengi('beyazKare') : getTemaRengi('kahverengiKare');
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, KARE_BOYUTU, KARE_BOYUTU);

            const shadowGradient = ctx.createLinearGradient(x, y, x + KARE_BOYUTU, y + KARE_BOYUTU);
            shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
            shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            shadowGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            ctx.fillStyle = shadowGradient;
            ctx.fillRect(x, y, KARE_BOYUTU, KARE_BOYUTU);

            ctx.restore();
        }
    }

    const onayX = onayKaresi.x * KARE_BOYUTU;
    const onayY = onayKaresi.y * KARE_BOYUTU;

    // Merkez portal (kelime onaylama)
    cizOnayKaresiVurgusu();

    // Sarı portal (harf silme portalı)
    cizGeriAlKaresi();
    // Zaman portalı (+30 saniye)
    cizEkstraSureKaresi();
    // x2 Puan portalı
    cizX2Karesi();
    // Seviye atlama portalı
    cizLevelSkipKaresi();

    // Duvar portalları
    duvarKareleriniCiz();

    // Pause durumunda harfleri çizme
    if (!oyunPause) {
        harfler.forEach(h => {
            const harfX = h.x * KARE_BOYUTU + KARE_BOYUTU / 2;
            const harfY = h.y * KARE_BOYUTU + KARE_BOYUTU / 2;

            ctx.save();

            const fontSize = KARE_BOYUTU * 0.77;
            const pulseEffect = 1 + Math.sin(Date.now() * 0.003 + h.x + h.y) * 0.08;
            const animatedFontSize = fontSize * pulseEffect;

            ctx.font = `900 ${animatedFontSize}px 'Segoe UI', 'Arial Black', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const optikOfset = KARE_BOYUTU * 0.04; // harfleri görsel merkeze yaklaştırmak için
            const yCoord = harfY + optikOfset;

            // Harf çizimi - Klasik tema
            const renkler = getHarfRengi(h.harf, h.x, h.y);
            ctx.strokeStyle = renkler.dis;
            ctx.lineWidth = KARE_BOYUTU * 0.15;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeText(h.harf, harfX, yCoord);

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = KARE_BOYUTU * 0.08;
            ctx.strokeText(h.harf, harfX, yCoord);

            ctx.fillStyle = renkler.ic;
            ctx.shadowBlur = 0;
            ctx.fillText(h.harf, harfX, yCoord);

            ctx.restore();
        });
    }

    const govdeRenkPaleti = getTemaRengi('govdeRenkleri');

    yilan.forEach((p, index) => {
        const x = p.x * KARE_BOYUTU + KARE_BOYUTU / 2;
        const y = p.y * KARE_BOYUTU + KARE_BOYUTU / 2;
        const isKafa = index === 0;

        const animasyonFaktörü = isKafa ? 1.1 : 1 + Math.sin(yilanAnimasyonOffset + index * 0.5) * 0.08;
        const radius = (KARE_BOYUTU / 2 * 0.85) * animasyonFaktörü;

        ctx.save();

        if (isKafa) {
            const kafaRengi = getTemaRengi('yilanKafa');
            ctx.fillStyle = kafaRengi;
            ctx.shadowColor = kafaRengi;
            ctx.shadowBlur = 15;
        } else {
            const renk1 = govdeRenkPaleti[(index - 1) % govdeRenkPaleti.length];
            const renk2 = govdeRenkPaleti[index % govdeRenkPaleti.length];
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, renk1);
            gradient.addColorStop(1, renk2);
            ctx.fillStyle = gradient;
            ctx.shadowColor = renk1;
            ctx.shadowBlur = 12;
        }

        // Daire çizimi
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Kafa üzerine gözleri çiz
        if (isKafa) {
            const gozRadius = radius * 0.15;
            const gozOfset = radius * 0.4;
            ctx.fillStyle = '#000000';

            let goz1X, goz1Y, goz2X, goz2Y;

            if (yon === 'YUKARI') {
                goz1X = x - gozOfset; goz1Y = y - gozOfset;
                goz2X = x + gozOfset; goz2Y = y - gozOfset;
            } else if (yon === 'ASAGI') {
                goz1X = x - gozOfset; goz1Y = y + gozOfset;
                goz2X = x + gozOfset; goz2Y = y + gozOfset;
            } else if (yon === 'SOL') {
                goz1X = x - gozOfset; goz1Y = y - gozOfset;
                goz2X = x - gozOfset; goz2Y = y + gozOfset;
            } else { // SAG
                goz1X = x + gozOfset; goz1Y = y - gozOfset;
                goz2X = x + gozOfset; goz2Y = y + gozOfset;
            }

            // Gözler
            ctx.beginPath();
            ctx.arc(goz1X, goz1Y, gozRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(goz2X, goz2Y, gozRadius, 0, Math.PI * 2);
            ctx.fill();

            // Göz parlaması
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(goz1X + gozRadius * 0.2, goz1Y - gozRadius * 0.2, gozRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(goz2X + gozRadius * 0.2, goz2Y - gozRadius * 0.2, gozRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    parçacıklarıÇiz(ctx);

    // Pause durumunda pause ekranını göster
    if (oyunPause) {
        pauseEkraniniGoster();
    }
}

// --- Geri Al Karesi Mantığı ---
// --- Geri Al Karesi Mantığı ---
function pozisyonDoluMu(x, y) {
    // Yılan, harfler, onay karesi veya portallar ile çakışma kontrolü
    if (yilan && yilan.some(p => p.x === x && p.y === y)) return true;
    if (harfler && harfler.some(h => h.x === x && h.y === y)) return true;
    if (onayKaresi && onayKaresi.x === x && onayKaresi.y === y) return true;
    if (geriAlKaresi && geriAlKaresi.x === x && geriAlKaresi.y === y) return true;
    if (ekstraSureKaresi && ekstraSureKaresi.x === x && ekstraSureKaresi.y === y) return true;
    if (x2Karesi && x2Karesi.x === x && x2Karesi.y === y) return true;
    if (levelSkipKaresi && levelSkipKaresi.x === x && levelSkipKaresi.y === y) return true;
    if (duvarKareleri && duvarKareleri.some(d => d.x === x && d.y === y)) return true;
    return false;
}

function harfiYerineKoyVeyaRastgele(harf, hedefX, hedefY) {
    let x = hedefX, y = hedefY;
    if (pozisyonDoluMu(x, y)) {
        // Rastgele boş yer bul
        let deneme = 0;
        do {
            x = Math.floor(Math.random() * GRID_BOYUTU);
            y = Math.floor(Math.random() * GRID_BOYUTU);
            deneme++;
            if (deneme > 200) break; // güvenlik
        } while (pozisyonDoluMu(x, y) || (geriAlKaresi && x === geriAlKaresi.x && y === geriAlKaresi.y) || (ekstraSureKaresi && x === ekstraSureKaresi.x && y === ekstraSureKaresi.y) || (x2Karesi && x === x2Karesi.x && y === x2Karesi.y) || (levelSkipKaresi && x === levelSkipKaresi.x && y === levelSkipKaresi.y));
    }
    harfler.push({ x, y, harf });
}

function geriAlKaresiOlustur() {
    // Boş bir hücre seç ve sarı portal (harf silme portalı) koy
    let x, y, deneme = 0;
    do {
        x = Math.floor(Math.random() * GRID_BOYUTU);
        y = Math.floor(Math.random() * GRID_BOYUTU);
        deneme++;
        if (deneme > 300) break;
    } while (
        pozisyonDoluMu(x, y) ||
        (geriAlKaresi && x === geriAlKaresi.x && y === geriAlKaresi.y) ||
        (ekstraSureKaresi && x === ekstraSureKaresi.x && y === ekstraSureKaresi.y)
    );
    geriAlKaresi = { x, y };
}

function ekstraSureKaresiOlustur() {
    // Boş bir hücre seç ve zaman portalı (+30 saniye) koy
    let x, y, deneme = 0;
    do {
        x = Math.floor(Math.random() * GRID_BOYUTU);
        y = Math.floor(Math.random() * GRID_BOYUTU);
        deneme++;
        if (deneme > 300) break;
    } while (
        pozisyonDoluMu(x, y) ||
        (geriAlKaresi && x === geriAlKaresi.x && y === geriAlKaresi.y) ||
        (ekstraSureKaresi && x === ekstraSureKaresi.x && y === ekstraSureKaresi.y)
    );
    ekstraSureKaresi = { x, y };
}

function x2KaresiOlustur() {
    // Boş bir hücre seç ve x2 puan portalı koy
    let x, y, deneme = 0;
    do {
        x = Math.floor(Math.random() * GRID_BOYUTU);
        y = Math.floor(Math.random() * GRID_BOYUTU);
        deneme++;
        if (deneme > 300) break;
    } while (
        pozisyonDoluMu(x, y) ||
        (geriAlKaresi && x === geriAlKaresi.x && y === geriAlKaresi.y) ||
        (ekstraSureKaresi && x === ekstraSureKaresi.x && y === ekstraSureKaresi.y) ||
        (x2Karesi && x === x2Karesi.x && y === x2Karesi.y)
    );
    x2Karesi = { x, y };
}

function levelSkipKaresiOlustur() {
    // Boş bir hücre seç ve seviye atlama portalı koy
    let x, y, deneme = 0;
    do {
        x = Math.floor(Math.random() * GRID_BOYUTU);
        y = Math.floor(Math.random() * GRID_BOYUTU);
        deneme++;
        if (deneme > 300) break;
    } while (
        pozisyonDoluMu(x, y) ||
        (geriAlKaresi && x === geriAlKaresi.x && y === geriAlKaresi.y) ||
        (ekstraSureKaresi && x === ekstraSureKaresi.x && y === ekstraSureKaresi.y) ||
        (x2Karesi && x === x2Karesi.x && y === x2Karesi.y) ||
        (levelSkipKaresi && x === levelSkipKaresi.x && y === levelSkipKaresi.y)
    );
    levelSkipKaresi = { x, y };
}

function geriAlKaresiniKullan() {
    if (!kelimeAlimGecmisi || kelimeAlimGecmisi.length === 0) {
        // Geri alınacak harf yoksa kareyi tüketme
        return false;
    }
    const son = kelimeAlimGecmisi.pop();
    // mevcutKelime'den son karakteri sil
    if (mevcutKelime && mevcutKelime.length > 0) {
        mevcutKelime = mevcutKelime.slice(0, -1);
        guncelleUI();
    }

    // Harfi yerine koy
    harfiYerineKoyVeyaRastgele(son.harf, son.x, son.y);

    // Efekt
    const gx = (geriAlKaresi.x * KARE_BOYUTU) + KARE_BOYUTU / 2;
    const gy = (geriAlKaresi.y * KARE_BOYUTU) + KARE_BOYUTU / 2;
    parçacıkEkle(gx, gy, 25);

    return true;
}

// --- KULLANICI GİRDİSİ ---
function yonDegistir(event) {
    if (yonDegisiyor || oyunBitti || !oyunAktif || oyunPause) return;

    const tusKodu = event.keyCode;
    const YUKARI = 38, ASAGI = 40, SOL = 37, SAG = 39;
    let denenenYon;
    if (tusKodu === YUKARI) denenenYon = 'YUKARI';
    else if (tusKodu === ASAGI) denenenYon = 'ASAGI';
    else if (tusKodu === SOL) denenenYon = 'SOL';
    else if (tusKodu === SAG) denenenYon = 'SAG';
    else return;

    if (tusKodu === YUKARI || tusKodu === ASAGI || tusKodu === SOL || tusKodu === SAG) {
        event.preventDefault();
    }

    if (denenenYon === 'YUKARI' && yon === 'ASAGI') return;
    if (denenenYon === 'ASAGI' && yon === 'YUKARI') return;
    if (denenenYon === 'SOL' && yon === 'SAG') return;
    if (denenenYon === 'SAG' && yon === 'SOL') return;

    yon = denenenYon;
    yonDegisiyor = true;
}

function tamEkranYap() {
    const element = document.body;
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) { element.requestFullscreen(); }
        else if (element.mozRequestFullScreen) { element.mozRequestFullScreen(); }
        else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen(); }
        else if (element.msRequestFullscreen) { element.msRequestFullscreen(); }
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); }
        else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
        else if (document.msExitFullscreen) { document.msExitFullscreen(); }
    }
}

// Tema değiştirme fonksiyonu (basit)
function temayıDeğiştir(tema) {
    // Tema sistemi opsiyonel - şimdilik boş bırakıyoruz
    console.log('Tema:', tema);
}

// Pause fonksiyonu
function oyunuPause() {
    if (!oyunAktif || oyunBitti) return;

    oyunPause = !oyunPause;

    if (oyunPause) {
        // Pause durumunda oyun döngüsünü durdur
        clearTimeout(anaDonguTimeoutId);
        clearInterval(zamanlayiciId);

        // Buton metnini değiştir
        const pauseText = pauseBtn.querySelector('.pause-text');
        const pauseIcon = pauseBtn.querySelector('.buton-ikon');
        if (pauseText) pauseText.textContent = 'Resume';
        if (pauseIcon) pauseIcon.textContent = '▶️';

        // Pause ekranını göster - tumunuCiz çağırarak
        tumunuCiz();

        // Pause sesi
        if (sesAktif) {
            bit8SesEfekti('pause', { frekans: 400, sure: 0.2, volume: 0.1, tip: 'square' });
        }
    } else {
        // Devam durumunda oyun döngüsünü başlat
        anaDongu();
        zamanlayiciId = setInterval(zamanlayiciyiGuncelle, 1000);

        // Buton metnini değiştir
        const pauseText = pauseBtn.querySelector('.pause-text');
        const pauseIcon = pauseBtn.querySelector('.buton-ikon');
        if (pauseText) pauseText.textContent = 'Pause';
        if (pauseIcon) pauseIcon.textContent = '⏸️';

        // Devam sesi
        if (sesAktif) {
            bit8SesEfekti('resume', { frekans: 600, sure: 0.2, volume: 0.1, tip: 'square' });
        }
    }
}

// Pause ekranını göster
function pauseEkraniniGoster() {
    if (!ctx || !oyunAlani || !oyunPause) return;

    ctx.save();

    // Yarı saydam siyah overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, oyunAlani.width, oyunAlani.height);

    // Pause metni
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px "Segoe UI"';
    ctx.fillText('PAUSE', oyunAlani.width / 2, oyunAlani.height / 2 - 20);

    // Alt metin
    ctx.font = 'bold 24px "Segoe UI"';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Press PAUSE button to resume', oyunAlani.width / 2, oyunAlani.height / 2 + 40);

    // Harflerin gizli olduğunu belirten metin
    ctx.font = 'bold 18px "Segoe UI"';
    ctx.fillStyle = '#ffaaaa';
    ctx.fillText('Letters are hidden', oyunAlani.width / 2, oyunAlani.height / 2 + 80);

    ctx.restore();
}

// --- OYUNU BAŞLATMA ---
document.addEventListener('keydown', (event) => {
    if (event.key === 'F11') {
        event.preventDefault();
        tamEkranYap();
        return;
    }

    const okTuslari = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (okTuslari.includes(event.code)) {
        event.preventDefault();
    }

    if (event.code === 'Space') {
        event.preventDefault();
        if (!oyunAktif) {
            if (seviyeTamamlandi && beklenenSeviye) {
                // Seviye tamamlandı, beklenen seviyeyi başlat
                oyunuBaslat(beklenenSeviye);
                seviyeTamamlandi = false;
                beklenenSeviye = null;
            } else if (tekrarSeviye) {
                // Yanınca aynı seviyeden devam
                const seviye = tekrarSeviye;
                tekrarSeviye = null;
                oyunuBaslat(seviye);
            } else {
                // Normal oyun başlat
                oyunuBaslat();
            }
        } else if (oyunAktif && !oyunBitti) {
            oyunuPause();
        }
    } else {
        yonDegistir(event);
    }
});

// Event Listeners
if (yeniOyunBtn) {
    yeniOyunBtn.addEventListener('click', () => {
        console.log('Yeni oyun butonu tıklandı');
        try {
            oyunuBaslat(1);
        } catch (e) {
            console.error('Oyun başlatma hatası:', e);
        }
    });
}
if (tamEkranBtn) tamEkranBtn.addEventListener('click', tamEkranYap);
if (pauseBtn) pauseBtn.addEventListener('click', oyunuPause);
if (temaSelect) temaSelect.addEventListener('change', (e) => temayıDeğiştir(e.target.value));

// Ses kontrolleri
if (sesToggle) {
    sesToggle.addEventListener('click', () => {
        sesAktif = !sesAktif;
        sesToggle.textContent = sesAktif ? 'On' : 'Off';
        sesToggle.style.background = sesAktif ? 'rgba(0, 255, 136, 0.2)' : 'rgba(244, 67, 54, 0.2)';
        sesToggle.style.borderColor = sesAktif ? '#c4b5fd' : '#f44336';
    });
}

// Müzik kontrolleri kaldırıldı

// Ses kontrolleri eklendi

// Window resize event listener
window.addEventListener('resize', canvasBoyutunuAyarla);

// Fullscreen change event listener
document.addEventListener('fullscreenchange', () => setTimeout(canvasBoyutunuAyarla, 100));
document.addEventListener('mozfullscreenchange', () => setTimeout(canvasBoyutunuAyarla, 100));
document.addEventListener('webkitfullscreenchange', () => setTimeout(canvasBoyutunuAyarla, 100));
document.addEventListener('msfullscreenchange', () => setTimeout(canvasBoyutunuAyarla, 100));


// SFX kontrolleri kaldırıldı

// Ses ayarları kaldırıldı

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, oyun başlatılıyor...');

    // Ses sistemini hemen başlat
    sesSisteminiBaslat();

    // Canvas'ı yeniden kontrol et
    oyunAlani = document.getElementById('oyunAlani');
    if (oyunAlani) {
        ctx = oyunAlani.getContext('2d');
        console.log('Canvas bulundu ve context oluşturuldu');
    } else {
        console.error('Canvas elementi bulunamadı!');
    }

    // Canvas boyutunu ayarla
    try {
        canvasBoyutunuAyarla();
    } catch (e) {
        console.error('Canvas boyutlandırma hatası:', e);
    }

    // Tema ve başlangıç ekranını ayarla
    try {
        temayıDeğiştir('default');
        baslangicEkraniniCiz();
    } catch (e) {
        console.error('Başlangıç ekranı çizim hatası:', e);
    }

    // Kelime listesini yükle
    kelimeListesiniYukle();

    console.log('Oyun başlatma tamamlandı');
});

// Fallback: Eğer DOMContentLoaded çalışmazsa
setTimeout(() => {
    if (!oyunAlani || !ctx) {
        console.log('Fallback başlatma çalışıyor...');
        oyunAlani = document.getElementById('oyunAlani');
        if (oyunAlani) {
            ctx = oyunAlani.getContext('2d');
            canvasBoyutunuAyarla();
            temayıDeğiştir('default');
            baslangicEkraniniCiz();
        }
    }
}, 1000);


/* =======================
   GAMEPAD (Xbox / Generic)
   ======================= */
(function () {
    const deadzone = 0.25;            // sol çubuk eşik
    const tekrarGecikmesiMs = 120;    // yön tekrarı için debouncing
    let gamepadIndex = null;
    let sonYon = null;
    let sonYonZaman = 0;
    let oncekiButonlar = {};
    let oncekiDpad = { up: false, down: false, left: false, right: false };
    let rafId = null;

    const durumEl = document.getElementById('gamepadDurum');

    function setDurum(txt) {
        if (durumEl) durumEl.textContent = txt;
    }

    function yonGonder(keyName) {
        // keyName: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
        const codeMap = {
            'ArrowUp': { code: 'ArrowUp', keyCode: 38 },
            'ArrowDown': { code: 'ArrowDown', keyCode: 40 },
            'ArrowLeft': { code: 'ArrowLeft', keyCode: 37 },
            'ArrowRight': { code: 'ArrowRight', keyCode: 39 },
        };
        const map = codeMap[keyName];
        if (!map) return;
        const e = {
            key: keyName,
            code: map.code,
            keyCode: map.keyCode,
            preventDefault: () => { }
        };
        if (typeof yonDegistir === 'function') {
            yonDegistir(e);
        }
    }

    function baslatVeyaDevam() {
        // Oyunu başlat: mevcut kod "Enter" ile başlatıyor; doğrudan fonksiyonu çağır.
        try {
            if (!oyunAktif) {
                if (seviyeTamamlandi && beklenenSeviye) {
                    // Seviye tamamlandı, beklenen seviyeyi başlat
                    oyunuBaslat(beklenenSeviye);
                    seviyeTamamlandi = false;
                    beklenenSeviye = null;
                } else {
                    // Normal oyun başlat
                    oyunuBaslat(1);
                }
            }
        } catch (e) { /* yoksay */ }
    }

    function yeniOyunBaslat() {
        // Yeni oyun başlat (oyun aktif olsa da olmasa da)
        try {
            // Seviye bekleme durumunu sıfırla
            seviyeTamamlandi = false;
            beklenenSeviye = null;
            oyunuBaslat(1);
        } catch (e) { /* yoksay */ }
    }

    function stickYon(axeX, axeY) {
        // Y ekseni: -1 yukarı, +1 aşağı  (Gamepad API standardı)
        let yatay = Math.abs(axeX) > deadzone ? (axeX < 0 ? 'ArrowLeft' : 'ArrowRight') : null;
        let dikey = Math.abs(axeY) > deadzone ? (axeY < 0 ? 'ArrowUp' : 'ArrowDown') : null;
        // Aynı anda ikisi gelirse, son yön değişimine göre basit priorite verelim:
        return dikey || yatay; // önce dikey olsun (dönüşte kendini kilitlememek adına)
    }

    function dpadYon(btns) {
        // 12:Up, 13:Down, 14:Left, 15:Right
        const up = !!(btns[12] && btns[12].pressed);
        const down = !!(btns[13] && btns[13].pressed);
        const left = !!(btns[14] && btns[14].pressed);
        const right = !!(btns[15] && btns[15].pressed);

        // Edge-detect: yeni basışlarda tek atış yap
        let key = null;
        if (up && !oncekiDpad.up) key = 'ArrowUp';
        else if (down && !oncekiDpad.down) key = 'ArrowDown';
        else if (left && !oncekiDpad.left) key = 'ArrowLeft';
        else if (right && !oncekiDpad.right) key = 'ArrowRight';

        oncekiDpad = { up, down, left, right };
        return key;
    }

    function poll() {
        const gp = navigator.getGamepads ? navigator.getGamepads()[gamepadIndex] : null;
        if (!gp) {
            rafId = requestAnimationFrame(poll);
            return;
        }

        // Bağlı metni
        setDurum(`Gamepad: ${gp.id || 'Unknown'} (index ${gamepadIndex})`);

        // Butonları kontrol et - Yeni atamalar
        const basilanA = gp.buttons[0]?.pressed; // A tuşu - Pause
        const basilanY = gp.buttons[4]?.pressed; // Y tuşu - Tam Ekran
        const basilan7 = gp.buttons[7]?.pressed; // 7 numaralı tuş - Yeni Oyun
        const basilanStart = gp.buttons[9]?.pressed; // START tuşu - Oyun başlat
        const basilanView = gp.buttons[3]?.pressed; // VIEW tuşu - Oyun başlat

        // Button edge detection - Yeni atamalar
        if (basilanA && !oncekiButonlar[0]) oyunuPause(); // A tuşu ile pause
        if (basilanY && !oncekiButonlar[4]) tamEkranYap(); // Y tuşu ile tam ekran
        if (basilan7 && !oncekiButonlar[7]) yeniOyunBaslat(); // 7 numaralı tuş ile yeni oyun
        if (basilanStart && !oncekiButonlar[9]) baslatVeyaDevam(); // START tuşu ile başlat
        if (basilanView && !oncekiButonlar[3]) baslatVeyaDevam(); // VIEW tuşu ile başlat

        // Önceki durumları güncelle
        oncekiButonlar[0] = basilanA;
        oncekiButonlar[4] = basilanY;
        oncekiButonlar[7] = basilan7;
        oncekiButonlar[9] = basilanStart;
        oncekiButonlar[3] = basilanView;

        // D‑pad tek atış
        const dKey = dpadYon(gp.buttons);
        if (dKey) {
            yonGonder(dKey);
            sonYon = dKey;
            sonYonZaman = performance.now();
        }

        // Sol çubuk (axes[0], axes[1]) – tekrarlı ama debounce'lu
        const now = performance.now();
        const sKey = stickYon(gp.axes[0] || 0, gp.axes[1] || 0);
        if (sKey && (sKey !== sonYon || now - sonYonZaman > tekrarGecikmesiMs)) {
            yonGonder(sKey);
            sonYon = sKey;
            sonYonZaman = now;
        }
        if (!sKey) {
            sonYon = null;
        }

        rafId = requestAnimationFrame(poll);
    }

    window.addEventListener('gamepadconnected', (e) => {
        gamepadIndex = e.gamepad.index;
        setDurum(`Gamepad connected: ${e.gamepad.id}`);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(poll);
    });

    window.addEventListener('gamepaddisconnected', () => {
        setDurum('Gamepad: not connected');
        gamepadIndex = null;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        oncekiButonlar = {};
        oncekiDpad = { up: false, down: false, left: false, right: false };
        sonYon = null;
    });

    // Sayfa ilk açılışında takılı kolu yakalamak için bir kere yokla
    (function initScan() {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gps.length; i++) {
            if (gps[i]) {
                gamepadIndex = i;
                setDurum(`Gamepad connected: ${gps[i].id}`);
                rafId = requestAnimationFrame(poll);
                break;
            }
        }
    })();
})();