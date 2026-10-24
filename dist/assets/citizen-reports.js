/* Browser-local public reports. No login, network submission or expert referral. */
(() => {
  'use strict';
  const MAX_PHOTOS = 3;
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_DATA_LENGTH = 350000;
  const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const blankDraft = () => ({ type: 'violation', title: '', body: '', images: [] });
  const hydrateIcons = () => window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' } });

  function validImages(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(image => image && typeof image.url === 'string' && image.url.length <= MAX_DATA_LENGTH &&
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.url))
      .slice(0, MAX_PHOTOS).map((image, index) => ({
        id: String(image.id || 'photo-' + index).slice(0, 80),
        name: String(image.name || 'عکس گزارش').slice(0, 80), url: image.url,
      }));
  }

  function validDraft(value) {
    const draft = value && typeof value === 'object' ? value : {};
    return {
      type: draft.type === 'praise' ? 'praise' : 'violation',
      title: typeof draft.title === 'string' ? draft.title.slice(0, 100) : '',
      body: typeof draft.body === 'string' ? draft.body.slice(0, 4000) : '',
      images: validImages(draft.images),
    };
  }

  function validReports(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(report => report && typeof report.id === 'string' && report.id.startsWith('CITIZEN-') &&
      ['violation', 'praise'].includes(report.type) && typeof report.title === 'string' && typeof report.body === 'string' &&
      typeof report.date === 'string' && !Number.isNaN(Date.parse(report.date)))
      .map(report => ({
        ...validDraft(report), id: report.id.slice(0, 100), code: String(report.code || '').slice(0, 40), date: report.date,
      }));
  }

  async function preparePhoto(file) {
    const source = URL.createObjectURL(file);
    try {
      const picture = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('این فایل به‌عنوان عکس قابل خواندن نیست.'));
        image.src = source;
      });
      if (!picture.naturalWidth || !picture.naturalHeight || picture.naturalWidth * picture.naturalHeight > 40000000) {
        throw new Error('ابعاد عکس بیش از حد بزرگ است؛ عکس کوچک‌تری انتخاب کنید.');
      }
      const scale = Math.min(1, 1280 / Math.max(picture.naturalWidth, picture.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(picture.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(picture.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('پردازش عکس در این مرورگر ممکن نیست.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      let url = canvas.toDataURL('image/jpeg', 0.76);
      if (url.length > MAX_DATA_LENGTH) url = canvas.toDataURL('image/jpeg', 0.48);
      if (url.length > MAX_DATA_LENGTH || !url.startsWith('data:image/jpeg;base64,')) {
        throw new Error('حجم این عکس برای ذخیره محلی زیاد است؛ عکس کوچک‌تری انتخاب کنید.');
      }
      return { id: 'IMG-' + (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), name: file.name.slice(0, 80), url };
    } finally { URL.revokeObjectURL(source); }
  }

  window.buildingCitizenReports = prefix => {
    const readStore = (key, fallback) => {
      try { const value = localStorage.getItem(prefix + key); return value ? JSON.parse(value) : fallback; }
      catch { return fallback; }
    };
    return {
      citizenReports: [], citizenDraft: blankDraft(), citizenErrors: {}, citizenReceipt: null, citizenRecord: null,
      citizenSubmitting: false, citizenDraftState: '', citizenUploadBusy: false, citizenUploadToken: 0,
      citizenPhotoError: '', citizenPhotoPreview: null,

      initCitizenReports() {
        this.loadCitizenReports();
        window.addEventListener('storage', event => {
          if (event.key === prefix + 'citizen-reports' || event.key === null) this.loadCitizenReports();
        });
      },
      citizenType(type) { return type === 'praise' ? 'گزارش تشویقی' : 'گزارش تخلف'; },
      loadCitizenReports() {
        this.citizenReports = validReports(readStore('citizen-reports', [])).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        this.$nextTick(hydrateIcons);
      },
      openCitizenForm() {
        this.closeModal();
        this.citizenDraft = validDraft(readStore('citizen-draft', this.citizenDraft));
        this.citizenErrors = {}; this.citizenReceipt = null; this.citizenPhotoError = '';
        this.citizenDraftState = this.citizenDraft.title || this.citizenDraft.body || this.citizenDraft.images.length ? 'پیش‌نویس قبلی بازیابی شد' : '';
        this.modal = 'citizen';
        this.$nextTick(() => { hydrateIcons(); setTimeout(() => this.$refs.citizenTitle?.focus(), 60); });
      },
      saveCitizenDraft() {
        if (this.citizenSubmitting || this.citizenReceipt || this.modal !== 'citizen') return;
        const draft = validDraft(this.citizenDraft);
        const hasContent = draft.title.trim() || draft.body.trim() || draft.images.length;
        try {
          if (hasContent) localStorage.setItem(prefix + 'citizen-draft', JSON.stringify(draft));
          else localStorage.removeItem(prefix + 'citizen-draft');
          this.citizenDraftState = hasContent ? 'پیش‌نویس در همین مرورگر ذخیره شد' : '';
        } catch { this.citizenDraftState = 'ذخیره پیش‌نویس ممکن نیست؛ فرم را تا پایان ثبت باز نگه دارید.'; }
      },
      closeCitizenState() {
        if (this.modal === 'citizen') this.saveCitizenDraft();
        this.citizenUploadToken++; this.citizenUploadBusy = false;
        this.citizenPhotoError = ''; this.citizenPhotoPreview = null;
      },
      submitCitizenReport() {
        if (this.citizenSubmitting || this.citizenUploadBusy || this.modal !== 'citizen') return;
        this.citizenErrors = {};
        if (!['violation', 'praise'].includes(this.citizenDraft.type)) this.citizenErrors.type = 'نوع گزارش را انتخاب کنید.';
        if (this.citizenDraft.title.trim().length < 3) this.citizenErrors.title = 'عنوان گزارش را با حداقل ۳ کاراکتر بنویسید.';
        if (this.citizenDraft.body.trim().length < 10) this.citizenErrors.body = 'متن گزارش را با حداقل ۱۰ کاراکتر بنویسید.';
        if (Object.keys(this.citizenErrors).length) {
          this.$nextTick(() => document.getElementById('citizen-form')?.querySelector('[aria-invalid="true"]')?.focus()); return;
        }
        this.citizenSubmitting = true;
        const report = {
          ...validDraft(this.citizenDraft), title: this.citizenDraft.title.trim(), body: this.citizenDraft.body.trim(),
          id: 'CITIZEN-' + (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
          code: 'PUB–' + String(Date.now()).slice(-8), date: new Date().toISOString(),
        };
        try { localStorage.setItem(prefix + 'citizen-reports', JSON.stringify([report, ...validReports(readStore('citizen-reports', []))])); }
        catch {
          this.citizenSubmitting = false;
          this.citizenErrors.storage = 'گزارش ذخیره نشد؛ فضای مرورگر پر یا غیرفعال است. متن و عکس‌های شما در فرم حفظ شده‌اند.'; return;
        }
        try { localStorage.removeItem(prefix + 'citizen-draft'); } catch {}
        this.loadCitizenReports(); this.citizenReceipt = report; this.citizenDraft = blankDraft(); this.citizenDraftState = '';
        this.citizenSubmitting = false;
        this.$nextTick(() => { hydrateIcons(); this.$refs.citizenReceipt?.focus(); });
      },
      openCitizenRecord(report) {
        this.closeModal(); this.citizenRecord = report; this.modal = 'citizen-record'; this.$nextTick(hydrateIcons);
      },
      async uploadCitizenPhotos(event) {
        const input = event.target;
        const files = Array.from(input.files || []);
        if (!files.length || this.citizenUploadBusy || this.modal !== 'citizen') return;
        this.citizenPhotoError = '';
        if (this.citizenDraft.images.length + files.length > MAX_PHOTOS) { this.citizenPhotoError = 'برای هر گزارش حداکثر ۳ عکس انتخاب کنید.'; input.value = ''; return; }
        if (files.some(file => !PHOTO_TYPES.includes(file.type))) { this.citizenPhotoError = 'فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.'; input.value = ''; return; }
        if (files.some(file => file.size > MAX_FILE_BYTES)) { this.citizenPhotoError = 'حجم هر عکس باید حداکثر ۸ مگابایت باشد.'; input.value = ''; return; }
        const token = ++this.citizenUploadToken;
        const draft = this.citizenDraft;
        this.citizenUploadBusy = true;
        try {
          const images = [];
          for (const file of files) {
            images.push(await preparePhoto(file));
            if (token !== this.citizenUploadToken) return;
          }
          draft.images = [...draft.images, ...images];
          this.saveCitizenDraft();
        } catch (error) { if (token === this.citizenUploadToken) this.citizenPhotoError = error.message || 'بارگذاری عکس انجام نشد؛ دوباره تلاش کنید.'; }
        finally { input.value = ''; if (token === this.citizenUploadToken) this.citizenUploadBusy = false; }
      },
      removeCitizenPhoto(id) {
        if (this.citizenUploadBusy) return;
        this.citizenDraft.images = this.citizenDraft.images.filter(photo => photo.id !== id);
        this.citizenPhotoError = ''; this.saveCitizenDraft();
      },
    };
  };
})();
