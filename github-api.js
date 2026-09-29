/**
 * Adapter để giao diện Apps Script cũ chạy trực tiếp trên GitHub Pages.
 * Tính toán bằng NG_ENGINE; chức năng Lưu dùng localStorage của trình duyệt.
 */
'use strict';

(function () {
  var STORAGE_KEY = 'ng_bhyt_saved_v1';
  var MAX_ITEMS = 500;

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal(input, requestId) {
    if (!/^[A-Za-z0-9_-]{12,80}$/.test(String(requestId || ''))) {
      throw new Error('Mã lần lưu không hợp lệ. Tải lại trang và thử lại.');
    }
    var items = loadSaved();
    var existing = items.find(function (x) { return x && x.id === requestId; });
    if (existing) {
      return { id: requestId, alreadySaved: true, sheetUrl: null, result: existing.result || null };
    }
    var result = globalThis.NG_ENGINE.calculate(input);
    items.unshift({
      id: requestId,
      savedAt: new Date().toISOString(),
      input: input,
      result: result
    });
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      throw new Error('Không thể lưu trên trình duyệt. Có thể bộ nhớ trình duyệt đã đầy hoặc chế độ riêng tư đang chặn lưu cục bộ.');
    }
    return { id: requestId, alreadySaved: false, sheetUrl: null, result: result };
  }

  globalThis.NG_PREVIEW_API = function (name, args) {
    if (!globalThis.NG_ENGINE) throw new Error('Không tải được engine.js.');
    args = Array.isArray(args) ? args : [];
    if (name === 'layCauHinh') return globalThis.NG_ENGINE.config();
    if (name === 'tinhNgayGiuong') return globalThis.NG_ENGINE.calculate(args[0]);
    if (name === 'luuKetQua') return saveLocal(args[0], args[1]);
    throw new Error('Hàm không được hỗ trợ trên GitHub Pages: ' + name);
  };

  globalThis.NG_LOCAL_STORE = {
    list: loadSaved,
    clear: function () { localStorage.removeItem(STORAGE_KEY); }
  };
})();
