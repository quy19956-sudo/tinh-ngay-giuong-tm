# TÍNH NGÀY GIƯỜNG BHYT – Google Apps Script

> Bản đóng gói sẵn theo cấu trúc GitHub: **tất cả tệp nằm trong một thư mục duy nhất**, không có thư mục con.

## Cấu trúc repository

- `Code.gs` — mã Apps Script chính.
- `Index.html` — giao diện web chuẩn của dự án nhiều tệp.
- `KiemThu.gs` — bộ kiểm thử tùy chọn.
- `appsscript.json` — manifest Apps Script.
- `Tinh_ngay_giuong_BHYT_FULL.gs` — bản gộp một tệp `.gs`, trong đó giao diện HTML và phần kiểm thử đã được nhúng/gộp.
- `Cai_dat_Tinh_ngay_giuong_BHYT.html` — trang hướng dẫn/cài đặt đi kèm.
- `KIEM_THU.txt` — kết quả kiểm thử bàn giao.

### Dùng bản nào?

- Muốn quản lý mã rõ ràng trên GitHub/Apps Script: dùng `Code.gs` + `Index.html` + `KiemThu.gs` + `appsscript.json`.
- Muốn chỉ sao chép **một tệp `.gs`**: dùng `Tinh_ngay_giuong_BHYT_FULL.gs`.

GitHub chỉ lưu và quản lý mã nguồn; để chạy như ứng dụng Google Apps Script, cần đưa mã vào Apps Script hoặc đồng bộ bằng `clasp`.

## Đưa thư mục này lên GitHub

Cách đơn giản: tạo repository mới trên GitHub, chọn **Add file → Upload files**, rồi kéo toàn bộ các tệp trong thư mục này lên cùng một cấp và commit.

Nếu dùng Git trên máy tính, chạy trong chính thư mục này:

```bash
git init
git add .
git commit -m "Initial commit - Tinh ngay giuong BHYT"
git branch -M main
git remote add origin <URL_REPOSITORY_GITHUB_CUA_BAN>
git push -u origin main
```

---

Phiên bản 1.0.0, ngày 29/09/2026. Giao diện và thông báo bằng tiếng Việt.

## Cài đặt nhanh

Cài lần đầu trên máy tính. Sau khi triển khai, điện thoại mở liên kết ứng dụng web bằng Chrome/Safari.

1. Tạo một Google Sheet mới tại https://sheets.new, đặt tên “Tính ngày giường BHYT”.
2. Chọn **Tiện ích mở rộng → Apps Script**.
3. Thay toàn bộ nội dung tệp **Code.gs** bằng nội dung **Code.gs** trong bộ này.
4. Bấm dấu **+ → HTML**, đặt tên **Index**. Thay nội dung bằng tệp **Index.html**. Google tự thêm đuôi `.html`; tên phải đúng chữ hoa/thường.
5. Lưu dự án. Trong danh sách hàm phía trên, chọn **khoiTao**, bấm **Chạy** và cấp quyền cho dự án vừa tạo. Hàm tạo các trang tính trong Sheet đang gắn, không xóa trang tính khác.
6. Quay về Google Sheet và tải lại. Chọn menu **Ngày giường BHYT → Mở giao diện tính**.

Tệp `appsscript.json` không bắt buộc: có thể mở Cài đặt dự án → Hiển thị tệp kê khai và thay nội dung bằng tệp này để khai báo múi giờ Việt Nam và phạm vi quyền. Mã tự xử lý giờ Việt Nam; không lệ thuộc múi giờ điện thoại. Không cần cài thư viện hay bật API nâng cao.

## Mở trên điện thoại

1. Trong Apps Script, chọn **Triển khai → Tùy chọn triển khai mới**.
2. Chọn loại **Ứng dụng web / Web app**.
3. **Thực thi với tư cách:** tôi. **Ai có quyền truy cập:** chỉ mình tôi, cho bản dùng cá nhân.
4. Bấm Triển khai, sao chép liên kết kết thúc bằng **/exec**.
5. Mở liên kết này bằng trình duyệt điện thoại với đúng tài khoản Google. Có thể thêm vào màn hình chính.

