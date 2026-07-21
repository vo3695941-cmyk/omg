// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán mã của bạn vào đây)
const API_URL = "https://sheetdb.io";

// Biến toàn cục phục vụ hệ thống
let tatCaBaiViet = [];
let userHienTai = "";

// Tự động chạy khi mở trang
document.addEventListener("DOMContentLoaded", () => {
    taiBaiVietWiki();
    kiemTraUserLocal();
    
    // Kích hoạt thanh tìm kiếm thời gian thực
    const searchInput = document.getElementById("wikiSearchInput");
    searchInput.addEventListener("input", xuLyTimKiem);

    // Kích hoạt nút đặt tên
    const step1Form = document.getElementById("step1Form");
    if(step1Form) step1Form.addEventListener("submit", xuLyDatTen);
});

// HÀM KIỂM TRA XEM TRONG MÁY ĐÃ CÓ TÊN CHƯA (Khóa cứng tên trên máy cũ)
function kiemTraUserLocal() {
    const savedUser = localStorage.getItem("wiki_username");
    if (savedUser) {
        userHienTai = savedUser;
        hienThiFormDangBai();
    }
}

// HÀM XỬ LÝ ĐẶT TÊN VÀ KIỂM TRA TRÙNG LẶP TRÊN SHEET 2
async function xuLyDatTen(e) {
    e.preventDefault();
    const inputName = document.getElementById("regUsername").value.trim();
    const regBtn = document.getElementById("regBtn");
    
    if(!inputName) return;

    regBtn.innerText = "ĐANG KIỂM TRA TÊN...";
    regBtn.disabled = true;

    try {
        // Gọi lên Sheet2 để kiểm tra danh sách tên trùng
        const response = await fetch(`${API_URL}?sheet=Trang tính2`);
        const usersList = await response.json();
        
        const biTrung = usersList.some(user => user.username && user.username.toLowerCase() === inputName.toLowerCase());
        
        if (biTrung) {
            alert(`✕ Tên "${inputName}" đã có người sử dụng! Vui lòng chọn tên khác.`);
            regBtn.innerText = "XÁC NHẬN BIỆT DANH";
            regBtn.disabled = false;
        } else {
            // Lưu tên mới độc quyền lên Sheet2
            const registerRes = await fetch(`${API_URL}?sheet=Trang tính2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{ username: inputName }] })
            });

            if(registerRes.ok) {
                localStorage.setItem("wiki_username", inputName);
                userHienTai = inputName;
                alert(`✓ Đăng ký tên độc quyền "${inputName}" thành công!`);
                hienThiFormDangBai();
            } else {
                alert("✕ Lỗi kết nối sever đăng ký.");
                regBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("✕ Lỗi kiểm tra cơ sở dữ liệu.");
        regBtn.disabled = false;
    }
}

function hienThiFormDangBai() {
    document.getElementById("authStep").style.display = "none";
    document.getElementById("postStep").style.display = "block";
    document.getElementById("currentUserDisplay").innerText = userHienTai;
}

// 1. TẢI BÀI VIẾT TỪ GOOGLE SHEETS
async function taiBaiVietWiki() {
    const listContainer = document.getElementById("wikiArticlesList");
    
    try {
        const response = await fetch(API_URL);
        const articles = await response.json();
        
        if (articles.length === 0) {
            listContainer.innerHTML = "<p class='loading-text'>Chưa có hồ sơ Lost Media nào được đăng. Hãy là người đầu tiên!</p>";
            return;
        }
        
        tatCaBaiViet = articles.reverse();
        hienThiDanhSach(tatCaBaiViet);
        
    } catch (error) {
        listContainer.innerHTML = "<p class='loading-text' style='color: #ff3333;'>Lỗi: Không thể kết nối với cơ sở dữ liệu Wiki.</p>";
    }
}

// IN BÀI VIẾT RA GIAO DIỆN
function hienThiDanhSach(danhSach) {
    const listContainer = document.getElementById("wikiArticlesList");
    listContainer.innerHTML = "";
    
    if (danhSach.length === 0) {
        listContainer.innerHTML = "<p class='loading-text'>❌ Không tìm thấy hồ sơ nào khớp với từ khóa của bạn.</p>";
        return;
    }
    
    danhSach.forEach(article => {
        let badgeClass = "lost"; 
        let statusText = article.status || "Thất lạc hoàn toàn";

        if (statusText.includes("Thất lạc một phần")) {
            badgeClass = "lost-partial"; 
        } else if (statusText.includes("Đã tìm thấy một phần")) {
            badgeClass = "partial"; 
        } else if (statusText.includes("Đã tìm thấy hoàn toàn") || statusText.includes("hoàn toàn")) {
            badgeClass = "found"; 
        } else if (statusText.includes("Tin đồn")) {
            badgeClass = "rumor"; 
        }

        let platformText = article.platform ? `<span><b>Hệ điều hành:</b> ${article.platform}</span>` : '';
        let authorText = article.author ? `<span><b>Người đóng góp:</b> 👤 ${article.author}</span>` : '<span><b>Người đóng góp:</b> 👤 Ẩn danh</span>';

        const articleHTML = `
            <article class="wiki-article">
                <h2 class="article-title">${article.title}</h2>
                <div class="article-meta">
                    <span><b>Thể loại:</b> ${article.category}</span>
                    ${platformText}
                    ${authorText}
                    <span><b>Trạng thái:</b> <span class="badge ${badgeClass}">${statusText}</span></span>
                </div>
                <p class="article-body">${article.content}</p>
            </article>
        `;
        listContainer.innerHTML += articleHTML;
    });
}

// HÀM LỌC TÌM KIẾM
function xuLyTimKiem(e) {
    const tuKhoa = e.target.value.toLowerCase().trim();
    const ketQuaLoc = tatCaBaiViet.filter(article => {
        const tieuDe = article.title ? article.title.toLowerCase() : "";
        return tieuDe.includes(tuKhoa);
    });
    hienThiDanhSach(ketQuaLoc);
}

// 2. GỬI BÀI VIẾT MỚI LÊN GOOGLE SHEETS
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
            status: document.getElementById("status").value,
            content: document.getElementById("content").value,
            author: userHienTai 
        };
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [newArticle] })
            });
            
            if (response.ok) {
                alert("✓ Bài viết của bạn đã được xuất bản lên Wiki!");
                postForm.reset();
                document.getElementById("wikiSearchInput").value = "";
                taiBaiVietWiki(); 
            } else {
                alert("✕ Lỗi hệ thống, không thể đăng bài.");
            }
        } catch (error) {
            alert("✕ Không thể kết nối mạng để đăng bài.");
        } finally {
            submitBtn.innerText = "XUẤT BẢN BÀI VIẾT";
            submitBtn.disabled = false;
        }
    });
}

// --- BỘ BẢO MẬT CHẶN F12 VÀ CHUỘT PHẢI ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});
