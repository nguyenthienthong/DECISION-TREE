# Decision Tree Explorer & Interactive Learning Lab 🌳

Một ứng dụng web tương tác trực quan toàn diện để học tập, thực hành và nghiên cứu sâu về **Cây Quyết Định (Decision Tree)** - thuật toán nền tảng trong Trí tuệ nhân tạo và Khai phá dữ liệu (Machine Learning & Data Mining).

## 🌟 Tính Năng Nổi Bật

### 1. Khám Phá Qua Nhiều Bộ Dữ Liệu (Multi-Dataset Support)
- **Chơi Tennis (Weather / Play Tennis)**: Dữ liệu kinh điển ID3/C4.5 của Tom Mitchell (1997).
- **Mua Máy Tính (Buy Computer)**: Dữ liệu phân loại khách hàng từ giáo trình Han & Kamber.
- **Sống Sót Tàu Titanic (Titanic Survival)**: Bộ dữ liệu kết hợp cả biến danh mục và biến số thực liên tục.
- **Sàng Lọc Tim Mạch (Heart Disease)**: Bài toán chẩn đoán y tế nhiều thuộc tính lâm sàng.
- **Dự Đoán Giá Nhà (Housing Price - Regression Tree)**: Bài toán hồi quy số thực liên tục với hàm mất mát MSE / Giảm phương sai (Variance Reduction).
- **Tải lên tệp CSV riêng (Custom CSV Upload)**: Tự động phân tích kiểu dữ liệu (Categorical / Numerical) và huấn luyện cây tức thì!

### 2. So Sánh & Thực Thi Nhiều Thuật Toán & Tiêu Chuẩn Phân Nhánh
- **ID3**: Entropy & Information Gain (Độ tăng thông tin).
- **C4.5**: Phân nhánh cho cả biến rời rạc và liên tục với ngưỡng số thực, chuẩn hóa bằng Split Information và Gain Ratio (Tỷ lệ tăng thông tin).
- **CART (Classification & Regression Tree)**: Cây nhị phân tối ưu với độ bất thuần Gini (Gini Impurity) và Variance Reduction (cho hồi quy).
- **So sánh lý thuyết mở rộng**: CHAID (Chi-square test) và liên hệ thực tiễn với Ensemble Learning (Random Forest, Gradient Boosting Trees).

### 3. Trực Quan Hóa Đồ Họa Tương Tác
- **Interactive Tree Graph (SVG)**: Cây vẽ phân cấp tự động, hiển thị rõ ràng điều kiện rẽ nhánh, số mẫu, giá trị Impurity, hỗ trợ kéo thả (Pan) và phóng to/thu nhỏ (Zoom).
- **2D Decision Boundary (Canvas)**: Trực quan hóa không gian dữ liệu 2D và các đường cắt vuông góc trực giao (Axis-aligned orthogonal splits) đặc trưng của Decision Tree.
- **Thử nghiệm dự đoán (Playground Inference)**: Nhập thuộc tính mẫu mới và quan sát hiệu ứng sáng rực đường đi (Animated path tracking) từ gốc đến lá.
- **Cắt tỉa & Tránh Overfitting**: Thanh trượt tinh chỉnh `max_depth`, `min_samples_split`, `min_impurity_decrease` quan sát cây co giãn theo thời gian thực.
- **Trích xuất bộ luật logic IF-THEN**: Tự động chuyển đổi cây thành tập luật điều kiện trực quan.

### 4. Giải Thích Toán Học Từng Bước (Step-by-Step Math Breakdown)
- Công thức KaTeX sắc nét chuẩn mực.
- Bảng phân tích chi tiết thay số thực tế tại nút gốc và từng nút rẽ: giải thích minh bạch *tại sao thuộc tính A được chọn làm thuộc tính phân nhánh thay vì thuộc tính B*.
- Nhấn vào bất kỳ nút nào trên cây để mở cửa sổ chi tiết toán học của nút đó!

---

## 🚀 Hướng Dẫn Chạy Website

Do website được thiết kế 100% chạy client-side (HTML5, Tailwind CSS, KaTeX, Lucide Icons, Vanilla JavaScript hiện đại), bạn có thể:

1. **Mở trực tiếp**:
   - Nhấp đúp vào tệp `index.html` trong thư mục dự án bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Brave).
2. **Hoặc chạy với máy chủ tĩnh (Local Server)**:
   - Nếu bạn dùng Visual Studio Code: Cài extension **Live Server** và nhấn **Go Live**.
   - Hoặc dùng Python:
     ```bash
     python -m http.server 8000
     ```
     Sau đó truy cập: `http://localhost:8000`