Giao diện web là đường dùng trên điện thoại; không cần tìm menu Apps Script trong ứng dụng Google Sheets di động. Quy trình triển khai tham chiếu tài liệu Google: https://developers.google.com/apps-script/guides/web

Khi thay mã sau này: lưu mã → Triển khai → Quản lý các tùy chọn triển khai → sửa → Phiên bản mới → Triển khai, rồi tải lại liên kết. Thay danh mục khoa chỉ cần tải lại giao diện.

## Những gì cần nhập mỗi ca

- Nơi tiếp nhận: Cấp cứu hoặc Phòng khám; ngày giờ tiếp nhận.
- Khoa điều trị, ngày giờ vào khoa, ngày giờ ra khoa.
- Tình trạng ra viện của khoa cuối.
- Chọn “Một khoa điều trị” hoặc “Nhiều khoa”; thêm lượt khi có chuyển khoa, kể cả từ 3 khoa trong ngày.
- Mã hồ sơ là tùy chọn. Không cần họ tên hay số thẻ BHYT.

Các lượt trung gian mặc định “Chuyển khoa nội bộ”. Khi thêm khoa, giờ vào được lấy từ giờ ra khoa trước; nếu sửa giờ ra khoa trước, giờ vào của lượt kế tiếp tự cập nhật. Chương trình chặn khoảng trống, chồng lấn hoặc giờ ra không sau giờ vào.

**Mốc vào viện nội trú:** mặc định bằng giờ vào khoa điều trị đầu tiên. Sau Cấp cứu, nếu hồ sơ ghi nhận đợt nội trú đã bắt đầu tại Cấp cứu, chọn “Bằng giờ vào Cấp cứu” hoặc nhập mốc riêng. Không mặc nhiên dùng giờ đến bệnh viện làm giờ bắt đầu nội trú. Với đường Phòng khám, công cụ dùng giờ vào khoa nội trú; nếu bệnh án có mốc/đường đi khác thì phải bổ sung hồ sơ, không cộng thời gian chờ khám.

“Khoa điều trị đầu tiên” là khoa nhận người bệnh sau nơi tiếp nhận. Thời gian Cấp cứu ban đầu được lấy từ giờ tiếp nhận đến giờ vào khoa này. Không nhập lặp Cấp cứu làm thẻ khoa đầu tiên.

## Danh mục giá

Trong `NG_DM_KHOA`, điền tên/mã khoa thực tế và **giá giường được phê duyệt** ở cột C. Giá để trống khi khởi tạo, không có số tiền giả. Có thể thêm các khoa mới. Mỗi mã phải duy nhất. Có thể ghi giá riêng tại từng thẻ khoa cho ca đang tính.

Giá chỉ cần để chọn khoa cao nhất/thấp nhất trong ngày đi từ 3 khoa; hai khoa không cần giá để chia 0,5 ngày. Nếu một khoa có nhiều loại giá, phải chọn/nhập đúng giá của người bệnh trong khoảng đó. Công cụ không tự xác định loại ICU, giường hậu phẫu, giường ghép hoặc giường băng ca.

## Kết quả và lưu

**Tính ngày giường** chỉ tính và hiển thị. **Lưu vào Google Sheet** mới ghi dữ liệu. Máy chủ tính lại trước khi lưu, vì vậy việc sửa nội dung kết quả trên trình duyệt không thay số được lưu. Mỗi bản tính có mã riêng; thử lại cùng lần lưu không tạo bản ghi trùng. Khi sửa đầu vào, kết quả cũ bị đánh dấu hết hạn và phải tính lại.

| Trang | Nội dung |
|---|---|
| NG_KET_QUA | Một dòng cho mỗi bản tính: tổng ngày, đã phân bổ, chờ đối chiếu, tình trạng ra viện, diễn giải |
| NG_CHI_TIET | Ngày/khoảng ngày, khoa, giờ thực tế, ngày quy đổi, giá tham chiếu, diễn giải và căn cứ |
| NG_DU_LIEU | Các mốc đầu vào và các lượt khoa để đối chiếu |
| NG_DM_KHOA | Mã, tên khoa và giá tham chiếu do đơn vị nhập |

