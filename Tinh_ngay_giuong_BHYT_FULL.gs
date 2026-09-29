/**
 * TỆP GỘP TỰ CHỨA - TÍNH NGÀY GIƯỜNG BHYT
 * Gồm: Code.gs + Index.html nhúng trực tiếp + KiemThu.gs.
 * Chỉ cần tạo 1 tệp .gs trong Apps Script và dán toàn bộ nội dung tệp này.
 * Sau đó chạy khoiTao() một lần. Có thể chạy chayKiemThu() để tự kiểm thử.
 */

/**
 * TÍNH NGÀY GIƯỜNG BHYT - 1.0.0 - 29/09/2026
 * Nguồn: PDF người dùng, trang 4, 9, 10; Điều 4c TT35/2016,
 * được bổ sung bởi khoản 4 Điều 1 TT39/2024/TT-BYT.
 * Đây là bộ quy tắc của tài liệu đã cung cấp, không tự cập nhật pháp luật.
 * Bản FULL một tệp: giao diện Index đã được nhúng trong mã. Chạy khoiTao một lần.
 */
var NG = {
  version: '1.0.0', tz: 'Asia/Ho_Chi_Minh', day: 86400000, hour: 3600000,
  source: 'PDF trang 4, 9, 10; Điều 4c TT35/2016 bổ sung bởi TT39/2024',
  statuses: {
    RA_VIEN: 'Ra viện thông thường',
    XIN_VE: 'Xin về, không diễn biến nặng lên',
    TU_VONG: 'Tử vong khi điều trị nội trú',
    NANG_XIN_VE: 'Nặng lên, gia đình xin về',
    NANG_CHUYEN_VIEN: 'Nặng lên, chuyển cơ sở KCB',
    QUA_CAP_CUU_CHUYEN: 'Qua cấp cứu, vẫn cần nội trú, chuyển cơ sở KCB',
    CHUYEN_VIEN_KHAC: 'Chuyển cơ sở KCB, không thuộc nhóm đặc biệt'
  },
  special: ['TU_VONG', 'NANG_XIN_VE', 'NANG_CHUYEN_VIEN', 'QUA_CAP_CUU_CHUYEN'],
  sheets: {
    NG_KET_QUA: ['Mã lần tính', 'Lưu lúc (giờ VN)', 'Mã hồ sơ (tùy chọn)', 'Mốc vào viện nội trú', 'Ra viện', 'Tình trạng ra viện', 'Tổng ngày theo khoản 1', 'Đã phân bổ dự kiến', 'Cần đối chiếu phân bổ', 'Trạng thái', 'Diễn giải', 'Phiên bản'],
    NG_CHI_TIET: ['Mã lần tính', 'Ngày / khoảng ngày', 'Khoa', 'Giờ thực tế trong khoảng', 'Ngày giường quy đổi dự kiến', 'Giá giường tham chiếu', 'Diễn giải', 'Căn cứ'],
    NG_DU_LIEU: ['Mã lần tính', 'Mã hồ sơ (tùy chọn)', 'Nơi tiếp nhận', 'Ngày giờ tiếp nhận', 'Mốc vào viện nội trú', 'STT khoa', 'Mã khoa', 'Tên khoa', 'Vào khoa', 'Ra khoa', 'Tình trạng ra khoa', 'Giá tham chiếu', 'Quy tắc'],
    NG_DM_KHOA: ['Mã khoa', 'Tên khoa', 'Giá giường tham chiếu (đồng/ngày)', 'Ghi chú']
  }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ngày giường BHYT')
    .addItem('Mở giao diện tính', 'moGiaoDien')
    .addItem('Khởi tạo / kiểm tra các trang tính', 'khoiTao')
    .addSeparator().addItem('Hướng dẫn sử dụng', 'huongDan').addToUi();
}

function khoiTao() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Mở Apps Script từ Tiện ích mở rộng của Google Sheet rồi chạy khoiTao.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    Object.keys(NG.sheets).forEach(function (name) {
      var sh = ss.getSheetByName(name), headers = NG.sheets[name];
      if (sh && sh.getLastRow() && JSON.stringify(sh.getRange(1, 1, 1, headers.length).getValues()[0]) !== JSON.stringify(headers)) {
        throw new Error('Trang ' + name + ' đã có cấu trúc khác. Hãy đổi tên trang đó trước; chương trình không ghi đè.');
      }
    });
    Object.keys(NG.sheets).forEach(function (name) {
      var sh = ss.getSheetByName(name) || ss.insertSheet(name), headers = NG.sheets[name];
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#124c50').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
      sh.setFrozenRows(1); sh.setRowHeight(1, 46); sh.setColumnWidths(1, headers.length, 155);
      sh.getRange(1, 1, sh.getMaxRows(), headers.length).setFontFamily('Arial').setVerticalAlignment('top');
      if (name === 'NG_KET_QUA') { sh.setColumnWidth(11, 620); sh.getRange('G:I').setNumberFormat('0.##'); }
      if (name === 'NG_CHI_TIET') { sh.setColumnWidth(7, 620); sh.setColumnWidth(8, 240); sh.getRange('D:F').setNumberFormat('0.##'); }
      if (name === 'NG_DM_KHOA') {
        sh.setColumnWidth(2, 245); sh.setColumnWidth(4, 540); sh.getRange('C2:C').setNumberFormat('#,##0').setBackground('#eef7ff');
        sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThan(0).setAllowInvalid(false).build());
        if (sh.getLastRow() === 1) sh.getRange(2, 1, 6, 4).setValues([
          ['CC', 'Cấp cứu', '', 'Điền đúng giá/loại giường được phê duyệt, không tự coi là ICU.'],
          ['TM', 'Nội Tim mạch', '', 'Giá chỉ cần để chọn khoa cao nhất/thấp nhất khi từ 3 khoa/ngày.'],
          ['HSTC', 'Hồi sức tích cực', '', 'Chỉ dùng khi người bệnh và giường đủ điều kiện giá ICU.'],
          ['NOI', 'Nội tổng hợp', '', 'Có thể thêm/sửa tên khoa. Mã khoa phải duy nhất.'],
          ['NGOAI', 'Ngoại tổng hợp', '', 'Nếu thay đổi loại giá theo ngày, cần đối chiếu riêng.'],
          ['KHAC', 'Khoa khác', '', 'Có thể nhập khoa mới trực tiếp ở giao diện.']
        ]);
      }
    });
    ss.setSpreadsheetTimeZone(NG.tz);
    PropertiesService.getScriptProperties().setProperty('NG_SPREADSHEET_ID', ss.getId());
    SpreadsheetApp.flush();
    ss.toast('Đã sẵn sàng. Menu Ngày giường BHYT → Mở giao diện tính.', 'Ngày giường BHYT', 8);
  } finally { lock.releaseLock(); }
}

