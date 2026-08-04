// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán mã thật của bạn vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";

// Biến toàn cục phục vụ hệ thống
let tatCaBaiViet = [];
let userHienTai = "";

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

        let platformClass = "platform-none";
        let platformValue = article.platform || "";
        if (platformValue.includes("Android") && platformValue.includes("iOS")) platformClass = "platform-both";
        else if (platformValue.includes("Android")) platformClass = "platform-android";
        else if (platformValue.includes("iOS")) platformClass = "platform-ios";

        let platformText = article.platform ? `<span><b>Hệ điều hành:</b> <span class="badge ${platformClass}">${article.platform}</span></span>` : '';
        let authorText = `<span><b>Người đóng góp:</b> 👤 ${article.author || "Thành viên"}</span>`;

        let mediaHTML = "";
        if (article.image_url && article.image_url.trim() !== "") {
            mediaHTML += `<img src="${article.image_url}" class="wiki-uploaded-img" alt="Bằng chứng">`;
        }
        
        // CẬP NHẬT: TỰ ĐỘNG HIỂN THỊ TRÌNH PHÁT VIDEO ĐỘC LẬP HTML5
        if (article.video_url && article.video_url.trim() !== "") {
            mediaHTML += `
                <div class="video-container" style="padding-bottom: 0; height: auto;">
                    <video controls style="width:100%; max-height:400px; background:#000; border-radius:4px;">
                        <source src="${article.video_url}" type="video/mp4">
                        Trình duyệt của bạn không hỗ trợ xem video trực tiếp.
                    </video>
                </div>`;
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
        submitBtn.innerText = "ĐANG TẢI VIDEO LÊN ĐÁM MÂY TỰ ĐỘNG...";
        submitBtn.disabled = true;
        
        let videoUrlFinal = "";
        const videoFileInput = document.getElementById("videoFile");
        
        // NẾU NGƯỜI DÙNG CÓ CHỌN TỆP VIDEO TỪ ĐIỆN THOẠI
        if (videoFileInput.files.length > 0) {
            const file = videoFileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "wiki_lostmedia_public"); // Tạo kênh upload công khai miễn phí ẩn

            try {
                // Đẩy video lên đám mây Cloudinary miễn phí vĩnh viễn
                const cloudRes = await fetch("https://cloudinary.com", {
                    method: "POST",
                    body: formData
                });
                const cloudData = await cloudRes.json();
                if(cloudData.secure_url) {
                    videoUrlFinal = cloudData.secure_url; // Lấy link trực tiếp file video dạng mp4
                }
            } catch (err) {
                console.error("Lỗi tải video:", err);
                alert("✕ Lỗi tải tệp video lên đám mây. Hệ thống sẽ đăng bài không kèm video.");
            }
        }
        
        submitBtn.innerText = "ĐANG XUẤT BẢN BÀI VIẾT...";
        
        const newArticle = {
            title: document.getElementById("title").value,
            category: document.getElementById("category").value,
            platform: document.getElementById("platform").value,
            image_url: document.getElementById("imageUrl").value, 
            video_url: videoUrlFinal, // Lưu link video mp4 đám mây vào Excel
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
                alert("✓ Bài viết và video của bạn đã được lưu trữ vĩnh viễn lên Wiki!");
                postForm.reset();
                document.getElementById("wikiSearchInput").value = "";
                taiBaiVietWiki(); 
            } else { alert("✕ Lỗi hệ thống, không thể đăng bài."); }
        } catch (error) { alert("✕ Không thể kết nối mạng."); }
        finally { submitBtn.innerText = "XUẤT BẢN BÀI VIẾT"; submitBtn.disabled = false; }
    });
}

// BỘ BẢO MẬT CHẶN F12
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault(); return false;
    }
});
