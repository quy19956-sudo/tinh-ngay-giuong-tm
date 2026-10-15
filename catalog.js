/* Danh mục dùng chung cho hai trang. Không gửi dữ liệu ra mạng. */
(function(root) {
  'use strict';
  const KEY = 'ngay-giuong.catalog.v2';
  const MAX_ROWS = 1000;
  const clone = value => JSON.parse(JSON.stringify(value));
  const clean = value => String(value == null ? '' : value).normalize('NFC').trim().replace(/\s+/g, ' ');
  const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const nameKey = value => fold(value).replace(/^khoa\s+/, '');
  function price(value, required = true) {
    if (value === null || value === undefined || clean(value) === '') {
      if (required) throw new Error('thiếu giá tiền');
      return null;
    }
    let number = value;
    if (typeof value === 'string') {
      let s = value.trim().replace(/[\u00a0\u202f]/g, ' ').replace(/\s*(?:₫|đ|vnd|đồng)\s*$/i, '').trim();
      if (/^\d{1,3}(?:\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
      else if (/^\d{1,3}(?:,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
      else if (/^\d{1,3}(?: \d{3})+$/.test(s)) s = s.replace(/ /g, '');
      if (!/^\d+$/.test(s)) throw new Error('giá phải là số nguyên đồng, ví dụ 500000 hoặc 500.000');
      number = Number(s);
    }
    if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 1 || number > 1000000000) {
      throw new Error('giá phải từ 1 đến 1.000.000.000 đồng, không có phần lẻ');
    }
    return number;
  }
  function hash(s) {
    let n = 2166136261;
    for (let i = 0; i < s.length; i++) { n ^= s.charCodeAt(i); n = Math.imul(n, 16777619); }
    return 'K_' + (n >>> 0).toString(36);
  }
  function validate(rows, options = {}) {
    if (!Array.isArray(rows)) throw new Error('Danh mục không đúng định dạng.');
    if (rows.length > MAX_ROWS) throw new Error('Danh mục tối đa 1.000 khoa.');
    const seen = new Map(), ids = new Set(), existing = new Map();
    (options.existing || []).forEach(w => existing.set(nameKey(w.name), w.id));
    const wards = [], errors = [];
    rows.forEach((row, index) => {
      const line = row.row || index + 2;
      const name = clean(row.name), emptyPrice = row.price == null || clean(row.price) === '';
      if (!name && emptyPrice) return;
      try {
        if (!name) throw new Error('thiếu tên khoa');
        if (typeof row.name !== 'string') throw new Error('tên khoa phải là văn bản');
        if (name.length > 100 || /[\x00-\x1f\x7f]/.test(String(row.name))) throw new Error('tên khoa không hợp lệ hoặc dài quá 100 ký tự');
        const key = nameKey(name);
        if (!key) throw new Error('thiếu tên khoa');
        if (seen.has(key)) throw new Error('trùng khoa “' + name + '” với dòng ' + seen.get(key));
        const amount = price(row.price, options.requiredPrices !== false);
        let id = row.id || existing.get(key) || hash(key);
        if (typeof id !== 'string' || id.length > 140 || !id || id === '__CAP_CUU__' || ids.has(id)) id = hash(key);
        if (ids.has(id)) throw new Error('mã khoa bị trùng');
        seen.set(key, line); ids.add(id);
        wards.push({id, name, price: amount});
      } catch (error) { errors.push('Dòng ' + line + ': ' + error.message + '.'); }
    });
    if (errors.length) throw new Error(errors.slice(0, 6).join('\n') + (errors.length > 6 ? '\nCòn ' + (errors.length - 6) + ' dòng lỗi.' : ''));
    if (!wards.length) throw new Error('Chưa có khoa nào trong danh mục.');
    return wards;
  }
  function load() {
    const base = root.NG_DEFAULT_CATALOG || {updatedAt: 0, wards: []};
    const result = {wards: clone(base.wards), source: 'shared', savedAt: base.updatedAt, error: ''};
    try {
      const raw = root.localStorage.getItem(KEY);
      if (!raw) return result;
      const saved = JSON.parse(raw);
      if (saved.schema !== 2 || !Number.isFinite(saved.savedAt)) throw new Error('sai định dạng');
      const wards = validate(saved.wards, {requiredPrices: false});
      // Bản đã lưu với cùng danh mục gốc vẫn dùng được khi đồng hồ máy bị sai.
      const currentBase = saved.baseRevision === base.updatedAt;
      const legacy = saved.baseRevision === undefined && saved.savedAt >= base.updatedAt;
      if (currentBase || legacy) return {wards, source: 'local', savedAt: saved.savedAt, error: ''};
      return result;
    } catch (error) {
      result.error = 'Không đọc được danh mục đã lưu; đang dùng danh mục mặc định. Có thể nhập lại Excel tại trang Danh mục.';
      return result;
    }
  }
  function save(rows) {
    const wards = validate(rows, {requiredPrices: true});
    const data = {schema: 2, baseRevision: (root.NG_DEFAULT_CATALOG || {}).updatedAt || 0, savedAt: Date.now(), wards};
    try { root.localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (error) { throw new Error('Trình duyệt không cho lưu danh mục. Hãy cho phép lưu dữ liệu website hoặc dùng trình duyệt thông thường.'); }
    return data;
  }
  function fromWorkbook(wb, existing) {
    if (!wb || !Array.isArray(wb.SheetNames) || wb.SheetNames.length !== 1) throw new Error('Tệp Excel phải có đúng 1 sheet.');
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error('Không đọc được sheet.');
    const cell = address => ws[address];
    const value = address => cell(address) && cell(address).v;
    const filled = c => c && (c.f || (c.v !== null && c.v !== undefined && clean(c.v) !== ''));
    const headersA = ['ten khoa', 'khoa'];
    const headersB = ['gia tien', 'don gia', 'gia giuong', 'gia tien (dong)', 'don gia (dong/ngay)', 'gia tien (dong/ngay)'];
    if (!headersA.includes(fold(value('A1'))) || !headersB.includes(fold(value('B1')))) {
      throw new Error('Hàng 1 cần có A1: tên khoa, B1: giá tiền. Dữ liệu bắt đầu từ hàng 2.');
    }
    let maxRow = 1;
    Object.keys(ws).forEach(address => {
      const m = /^([A-Z]+)([1-9]\d*)$/.exec(address);
      if (!m || !filled(ws[address])) return;
      if (m[1] !== 'A' && m[1] !== 'B') throw new Error('Chỉ nhận 2 cột A (tên khoa) và B (giá tiền). Có dữ liệu tại ô ' + address + '.');
      if (+m[2] > MAX_ROWS + 1) throw new Error('Danh mục tối đa 1.000 khoa.');
      if (ws[address].f) throw new Error('Ô ' + address + ' chứa công thức. Hãy dán giá trị vào Excel trước khi nhập.');
      if (ws[address].t === 'e' || ws[address].t === 'b' || ws[address].t === 'd') throw new Error('Ô ' + address + ' không đúng kiểu dữ liệu.');
      maxRow = Math.max(maxRow, +m[2]);
    });
    const rows = [];
    for (let r = 2; r <= maxRow; r++) rows.push({name: value('A' + r), price: value('B' + r), row: r});
    return validate(rows, {existing, requiredPrices: true});
  }
  function sharedFile(rows) {
    const wards = validate(rows);
    return '// Danh mục dùng chung cho ứng dụng Tính ngày giường.\n' +
      'globalThis.NG_DEFAULT_CATALOG = ' + JSON.stringify({updatedAt: Date.now(), wards}, null, 2)
        .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ';\n';
  }
  root.NG_CATALOG = {KEY, load, save, validate, price, fold, nameKey, fromWorkbook, sharedFile};
})(globalThis);
