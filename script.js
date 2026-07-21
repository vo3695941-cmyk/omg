// ĐƯỜNG DẪN API SHEETDB CỦA BẠN (Dán vào đây)
const API_URL = "https://sheetdb.io/api/v1/h9tbqw2l8hjh8";

// Tự động tải bài viết khi mở trang
document.addEventListener("DOMContentLoaded", taiBaiVietWiki);

// 1. TẢI VÀ TỰ ĐỘNG PHÂN LOẠI MÀU BÀI VIẾT
async function taiBaiVietWiki() {
    const listContainer = document.getElementById("wikiArticlesList");
    
    try {
        const response = await fetch(API_URL);
        const articles = await response.json();
        
        if (articles.length === 0) {
            listContainer.innerHTML = "<p class='loading-text'>Chưa có hồ sơ Lost Media nào được đăng. Hãy là người đầu tiên!</p>";
            return;
        }
        
        listContainer.innerHTML = "";
        articles.reverse().forEach(article => {
            
            // Xử lý logic chọn Class màu dựa theo văn bản trạng thái mẫu mới
            let badgeClass = "lost"; 
            let statusText = article.status || "Thất lạc hoàn toàn";

            if (statusText.includes("Thất lạc một phần")) {
                badgeClass = "lost-partial"; // Đỏ sẫm
            } else if (statusText.includes("Đã tìm thấy một phần")) {
                badgeClass = "partial"; // Màu cam
            } else if (statusText.includes("Đã tìm thấy hoàn toàn") || statusText.includes("hoàn toàn")) {
                badgeClass = "found"; // Màu xanh lá
            } else if (statusText.includes("Tin đồn")) {
                badgeClass = "rumor"; // Màu xám
            }

            const articleHTML = `
                <article class="wiki-article">
                    <h2 class="article-title">${article.title}</h2>
                    <div class="article-meta">
                        <span><b>Thể loại:</b> ${article.category}</span>
                        <span><b>Trạng thái:</b> <span class="badge ${badgeClass}">${statusText}</span></span>
                    </div>
                    <p class="article-body">${article.content}</p>
                </article>
            `;
            listContainer.innerHTML += articleHTML;
        });
        
    } catch (error) {
        listContainer.innerHTML = "<p class='loading-text' style='color: #ff3333;'>Lỗi: Không thể kết nối với cơ sở dữ liệu Wiki.</p>";
        console.error(error);
    }
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
            taiBaiVietWiki(); // Tải lại danh sách bài viết ngay lập tức
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