function doGet() {
  return HtmlService.createHtmlOutput(NG_INDEX_HTML_).setTitle('Tính ngày giường BHYT')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function moGiaoDien() {
  SpreadsheetApp.getUi().showModalDialog(doGet().setWidth(1140).setHeight(780), 'Tính ngày giường BHYT');
}
function huongDan() {
  SpreadsheetApp.getUi().alert('Cách dùng',
    '1. Điền giá được phê duyệt ở NG_DM_KHOA nếu cần phân bổ từ 3 khoa/ngày.\n' +
    '2. Mở giao diện, nhập mốc tiếp nhận và các lượt vào/ra khoa.\n' +
    '3. Chọn đúng mốc vào viện nội trú trên hồ sơ và tình trạng ra viện.\n' +
    '4. Bấm Tính ngày giường, xem diễn giải, rồi Lưu vào Google Sheet.\n' +
    'Điện thoại: dùng liên kết Ứng dụng web sau khi triển khai Apps Script.\n' +
    'NG_KET_QUA / NG_CHI_TIET / NG_DU_LIEU là nhật ký; sửa các ô nhật ký không tự tính lại.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('NG_SPREADSHEET_ID');
  if (!id) throw new Error('Chưa khởi tạo. Hãy chạy hàm khoiTao trong Apps Script của Google Sheet.');
  return SpreadsheetApp.openById(id);
}
function sheet_(ss, name) {
  var sh = ss.getSheetByName(name), headers = NG.sheets[name];
  if (!sh || JSON.stringify(sh.getRange(1, 1, 1, headers.length).getValues()[0]) !== JSON.stringify(headers)) {
    throw new Error('Không tìm thấy cấu trúc hợp lệ của ' + name + '. Chạy khoiTao để kiểm tra.');
  }
  return sh;
}
function catalog_(ss) {
  var sh = sheet_(ss, 'NG_DM_KHOA'), rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [], seen = Object.create(null);
  return rows.filter(function (r) { return r[0] || r[1]; }).map(function (r) {
    var id = String(r[0]).trim(), name = String(r[1]).trim();
    if (!id || !name || seen[id]) throw new Error('Danh mục khoa thiếu mã/tên hoặc trùng mã: ' + id);
    seen[id] = true;
    return { id: id, name: name, price: price_(r[2], 'Giá trong danh mục ' + name) };
  });
}
function layCauHinh() {
  var ss = ss_();
  return { wards: catalog_(ss), statuses: NG.statuses, source: NG.source, version: NG.version, sheetUrl: ss.getUrl() };
}
function inputWithCatalog_(input, ss) {
  var p = JSON.parse(JSON.stringify(input || {})), cat = catalog_(ss), map = Object.create(null);
  cat.forEach(function (w) { map[w.id] = w; });
  p.stays = (p.stays || []).map(function (s) {
    var c = map[s.wardId];
    if (c) { s.name = c.name; if (s.price === '' || s.price === null || s.price === undefined) s.price = c.price; }
    return s;
  });
  var cc = map.CC;
  if (cc && (p.originPrice === '' || p.originPrice === null || p.originPrice === undefined)) p.originPrice = cc.price;
  return p;
}
function tinhNgayGiuong(input) { return tinhCotLoi_(inputWithCatalog_(input, ss_())); }

function luuKetQua(input, requestId) {
  if (!/^[A-Za-z0-9_-]{12,80}$/.test(String(requestId || ''))) throw new Error('Mã lần lưu không hợp lệ. Tải lại giao diện.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var ss = ss_(), sum = sheet_(ss, 'NG_KET_QUA'), details = sheet_(ss, 'NG_CHI_TIET'), data = sheet_(ss, 'NG_DU_LIEU');
    var existing = sum.getLastRow() > 1 ? sum.getRange(2, 1, sum.getLastRow() - 1, 1).createTextFinder(requestId).matchEntireCell(true).findNext() : null;
    if (existing) return { id: requestId, alreadySaved: true, sheetUrl: ss.getUrl(), result: null };
    // Luôn tính lại trên máy chủ, không tin số ngày do trình duyệt gửi lên.
    var p = inputWithCatalog_(input, ss), result = tinhCotLoi_(p), n = result.normalized;
    var rawRows = n.stays.map(function (s, i) {
      return [requestId, n.caseCode, n.origin === 'CAP_CUU' ? 'Cấp cứu' : 'Phòng khám', fmt_(n.arrival), fmt_(n.admit), i + 1, s.wardId, s.name, fmt_(s.start), fmt_(s.end), i === n.stays.length - 1 ? NG.statuses[n.status] : 'Chuyển khoa nội bộ', s.price === null ? '' : s.price, NG.version];
    });
    var detRows = result.details.map(function (d) { return [requestId, d.date, d.ward, d.hours, d.days === null ? 'Cần đối chiếu' : d.days, d.price === null ? '' : d.price, d.explanation, d.basis]; });
    var sumRows = [[requestId, Utilities.formatDate(new Date(), NG.tz, 'dd/MM/yyyy HH:mm:ss'), n.caseCode, fmt_(n.admit), fmt_(n.end), NG.statuses[n.status], result.totalDays, result.allocatedDays, result.pendingDays, result.pendingDays ? 'CẦN ĐỐI CHIẾU' : 'ĐÃ TÍNH - PHÂN BỔ DỰ KIẾN', result.explanation + '\n' + result.notes.join('\n'), NG.version]];
    var written = [];
    try {
      appendRows_(data, rawRows, written); appendRows_(details, detRows, written); appendRows_(sum, sumRows, written);
      SpreadsheetApp.flush();
    } catch (e) {
      written.reverse().forEach(function (w) { try { w.sheet.getRange(w.row, 1, w.count, w.cols).clearContent(); } catch (ignore) {} });
      throw new Error('Lưu chưa hoàn tất: ' + e.message + '. Có thể bấm Lưu lại với cùng mã lần lưu.');
    }
    return { id: requestId, alreadySaved: false, sheetUrl: ss.getUrl(), result: result };
  } finally { lock.releaseLock(); }
}
function appendRows_(sh, rows, written) {
  if (!rows.length) return;
  var row = sh.getLastRow() + 1, need = row + rows.length - 1;
  if (need > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows());
  var r = sh.getRange(row, 1, rows.length, rows[0].length);
  written.push({ sheet: sh, row: row, count: rows.length, cols: rows[0].length });
  r.setValues(rows.map(function (a) { return a.map(safeCell_); })).setWrap(true);
}
function safeCell_(v) { return typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }

// ===== BỘ TÍNH THUẦN JAVASCRIPT, không phụ thuộc dịch vụ Google =====
function parseTime_(s, label) {
  if (typeof s !== 'string') throw new Error(label + ': nhập đủ ngày và giờ.');
  var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(label + ': định dạng phải là yyyy-MM-ddTHH:mm.');
  var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5];
  var t = Date.UTC(y, mo - 1, d, h, mi), z = new Date(t);
  if (y < 1900 || y > 2200 || z.getUTCFullYear() !== y || z.getUTCMonth() !== mo - 1 || z.getUTCDate() !== d || h > 23 || mi > 59) throw new Error(label + ': ngày giờ không hợp lệ.');
  // Trục thời gian ảo theo giờ VN, không dùng múi giờ của máy người nhập.
  return t;
}
function pad_(n) { return String(n).padStart(2, '0'); }
function day_(t) { return Math.floor(t / NG.day) * NG.day; }
function date_(t) { var d = new Date(t); return pad_(d.getUTCDate()) + '/' + pad_(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
function fmt_(t) { var d = new Date(t); return date_(t) + ' ' + pad_(d.getUTCHours()) + ':' + pad_(d.getUTCMinutes()); }
function hours_(ms) { return Math.round(ms / NG.hour * 10000) / 10000; }
function price_(v, label) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(v);
  if (!isFinite(n) || n <= 0 || n > 1000000000) throw new Error(label + ': nhập số lớn hơn 0, không dùng dấu phân cách hàng nghìn.');
  return n;
}
function text_(s, max, label) {
  s = String(s || '').trim(); if (s.length > max) throw new Error(label + ' quá dài.'); return s;
}
function normalize_(p) {
  if (!p || ['CAP_CUU', 'PHONG_KHAM'].indexOf(p.origin) < 0) throw new Error('Chọn nơi tiếp nhận: Cấp cứu hoặc Phòng khám.');
  if (!Object.prototype.hasOwnProperty.call(NG.statuses, p.status)) throw new Error('Chọn tình trạng ra viện cuối đợt. Chuyển khoa nội bộ không phải chuyển viện.');
  if (!Array.isArray(p.stays) || !p.stays.length || p.stays.length > 100) throw new Error('Cần từ 1 đến 100 lượt khoa.');
  var arrival = parseTime_(p.arrival, 'Ngày giờ tiếp nhận');
  var names = Object.create(null);
  var stays = p.stays.map(function (s, i) {
    var id = text_(s.wardId, 140, 'Mã khoa'), name = text_(s.name, 100, 'Tên khoa');
    if (!id || !name) throw new Error('Lượt ' + (i + 1) + ': thiếu tên/mã khoa.');
    if (id === '__CAP_CUU__') throw new Error('Mã khoa đã được dành riêng.');
    if (names[id] && names[id] !== name) throw new Error('Cùng mã khoa phải có cùng tên: ' + id);
    names[id] = name;
    var start = parseTime_(s.start, 'Vào khoa ' + (i + 1)), end = parseTime_(s.end, 'Ra khoa ' + (i + 1));
    if (end <= start) throw new Error('Ra khoa ' + (i + 1) + ' phải sau lúc vào khoa.');
    return { wardId: id, name: name, start: start, end: end, price: price_(s.price, 'Giá khoa ' + name), emergency: false };
  });
  if (arrival > stays[0].start) throw new Error('Giờ tiếp nhận phải trước hoặc bằng giờ vào khoa đầu tiên.');
  if (p.origin === 'CAP_CUU' && stays[0].wardId === 'CC') throw new Error('Khoa đầu tiên phải là khoa nhận sau Cấp cứu. Thời gian Cấp cứu được nhập từ giờ tiếp nhận đến giờ vào khoa đầu tiên.');
  stays.forEach(function (s, i) {
    if (i && s.start !== stays[i - 1].end) throw new Error('Lượt ' + (i + 1) + ': giờ vào phải trùng giờ ra khoa trước; cần sửa khoảng trống hoặc chồng lấn.');
  });
  var admit;
  if (p.admitMode === 'CAP_CUU') {
    if (p.origin !== 'CAP_CUU') throw new Error('Tiếp nhận ở Phòng khám không dùng mốc Cấp cứu.');
    admit = arrival;
  } else if (p.admitMode === 'CUSTOM') admit = parseTime_(p.admission, 'Mốc vào viện nội trú');
  else if (!p.admitMode || p.admitMode === 'KHOA') admit = stays[0].start;
  else throw new Error('Mốc vào viện nội trú không hợp lệ.');
  if (admit < arrival || admit > stays[0].start) throw new Error('Mốc vào viện phải nằm từ lúc tiếp nhận đến lúc vào khoa đầu tiên.');
  if (p.origin === 'PHONG_KHAM' && admit !== stays[0].start) throw new Error('Mốc nội trú khác lúc vào khoa sau Phòng khám: cần bổ sung lượt khoa/giường thực tế; không tính thời gian chờ khám thành ngày giường.');
  var end = stays[stays.length - 1].end;
  if (end - admit > 3660 * NG.day) throw new Error('Khoảng điều trị vượt 10 năm; kiểm tra lại ngày nhập.');
  return { origin: p.origin, arrival: arrival, admit: admit, end: end, status: p.status, stays: stays,
    caseCode: text_(p.caseCode, 80, 'Mã hồ sơ'), originPrice: price_(p.originPrice, 'Giá Cấp cứu') };
}
function total_(start, end, status) {
  var ms = end - start, delta = Math.round((day_(end) - day_(start)) / NG.day), n, reason, basis;
  if (ms <= 0) throw new Error('Giờ ra phải sau giờ vào.');
  if (ms <= 4 * NG.hour) { n = 0; reason = 'Thời gian điều trị ≤ 4 giờ: không tính ngày giường nội trú.'; basis = 'Điểm d khoản 1 Điều 4c'; }
  else if (ms < 24 * NG.hour) { n = 1; reason = 'Thời gian điều trị > 4 giờ và < 24 giờ: tính 1 ngày, kể cả qua nửa đêm.'; basis = 'Điểm c khoản 1 Điều 4c'; }
  else if (NG.special.indexOf(status) >= 0) { n = delta + 1; reason = 'Nhóm đặc biệt: ngày ra − ngày vào + 1 = ' + delta + ' + 1 = ' + n + ' ngày.'; basis = 'Điểm a khoản 1 Điều 4c'; }
  else { n = delta; reason = 'Trường hợp còn lại: ngày ra − ngày vào = ' + delta + ' ngày; không chia tổng giờ cho 24 để làm tròn.'; basis = 'Điểm b khoản 1 Điều 4c'; }
  return { days: n, explanation: fmt_(start) + ' → ' + fmt_(end) + ' (' + hours_(ms) + ' giờ). ' + reason, basis: basis, short: ms < 24 * NG.hour };
}
function groups_(segments, from, to) {
  var map = Object.create(null), list = [];
  segments.forEach(function (s) {
    var a = Math.max(from, s.start), b = Math.min(to, s.end);
    if (b <= a) return;
    var g = map[s.wardId];
    if (!g) { g = { id: s.wardId, name: s.name, ms: 0, price: s.price, priceConflict: false, excluded: s.excluded || false }; map[s.wardId] = g; list.push(g); }
    if (g.price !== s.price) g.priceConflict = true;
    g.ms += b - a;
  });
  return list;
}
function allocate_(groups, label) {
  var rows = groups.map(function (g) { return { date: label, ward: g.name, hours: hours_(g.ms), days: 0, price: g.price, explanation: '', basis: 'Khoản 2 Điều 4c' }; });
  function pending(message) {
    rows.forEach(function (r, i) { r.days = groups[i].excluded ? 0 : null; r.explanation = message + (groups[i].excluded ? ' Cấp cứu ≤4 giờ: không thanh toán giường hồi sức cấp cứu.' : ''); });
    if (!rows.length) rows.push({ date: label, ward: 'Cần xác minh', hours: 0, days: null, price: null, explanation: message, basis: 'Khoản 1, 2 Điều 4c' });
    return { rows: rows, pending: 1 };
  }
  if (!groups.length) return pending('Không có thời gian nằm thực tế trong ngày này (ví dụ ra viện đúng 00:00). Tổng ngày vẫn theo khoản 1; cần xác nhận khoa nhận phân bổ.');
  if (groups.some(function (g) { return g.excluded; })) return pending('Có lượt Cấp cứu ≤4 giờ trong khoảng nội trú. PDF không nêu rõ cách kết hợp phần loại trừ với phân bổ chuyển khoa; cần đối chiếu phần của khoa còn lại.');
  if (groups.length === 1) {
    rows[0].days = 1; rows[0].explanation = 'Một khoa trong ngày tính giường: phân bổ 1 ngày theo quy ước đã công khai.'; rows[0].basis = 'Khoản 1 Điều 4c; quy ước phân bổ của công cụ'; return { rows: rows, pending: 0 };
  }
  if (groups.length === 2) {
    rows.forEach(function (r) { r.days = 0.5; r.explanation = 'Chuyển 2 khoa trong cùng ngày: mỗi khoa 0,5 ngày; không áp ngưỡng >4 giờ của trường hợp từ 3 khoa.'; });
    return { rows: rows, pending: 0 };
  }
  var eligible = groups.map(function (g, i) { return { g: g, i: i }; }).filter(function (a) { return a.g.ms > 4 * NG.hour; });
  if (eligible.length < 2) return pending('Có từ 3 khoa nhưng ít hơn 2 khoa nằm >4 giờ trong ngày. Tài liệu không nêu rõ cách phân bổ tình huống này.');
  if (eligible.some(function (a) { return a.g.price === null || a.g.priceConflict; })) return pending('Có từ 3 khoa: cần giá giường hợp lệ, thống nhất trong ngày của tất cả khoa nằm >4 giờ để xác định giá cao nhất/thấp nhất.');
  var prices = eligible.map(function (a) { return a.g.price; }), low = Math.min.apply(null, prices), high = Math.max.apply(null, prices);
  var lows = eligible.filter(function (a) { return a.g.price === low; }), highs = eligible.filter(function (a) { return a.g.price === high; });
  if (eligible.length > 2 && (lows.length > 1 || highs.length > 1)) return pending('Nhiều khoa cùng mức giá cao nhất/thấp nhất. Giá bình quân xác định được (' + ((low + high) / 2) + ' đồng), nhưng cần xác nhận khoa được ghi nhận; không tự chọn khoa khi đồng giá.');
  var chosen = eligible.length === 2 ? [eligible[0].i, eligible[1].i] : [lows[0].i, highs[0].i];
  rows.forEach(function (r, i) {
    r.days = chosen.indexOf(i) >= 0 ? 0.5 : 0;
    r.explanation = groups[i].ms <= 4 * NG.hour ? 'Từ 3 khoa trong ngày: khoa này nằm ≤4 giờ, không thuộc nhóm chọn giá.' :
      r.days ? 'Thuộc 2 khoa được chọn giá cao nhất/thấp nhất trong nhóm >4 giờ; 0,5 ngày quy đổi. Giá bình quân ngày = ' + ((low + high) / 2) + ' đồng.' : 'Nằm >4 giờ nhưng giá không phải mức cao nhất hoặc thấp nhất: 0 ngày quy đổi tại khoa này.';
  });
  return { rows: rows, pending: 0 };
}
function tinhCotLoi_(input) {
  var n = normalize_(input), total = total_(n.admit, n.end, n.status), segments = n.stays.slice(), details = [], notes = [], pending = 0;
  var before = n.stays[0].start - n.arrival;
  notes.push('Mốc dùng tính: ' + fmt_(n.admit) + '. Phải khớp ngày giờ vào viện nội trú trên hồ sơ.');
  if (n.origin === 'PHONG_KHAM') notes.push('Thời gian tại Phòng khám không tự tính thành giường nội trú.');
  if (n.origin === 'CAP_CUU' && n.admit < n.stays[0].start) {
    segments.unshift({ wardId: 'CC', name: 'Cấp cứu', start: n.admit, end: n.stays[0].start, price: n.originPrice, emergency: true, excluded: before <= 4 * NG.hour });
  }
  if (n.admit > n.arrival || before === 0) {
    details.push({ date: date_(n.arrival), ward: n.origin === 'CAP_CUU' ? 'Cấp cứu (trước mốc nội trú)' : 'Phòng khám', hours: hours_(n.admit - n.arrival), days: 0, price: null,
      explanation: 'Khoảng trước mốc nội trú đã chọn: không cộng vào kết quả đợt này.' + (n.origin === 'CAP_CUU' && before <= 4 * NG.hour ? ' Lượt Cấp cứu ≤4 giờ: không thanh toán giường hồi sức cấp cứu theo điểm c.' : ''), basis: n.origin === 'CAP_CUU' ? 'Mốc hồ sơ; điểm c khoản 1 Điều 4c khi đủ điều kiện' : 'Phân biệt ngoại trú và nội trú' });
    if (n.origin === 'CAP_CUU' && before > 4 * NG.hour) notes.push('Có >4 giờ ở Cấp cứu trước mốc nội trú. Kiểm tra hồ sơ: nếu thời gian này thuộc đợt nội trú, phải đổi mốc vào viện; công cụ hiện chưa cộng khoảng đó.');
  }
  if (!total.days) {
    groups_(segments, n.admit, n.end).forEach(function (g) { details.push({ date: date_(n.admit) + (day_(n.end) !== day_(n.admit) ? ' – ' + date_(n.end) : ''), ward: g.name, hours: hours_(g.ms), days: 0, price: g.price, explanation: 'Cả đợt nội trú ≤4 giờ: 0 ngày giường, kể cả tình trạng ra viện thuộc nhóm đặc biệt.', basis: total.basis }); });
  } else if (total.short && day_(n.admit) !== day_(n.end)) {
    var gs = groups_(segments, n.admit, n.end), label = date_(n.admit) + ' – ' + date_(n.end);
    if (gs.length === 1 && !gs[0].excluded) {
      details.push({ date: label, ward: gs[0].name, hours: hours_(gs[0].ms), days: 1, price: gs[0].price, explanation: 'Đợt >4 và <24 giờ qua nửa đêm, chỉ một khoa: toàn đợt tính 1 ngày, không tách thành 2 ngày.', basis: total.basis });
    } else {
      pending = 1;
      gs.forEach(function (g) { details.push({ date: label, ward: g.name, hours: hours_(g.ms), days: g.excluded ? 0 : null, price: g.price, explanation: 'Toàn đợt <24 giờ qua nửa đêm có chuyển khoa: tổng là 1 ngày; PDF chưa quy định rõ cách ghép phân bổ giữa hai ngày lịch. Cần đối chiếu.' + (g.excluded ? ' Cấp cứu ≤4 giờ: không tính giường hồi sức cấp cứu.' : ''), basis: 'Điểm c khoản 1 và khoản 2 Điều 4c' }); });
    }
  } else {
    var startDay = day_(n.admit);
    for (var i = 0; i < total.days; i++) {
      var d = startDay + i * NG.day, allocation = allocate_(groups_(segments, Math.max(d, n.admit), Math.min(d + NG.day, n.end)), date_(d));
      details = details.concat(allocation.rows); pending += allocation.pending;
    }
    if (!total.short && NG.special.indexOf(n.status) < 0 && day_(n.end) >= startDay + total.days * NG.day) {
      groups_(segments, day_(n.end), n.end).forEach(function (g) { details.push({ date: date_(n.end), ward: g.name, hours: hours_(g.ms), days: 0, price: g.price, explanation: 'Ngày ra viện thông thường: không tính trong phân bổ dự kiến (quy ước tính ngày vào, không tính ngày ra).', basis: 'Điểm b khoản 1 Điều 4c; quy ước phân bổ' }); });
    }
  }
  notes.push('Phân bổ là dự kiến: đợt ≥24 giờ thông thường tính các ngày từ ngày vào đến trước ngày ra; nhóm đặc biệt gồm ngày ra. PDF cho công thức tổng, không mô tả toàn bộ cách gán ngày cho khoa.');
  notes.push('Chỉ đếm khoa có thời gian thực tế >0 trong ngày; đúng 00:00 không tạo thêm khoa ở ngày trước. Các lượt cùng mã khoa trong một ngày được cộng thời gian.');
  notes.push('Giá chỉ để chọn khoa cao/thấp; 0,5 là ngày quy đổi theo tỷ lệ giá. Chưa tính tiền BHYT thực trả, đồng chi trả, hậu phẫu, nằm ghép hoặc điều kiện ICU.');
  var byWard = Object.create(null), allocated = 0;
  details.forEach(function (d) {
    if (!byWard[d.ward]) byWard[d.ward] = { ward: d.ward, days: 0, hasPending: false };
    if (d.days === null) byWard[d.ward].hasPending = true;
    else { byWard[d.ward].days += d.days; allocated += d.days; }
  });
  if (Math.abs(allocated + pending - total.days) > 0.000001) throw new Error('Kiểm tra nội bộ: tổng phân bổ không khớp. Không lưu kết quả.');
  return { totalDays: total.days, allocatedDays: allocated, pendingDays: pending, hours: hours_(n.end - n.admit),
    explanation: total.explanation + ' Căn cứ: ' + total.basis + '.', basis: total.basis, details: details, byWard: Object.keys(byWard).map(function (k) { return byWard[k]; }),
    notes: notes, normalized: n, version: NG.version };
}

/**
 * Tính tổng ngày và diễn giải ngay trong ô Google Sheet (không phân bổ chuyển khoa).
 * =NGAY_GIUONG_TONG(A2;B2;C2)
 * A/B: ô ngày giờ; C: mã RA_VIEN, TU_VONG... hoặc đúng nhãn tình trạng trong giao diện.
 * @customfunction
 */
function NGAY_GIUONG_TONG(vaoVien, raVien, tinhTrang) {
  var status = String(tinhTrang || 'RA_VIEN').trim();
  Object.keys(NG.statuses).forEach(function (k) { if (NG.statuses[k] === status) status = k; });
  if (!Object.prototype.hasOwnProperty.call(NG.statuses, status)) return [['', 'Tình trạng không hợp lệ. Dùng RA_VIEN, TU_VONG, XIN_VE, NANG_XIN_VE, NANG_CHUYEN_VIEN, QUA_CAP_CUU_CHUYEN hoặc CHUYEN_VIEN_KHAC.']];
  function convert(v) {
    if (v instanceof Date) return parseTime_(Utilities.formatDate(v, NG.tz, "yyyy-MM-dd'T'HH:mm"), 'Ngày giờ');
    return parseTime_(String(v), 'Ngày giờ');
  }
  try { var r = total_(convert(vaoVien), convert(raVien), status); return [[r.days, r.explanation + ' ' + r.basis + '.']]; }
  catch (e) { return [['', e.message]]; }
}


/* ===== GIAO DIỆN INDEX.HTML ĐƯỢC NHÚNG ĐỂ CHẠY CHỈ VỚI 1 TỆP .GS ===== */
var NG_INDEX_HTML_ = "<!doctype html>\n<html lang=\"vi\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <base target=\"_top\">\n  <title>Tính ngày giường BHYT</title>\n  <style>\n    :root{--ink:#183c41;--muted:#577078;--brand:#12696c;--light:#e9f5f2;--line:#d7e4e6;--bg:#f3f7f8;--amber:#8b4b0b;--amberbg:#fff4df;--red:#b02936}\n    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 Arial,Helvetica,sans-serif}button,input,select{font:inherit}button,a,input,select{touch-action:manipulation}button{cursor:pointer}button:disabled{opacity:.5;cursor:wait}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #e39e32;outline-offset:3px}[hidden]{display:none!important}a{color:var(--brand)}\n    .top{background:#124c50;color:white;padding:24px max(22px,calc((100vw - 1180px)/2)) 26px}.topline{display:flex;gap:18px;align-items:center;justify-content:space-between}.brandtag{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.85}.top h1{font-size:29px;line-height:1.2;margin:7px 0 9px;font-weight:700}.top p{margin:0;color:#cde4e3;font-size:14px}.pill{border:1px solid #558083;border-radius:30px;padding:7px 12px;white-space:nowrap;font-size:12px}.wrap{max-width:1180px;margin:22px auto;padding:0 22px 45px}.layout{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:22px;align-items:start}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:23px;box-shadow:0 3px 14px #183c4105;margin-bottom:18px;min-width:0}.card h2{margin:0 0 4px;font-size:19px}.sub{color:var(--muted);font-size:13px;margin:0 0 19px}.section-title{display:flex;align-items:center;gap:10px;margin-bottom:14px}.step{height:28px;width:28px;display:inline-grid;place-items:center;background:var(--light);color:var(--brand);font-weight:700;border-radius:9px;font-size:13px;flex-shrink:0}.section-title h2{margin:0}.field{display:flex;flex-direction:column;gap:6px;min-width:0;margin-bottom:15px}.field label{font-size:13px;font-weight:700}.field small,.hint{font-size:12px;color:var(--muted);line-height:1.5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.full{grid-column:1/-1}input,select{width:100%;min-width:0;border:1px solid #bbced1;border-radius:9px;background:white;color:var(--ink);padding:11px 10px;min-height:45px;font-size:16px}input:focus,select:focus{outline:2px solid #78bdbc;outline-offset:1px}input[readonly]{background:#eef3f5;color:#667f85}.toggle{display:grid;grid-template-columns:1fr 1fr;background:#edf3f4;padding:4px;border-radius:11px;gap:4px;margin-bottom:20px}.toggle button{border:0;background:transparent;border-radius:8px;padding:11px 8px;color:var(--muted);font-weight:700;font-size:13px}.toggle button.active{background:#fff;color:var(--brand);box-shadow:0 1px 5px #12383d16}.ward{border:1px solid var(--line);border-radius:12px;padding:16px;margin:12px 0;background:#fcfefe}.ward-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px}.ward-head strong{font-size:14px}.ward .field:last-child{margin-bottom:0}.remove{background:none;border:0;color:var(--red);padding:5px;font-size:13px}.linkbtn{border:0;background:none;color:var(--brand);padding:3px 0;font-size:12px;text-align:left}.btn{border:1px solid var(--brand);color:var(--brand);background:white;border-radius:10px;padding:12px 16px;font-weight:700;min-height:46px}.btn.primary{background:var(--brand);color:white}.btn.soft{background:var(--light);border-color:var(--light)}.btn.wide{width:100%}.actions{display:flex;gap:10px;flex-wrap:wrap}.actions .btn{flex:1}.note{border-radius:10px;padding:12px 14px;font-size:13px;background:#edf6f5;border-left:3px solid #64aba9;margin:13px 0}.note.amber{background:var(--amberbg);border-color:#d6a554;color:var(--amber)}.note.error{background:#fff0f1;border-color:var(--red);color:#982834}.note.success{background:#edf8f0;border-color:#48a866;color:#216038}.note p{margin:4px 0}.loading{font-size:13px;padding:11px 15px;background:white;border:1px solid var(--line);border-radius:10px;margin-bottom:18px}details{font-size:13px;margin-top:14px}summary{cursor:pointer;font-weight:700;color:var(--brand);padding:8px 0}details p{color:var(--muted);margin:6px 0 12px}.empty{text-align:center;padding:20px 8px 14px}.empty-mark{font-size:40px;color:var(--brand);font-weight:300;line-height:1.1;margin:6px 0 18px}.empty h3{font-size:19px;margin:7px 0}.empty p{color:var(--muted);font-size:14px}.rule-list{text-align:left;margin:25px 0 0;border-top:1px solid var(--line)}.rule-row{display:flex;gap:14px;justify-content:space-between;border-bottom:1px solid var(--line);padding:13px 0;font-size:13px}.rule-row b{color:var(--brand);white-space:nowrap}.result-head{display:flex;gap:12px;align-items:center;justify-content:space-between}.tag{border-radius:30px;background:var(--light);color:var(--brand);font-size:11px;font-weight:700;padding:6px 9px}.tag.warn{background:var(--amberbg);color:var(--amber)}.metric{padding:20px 0 15px;border-bottom:1px solid var(--line);margin-bottom:18px}.number{font-size:66px;line-height:1;color:var(--brand);font-weight:700;letter-spacing:-3px}.unit{font-size:18px;margin-left:10px}.metric-caption{font-size:12px;color:var(--muted);margin-top:8px}.minimetrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:15px 0}.minimetrics div{background:#f1f6f6;padding:13px;border-radius:10px;font-size:12px}.minimetrics strong{display:block;font-size:22px;color:var(--ink)}.ward-summary{display:grid;gap:8px;margin:16px 0}.summary-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 12px;background:#f6f9f9;border-radius:8px;font-size:13px}.summary-row b{font-size:16px;white-space:nowrap}.summary-row small{display:block;color:var(--amber);font-size:11px}.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px;margin:12px 0}.detail-table{width:100%;border-collapse:collapse;font-size:12px;min-width:450px}.detail-table th{background:#eaf2f3;color:#34565e;text-align:left;padding:10px}.detail-table td{padding:11px 10px;border-top:1px solid var(--line);vertical-align:top}.detail-table td:nth-child(2){font-weight:700;color:var(--brand);min-width:70px}.detail-table small{display:block;color:var(--muted);font-size:11px;margin-top:4px}.result-notes{padding-left:18px;font-size:12px;color:var(--muted)}.result-notes li{margin:8px 0}.footer{font-size:12px;color:var(--muted);margin-top:20px}.stale{opacity:.5}.modehelp{font-size:12px;color:var(--muted);margin:0 0 14px}.toplink{color:#d6eeec;font-size:13px}.saveinfo{font-size:12px;overflow-wrap:anywhere}.previewbadge{background:#fff4df;color:#7a490c}.toolbar{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:14px}.toolbar button{font-size:12px;background:none;border:0;color:var(--brand);padding:5px 0}.status-stay{font-size:12px;color:var(--muted);padding:4px 0 0}.formactions{position:sticky;bottom:0;background:#fffffff2;backdrop-filter:blur(7px);padding:12px 0 0;margin-top:14px}.print-only{display:none}\n    input,select{font-weight:400}.formactions{position:static}.vn-time{display:block;color:var(--brand);font-size:12px;font-weight:400;margin-top:5px}\n    @media(max-width:900px){.layout{grid-template-columns:1fr}.wrap{max-width:680px}.top{padding:21px 22px}.resultcol{scroll-margin-top:18px}}\n    @media(max-width:520px){.wrap{padding:0 12px 25px;margin-top:13px}.top{padding:20px 17px}.top h1{font-size:25px}.pill{display:none}.card{padding:17px;border-radius:13px;margin-bottom:13px}.grid{grid-template-columns:1fr}.full{grid-column:auto}.ward{padding:13px}.actions{gap:8px}.btn{padding:11px 12px;font-size:14px}.number{font-size:59px}.detail-table{min-width:0;display:block}.detail-table thead{display:none}.detail-table tbody,.detail-table tr,.detail-table td{display:block;width:100%}.detail-table tr{border-bottom:1px solid var(--line);padding:10px 12px}.detail-table tr:last-child{border-bottom:0}.detail-table td{border:0;padding:4px 0}.detail-table td:nth-child(2):before{content:'Ngày quy đổi: ';font-size:12px;color:var(--muted);font-weight:400}.tablewrap{overflow:visible}.sub{font-size:12px}.topline{gap:6px}.minimetrics{gap:8px}.minimetrics div{padding:10px}}\n    @media print{body{background:#fff}.top{background:#fff;color:#183c41;padding:0 0 15px}.top p,.brandtag{color:#577078}.inputcol,.loading,.toolbar,.saveactions,.footer,.toplink,.pill{display:none!important}.wrap{max-width:none;margin:0;padding:0}.layout{display:block}.card{box-shadow:none;border:0;padding:0}.detail-table{min-width:0}.tablewrap{overflow:visible}details{display:block}details>*{display:block}.print-only{display:block}.number{font-size:42px}.note{break-inside:avoid}.detail-table tr{break-inside:avoid}}\n  </style>\n</head>\n<body>\n<header class=\"top\"><div class=\"topline\"><div><div class=\"brandtag\">Công cụ hỗ trợ nghiệp vụ</div><h1>Tính ngày giường BHYT</h1><p>Nhập một lần · Xem từng khoa · Có diễn giải</p></div><span class=\"pill\">Theo tài liệu TT39/2024</span></div></header>\n<main class=\"wrap\">\n  <div id=\"connection\" class=\"loading\" role=\"status\">Đang kết nối Google Sheet…</div>\n  <div class=\"toolbar\"><span class=\"hint\">Ngày giờ tính theo Việt Nam (UTC+7)</span><button id=\"sampleBtn\" type=\"button\">Điền ví dụ minh họa</button></div>\n  <div class=\"layout\">\n    <section class=\"inputcol\">\n      <form id=\"form\" novalidate>\n        <div class=\"card\">\n          <div class=\"section-title\"><span class=\"step\">1</span><h2>Tiếp nhận người bệnh</h2></div>\n          <p class=\"sub\">Chọn đường đi và nhập thời điểm thực tế.</p>\n          <div class=\"toggle\" role=\"group\" aria-label=\"Chế độ chuyển khoa\"><button type=\"button\" id=\"singleMode\" class=\"active\" aria-pressed=\"true\">Một khoa điều trị</button><button type=\"button\" id=\"multiMode\" aria-pressed=\"false\">Nhiều khoa</button></div>\n          <p id=\"modeHelp\" class=\"modehelp\">Cấp cứu / Phòng khám → 1 khoa điều trị → ra viện.</p>\n          <div class=\"grid\">\n            <div class=\"field\"><label for=\"origin\">Nơi tiếp nhận</label><select id=\"origin\"><option value=\"PHONG_KHAM\">Phòng khám</option><option value=\"CAP_CUU\">Khoa Cấp cứu</option></select></div>\n            <div class=\"field\"><label for=\"arrival\">Ngày giờ vào nơi tiếp nhận</label><input id=\"arrival\" type=\"datetime-local\" step=\"60\" required></div>\n          </div>\n          <div class=\"field\"><label for=\"caseCode\">Mã hồ sơ <span class=\"hint\">(không bắt buộc)</span></label><input id=\"caseCode\" maxlength=\"80\" placeholder=\"Ví dụ: HS-001\" autocomplete=\"off\"><small>Không cần nhập họ tên hoặc thông tin định danh người bệnh.</small></div>\n        </div>\n        <div class=\"card\">\n          <div class=\"section-title\"><span class=\"step\">2</span><h2>Quá trình điều trị</h2></div>\n          <p class=\"sub\">Mỗi thẻ là một lượt nằm khoa; giờ chuyển được nối tự động.</p>\n          <div id=\"wards\"></div>\n          <button type=\"button\" id=\"addWard\" class=\"btn soft wide\" hidden>+ Thêm khoa tiếp theo</button>\n          <div class=\"field\" style=\"margin-top:20px\"><label for=\"status\">Tình trạng ra khoa cuối / ra viện</label><select id=\"status\"></select><small>Chuyển khoa trong cùng bệnh viện không phải “chuyển cơ sở KCB”.</small></div>\n          <div class=\"field\"><label for=\"admitMode\">Mốc vào viện nội trú dùng tính ngày</label><select id=\"admitMode\"><option value=\"KHOA\">Bằng giờ vào khoa điều trị đầu tiên</option><option value=\"CAP_CUU\" hidden>Bằng giờ vào Cấp cứu (hồ sơ ghi nhận nội trú)</option><option value=\"CUSTOM\" hidden>Nhập mốc nội trú riêng trong thời gian Cấp cứu</option></select><small id=\"admitHint\">Dùng giờ vào viện trên hồ sơ. Không cộng thời gian chờ khám vào nội trú.</small></div>\n          <div class=\"field\" id=\"customAdmission\" hidden><label for=\"admission\">Ngày giờ vào viện nội trú trên hồ sơ</label><input id=\"admission\" type=\"datetime-local\" step=\"60\"></div>\n          <details id=\"emergencyPrice\" hidden><summary>Giá giường Cấp cứu (chỉ cần khi từ 3 khoa/ngày)</summary><div class=\"field\"><label for=\"originPrice\">Đồng/ngày; để trống để lấy từ danh mục</label><input id=\"originPrice\" type=\"number\" min=\"1\" max=\"1000000000\" step=\"1\" inputmode=\"numeric\" placeholder=\"Lấy từ NG_DM_KHOA\"></div></details>\n          <div id=\"formError\" class=\"note error\" role=\"alert\" hidden></div>\n          <div class=\"formactions\"><div class=\"actions\"><button type=\"submit\" id=\"calculate\" class=\"btn primary\">Tính ngày giường</button><button type=\"button\" id=\"clearBtn\" class=\"btn\">Nhập ca mới</button></div></div>\n        </div>\n      </form>\n    </section>\n    <section id=\"resultColumn\" class=\"resultcol\" aria-label=\"Kết quả tính\">\n      <div class=\"card\">\n        <div id=\"empty\" class=\"empty\"><div class=\"empty-mark\">01 / ½</div><h3>Ngày giường, rõ từng bước</h3><p>Nhập các mốc bên trái để xem tổng ngày,<br>phần của từng khoa và căn cứ áp dụng.</p><div class=\"rule-list\"><div class=\"rule-row\"><span>Điều trị ≤4 giờ</span><b>0 ngày</b></div><div class=\"rule-row\"><span>Trên 4, dưới 24 giờ</span><b>1 ngày</b></div><div class=\"rule-row\"><span>Chuyển 2 khoa trong ngày</span><b>0,5 mỗi khoa</b></div><div class=\"rule-row\"><span>Từ 3 khoa trong ngày</span><b>Xét giờ + giá</b></div></div><p class=\"hint\">Quy tắc 4 giờ và 24 giờ xét trên đợt nội trú; không làm tròn riêng mỗi lượt khoa.</p></div>\n        <div id=\"result\" hidden aria-live=\"polite\">\n          <div class=\"result-head\"><h2>Kết quả của đợt điều trị</h2><span id=\"resultTag\" class=\"tag\">ĐÃ TÍNH</span></div>\n          <div id=\"staleNotice\" class=\"note amber\" hidden>Dữ liệu đã thay đổi. Bấm “Tính ngày giường” để cập nhật.</div>\n          <div id=\"resultBody\">\n            <div class=\"metric\"><span id=\"total\" class=\"number\">0</span><span class=\"unit\">ngày giường</span><div class=\"metric-caption\">TỔNG TOÀN ĐỢT THEO KHOẢN 1 ĐIỀU 4c</div></div>\n            <div class=\"note\" id=\"explanation\"></div>\n            <div class=\"minimetrics\"><div><strong id=\"allocated\">0</strong>Đã phân bổ dự kiến</div><div><strong id=\"pending\">0</strong>Chờ đối chiếu phân bổ</div></div>\n            <div id=\"pendingMessage\" class=\"note amber\" hidden></div>\n            <h3 style=\"font-size:15px;margin-bottom:8px\">Ngày quy đổi theo khoa</h3><div id=\"wardSummary\" class=\"ward-summary\"></div>\n            <h3 style=\"font-size:15px;margin:20px 0 7px\">Chi tiết và diễn giải</h3>\n            <div class=\"tablewrap\"><table class=\"detail-table\"><thead><tr><th>Ngày · Khoa</th><th>Ngày quy đổi</th><th>Diễn giải</th></tr></thead><tbody id=\"detailRows\"></tbody></table></div>\n            <details id=\"conventions\"><summary>Mốc tính, quy ước và phạm vi</summary><ul id=\"notes\" class=\"result-notes\"></ul></details>\n          </div>\n          <div class=\"saveactions\"><div class=\"actions\" style=\"margin-top:18px\"><button type=\"button\" class=\"btn primary\" id=\"saveBtn\">Lưu vào Google Sheet</button><button type=\"button\" class=\"btn\" id=\"printBtn\">In kết quả</button></div><div id=\"saveMessage\" class=\"note success saveinfo\" role=\"status\" hidden></div></div>\n        </div>\n      </div>\n      <div class=\"card\"><h2 style=\"font-size:16px\">Cách đọc kết quả</h2><p class=\"hint\">“Tổng ngày” tính cho cả đợt. “Ngày quy đổi” là phần giá giường phân cho từng khoa, không phải thời gian nằm thực tế. Không cộng thêm một ngày sau mỗi lần chuyển khoa.</p><details><summary>Vì sao đôi lúc cần đối chiếu?</summary><p>PDF chưa mô tả đầy đủ các tổ hợp: Cấp cứu ≤4 giờ rồi chuyển khoa, đợt &lt;24 giờ qua nửa đêm có chuyển khoa, từ 3 khoa nhưng thiếu giá hoặc ít hơn 2 khoa nằm &gt;4 giờ. Công cụ vẫn tính tổng; phần chưa rõ không tự điền thành 0.</p></details><details><summary>Thiết lập giá khoa một lần</summary><p>Trong Google Sheet, mở <b>NG_DM_KHOA</b>, điền đúng giá giường được phê duyệt tại cột C. Không có giá mẫu. Tải lại giao diện sau khi sửa danh mục. Khi cần, có thể nhập giá riêng tại thẻ khoa của ca đang tính.</p></details><details><summary>Nguồn quy tắc</summary><p>Huong_dan_BHYT_3_phan_v3_bo_sung_PT_TT.pdf, trang 4, 9 và 10. Đối chiếu Điều 4c Thông tư 35/2016/TT-BYT được bổ sung bởi Thông tư 39/2024/TT-BYT. Phiên bản 1.0.0, ngày 29/09/2026; không tự cập nhật văn bản.</p><a href=\"https://chinhphu.vn/?docid=211771&amp;pageid=27160\" target=\"_blank\" rel=\"noopener\">Xem văn bản tại Cổng thông tin Chính phủ ↗</a></details></div>\n    </section>\n  </div>\n  <footer class=\"footer\">Dữ liệu chỉ được ghi vào Google Sheet khi bấm Lưu. Các trang kết quả là nhật ký tính; sửa ô nhật ký không tự tính lại. <a id=\"sheetLink\" hidden target=\"_blank\" rel=\"noopener\">Mở Google Sheet ↗</a></footer>\n</main>\n<script>\n  'use strict';\n  const $ = id => document.getElementById(id);\n  let cfg = null, multi = false, result = null, calculatedInput = null, requestId = '', saving = false, revision = 0, ready = false;\n  const fallbackStatuses = {RA_VIEN:'Ra viện thông thường',XIN_VE:'Xin về, không diễn biến nặng lên',TU_VONG:'Tử vong khi điều trị nội trú',NANG_XIN_VE:'Nặng lên, gia đình xin về',NANG_CHUYEN_VIEN:'Nặng lên, chuyển cơ sở KCB',QUA_CAP_CUU_CHUYEN:'Qua cấp cứu, vẫn cần nội trú, chuyển cơ sở KCB',CHUYEN_VIEN_KHAC:'Chuyển cơ sở KCB, không thuộc nhóm đặc biệt'};\n  const fmt = x => x === null ? 'Cần đối chiếu' : Number(x).toLocaleString('vi-VN', {maximumFractionDigits:4});\n  const escapeHtml = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\n  function refreshTimes() {\n    document.querySelectorAll('input[type=\"datetime-local\"]').forEach(el => {\n      let out=el.nextElementSibling;\n      if(!out || !out.classList.contains('vn-time')){out=document.createElement('span');out.className='vn-time';el.insertAdjacentElement('afterend',out);}\n      const m=/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})$/.exec(el.value);\n      out.textContent=m ? `${m[3]}/${m[2]}/${m[1]} · ${m[4]}:${m[5]}` : 'Ngày/tháng/năm · giờ:phút';\n    });\n  }\n  function rpc(name, ...args) {\n    return new Promise((resolve,reject) => {\n      if (window.NG_PREVIEW_API) return Promise.resolve(window.NG_PREVIEW_API(name,args)).then(resolve,reject);\n      if (!window.google || !google.script || !google.script.run) return reject(new Error('Mở giao diện từ Apps Script hoặc liên kết Ứng dụng web; tệp HTML mở riêng không kết nối Google Sheet.'));\n      google.script.run.withSuccessHandler(resolve).withFailureHandler(e => reject(new Error(e.message || String(e))))[name](...args);\n    });\n  }\n  function markDirty() {\n    refreshTimes();\n    revision++; requestId = ''; $('saveMessage').hidden = true; $('formError').hidden = true;\n    if (result) { $('staleNotice').hidden = false; $('resultBody').classList.add('stale'); $('saveBtn').disabled = true; $('printBtn').disabled = true; }\n  }\n  function makeId() { return 'NG_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,12); }\n  function options() { return (cfg?.wards || [{id:'TM',name:'Nội Tim mạch',price:null},{id:'HSTC',name:'Hồi sức tích cực',price:null},{id:'NOI',name:'Nội tổng hợp',price:null}]).map(w => `<option value=\"${escapeHtml(w.id)}\">${escapeHtml(w.name)}</option>`).join('') + '<option value=\"CUSTOM_WARD\">Nhập khoa khác…</option>'; }\n  function wardCards() { return Array.from($('wards').children); }\n  function addWard(data = {}) {\n    const prior = wardCards().at(-1), node = document.createElement('div'); node.className = 'ward';\n    node.innerHTML = `<div class=\"ward-head\"><strong class=\"wardLabel\"></strong><button class=\"remove\" type=\"button\">Bỏ lượt này</button></div>\n      <div class=\"field\"><label>Khoa điều trị<select class=\"wardId\">${options()}</select></label></div>\n      <div class=\"field customName\" hidden><label>Tên khoa khác<input class=\"wardName\" maxlength=\"100\" placeholder=\"Nhập tên khoa\"></label></div>\n      <div class=\"grid\"><div class=\"field\"><label>Ngày giờ vào khoa<input type=\"datetime-local\" step=\"60\" class=\"start\" required></label><button type=\"button\" class=\"linkbtn sync\" hidden>Lấy giờ ra của khoa trước</button></div><div class=\"field\"><label>Ngày giờ ra khoa<input type=\"datetime-local\" step=\"60\" class=\"end\" required></label></div></div>\n      <div class=\"status-stay\"></div><details><summary>Giá giường tham chiếu (tùy chọn)</summary><div class=\"field\"><label>Đồng/ngày<input class=\"price\" type=\"number\" min=\"1\" max=\"1000000000\" step=\"1\" inputmode=\"numeric\" placeholder=\"Lấy từ danh mục khoa\"></label><small>Chỉ cần để chọn giá cao nhất/thấp nhất khi có từ 3 khoa trong ngày. Nhập số liền, ví dụ 500000.</small></div></details>`;\n    $('wards').appendChild(node);\n    node.querySelector('.wardId').value = data.wardId || (prior ? (cfg?.wards?.find(w=>w.id==='NOI')?.id || 'CUSTOM_WARD') : 'TM');\n    if (!node.querySelector('.wardId').value) node.querySelector('.wardId').value = 'CUSTOM_WARD';\n    node.querySelector('.wardName').value = data.name || '';\n    node.querySelector('.start').value = data.start || prior?.querySelector('.end').value || '';\n    node.querySelector('.end').value = data.end || '';\n    node.querySelector('.price').value = data.price ?? '';\n    node.querySelector('.remove').onclick = () => { node.remove(); numberWards(); markDirty(); };\n    node.querySelector('.sync').onclick = () => { const list = wardCards(), i = list.indexOf(node); if (i) node.querySelector('.start').value = list[i-1].querySelector('.end').value; markDirty(); };\n    node.querySelector('.wardId').onchange = () => { node.querySelector('.customName').hidden = node.querySelector('.wardId').value !== 'CUSTOM_WARD'; };\n    node.querySelector('.wardId').onchange();\n    node.querySelector('.end').addEventListener('change', () => {\n      const list = wardCards(), next = list[list.indexOf(node)+1]; if (next) next.querySelector('.start').value = node.querySelector('.end').value;\n    });\n    numberWards(); refreshTimes();\n  }\n  function numberWards() {\n    const list = wardCards(); list.forEach((node,i) => {\n      node.querySelector('.wardLabel').textContent = 'Khoa ' + (i+1);\n      node.querySelector('.remove').hidden = list.length === 1;\n      node.querySelector('.sync').hidden = i === 0;\n      node.querySelector('.status-stay').textContent = i === list.length-1 ? 'Khoa cuối: dùng tình trạng ra viện bên dưới.' : 'Ra khoa: chuyển khoa nội bộ.';\n    });\n  }\n  function setMode(isMulti) {\n    if (!isMulti && wardCards().length > 1) { showError('Đang có nhiều khoa. Bỏ các lượt dư trước khi chuyển về chế độ một khoa.'); return; }\n    multi = isMulti;\n    $('singleMode').classList.toggle('active',!multi); $('singleMode').setAttribute('aria-pressed',String(!multi));\n    $('multiMode').classList.toggle('active',multi); $('multiMode').setAttribute('aria-pressed',String(multi));\n    $('addWard').hidden = !multi;\n    $('modeHelp').textContent = multi ? 'Cấp cứu / Phòng khám → nhiều khoa, kể cả trên 2 khoa trong một ngày → ra viện.' : 'Cấp cứu / Phòng khám → 1 khoa điều trị → ra viện.';\n    markDirty();\n  }\n  function updateOrigin() {\n    const emergency = $('origin').value === 'CAP_CUU';\n    Array.from($('admitMode').options).forEach(o => { if(o.value !== 'KHOA') { o.hidden = !emergency; o.disabled = !emergency; } });\n    if (!emergency) $('admitMode').value = 'KHOA';\n    $('emergencyPrice').hidden = !emergency;\n    $('customAdmission').hidden = $('admitMode').value !== 'CUSTOM';\n    $('admission').required = ! $('customAdmission').hidden;\n    $('admitHint').textContent = emergency ? 'Mặc định từ khoa điều trị. Nếu hồ sơ ghi nhận nội trú từ Cấp cứu, chọn đúng mốc tương ứng để cộng thời gian đó.' : 'Dùng giờ vào viện trên hồ sơ. Không cộng thời gian chờ khám vào nội trú.';\n  }\n  function payload() {\n    return {origin:$('origin').value, arrival:$('arrival').value, caseCode:$('caseCode').value, admitMode:$('admitMode').value, admission:$('admission').value, status:$('status').value, originPrice:$('originPrice').value,\n      stays:wardCards().map(node => {\n        const id = node.querySelector('.wardId').value, c = cfg?.wards.find(w => w.id === id), custom = node.querySelector('.wardName').value.trim();\n        if (id === 'CUSTOM_WARD' && !custom) throw new Error('Nhập tên khoa ở lựa chọn Khoa khác.');\n        return {wardId:id === 'CUSTOM_WARD' ? 'USER_' + custom.normalize('NFC').toLocaleLowerCase('vi-VN') : id,name:c?.name || custom,start:node.querySelector('.start').value,end:node.querySelector('.end').value,price:node.querySelector('.price').value};\n      })};\n  }\n  function showError(message) { $('formError').textContent = message; $('formError').hidden = false; }\n  function render(r) {\n    result = r; $('empty').hidden = true; $('result').hidden = false; $('staleNotice').hidden = true; $('resultBody').classList.remove('stale');\n    $('resultTag').textContent = r.pendingDays ? 'CẦN ĐỐI CHIẾU' : 'PHÂN BỔ DỰ KIẾN'; $('resultTag').className = 'tag' + (r.pendingDays ? ' warn' : '');\n    $('total').textContent = fmt(r.totalDays); $('allocated').textContent = fmt(r.allocatedDays); $('pending').textContent = fmt(r.pendingDays); $('explanation').textContent = r.explanation;\n    $('pendingMessage').hidden = !r.pendingDays; $('pendingMessage').textContent = `Tổng ${fmt(r.totalDays)} ngày đã tính theo mốc nhập. Còn ${fmt(r.pendingDays)} ngày cần đối chiếu cách phân bổ; xem lý do ở từng dòng dưới đây.`;\n    $('wardSummary').innerHTML = r.byWard.map(w => `<div class=\"summary-row\"><span>${escapeHtml(w.ward)}${w.hasPending?'<small>Còn phần chưa xác định</small>':''}</span><b>${fmt(w.days)}${w.hasPending?' + ?':''}</b></div>`).join('');\n    $('detailRows').innerHTML = r.details.map(d => `<tr><td><b>${escapeHtml(d.ward)}</b><small>${escapeHtml(d.date)} · ${fmt(d.hours)} giờ</small></td><td>${fmt(d.days)}</td><td>${escapeHtml(d.explanation)}<small>${escapeHtml(d.basis)}</small></td></tr>`).join('');\n    $('notes').innerHTML = r.notes.map(n => '<li>' + escapeHtml(n) + '</li>').join('');\n    $('saveBtn').disabled = false; $('printBtn').disabled = false;\n  }\n  $('form').addEventListener('input',markDirty); $('form').addEventListener('change',markDirty);\n  $('origin').onchange = updateOrigin; $('admitMode').onchange = updateOrigin;\n  $('singleMode').onclick = () => setMode(false); $('multiMode').onclick = () => setMode(true);\n  $('addWard').onclick = () => { if(wardCards().length >= 100) return showError('Tối đa 100 lượt khoa.'); addWard(); markDirty(); };\n  $('form').onsubmit = async e => {\n    e.preventDefault(); $('formError').hidden = true;\n    if (!ready) return showError('Chưa kết nối Google Sheet. Kiểm tra thông báo phía trên.');\n    if (!$('form').reportValidity()) return;\n    const rev = revision;\n    try {\n      const p = payload(); $('calculate').disabled = true; $('calculate').textContent = 'Đang tính…'; $('saveBtn').disabled = true;\n      const r = await rpc('tinhNgayGiuong',p);\n      if (rev !== revision) { showError('Dữ liệu đã đổi trong lúc tính. Bấm Tính lại để dùng dữ liệu mới.'); return; }\n      calculatedInput = p; requestId = makeId(); $('saveMessage').hidden = true; render(r);\n      if (window.innerWidth < 901) $('resultColumn').scrollIntoView({behavior:'smooth',block:'start'});\n    } catch(err) { showError(err.message); }\n    finally { $('calculate').disabled = false; $('calculate').textContent = 'Tính ngày giường'; }\n  };\n  $('saveBtn').onclick = async () => {\n    if (saving || !result || !requestId || !$('staleNotice').hidden) return;\n    saving = true; const rev = revision; $('saveBtn').disabled = true; $('saveMessage').hidden = true;\n    try {\n      const saved = await rpc('luuKetQua', calculatedInput, requestId);\n      if (rev !== revision) { $('saveMessage').className='note amber saveinfo'; $('saveMessage').textContent='Đã lưu bản tính trước khi bạn sửa dữ liệu. Bấm Tính lại để lưu dữ liệu mới.'; }\n      else { if (saved.result) render(saved.result); $('saveBtn').disabled = true; $('saveMessage').className='note success saveinfo'; $('saveMessage').textContent=(saved.alreadySaved?'Bản tính này đã được lưu. ':'Đã lưu kết quả và diễn giải. ') + 'Mã: ' + saved.id; }\n      $('saveMessage').hidden = false;\n    } catch(err) { $('saveMessage').className='note error saveinfo'; $('saveMessage').textContent=err.message; $('saveMessage').hidden=false; $('saveBtn').disabled=!!$('staleNotice').offsetParent; }\n    finally { saving=false; }\n  };\n  $('printBtn').onclick = () => { const old=$('conventions').open; $('conventions').open=true; window.print(); $('conventions').open=old; };\n  $('clearBtn').onclick = () => {\n    if (saving) return showError('Đang lưu, vui lòng chờ hoàn tất.');\n    $('form').reset(); $('wards').innerHTML=''; addWard(); result=null; calculatedInput=null; requestId=''; revision++;\n    $('result').hidden=true; $('empty').hidden=false; $('saveMessage').hidden=true; $('formError').hidden=true; setMode(false); updateOrigin();\n  };\n  $('sampleBtn').onclick = () => {\n    if (saving) return;\n    $('origin').value='PHONG_KHAM'; $('arrival').value='2026-09-01T06:30'; $('caseCode').value='VI-DU-KHONG-PHAI-NGUOI-BENH'; $('admitMode').value='KHOA'; $('status').value='RA_VIEN';\n    $('wards').innerHTML=''; addWard({wardId:'TM',start:'2026-09-01T08:00',end:'2026-09-02T12:00'}); addWard({wardId:'NOI',start:'2026-09-02T12:00',end:'2026-09-04T10:00'}); setMode(true); updateOrigin(); markDirty();\n  };\n  async function init() {\n    $('status').innerHTML=Object.entries(fallbackStatuses).map(([k,v])=>`<option value=\"${k}\">${escapeHtml(v)}</option>`).join('');\n    $('calculate').disabled=true;\n    try {\n      cfg=await rpc('layCauHinh'); ready=true;\n      $('status').innerHTML=Object.entries(cfg.statuses).map(([k,v])=>`<option value=\"${k}\">${escapeHtml(v)}</option>`).join('');\n      $('connection').textContent=window.NG_PREVIEW_API?'Bản kiểm thử cục bộ · chưa kết nối tài khoản Google':'Đã kết nối · Nhập dữ liệu, tính và lưu ngay trên giao diện';\n      if(window.NG_PREVIEW_API) $('connection').classList.add('previewbadge');\n      if(cfg.sheetUrl){$('sheetLink').href=cfg.sheetUrl; $('sheetLink').hidden=false;}\n    } catch(err) { $('connection').textContent=err.message; $('connection').classList.add('note','error'); }\n    addWard(); updateOrigin(); $('calculate').disabled=!ready;\n  }\n  init();\n</script>\n</body>\n</html>\n";


/* ===== BỘ KIỂM THỬ (gộp từ KiemThu.gs) ===== */
/** Tùy chọn: thêm tệp KiemThu.gs rồi chạy chayKiemThu. Không đọc/ghi dữ liệu người bệnh. */
function chayKiemThu() {
  var count = 0, messages = [];
  function equal(a,b,name) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(name + ': nhận ' + JSON.stringify(a) + ', cần ' + JSON.stringify(b)); }
  function ward(id,a,b,price) { return {wardId:id,name:id,start:a,end:b,price:price === undefined ? '' : price}; }
  function one(a,b,status) { return {origin:'PHONG_KHAM',arrival:a,admitMode:'KHOA',status:status || 'RA_VIEN',stays:[ward('A',a,b)]}; }
  function run(name,p,days,pending,shares) {
    var r=tinhCotLoi_(p); equal(r.totalDays,days,name); equal(r.pendingDays,pending || 0,name+' / chờ');
    equal(r.allocatedDays+r.pendingDays,r.totalDays,name+' / bảo toàn tổng');
    if(shares) Object.keys(shares).forEach(function(k){var w=r.byWard.filter(function(x){return x.ward===k;})[0];equal(w ? w.days : 0,shares[k],name+' / '+k);});
    count++;messages.push('ĐẠT: '+name);
  }
  function invalid(name,p) { var failed=false;try {tinhCotLoi_(p);}catch(e){failed=true;}if(!failed)throw new Error(name+': chưa chặn dữ liệu sai');count++;messages.push('ĐẠT: '+name); }
  run('3 giờ 59 phút',one('2026-09-01T08:00','2026-09-01T11:59'),0);
  run('Đúng 4 giờ',one('2026-09-01T08:00','2026-09-01T12:00'),0);
  run('4 giờ 1 phút',one('2026-09-01T08:00','2026-09-01T12:01'),1);
  run('23 giờ 59 phút',one('2026-09-01T08:00','2026-09-02T07:59'),1);
  run('Đúng 24 giờ thông thường',one('2026-09-01T08:00','2026-09-02T08:00'),1);
  run('Đúng 24 giờ tử vong',one('2026-09-01T08:00','2026-09-02T08:00','TU_VONG'),2);
  run('3,5 giờ tử vong vẫn không tính',one('2026-09-01T08:00','2026-09-01T11:30','TU_VONG'),0);
  run('20 giờ tử vong qua ngày vẫn 1',one('2026-09-01T08:00','2026-09-02T04:00','TU_VONG'),1);
  run('Ví dụ PDF 01/6 ra 05/6',one('2026-06-01T08:00','2026-06-05T10:00'),4);
  run('Ví dụ PDF 01/6 tử vong 05/6',one('2026-06-01T08:00','2026-06-05T10:00','TU_VONG'),5);
  run('Nặng xin về',one('2026-09-01T08:00','2026-09-03T10:00','NANG_XIN_VE'),3);
  run('Nặng chuyển viện',one('2026-09-01T08:00','2026-09-03T10:00','NANG_CHUYEN_VIEN'),3);
  run('Qua cấp cứu còn cần nội trú chuyển viện',one('2026-09-01T08:00','2026-09-03T10:00','QUA_CAP_CUU_CHUYEN'),3);
  run('Nhẹ xin về không cộng 1',one('2026-09-01T08:00','2026-09-03T10:00','XIN_VE'),2);
  run('Chuyển viện khác không cộng 1',one('2026-09-01T08:00','2026-09-03T10:00','CHUYEN_VIEN_KHAC'),2);
  run('Năm nhuận',one('2024-02-28T08:00','2024-03-01T08:00'),2);
  run('Qua năm',one('2025-12-31T08:00','2026-01-02T08:00'),2);
  run('Không làm tròn giờ/24',one('2026-09-01T23:00','2026-09-03T01:00'),2);
  var p=one('2026-09-01T08:00','2026-09-03T08:00');p.arrival='2026-08-31T20:00';
  run('Không cộng thời gian phòng khám',p,2);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays=[ward('A','2026-09-01T08:00','2026-09-01T10:00'),ward('B','2026-09-01T10:00','2026-09-03T08:00')];
  run('2 khoa không áp >4 giờ riêng từng khoa',p,2,0,{A:0.5,B:1.5});
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays=[ward('A','2026-09-01T08:00','2026-09-02T00:00'),ward('B','2026-09-02T00:00','2026-09-03T08:00')];
  run('Chuyển đúng 00:00 không đếm hai khoa ngày trước',p,2,0,{A:1,B:1});
  p=one('2026-09-01T00:00','2026-09-02T00:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T06:00',400000),ward('B','2026-09-01T06:00','2026-09-01T12:00',800000),ward('C','2026-09-01T12:00','2026-09-02T00:00',600000)];
  run('3 khoa lấy giá cao nhất và thấp nhất',p,1,0,{A:0.5,B:0.5,C:0});
  p.stays[0].end='2026-09-01T04:00';p.stays[1].start='2026-09-01T04:00';
  run('3 khoa, đúng 4 giờ bị loại khỏi nhóm giá',p,1,0,{A:0,B:0.5,C:0.5});
  p.stays[1].price='';run('3 khoa thiếu giá: tổng vẫn có, phân bổ chờ',p,1,1);
  p.stays[0].end='2026-09-01T06:00';p.stays[1].start='2026-09-01T06:00';p.stays.forEach(function(s){s.price=500000;});
  run('3 khoa đồng giá cần xác nhận khoa',p,1,1);
  p=one('2026-09-01T00:00','2026-09-01T12:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T04:00',1),ward('B','2026-09-01T04:00','2026-09-01T08:00',2),ward('C','2026-09-01T08:00','2026-09-01T12:00',3)];
  run('3 khoa đều đúng 4 giờ',p,1,1);
  p=one('2026-09-01T22:00','2026-09-02T06:00');p.stays=[ward('A','2026-09-01T22:00','2026-09-02T00:00'),ward('B','2026-09-02T00:00','2026-09-02T06:00')];
  run('Đợt ngắn qua nửa đêm chuyển khoa',p,1,1);
  p=one('2026-09-01T06:00','2026-09-02T12:00');p.origin='CAP_CUU';p.arrival='2026-09-01T00:00';p.admitMode='CAP_CUU';
  run('Cấp cứu >4 giờ thuộc nội trú + 1 khoa',p,1,0,{'Cấp cứu':0.5,A:0.5});
  p.stays[0].start='2026-09-01T04:00';
  run('Cấp cứu đúng 4 giờ không tự suy diễn phần còn lại',p,1,1,{'Cấp cứu':0});
  p.admitMode='KHOA';run('Mốc nội trú từ khoa: CC trước mốc không cộng',p,1,0,{A:1});
  p=one('2026-09-01T08:00','2026-09-03T00:00','TU_VONG');run('Tử vong đúng 00:00 vẫn giữ tổng, chờ phân bổ ngày cuối',p,3,1);
  p=one('2026-09-01T00:00','2026-09-02T00:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T03:00'),ward('B','2026-09-01T03:00','2026-09-01T07:00'),ward('A','2026-09-01T07:00','2026-09-02T00:00')];
  run('Quay lại cùng khoa trong ngày: 2 khoa duy nhất',p,1,0,{A:0.5,B:0.5});
  invalid('Ngày 31/2',one('2026-02-31T08:00','2026-03-04T08:00'));
  invalid('Ra trước vào',one('2026-09-03T08:00','2026-09-01T08:00'));
  invalid('Lượt 0 phút',one('2026-09-01T08:00','2026-09-01T08:00'));
  p=one('2026-09-01T08:00','2026-09-02T08:00');p.arrival='2026-09-01T09:00';invalid('Tiếp nhận sau vào khoa',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays.push(ward('B','2026-09-03T07:00','2026-09-04T08:00'));invalid('Chồng lấn giờ chuyển',p);
  p.stays[1].start='2026-09-03T09:00';invalid('Khoảng trống giờ chuyển',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00','CHUYEN_KHOA');invalid('Không dùng chuyển khoa thay ra viện',p);
  p.status='__proto__';invalid('Chặn khóa tình trạng không hợp lệ',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays[0].price=-1;invalid('Giá âm',p);
  p.stays[0].price='500.000đ';invalid('Giá dạng chữ',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.admitMode='CAP_CUU';invalid('Phòng khám không chọn mốc CC',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays[0].wardId='__proto__';p.stays[0].name='constructor';run('Tên/mã khoa đặc biệt không phá bảng tổng',p,2);
  equal(safeCell_('=HYPERLINK("bad")').charAt(0),"'",'Chặn công thức trong mã hồ sơ');count++;messages.push('ĐẠT: Chặn công thức trong dữ liệu văn bản');
  var report={passed:count,failed:0,cases:messages};
  if(typeof Logger !== 'undefined') Logger.log(JSON.stringify(report,null,2));
  return report;
}