Ba trang kết quả/chi tiết/dữ liệu là nhật ký của thời điểm tính. Sửa trực tiếp các ô nhật ký không tự tính lại. Để sửa một ca, nhập lại trên giao diện và lưu bản tính mới; công cụ giữ lịch sử. Chạy `khoiTao` lần nữa chỉ kiểm tra/định dạng cấu trúc, không xóa các dòng cũ hay danh mục đã nhập. Nếu trang cùng tên có cấu trúc khác, mã dừng và báo lỗi.

## Bộ quy tắc đã cài

Nguồn chính: `Huong_dan_BHYT_3_phan_v3_bo_sung_PT_TT.pdf`, trang 4, 9, 10 do người dùng cung cấp. Đối chiếu Điều 4c Thông tư 35/2016/TT-BYT được bổ sung bởi khoản 4 Điều 1 Thông tư 39/2024/TT-BYT.

| Tình huống | Cách tính |
|---|---|
| Cả đợt nội trú ≤4 giờ | 0 ngày |
| Cả đợt >4 giờ và <24 giờ | 1 ngày, kể cả qua nửa đêm |
| Đợt ≥24 giờ, ra viện thông thường hoặc xin về không nặng lên | Ngày ra − ngày vào theo ngày lịch |
| Đợt ≥24 giờ: tử vong nội trú; nặng lên xin về; nặng lên chuyển cơ sở; qua cấp cứu vẫn cần nội trú và chuyển cơ sở | Ngày ra − ngày vào +1 |
| 2 khoa trong cùng ngày được phân bổ | Mỗi khoa 0,5 ngày; không áp ngưỡng >4 giờ của nhánh từ 3 khoa |
| Từ 3 khoa trong ngày | Trong các khoa nằm >4 giờ, chọn giá cao nhất/thấp nhất; mỗi khoa chọn 0,5 ngày quy đổi |
| Cấp cứu trực tiếp ≤4 giờ | Không tính giường hồi sức cấp cứu; cách kết hợp với khoa sau được báo cần đối chiếu nếu nằm trong mốc nội trú đã chọn |

Ngưỡng 4/24 giờ của toàn đợt không áp riêng cho mỗi lượt khoa. Không dùng `ceil(tổng giờ / 24)`. Đúng 4 giờ thuộc nhóm 0 ngày; đúng 24 giờ dùng công thức ngày lịch theo tình trạng ra viện. Quy tắc ngắn ngày được ưu tiên theo cách trình bày trong PDF.

### Các quy ước triển khai phải biết

1. **Tổng ngày và phân bổ là hai bước riêng.** Tổng theo khoản 1; phần phân bổ theo khoản 2 và các quy ước dưới đây. Các nhãn phân bổ luôn ghi “dự kiến”.
2. Đợt ≥24 giờ thông thường: phân bổ các ngày từ ngày vào đến trước ngày ra. Nhóm đặc biệt: gồm ngày ra. Đây là quy ước vận hành để gán công thức tổng vào từng ngày; PDF không mô tả mọi tổ hợp gán ngày cho khoa. Cần đối chiếu với cách ghi nhận của đơn vị khi dùng số phân bổ.
3. Chỉ đếm khoa thực sự có thời gian >0 trong ngày; chuyển lúc 00:00 không cộng khoa đến vào ngày trước. Các lần quay lại cùng mã khoa trong một ngày được cộng giờ và tính là một khoa.
4. Đợt >4 và <24 giờ qua nửa đêm chỉ có một khoa: phân toàn bộ 1 ngày cho khoa đó. Nếu có nhiều khoa, giữ tổng 1 ngày và đánh dấu phân bổ cần đối chiếu.
5. Từ 3 khoa nhưng ít hơn 2 khoa nằm >4 giờ; thiếu giá; giá thay đổi trong cùng khoa/ngày; hoặc có nhiều khoa cùng giá cực trị: không tự đoán khoa nhận phân bổ. Với đồng giá có thể xác định giá bình quân nhưng chưa chốt khoa ghi nhận.
6. Nếu ra viện đúng 00:00 ở nhóm cộng ngày ra, tổng vẫn theo công thức. Ngày cuối không có thời gian nằm thực tế được đánh dấu cần xác nhận khoa nhận phân bổ.
7. Không suy ra “BHYT không trả” thành “người bệnh phải trả”. Không tính số tiền BHYT thực trả, mức hưởng, đồng chi trả, nằm ghép, hậu phẫu 10 ngày hay điều kiện ICU.

