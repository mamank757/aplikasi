const GAS_URL_1 = "https://script.google.com/macros/s/AKfycbzJfQzgWnMJKqiaT8YP-GEPI_PNyYgjMkdL7LWQeostDueXwhRcY8ihHsPxNVTvIgRv/exec";
const GAS_URL_2 = "https://script.google.com/macros/s/AKfycbyvSjJziHRXDf_sj0HX1zKOr3P57uzvBBwT1EZzedVhzykUB4JN5H-WCuJNH43dhXcX/exec"; 
const GAS_URL_3 = "https://script.google.com/macros/s/AKfycbwldD-I2QuQew6mDuZ2YCjy7dA21yGT8QIab4sDJF88_Hcs1Jr8BrAduz1ZpSy-6CQN/exec"; 
const GAS_URL_4 = "https://script.google.com/macros/s/AKfycbxFXv4RlK2hztotRkjt-J8tyd9kBEGm-EoQTpdTZ503q7UfTuW5CUrfrtAe546CTEqZ/exec";

const chatboxAI = document.getElementById('chatboxAI');
const btnBukaChat = document.getElementById('btnBukaChat');
const btnTutupChat = document.getElementById('btnTutupChat');
const areaPesan = document.getElementById('areaPesan');
const inputPesan = document.getElementById('inputPesan');
const btnKirimPesan = document.getElementById('btnKirimPesan');

chatboxAI.style.display = 'none';

btnBukaChat.addEventListener('click', () => {
    toggleChatbox(1); // Default membuka AI 1 jika dari tombol mengambang
});

btnTutupChat.addEventListener('click', () => {
    chatboxAI.style.display = 'none';
    btnBukaChat.style.display = 'block';
});

btnKirimPesan.addEventListener('click', kirimPesan);

inputPesan.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        kirimPesan();
    }
});

async function simpanGambarPeta() {
    if (luasTotalHa === "0") {
        tampilkanPesan("⚠️ Belum ada area yang diukur!", "warning");
        return;
    }

    // Perlu library leaflet-image
    leafletImage(map, function(err, canvas) {
        if (err) {
            tampilkanPesan("❌ Gagal membuat gambar peta.", "error");
            return;
        }

        // Tambahkan teks info luas di atas canvas
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 10, 280, 60);
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`Luas: ${luasTotalHa} Hektar`, 20, 35);
        ctx.fillStyle = 'white';
        ctx.font = '13px sans-serif';
        ctx.fillText(`${luasTotalM2} m² • Smart Farming`, 20, 58);

        // Download otomatis
        const link = document.createElement('a');
        link.download = `lahan_${luasTotalHa}ha.png`;
        link.href = canvas.toDataURL('png');
        link.click();

        tampilkanPesan("✅ Gambar tersimpan!\nKirim manual ke WhatsApp.", "info");
    });
}

async function kirimPesan() {

    const teksPesan = inputPesan.value.trim();

    if (!teksPesan) return;

    tambahkanPesanLayar("Anda", teksPesan, "#3b82f6");

    inputPesan.value = "";

    btnKirimPesan.disabled = true;
    inputPesan.disabled = true;
    btnKirimPesan.textContent = "MENUNGGU JAWABAN...";

    try {

        let targetUrl;
        if (activeChatType === 1) targetUrl = GAS_URL_1;
        else if (activeChatType === 2) targetUrl = GAS_URL_2;
        else if (activeChatType === 3) targetUrl = GAS_URL_3;
        else targetUrl = GAS_URL_4; // Eksekusi URL ke-4
        const response = await fetch(targetUrl, {
            method: "POST",
            body: JSON.stringify({
                pesan: teksPesan
            })
        });

        const rawText = await response.text();

        console.log("STATUS:", response.status);
        console.log("RAW:", rawText);

        let data;

        try {
            data = JSON.parse(rawText);
        } catch {

            tambahkanPesanLayar(
                "DEBUG",
                rawText,
                "#f59e0b"
            );

            return;
        }

        // Jika ini response langsung dari Groq
        if (data.choices &&
            data.choices[0] &&
            data.choices[0].message) {

            tambahkanPesanLayar(
                "Asisten",
                data.choices[0].message.content,
                "#10b981"
            );

            return;
        }

        // Jika format custom Apps Script
        if (data.status === "sukses") {

            tambahkanPesanLayar(
                "Asisten",
                data.jawaban,
                "#10b981"
            );

            return;
        }

        tambahkanPesanLayar(
            "DEBUG",
            JSON.stringify(data, null, 2),
            "#ef4444"
        );

    } catch (err) {

        console.error(err);

        tambahkanPesanLayar(
            "Sistem",
            err.message || err.toString(),
            "#ef4444"
        );

    } finally {

        btnKirimPesan.disabled = false;
        inputPesan.disabled = false;
        btnKirimPesan.textContent = "KIRIM PESAN";

    }
}

function tambahkanPesanLayar(pengirim, teks, warnaAksen) {

    const bubble = document.createElement("div");

    bubble.style.cssText = `
        background: rgba(255,255,255,0.05);
        color: #e2e8f0;
        padding: 10px;
        border-radius: 8px;
        border-left: 3px solid ${warnaAksen};
        margin-bottom: 10px;
        line-height: 1.5;
    `;

    bubble.innerHTML = `
        <strong style="color:${warnaAksen}">
            ${pengirim}
        </strong>
        <br>
        ${teks.replace(/\n/g,"<br>")}
    `;

    areaPesan.appendChild(bubble);

    areaPesan.scrollTop = areaPesan.scrollHeight;
}

function startBWDCamera() {
    const video = document.getElementById('videoElement');
    if (!video) return;

    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
    })
    .then(stream => {
        currentStream = stream;
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Camera error:", err);
        alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
    });
}
