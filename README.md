# Tính ngày giường — bản gọn 2.0, một thư mục

## Sử dụng

1. Trang **Tính ngày giường**: chọn vào Cấp cứu hoặc vào từ Phòng khám; nhập giờ/ngày tiếp nhận, vào khoa điều trị cuối và kết thúc nội trú. Tích **Có khoa thứ 2** nếu có khoa trung gian.
2. Chọn đúng **Tình trạng cuối đợt**, bấm **Tính ngày giường**. Kết quả gồm tổng ngày, phần từng khoa và lý giải ngắn. Diễn giải đầy đủ nằm trong **Chi tiết theo ngày**.
3. Trang **Danh mục khoa, giá**: chọn Excel → kiểm tra bảng → **Lưu danh mục**. Có thể sửa trực tiếp, thêm hoặc xóa khoa tại bảng.

**Mốc nội trú luôn là ngày giờ vào Cấp cứu hoặc vào từ Phòng khám, theo yêu cầu người dùng.** Không còn lựa chọn mốc riêng. Phần trước lúc chuyển khoa được ghi nhận tại khoa tiếp nhận đã chọn trong danh mục. Nếu danh mục nhập Excel không có tên Cấp cứu/Phòng khám, cần chọn mục tiếp nhận thực tế tương ứng trước khi tính.

Excel cần **đúng 1 sheet**, hàng 1 gồm **A1: tên khoa**, **B1: giá tiền**. Mỗi hàng tiếp theo là một khoa; giá là số nguyên đồng/ngày, lớn hơn 0. Có nút tải mẫu Excel một sheet. Tệp sai, trùng khoa, thiếu giá hoặc chứa công thức sẽ bị chặn và không ghi đè danh mục đã lưu. Không có đơn giá bệnh viện được tự đặt sẵn.

## Đưa lên GitHub Pages

1. Giải nén. Tải **toàn bộ nội dung bên trong thư mục** lên thư mục gốc repository, ghi đè các tệp cũ. Tất cả tệp nằm cùng một cấp, không có thư mục con. Giải nén, mở thư mục `Tinh-Ngay-Giuong`, chọn tất cả tệp bên trong rồi tải lên GitHub. Có thể xóa `github-api.js` cũ vì bản này không sử dụng.
2. Đảm bảo `index.html` nằm ngay ở thư mục gốc. Giữ cấu hình GitHub Pages hiện có; nếu chưa bật, chọn **Settings → Pages → Deploy from a branch → main → /(root)**.
3. Mở địa chỉ Pages. Nếu vẫn thấy giao diện cũ, tải lại trang và bỏ bộ nhớ đệm.

Ứng dụng không cần cài thư viện hoặc biên dịch. Thư viện đọc Excel đã được đóng gói kèm, không lấy từ CDN khi sử dụng.

## Danh mục lưu ở đâu?

Nút **Lưu danh mục** lưu trên trình duyệt/thiết bị đang dùng. Đổi máy hoặc xóa dữ liệu website thì cần nhập lại Excel. Hai trang đồng bộ giá trên cùng địa chỉ website; không dựa vào việc mở rời các tệp bằng `file://`, vì cách chia sẻ dữ liệu cục bộ giữa các tệp tùy trình duyệt.

Muốn áp dụng cho **mọi máy**: tại trang Danh mục, mở **Sao lưu hoặc dùng danh mục trên máy khác** → **Tải danh-muc.js dùng chung** → thay tệp cùng tên trong repository. Khi bản dùng chung thay đổi, bản lưu dựa trên danh mục gốc cũ được thay bằng bản mới. Người dùng vẫn có thể lưu riêng sau lần cập nhật đó.

Không nhập thông tin định danh người bệnh. Mốc điều trị chỉ dùng trong phiên đang mở. Tệp Excel được đọc trên thiết bị, không gửi tới máy chủ. Có sao chép kết quả và in/lưu PDF bằng chức năng in của trình duyệt.

## Quy tắc và giới hạn

Tổng ngày: ≤4 giờ là 0; >4 và <24 giờ là 1; từ 24 giờ tính ngày ra trừ ngày vào, cộng 1 cho nhóm đặc biệt theo tình trạng đã chọn. Không làm tròn tổng giờ/24. Phần chia theo khoa dự kiến dùng ngày lịch: tính ngày vào, bỏ ngày ra thông thường, tính cả ngày ra với nhóm đặc biệt.

Hai khoa trong ngày: mỗi khoa 0,5 ngày. Từ ba khoa: xét khoa nằm >4 giờ có giá cao nhất/thấp nhất. Cấp cứu ≤4 giờ không tính giường hồi sức cấp cứu. Những tổ hợp chưa được mô tả đủ để gán phần từng khoa được ghi **Cần đối chiếu**; không thay phần chưa rõ bằng số 0. Tổng ngày vẫn được kiểm tra bảo toàn: phần xác định + phần chờ = tổng.

Tiền giường là **tạm tính theo giá danh mục**, chưa xét mức hưởng BHYT, đồng chi trả, nằm ghép, loại giường hậu phẫu và điều kiện ICU. Mẫu gọn hỗ trợ Cấp cứu/Phòng khám → một khoa trung gian tùy chọn → khoa điều trị cuối; không đại diện cho một đợt có nhiều lần quay lại khoa hoặc trên ba khoa. Chuyển khoa nội bộ chưa phải ra viện.

Căn cứ các ngưỡng ngày giường: Điều 4c TT35/2016/TT-BYT được bổ sung bởi khoản 4 Điều 1 TT39/2024/TT-BYT. Việc lấy mốc vào từ Phòng khám là cấu hình theo yêu cầu người dùng, không phải kết luận chung rằng thời gian khám ngoại trú được thanh toán ngày giường. Quy tắc không tự cập nhật khi văn bản thay đổi.

- [Văn bản trên CSDL quốc gia về văn bản pháp luật](https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=171885)
- [Hướng dẫn trên Cổng thông tin BHXH Việt Nam](https://baohiemxahoi.gov.vn/tintuc/Pages/hoat-dong-bhxh-viet-nam.aspx?CateID=0&ItemID=24020)

Kiểm tra bộ tính và đọc Excel: `node check.cjs`. Kết quả và giới hạn kiểm tra ghi trong `KIEM_THU.txt`.
