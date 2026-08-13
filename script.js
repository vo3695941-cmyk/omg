// ĐƯỜNG DẪN API SHEETDB (Điền mã số đuôi thật của bạn vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";
let tatCaBaiViet = [], userHienTai = "";

document.addEventListener("DOMContentLoaded", () => {
    kiemTraUserLocal();
    
    // KÍCH HOẠT ĐIỀU HƯỚNG CHUYỂN TRANG CHỦ
    document.getElementById("btnGoToPost").addEventListener("click", () => moCuaSo("sectionPost"));
    document.getElementById("btnGoToView").addEventListener("click", () => { moCuaSo("sectionView"); taiBaiVietWiki(); });
    document.getElementById("closePostBtn").addEventListener("click", veTrangChu);
    document.getElementById("closeViewBtn").addEventListener("click", veTrangChu);

    if(document.getElementById("wikiSearchInput")) document.getElementById("wikiSearchInput").addEventListener("input", xuLyTimKiem);
    if(document.getElementById("step1Form")) document.getElementById("step1Form").addEventListener("submit", xuLyDatTen);
});

// HÀM ĐIỀU HƯỚNG ẨN HIỆN GIAO DIỆN
function moCuaSo(sectionId) {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById(sectionId).style.display = "block";
}

function veTrangChu() {
    document.getElementById("sectionPost").style.display = "none";
    document.getElementById("sectionView").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
}

function kiemTraUserLocal() {
    userHienTai = localStorage.getItem("wiki_username") || "";
    if (userHienTai) hienThiFormDangBai();
}

async function xuLyDatTen(e) {
    e.preventDefault(); const inputName = document.getElementById("regUsername").value.trim(); const regBtn = document.getElementById("regBtn");
    if(!inputName) return; regBtn.innerText = "ĐANG KIỂM TRA..."; regBtn.disabled = true;
    try {
        const res = await fetch(`${API_URL}?sheet=Trang tính2`); const list = await res.json();
        if ((Array.isArray(list) ? list : []).some(u => u.username && u.username.toString().toLowerCase() === inputName.toLowerCase())) {
            alert(`✕ Tên "${inputName}" đã trùng!`); regBtn.innerText = "XÁC NHẬN BIỆT DANH"; regBtn.disabled = false;
        } else {
            const regRes = await fetch(`${API_URL}?sheet=Trang tính2`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [{"username": inputName}] }) });
            if(regRes.ok) { localStorage.setItem("wiki_username", inputName); userHienTai = inputName; alert("✓ Đăng ký thành công!"); hienThiFormDangBai(); }
            else { alert("✕ Lỗi đăng ký."); regBtn.disabled = false; }
        }
    } catch { alert("✕ Lỗi kết nối."); regBtn.disabled = false; }
}

function hienThiFormDangBai() {
    if(document.getElementById("authStep")) document.getElementById("authStep").style.display = "none";
    if(document.getElementById("postStep")) document.getElementById("postStep").style.display = "block";
    if(document.getElementById("currentUserDisplay")) document.getElementById("currentUserDisplay").innerText = userHienTai;
}

async function taiBaiVietWiki() {
    try {
        const res = await fetch(`${API_URL}?sheet=Trang tính1`); const articles = await res.json();
        tatCaBaiViet = (Array.isArray(articles) ? articles : []).reverse(); hienThiDanhSach(tatCaBaiViet);
    } catch { document.getElementById("wikiArticlesList").innerHTML = "<p class='loading-text' style='color:#ff3333;'>Lỗi kết nối.</p>"; }
}

function hienThiDanhSach(danhSach) {
    const listContainer = document.getElementById("wikiArticlesList"); listContainer.innerHTML = danhSach.length === 0 ? "<p class='loading-text'>✕ Không tìm thấy.</p>" : "";
    danhSach.forEach(art => {
        let bClass = art.status?.includes("một phần") ? (art.status.includes("Thất lạc") ? "lost-partial" : "partial") : (art.status?.includes("hoàn toàn") && art.status.includes("Tìm thấy") ? "found" : (art.status?.includes("Tin đồn") ? "rumor" : "lost"));
        let pClass = art.platform?.includes("Android") && art.platform?.includes("iOS") ? "platform-both" : (art.platform?.includes("Android") ? "platform-android" : (art.platform?.includes("iOS") ? "platform-ios" : "platform-none"));
        let mediaHTML = art.image_url ? `<img src="${art.image_url}" class="wiki-uploaded-img">` : "";
        if (art.video_url) mediaHTML += `<div class="video-container" style="padding-bottom:0;height:auto;"><video controls style="width:100%;max-height:400px;background:#000;"><source src="${art.video_url}" type="video/mp4"></video></div>`;
        listContainer.innerHTML += `
            <article class="wiki-article">
                <h2 class="article-title">${art.title}</h2>
                <div class="article-meta"><span><b>Thể loại:</b> ${art.category}</span>${art.platform ? `<span><b>Hệ điều hành:</b> <span class="badge ${pClass}">${art.platform}</span></span>`:''}<span><b>Người đăng:</b> 👤 ${art.author || "Thành viên"}</span><span><b>Trạng thái:</b> <span class="badge ${bClass}">${art.status || "Thất lạc"}</span></span></div>
                ${mediaHTML ? `<div class="wiki-media-box">${mediaHTML}</div>`:""}<p class="article-body">${art.content}</p>
            </article>`;
    });
}

function xuLyTimKiem(e) {
    const kw = e.target.value.toLowerCase().trim();
    hienThiDanhSach(tatCaBaiViet.filter(art => (art.title ? art.title.toLowerCase() : "").includes(kw)));
}

async function uploadToCloud(elementId, type) {
    const fileInput = document.getElementById(elementId);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return "";
    const formData = new FormData(); formData.append("file", fileInput.files[0]); formData.append("upload_preset", "wiki_lostmedia_public");
    try {
        const res = await fetch(`https://cloudinary.com{type}/upload`, { method: "POST", body: formData });
        if (!res.ok) return "";
        const data = await res.json(); return data.secure_url || "";
    } catch { return ""; }
}

if(document.getElementById("postForm")) {
    document.getElementById("postForm").addEventListener("submit", async function(e) {
        e.preventDefault(); const btn = document.getElementById("submitBtn"); btn.innerText = "⏳ ĐANG LƯU TRỮ TỆP..."; btn.disabled = true;
        const imgUrl = await uploadToCloud("imageFile", "image");
        const vidUrl = await uploadToCloud("videoFile", "video");
        btn.innerText = "⚡ ĐANG XUẤT BẢN...";
        const newArt = { title: document.getElementById("title").value, category: document.getElementById("category").value, platform: document.getElementById("platform").value, image_url: imgUrl, video_url: vidUrl, status: document.getElementById("status").value, content: document.getElementById("content").value, author: userHienTai };
        try {
            const res = await fetch(`${API_URL}?sheet=Trang tính1`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [newArt] }) });
            if (res.ok) { alert("✓ Đăng bài lên Wiki thành công!"); this.reset(); document.getElementById("wikiSearchInput").value = ""; veTrangChu(); }
            else alert("✕ Thất bại.");
        } catch { alert("✕ Lỗi kết nối."); }
        finally { btn.innerText = "XUẤT BẢN BÀI VIẾT"; btn.disabled = false; }
    });
}

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => { if (e.key === 'F12' || e.keyCode === 123 || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key?.toLowerCase() === 'u')) e.preventDefault(); });
