// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán mã thật của bạn vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";

// Biến toàn cục phục vụ hệ thống
let tatCaBaiViet = [];
let userHienTai = "";

// Tự động chạy khi mở trang
document.addEventListener("DOMContentLoaded", () => {
    taiBaiVietWiki();
    kiemTraUserLocal();
    
    // Kích hoạt thanh tìm kiếm thời gian thực
    const searchInput = document.getElementById("wikiSearchInput");
    if(searchInput) searchInput.addEventListener("input", xuLyTimKiem);

    // Kích hoạt nút đặt tên
    const step1Form = document.getElementById("step1Form");
    if(step1Form) step1Form.addEventListener("submit", xuLyDatTen);
});

// HÀM KIỂM TRA LOCALSTORAGE TRÊN ĐIỆN THOẠI
function kiemTraUserLocal() {
    const savedUser = localStorage.getItem("wiki_username");
    if (savedUser) {
        userHienTai = savedUser;
        hienThiFormDangBai();
    }
}

// HÀM ĐĂNG KÝ BIỆT DANH VÀ KIỂM TRA TRÙNG NHAU (GỬI ĐẾN TRANG TÍNH2)
async function xuLyDatTen(e) {
    e.preventDefault();
    const inputName = document.getElementById("regUsername").value.trim();
    const regBtn = document.getElementById("regBtn");
    
    if(!inputName) return;

    regBtn.innerText = "ĐANG KIỂM TRA TÊN...";
    regBtn.disabled = true;

    try {
        // 1. Lấy danh sách tên từ Trang tính2 về để đối chiếu xem có trùng không
        const response = await fetch(`${API_URL}?sheet=Trang tính2`);
        const usersList = await response.json();
        const danhSachTen = Array.isArray(usersList) ? usersList : [];
        
        const biTrung = danhSachTen.some(user => user.username && user.username.toString().toLowerCase() === inputName.toLowerCase());
        
        if (biTrung) {
            alert(`✕ Tên "${inputName}" đã có người sử dụng! Vui lòng chọn tên khác.`);
            regBtn.innerText = "XÁC NHẬN BIỆT DANH";
            regBtn.disabled = false;
        } else {
            // 2. Gửi dữ liệu theo đúng chuẩn Array mảng bọc Object đối tượng của SheetDB
            const registerRes = await fetch(`${API_URL}?sheet=Trang tính2`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [
                        { "username": inputName }
                    ]
                })
            });

            if(registerRes.ok) {
                // Lưu tên vào máy điện thoại để không bắt nhập lại lần sau
                localStorage.setItem("wiki_username", inputName);
                userHienTai = inputName;
                alert(`✓ Đăng ký tên độc quyền "${inputName}" thành công!`);
                hienThiFormDangBai();
            } else {
                alert("✕ Lỗi kết nối máy chủ đăng ký dữ liệu.");
                regBtn.innerText = "XÁC NHẬN BIỆT DANH";
                regBtn.disabled = false;
            }
        }
    } catch (error) {
        alert("✕ Lỗi cấu trúc bảng dữ liệu phụ.");
        regBtn.innerText = "XÁC NHẬN BIỆT DANH";
        regBtn.disabled = false;
        console.error(error);
    }
}

function hienThiFormDangBai() {
    document.getElementById("authStep").style.display = "none";
    document.getElementById("postStep").style.display = "block";
    document.getElementById("currentUserDisplay").innerText = userHienTai;
}

// 3. TẢI TOÀN BỘ BÀI VIẾT TỪ TRANG TÍNH1 LÊN WEB
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
        listContainer.innerHTML = "<p class='loading-text' style='color: #ff3333;'>Lỗi: Không thể kết nối với cơ sở dữ liệu Wiki.</p>";
    }
}

// IN BÀI VIẾT RA GIAO DIỆN MÀN HÌNH
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

// HÀM LỌC TÌM KIẾM THEO TỪ KHÓA TÊN GAME
function xuLyTimKiem(e) {
    const tuKhoa = e.target.value.toLowerCase().trim();
    const ketQuaLoc = tatCaBaiViet.filter(article => {
        const tieuDe = article.title ? article.title.toLowerCase() : "";
        return tieuDe.includes(tuKhoa);
    });
    hienThiDanhSach(ketQuaLoc);
}

// 4. GỬI BÀI VIẾT MỚI LÊN TRANG TÍNH1
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
            const response = await fetch(`${API_URL}?sheet=Trang tính1`, {
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
