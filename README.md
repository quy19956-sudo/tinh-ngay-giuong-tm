# Tính ngày giường 2.1 — một thư mục

1. Hàng đầu chỉ chọn **Cấp cứu** hoặc **Phòng khám**, nhập mốc **vào viện nội trú trên hồ sơ**.
2. Nếu có khoa trung gian, chọn **Có khoa thứ 2**, chọn khoa và nhập ngày giờ.
3. Khoa cuối cố định **Nội Tim mạch**. Chỉ nhập giờ/ngày vào Tim mạch, ra viện và tình trạng cuối đợt.

Giờ dùng **HH:mm 24 giờ**, không AM/PM. Gõ `0730` hoặc `730` sẽ thành `07:30`; `1845` thành `18:45` khi rời ô hoặc bấm tính. Chỉ nhận `00:00` đến `23:59`. Qua nửa đêm phải đổi ngày rồi nhập `00:00`.

## Phòng khám không có giường

Phòng khám chỉ là đường vào viện, không tạo ngày giường, đơn giá hay phần 0,5 ngày; không đếm thành khoa chuyển thêm. Ví dụ Phòng khám → Nội tổng hợp → Tim mạch chỉ có **2 khoa giường**. Mốc nhập không phải giờ đăng ký khám ngoại trú.

Nếu ngày đầu chưa có khoa giường thực tế sau mốc vào viện, ngày đó được giữ ở **Cần đối chiếu**, không tạo giường Phòng khám để lấp khoảng trống.

## Danh mục

Excel đúng **1 sheet**, hàng 1: **A1: tên khoa**, **B1: giá tiền**. Chỉ nhập khoa có giường; giá số nguyên đồng/ngày >0. Chọn tệp → xem bảng → **Lưu danh mục**. Tệp sai, thiếu giá, trùng khoa, có công thức không ghi đè bản đã lưu.

Giá Tim mạch được tra bằng tên **Nội Tim mạch** hoặc **Tim mạch**; Cấp cứu bằng **Cấp cứu** hoặc **Hồi sức cấp cứu**. Cho phép chữ “Khoa” ở đầu, không phân biệt hoa thường/dấu. Thiếu tên đúng thì để trống giá, không lấy giá khoa khác.

Bản cũ có mục giường Phòng khám sẽ được loại mục đó khỏi sử dụng, giữ mã/giá các khoa còn lại. Danh mục lưu trên trình duyệt hiện tại. Đổi máy: xuất/nhập Excel. Dùng chung mọi máy: tải `danh-muc.js` từ mục sao lưu ở trang Danh mục và thay tệp cùng tên trên GitHub.

## Đưa lên GitHub

Giải nén, mở thư mục **Tinh-Ngay-Giuong**, chọn toàn bộ tệp bên trong, tải lên thư mục gốc repository và ghi đè bản cũ. Tất cả 16 tệp cùng một cấp, **không có thư mục con**. `index.html` phải ở gốc. Giữ cấu hình Pages đang dùng, tải lại trang khi triển khai xong. Không cần cài thư viện hoặc token.

Không dựa vào việc mở rời hai trang bằng `file://` để đồng bộ danh mục; dùng địa chỉ GitHub Pages.

## Quy tắc và giới hạn

Cả đợt ≤4h: 0 ngày; >4 và <24h: 1 ngày. Từ 24h: ngày ra trừ ngày vào, cộng 1 cho nhóm đặc biệt đã chọn. Không chia giờ/24 để làm tròn.

Quy định không thanh toán giường HSCC khi lượt Cấp cứu ≤4h chỉ dùng cho Cấp cứu. Chuyển **2 khoa thông thường**: mỗi khoa 0,5 ngày, không áp ngưỡng >4h riêng từng lượt. Ngày có **từ 3 khoa**: xét khoa nằm >4h để chọn giá cao nhất/thấp nhất theo khoản 2 Điều 4c.

Cấp cứu ngắn không chặn xét hai khoa còn lại nếu cả hai >4h. Với ca trong ảnh (CC1h31 → Nội3h01 → TM29 phút trong ngày đầu), hai khoa thường có lý do chờ theo quy tắc **>=3 khoa chưa đủ hai khoa >4h**, không dùng lý do riêng của Cấp cứu. Các ngày Tim mạch trọn sau đó vẫn được ghi riêng.

Thiếu giá, đồng giá cần xác định khoa, đợt ngắn qua nửa đêm có chuyển khoa, hoặc kết hợp 2 khoa với lượt giường không thanh toán mà chưa rõ cách gán: giữ **Cần đối chiếu**, nêu đúng lý do. Không tự dồn phần chưa rõ sang khoa khác.

Phân bổ theo quy ước ngày lịch công khai: tính ngày vào, bỏ ngày ra thông thường; nhóm đặc biệt tính cả ngày ra. Tiền chỉ tạm tính theo danh mục, chưa xét mức hưởng BHYT, nằm ghép, hậu phẫu và điều kiện ICU. Chuyển khoa nội bộ chưa phải ra viện.

Đối chiếu Điều 4b, 4c TT35/2016/TT-BYT được bổ sung bởi TT39/2024/TT-BYT, trang 3–4 bản người dùng gửi. [Văn bản](https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=171885) · [Hướng dẫn BHXH](https://baohiemxahoi.gov.vn/tintuc/Pages/hoat-dong-bhxh-viet-nam.aspx?CateID=0&ItemID=24020). Không tự cập nhật khi văn bản thay đổi.

Kiểm tra: `node check.cjs`. Xem phạm vi kiểm tra trong `KIEM_THU.txt`.
