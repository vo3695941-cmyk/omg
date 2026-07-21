// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán mã của bạn vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";

// Biến toàn cục để lưu trữ danh sách bài viết phục vụ tìm kiếm
let tatCaBaiViet = [];

// Tự động tải bài viết khi mở trang
document.addEventListener("DOMContentLoaded", () => {
    taiBaiVietWiki();
    
    // KÍCH HOẠT TÍNH NĂNG TÌM KIẾM THEO THỜI GIAN THỰC
    const searchInput = document.getElementById("wikiSearchInput");
    searchInput.addEventListener("input", xuLyTimKiem);
});

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
        
        // Lưu dữ liệu vào biến tổng để phục vụ cho hàm tìm kiếm
        tatCaBaiViet = articles.reverse();
        
        // Hiển thị danh sách ban đầu lên màn hình
        hienThiDanhSach(tatCaBaiViet);
        
    } catch (error) {
        listContainer.innerHTML = "<p class='loading-text' style='color: #ff3333;'>Lỗi: Không thể kết nối với cơ sở dữ liệu Wiki.</p>";
        console.error(error);
    }
}

// HÀM PHỤ TRỢ: IN GIAO DIỆN BÀI VIẾT RA MÀN HÌNH
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

        const articleHTML = `
            <article class="wiki-article">
                <h2 class="article-title">${article.title}</h2>
                <div class="article-meta">
                    <span><b>Thể loại:</b> ${article.category}</span>
                    ${platformText}
                    <span><b>Trạng thái:</b> <span class="badge ${badgeClass}">${statusText}</span></span>
                </div>
                <p class="article-body">${article.content}</p>
            </article>
        `;
        listContainer.innerHTML += articleHTML;
    });
}

// CẬP NHẬT: HÀM LỌC TÌM KIẾM THEO TÊN BÀI VIẾT
function xuLyTimKiem(e) {
    const tuKhoa = e.target.value.toLowerCase().trim();
    
    // Tiến hành lọc các bài viết có tiêu đề chứa từ khóa người dùng nhập vào
    const ketQuaLoc = tatCaBaiViet.filter(article => {
        const tieuDe = article.title ? article.title.toLowerCase() : "";
        return tieuDe.includes(tuKhoa);
    });
    
    // In danh sách sau khi lọc ra màn hình
    hienThiDanhSach(ketQuaLoc);
}

// 2. GỬI BÀI VIẾT MỚI LÊN GOOGLE SHEETS
const postForm = document.getElementById("postForm");
const submitBtn = document.getElementById("submitBtn");

postForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    submitBtn.innerText = "ĐANG XUẤT BẢN...";
    submitBtn.disabled = true;
    
    const newArticle = {
        title: document.getElementById("title").value,
        category: document.getElementById("category").value,
        platform: document.getElementById("platform").value,
        status: document.getElementById("status").value,
        content: document.getElementById("content").value
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
            // Xóa chữ trong ô tìm kiếm khi đăng bài mới để tránh bị lỗi hiển thị
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
