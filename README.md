# Tính ngày giường BHYT — bản GitHub Pages

Bản này chạy **trực tiếp trên GitHub Pages**, không cần Google Apps Script để tính toán.

## Cách đưa lên GitHub để chạy

1. Mở repository `Tinh-Ngay-Giuong`.
2. Xóa/ghi đè nội dung cũ và tải **toàn bộ các file trong thư mục này vào thư mục gốc của repository**.
3. Quan trọng: phải có file `index.html` (chữ thường) ngay ở thư mục gốc.
4. Vào **Settings → Pages**.
5. Trong **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn branch **main** và thư mục **/(root)**, sau đó bấm **Save**.
7. Chờ GitHub triển khai xong rồi mở địa chỉ Pages mà GitHub hiển thị.

Với repository tên `Tinh-Ngay-Giuong`, địa chỉ thường có dạng:

`https://TEN-TAI-KHOAN.github.io/Tinh-Ngay-Giuong/`

## Các file

- `index.html`: giao diện chính; GitHub Pages mở file này.
- `engine.js`: bộ quy tắc tính ngày giường, chuyển từ `Code.gs` sang JavaScript chạy trên trình duyệt.
- `github-api.js`: lớp tương thích với giao diện; tính và lưu cục bộ.
- `.nojekyll`: yêu cầu GitHub Pages phục vụ file tĩnh trực tiếp.
- `.gitattributes`: ưu tiên GitHub nhận diện repository là JavaScript thay vì HTML.
- `KIEM_THU.txt`: ghi chú kiểm thử.

## Chức năng Lưu

Nút **Lưu trên trình duyệt** lưu bản tính bằng `localStorage` trên đúng trình duyệt/thiết bị đang dùng. Dữ liệu không tự gửi lên Google Sheet hay máy chủ.

- Đổi máy/trình duyệt sẽ không thấy các bản đã lưu ở máy cũ.
- Xóa dữ liệu website của trình duyệt có thể xóa các bản lưu này.
- Phần tính toán vẫn hoạt động khi không có Google Sheet.

## Giá khoa mặc định

Mặc định giá để trống. Có thể nhập giá ngay trên giao diện cho từng khoa. Nếu muốn đặt giá mặc định, sửa mảng `wards` ở đầu file `engine.js`, ví dụ:

```js
{id:'TM', name:'Nội Tim mạch', price:500000}
```

Không dùng dấu chấm/ngăn cách hàng nghìn trong số tiền JavaScript.

## Lưu ý

Công cụ triển khai bộ quy tắc đã có trong dự án gốc và không tự cập nhật văn bản pháp luật. Kết quả có mục “Cần đối chiếu” ở các tình huống mà bộ quy tắc nguồn chưa quy định đủ cách phân bổ.