Trong một số tổ hợp, chỉ các mốc ngày giờ và tình trạng chưa đủ để chốt phân bổ hợp lệ. Khi đó **chờ đối chiếu khác với 0 ngày**. Chương trình luôn kiểm tra: `đã phân bổ dự kiến + chờ đối chiếu = tổng ngày`.

Bộ quy tắc bám tài liệu người dùng gửi, không phải dịch vụ tự cập nhật văn bản pháp luật sau ngày xây dựng.

## Hàm dùng trực tiếp trong ô Google Sheet

Để chỉ tính **tổng cả đợt**, không phân bổ khoa:

```text
=NGAY_GIUONG_TONG(A2;B2;C2)
```

Nếu Sheet dùng dấu phẩy phân cách tham số, thay `;` bằng `,`. A2 và B2 là ô ngày giờ **vào viện nội trú / ra viện**, C2 là một mã dưới đây. Công thức trả hai cột: số ngày và diễn giải; để trống ô bên phải để kết quả mở rộng.

| Mã | Tình trạng |
|---|---|
| RA_VIEN | Ra viện thông thường |
| XIN_VE | Xin về, không diễn biến nặng lên |
| TU_VONG | Tử vong khi điều trị nội trú |
| NANG_XIN_VE | Nặng lên, gia đình xin về |
| NANG_CHUYEN_VIEN | Nặng lên, chuyển cơ sở KCB |
| QUA_CAP_CUU_CHUYEN | Qua cấp cứu, vẫn cần nội trú, chuyển cơ sở KCB |
| CHUYEN_VIEN_KHAC | Chuyển cơ sở KCB, không thuộc nhóm đặc biệt |

Không chạy hàm này cho từng khoa rồi cộng các kết quả. Dùng giao diện Nhiều khoa khi có chuyển khoa.

## Tự kiểm tra

Tệp `KiemThu.gs` là tùy chọn. Thêm tệp tập lệnh tên `KiemThu`, dán nội dung, chạy `chayKiemThu`. Hàm chỉ dùng dữ liệu giả, không đọc/ghi bảng người bệnh. Xem Nhật ký thực thi để biết số ca đạt.

Tệp `KIEM_THU.txt` ghi kết quả kiểm thử của bộ bàn giao. Kiểm thử cục bộ không thay thế chạy thử trong tài khoản Google của đơn vị. Bộ mã chưa được triển khai vào tài khoản Google của người dùng.

## Xử lý lỗi thường gặp

- Không thấy menu: tải lại Google Sheet trên máy tính; kiểm tra `Code.gs` đã lưu.
- Không tìm thấy tệp HTML: tên phải đúng `Index`, không phải `index` hoặc `Index.html.html`.
- “Chưa khởi tạo”: chạy `khoiTao` từ trình biên tập Apps Script gắn với Sheet.
- Không mở trên điện thoại: mở URL `/exec` bằng trình duyệt và đúng tài khoản được cấp quyền; không mở tệp Index.html tải về để tính thật.
- Thiếu giá khi từ 3 khoa: điền cột C `NG_DM_KHOA`, tải lại giao diện rồi tính lại; hoặc nhập giá riêng trong thẻ khoa.
- Khoảng trống/chồng lấn: sửa giờ vào khoa sau bằng giờ ra khoa trước theo hồ sơ thực tế.
- Đã sửa mã nhưng web còn cũ: triển khai phiên bản mới.
- Không cho sửa tệp hoặc bị hạn chế triển khai: kiểm tra quyền chỉnh sửa Sheet/chính sách Google Workspace của đơn vị.

## Tài liệu đối chiếu

- PDF người dùng: trang 4, 9, 10 (không đính kèm lại trong bộ mã).
- Cổng thông tin Chính phủ: https://chinhphu.vn/?docid=211771&pageid=27160
- Bản PDF Thông tư: https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/11/39-byt.pdf
- Google Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- HTML Service, giao tiếp máy chủ: https://developers.google.com/apps-script/guides/html/communication
