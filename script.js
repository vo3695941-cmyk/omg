// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán mã của bạn vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";

// Biến toàn cục phục vụ hệ thống
let tatCaBaiViet = [];
let userHienTai = "";

// Tự động chạy khi mở trang
document.addEventListener("DOMContentLoaded", () => {
    taiBaiVietWiki();
    kiemTraUserLocal();
    
    const searchInput = document.getElementById("wikiSearchInput");
    if(searchInput) searchInput.addEventListener("input", xuLyTimKiem);

    const step1Form = document.getElementById("step1Form");
    if(step1Form) step1Form.addEventListener("submit", xuLyDatTen);
});

function kiemTraUserLocal() {
    const savedUser = localStorage.getItem("wiki_username");
    if (savedUser) {
        userHienTai = savedUser;
        hienThiFormDangBai();
    }
}

async function xuLyDatTen(e) {
    e.preventDefault();
    const inputName = document.getElementById("regUsername").value.trim();
    const regBtn = document.getElementById("regBtn");
    if(!inputName) return;
    regBtn.innerText = "ĐANG KIỂM TRA TÊN...";
    regBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}?sheet=Trang tính2`);
        const usersList = await response.json();
        const danhSachTen = Array.isArray(usersList) ? usersList : [];
        const biTrung = danhSachTen.some(user => user.username && user.username.toString().toLowerCase() === inputName.toLowerCase());
        
        if (biTrung) {
            alert(`✕ Tên "${inputName}" đã có người sử dụng!`);
            regBtn.innerText = "XÁC NHẬN BIỆT DANH";
            regBtn.disabled = false;
        } else {
            const registerRes = await fetch(`${API_URL}?sheet=Trang tính2`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{ "username": inputName }] })
            });

            if(registerRes.ok) {
                localStorage.setItem("wiki_username", inputName);
                userHienTai = inputName;
                alert(`✓ Đăng ký thành công tên độc quyền!`);
                hienThiFormDangBai();
            } else {
                alert("✕ Lỗi kết nối đăng ký.");
                regBtn.innerText = "XÁC NHẬN BIỆT DANH";
                regBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("✕ Lỗi cấu trúc bảng phụ.");
        regBtn.innerText = "XÁC NHẬN BIỆT DANH";
        regBtn.disabled = false;
    }
}

function hienThiFormDangBai() {
    document.getElementById("authStep").style.display = "none";
    document.getElementById("postStep").style.display = "block";
    document.getElementById("currentUserDisplay").innerText = userHienTai;
}

async function taiBaiVietWiki() {
    const listContainer = document.getElementById("wikiArticlesList");
    try {
        const response = await fetch(`${API_URL}?sheet=Trang tính1`);
        const articles = await response.json();
        const danhSachBai = Array.isArray(articles) ? articles : [];

        if (danhSachBai.length === 0 || danhSachBai.error) {
            listContainer.innerHTML = "<p class='loading-text'>Chưa có hồ sơ Lost Media nào được đăng. Hãy là người đầu tiên!</p>";
            return;
        }
        tatCaBaiViet = danhSachBai.reverse();
        hienThiDanhSach(tatCaBaiViet);
    } catch (error) {
        listContainer.innerHTML = "<p class='loading-text' style='color: #ff3333;'>Lỗi kết nối cơ sở dữ liệu Wiki.</p>";
    }
}

// HÀM CHUYỂN LINK YOUTUBE THƯỜNG THÀNH LINK EMBED ĐỂ CHẠY ĐƯỢC TRÊN WEB
function layYoutubeEmbedId(url) {
    if(!url) return null;
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function hienThiDanhSach(danhSach) {
    const listContainer = document.getElementById("wikiArticlesList");
    listContainer.innerHTML = "";
    
    if (danhSach.length === 0) {
        listContainer.innerHTML = "<p class='loading-text'>✕ Không tìm thấy kết quả phù hợp.</p>";
        return;
    }
    
    danhSach.forEach(article => {
        let badgeClass = "lost"; 
        let statusText = article.status || "Thất lạc hoàn toàn";
        if (statusText.includes("Thất lạc một phần")) badgeClass = "lost-partial"; 
        else if (statusText.includes("Đã tìm thấy một phần")) badgeClass = "partial"; 
        else if (statusText.includes("Đã tìm thấy hoàn toàn")) badgeClass = "found"; 
        else if (statusText.includes("Tin đồn")) badgeClass = "rumor"; 

        let platformText = article.platform ? `<span><b>Hệ điều hành:</b> ${article.platform}</span>` : '';
        let authorText = `<span><b>Người đóng góp:</b> 👤 ${article.author || "Thành viên"}</span>`;

        // TỰ ĐỘNG XỬ LÝ ẢNH VÀ VIDEO NHÚNG
        let mediaHTML = "";
        if (article.image_url && article.image_url.trim() !== "") {
            mediaHTML += `<img src="${article.image_url}" class="wiki-uploaded-img" alt="Bằng chứng">`;
        }
        
        let ytId = layYoutubeEmbedId(article.video_url);
        if (ytId) {
            mediaHTML += `<div class="video-container"><iframe src="https://youtube.com{ytId}" allowfullscreen></iframe></div>`;
        }

        const articleHTML = `
            <article class="wiki-article">
                <h2 class="article-title">${article.title}</h2>
                <div class="article-meta">
                    <span><b>Thể loại:</b> ${article.category}</span>
                    ${platformText} ${authorText}
                    <span><b>Trạng thái:</b> <span class="badge ${badgeClass}">${statusText}</span></span>
                </div>
                ${mediaHTML ? `<div class="wiki-media-box">${mediaHTML}</div>` : ""}
                <p class="article-body">${article.content}</p>
            </article>
        `;
        listContainer.innerHTML += articleHTML;
    });
}

function xuLyTimKiem(e) {
    const tuKhoa = e.target.value.toLowerCase().trim();
    const ketQuaLoc = tatCaBaiViet.filter(article => {
        const tieuDe = article.title ? article.title.toLowerCase() : "";
        return tieuDe.includes(tuKhoa);
    });
    hienThiDanhSach(ketQuaLoc);
}

const postForm = document.getElementById("postForm");
const submitBtn = document.getElementById("submitBtn");

if(postForm) {
    postForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        submitBtn.innerText = "ĐANG XUẤT BẢN...";
        submitBtn.disabled = true;
        
        const newArticle = {
            title: document.getElementById("title").value,
            category: document.getElementById("category").value,
            platform: document.getElementById("platform").value,
            image_url: document.getElementById("imageUrl").value, // Lấy link ảnh
            video_url: document.getElementById("videoUrl").value, // Lấy link video
            status: document.getElementById("status").value,
            content: document.getElementById("content").value,
            author: userHienTai 
        };
        
        try {
            const response = await fetch(`${API_URL}?sheet=Trang tính1`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [newArticle] })
            });
            
            if (response.ok) {
                alert("✓ Bài viết của bạn đã được xuất bản lên Wiki!");
                postForm.reset();
                document.getElementById("wikiSearchInput").value = "";
                taiBaiVietWiki(); 
            } else { alert("✕ Lỗi hệ thống, không thể đăng bài."); }
        } catch (error) { alert("✕ Không thể kết nối mạng."); }
        finally { submitBtn.innerText = "XUẤT BẢN BÀI VIẾT"; submitBtn.disabled = false; }
    });
}

// BỘ BẢO MẬT CHẶN F12 VÀ CHUỘT PHẢI
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault(); return false;
    }
});
