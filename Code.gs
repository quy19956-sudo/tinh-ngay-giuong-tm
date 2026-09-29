/**
 * TÍNH NGÀY GIƯỜNG BHYT - 1.0.0 - 29/09/2026
 * Nguồn: PDF người dùng, trang 4, 9, 10; Điều 4c TT35/2016,
 * được bổ sung bởi khoản 4 Điều 1 TT39/2024/TT-BYT.
 * Đây là bộ quy tắc của tài liệu đã cung cấp, không tự cập nhật pháp luật.
 * Tạo 2 tệp trong Apps Script: Code.gs và Index.html. Chạy khoiTao một lần.
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
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Tính ngày giường BHYT')
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
