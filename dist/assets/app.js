/* Building passport demo. No backend, no requests containing user data. */
(() => {
  'use strict';

  const PROJECT_ID = 'BS-1184';
  const PREFIX = `building-passport:${PROJECT_ID}:`;
  const EXPECTED_URL = 'https://building-passport.amirreza-riahi3311.chatgpt.site/';
  const ROLE_NAMES = ['ناظر سازه', 'ناظر معمار', 'ناظر مکانیک', 'ناظر برق', 'ناظر هماهنگ‌کننده', 'مجری', 'سرپرست پروژه'];
  const STAGES = ['اجرای اسکلت', 'فونداسیون', 'سفت‌کاری', 'تأسیسات', 'نازک‌کاری', 'پایان کار'];
  const OUTCOMES = ['مطابق ضوابط', 'نیاز به پیگیری'];
  let mapInstance = null;
  let expandedMap = null;
  let toastTimer = null;
  let draftTimer = null;

  const team = [
    { id: 'D1', role: 'طراح سازه', name: 'مهندس آرش رضایی', initials: 'آ ر', group: 'design', grade: 'پایه ۱ · پروانه', license: '101842' },
    { id: 'D2', role: 'طراح معمار', name: 'مهندس نازنین احمدی', initials: 'ن ا', group: 'design', grade: 'پایه ۱ · پروانه', license: '103576' },
    { id: 'D3', role: 'طراح برق', name: 'مهندس پویا کریمی', initials: 'پ ک', group: 'design', grade: 'پایه ۲ · پروانه', license: '107215' },
    { id: 'D4', role: 'طراح مکانیک', name: 'مهندس سارا محمدی', initials: 'س م', group: 'design', grade: 'پایه ۱ · پروانه', license: '106439' },
    { id: 'S1', role: 'ناظر سازه', name: 'مهندس مهدی کاظمی', initials: 'م ک', group: 'supervision', grade: 'پایه ۱ · پروانه', license: '102398' },
    { id: 'S2', role: 'ناظر معمار', name: 'مهندس مریم صادقی', initials: 'م ص', group: 'supervision', grade: 'پایه ۱ · پروانه', license: '105627' },
    { id: 'S3', role: 'ناظر مکانیک', name: 'مهندس علی موسوی', initials: 'ع م', group: 'supervision', grade: 'پایه ۲ · پروانه', license: '108164' },
    { id: 'S4', role: 'ناظر برق', name: 'مهندس امیر حسینی', initials: 'ا ح', group: 'supervision', grade: 'پایه ۲ · پروانه', license: '109052' },
    { id: 'S5', role: 'ناظر هماهنگ‌کننده', name: 'مهندس رضا شریفی', initials: 'ر ش', group: 'supervision', grade: 'پایه ۱ · پروانه', license: '104871' },
    { id: 'E1', role: 'مجری', name: 'شرکت سازه‌گستر آبان', initials: 'س آ', group: 'execution', grade: 'مجری حقوقی · مجوز', license: '204318' },
    { id: 'E2', role: 'سرپرست پروژه', name: 'مهندس فرهاد نادری', initials: 'ف ن', group: 'execution', grade: 'پایه ۱ · پروانه', license: '110593' },
    { id: 'X1', role: 'آزمایشگاه بتن', name: 'آزمایشگاه بتن آریا', initials: 'ب آ', group: 'specialists', grade: 'آزمایشگاه · مجوز', license: '301465' },
    { id: 'X2', role: 'آزمایشگاه مکانیک خاک', name: 'آزمایشگاه خاک پایدار', initials: 'خ پ', group: 'specialists', grade: 'آزمایشگاه · مجوز', license: '302174' },
    { id: 'X3', role: 'نقشه‌بردار', name: 'مهندس سینا مرادی', initials: 'س م', group: 'specialists', grade: 'پایه ۱ · پروانه', license: '111284' },
    { id: 'X4', role: 'ترافیک', name: 'مهندس نیلوفر بهرامی', initials: 'ن ب', group: 'specialists', grade: 'پایه ۲ · پروانه', license: '112693' },
    { id: 'X5', role: 'شهرساز', name: 'مهندس پیمان رستمی', initials: 'پ ر', group: 'specialists', grade: 'پایه ۱ · پروانه', license: '113748' },
  ];

  const seedReports = [
    { id: 'R-004', code: 'RPT–004', title: 'بازدید از اجرای اسکلت طبقه سوم', role: 'ناظر سازه', author: 'مهندس مهدی کاظمی', kind: 'supervisor', date: '2026-10-10T09:00:00+03:30', stage: 'اجرای اسکلت', status: 'نیاز به پیگیری', outcome: 'نیاز به پیگیری', body: 'در بازدید از طبقه سوم، چیدمان ستون‌ها و اتصالات اجراشده بررسی شد.\n\n۱. تطابق جانمایی ستون‌ها با نقشه سازه کنترل شد.\n۲. تکمیل مستندات کنترل جوش چند اتصال باقی‌مانده به مجری اعلام شد.\n۳. پیش از ادامه عملیات، تصاویر و گزارش کنترل اتصالات برای ناظر ارسال شود.\n\nاین متن صرفاً گزارش نمونه برای نمایش رابط کاربری است.' },
    { id: 'R-003', code: 'RPT–003', title: 'گزارش پیشرفت عملیات اجرایی', role: 'مجری', author: 'شرکت سازه‌گستر آبان', kind: 'executor', date: '2026-10-08T13:20:00+03:30', stage: 'اجرای اسکلت', status: 'ثبت‌شده', outcome: 'مطابق ضوابط', body: 'عملیات اجرایی ستون‌های طبقه دوم و آماده‌سازی قالب‌بندی سقف انجام شد.\n\nبرنامه کارگاه برای بازدید ناظر هماهنگ‌کننده تنظیم شده و مدارک مصالح مصرفی در پرونده کارگاه قرار گرفته است.\n\nفهرست فعالیت‌های این بازدید:\n• کنترل مسیرهای دسترسی کارگاه\n• تکمیل آماده‌سازی قالب‌ها\n• هماهنگی نمونه‌برداری بتن سقف\n\nاین متن یک گزارش نمایشی است.' },
    { id: 'R-002', code: 'RPT–002', title: 'کنترل جانمایی فضاها و ابعاد بازشوها', role: 'ناظر معمار', author: 'مهندس مریم صادقی', kind: 'supervisor', date: '2026-10-06T10:15:00+03:30', stage: 'اجرای اسکلت', status: 'بررسی شده', outcome: 'مطابق ضوابط', body: 'جانمایی فضاها، ابعاد بازشوها و مسیر پله مطابق نقشه‌های نمونه بررسی شد.\n\nموارد بررسی‌شده:\n۱. ابعاد و جانمایی راه‌پله\n۲. جانمایی بازشوهای تأسیساتی\n۳. ارتباط فضاهای عمومی طبقات\n\nنتیجه ثبت‌شده بازدید: مطابق ضوابط.\n\nتمام اطلاعات این گزارش برای نمایش دمو تهیه شده‌اند.' },
    { id: 'R-001', code: 'RPT–001', title: 'گزارش هماهنگی ناظرین و بازدید کارگاه', role: 'ناظر هماهنگ‌کننده', author: 'مهندس رضا شریفی', kind: 'supervisor', date: '2026-10-04T09:30:00+03:30', stage: 'فونداسیون', status: 'بررسی شده', outcome: 'مطابق ضوابط', body: 'جلسه هماهنگی ناظرین سازه، معماری، برق و مکانیک با حضور مجری برگزار شد.\n\nبرنامه بازدیدهای دوره‌ای ثبت و نحوه ارسال مدارک آزمایشگاه به عوامل پروژه مشخص شد. جانمایی اولیه مسیرهای عبور تأسیسات برای کنترل در مرحله بعدی در دستور کار قرار گرفت.\n\nاین گزارش صرفاً نمونه است.' },
  ];

  const labs = [
    { id: 'LAB-01', code: 'LAB–001', title: 'آزمایش مقاومت فشاری بتن', author: 'آزمایشگاه بتن آریا', date: '2026-10-07T09:00:00+03:30', testType: 'مقاومت فشاری ۲۸ روزه', result: 'نتیجه نمونه ثبت‌شده', metricLabel: 'میانگین مقاومت ۲۸ روزه', metricValue: '۳۴٫۲', metricUnit: 'MPa', body: 'شناسه نمونه: C–1405–071\nمحل نمونه‌برداری: سقف طبقه دوم\nتاریخ نمونه‌برداری: ۱۸ شهریور ۱۴۰۵\nسن نمونه‌ها: ۲۸ روز\n\nمقادیر نمایشی مقاومت فشاری:\nنمونه اول: ۳۳٫۸ مگاپاسکال\nنمونه دوم: ۳۴٫۵ مگاپاسکال\nنمونه سوم: ۳۴٫۳ مگاپاسکال\nمیانگین: ۳۴٫۲ مگاپاسکال\n\nاین مقادیر فرضی هستند؛ نتیجه واقعی یا تأیید فنی یک ساختمان محسوب نمی‌شوند.' },
    { id: 'LAB-02', code: 'LAB–002', title: 'گزارش مکانیک خاک', author: 'آزمایشگاه خاک پایدار', date: '2026-10-02T09:00:00+03:30', testType: 'مطالعات ژئوتکنیک', result: 'نتیجه نمونه ثبت‌شده', metricLabel: 'عمق گمانه نمونه', metricValue: '۱۵', metricUnit: 'متر', body: 'شناسه مطالعه: G–1405–028\nمحل مطالعه: زمین پروژه بهشتی\nتعداد گمانه: ۳ گمانه نمونه\nعمق گمانه: ۱۵ متر\n\nبخش‌های گزارش نمونه:\n۱. معرفی محل و مشخصات زمین\n۲. شرح عملیات گمانه‌زنی\n۳. نتایج دانه‌بندی و حدود اتربرگ\n۴. ثبت تراز آب زیرزمینی\n۵. جمع‌بندی مطالعات\n\nاین سند برای نمایش رابط کاربری است و توصیه طراحی یا داده ژئوتکنیکی واقعی ارائه نمی‌کند.' },
  ];

  const letters = [
    { id: 'L-03', number: '۱۴۰۵/۳۱۸', title: 'درخواست بازدید مرحله‌ای اسکلت', author: 'واحد کنترل نظارت', recipient: 'ناظر هماهنگ‌کننده', subject: 'هماهنگی بازدید', date: '2026-10-09T09:00:00+03:30', body: 'ناظر هماهنگ‌کننده محترم پروژه بهشتی\n\nبا سلام،\nخواهشمند است زمان بازدید مرحله‌ای اسکلت ساختمان با ناظرین مرتبط و مجری هماهنگ شود. گزارش بازدید و موارد قابل پیگیری پس از انجام بازدید در پرونده پروژه درج گردد.\n\nواحد کنترل نظارت\n\nاین نامه نمونه و فاقد اعتبار اداری است.' },
    { id: 'L-02', number: '۱۴۰۵/۲۹۴', title: 'ارسال نتایج آزمایش بتن سقف', author: 'آزمایشگاه بتن آریا', recipient: 'ناظر سازه و واحد کنترل نظارت', subject: 'نتایج آزمایش بتن', date: '2026-10-07T09:00:00+03:30', body: 'ناظر سازه محترم پروژه بهشتی\n\nبا سلام،\nنتایج نمونه‌های آزمایش بتن سقف طبقه دوم با شناسه C–1405–071 جهت درج در پرونده پروژه و بررسی به پیوست پرونده آزمایشگاه ارائه شده است.\n\nآزمایشگاه بتن آریا\n\nاین متن نمونه است؛ پیوست واقعی برای آن وجود ندارد.' },
    { id: 'L-01', number: '۱۴۰۵/۲۶۷', title: 'معرفی عوامل طراحی و نظارت پروژه', author: 'مدیریت پروژه', recipient: 'واحد کنترل نظارت', subject: 'معرفی عوامل پروژه', date: '2026-09-28T09:00:00+03:30', body: 'واحد محترم کنترل نظارت\n\nبا سلام،\nاطلاعات عوامل طراحی، نظارت، اجرا و خدمات تخصصی پروژه بهشتی جهت ثبت در شناسنامه ساختمان ارائه شده است. مشخصات کامل این عوامل در بخش اطلاعات عمومی پروژه در دسترس است.\n\nمدیریت پروژه بهشتی\n\nاین نامه صرفاً جهت نمایش دمو تهیه شده است.' },
  ];

  function normalizeDigits(value) {
    return String(value ?? '').replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
  }

  function normalizePhone(value) {
    let phone = normalizeDigits(value).replace(/[\s()-]/g, '');
    if (phone.startsWith('+98')) phone = '0' + phone.slice(3);
    else if (phone.startsWith('0098')) phone = '0' + phone.slice(4);
    else if (phone.startsWith('98') && phone.length === 12) phone = '0' + phone.slice(2);
    return /^09\d{9}$/.test(phone) ? phone : '';
  }

  function readStore(key, fallback) {
    try { const value = localStorage.getItem(PREFIX + key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  }

  function validLocalReports(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(r => r && typeof r.id === 'string' && r.id.startsWith('LOCAL-') && typeof r.title === 'string' && typeof r.body === 'string' && ROLE_NAMES.includes(r.role) && normalizePhone(r.ownerPhone) && !Number.isNaN(Date.parse(r.date)))
      .map(r => ({ id: r.id.slice(0,100), code: String(r.code || '').slice(0,35), title: r.title.slice(0,100), body: r.body.slice(0,4000), role: r.role, kind: ['مجری','سرپرست پروژه'].includes(r.role) ? 'executor' : 'supervisor', ownerPhone: normalizePhone(r.ownerPhone), date: r.date, stage: STAGES.includes(r.stage) ? r.stage : STAGES[0], status: r.outcome === OUTCOMES[1] ? OUTCOMES[1] : 'ثبت‌شده', outcome: OUTCOMES.includes(r.outcome) ? r.outcome : OUTCOMES[0], author: 'کارشناس پروژه' }));
  }

  function blankDraft() { return { title: '', role: '', stage: STAGES[0], body: '', outcome: OUTCOMES[0] }; }

  function validDraft(value) {
    if (!value || typeof value !== 'object') return blankDraft();
    return { title: typeof value.title === 'string' ? value.title.slice(0,100) : '', role: ROLE_NAMES.includes(value.role) ? value.role : '', stage: STAGES.includes(value.stage) ? value.stage : STAGES[0], body: typeof value.body === 'string' ? value.body.slice(0,4000) : '', outcome: OUTCOMES.includes(value.outcome) ? value.outcome : OUTCOMES[0] };
  }

  function hydrateIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }

  function reducedMotion() { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }

  function animateCards() {
    if (window.Motion?.animate && !reducedMotion()) {
      window.Motion.animate('#team .person-card', { opacity: [0.5, 1], y: [6, 0] }, { duration: 0.25, ease: 'easeOut' });
    }
  }

  function setupAnimations() {
    if (!window.Motion?.animate || reducedMotion()) return;
    const { animate, inView } = window.Motion;
    document.querySelectorAll('[data-intro]').forEach((el, i) => animate(el, { opacity: [0, 1], y: [15, 0] }, { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }));
    document.querySelectorAll('[data-float]').forEach((el, i) => animate(el, { y: [0, -5, 0] }, { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }));
    if (inView) document.querySelectorAll('[data-reveal]').forEach(el => inView(el, () => { animate(el, { opacity: [0,1], y: [15,0] }, { duration: 0.55, ease: [0.22,1,0.36,1] }); }, { margin: '0px 0px -25px 0px' }));
  }

  function setupMap(component) {
    if (mapInstance) return;
    if (!window.ProjectMap) { component.mapConnection = 'unavailable'; return; }
    mapInstance = window.ProjectMap.create('project-map', { onStatus: status => { if (component.modal !== 'map') component.mapConnection = status; } });
  }

  window.buildingPortal = () => ({
    view: 'public', modal: '', activeSection: 'building', team, labs, letters,
    teamGroups: [{ id:'all',label:'همه عوامل' },{ id:'design',label:'طراحی' },{ id:'supervision',label:'نظارت' },{ id:'execution',label:'اجرا' },{ id:'specialists',label:'خدمات تخصصی' }],
    teamGroup: 'all', teamSearch: '', controlTab: 'reports', reportFilter: 'all', reportSearch: '',
    phone: '', phoneInput: '', phoneError: '', reports: [...seedReports], reportRoles: ROLE_NAMES,
    draft: blankDraft(), formErrors: {}, draftState: '', hasDraft: false, submitting: false,
    toastMessage: '', selectedDocument: null, documentKind: '', qrImage: '', mapConnection: 'loading',
    publicUrl: window.location.protocol.startsWith('http') ? new URL('./', window.location.href).href : EXPECTED_URL,

    init() {
      this.phone = normalizePhone(readStore('session', ''));
      this.loadReports();
      this.loadDraft();
      this.$watch('teamGroup', () => this.$nextTick(() => animateCards()));
      this.$watch('teamSearch', () => this.$nextTick(() => animateCards()));
      this.$watch('reportFilter', () => this.$nextTick(hydrateIcons));
      this.$watch('reportSearch', () => this.$nextTick(hydrateIcons));
      this.$watch('reports', () => this.$nextTick(hydrateIcons));
      this.$nextTick(() => {
        hydrateIcons(); setupMap(this); setupAnimations();
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(entries => {
            if (this.view !== 'public') return;
            entries.forEach(entry => { if (entry.isIntersecting) this.activeSection = entry.target.id; });
          }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
          ['building','team','location'].forEach(id => observer.observe(document.getElementById(id)));
        }
      });
      window.addEventListener('storage', event => { if (event.key === PREFIX + 'reports') this.loadReports(); });
    },

    fa(value) { return String(value ?? '').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]); },
    dateFa(value) { if (!value || Number.isNaN(Date.parse(value))) return '—'; return new Date(value).toLocaleDateString('fa-IR', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Tehran' }); },
    normalize(value) { return String(value).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').toLowerCase().trim(); },
    get filteredTeam() { const q = this.normalize(this.teamSearch); return this.team.filter(p => (this.teamGroup === 'all' || p.group === this.teamGroup) && this.normalize(p.role + ' ' + p.name).includes(q)); },
    get filteredReports() { const q = this.normalize(this.reportSearch); return this.reports.filter(r => (this.reportFilter === 'all' || this.reportFilter === r.kind || (this.reportFilter === 'mine' && r.ownerPhone === this.phone)) && this.normalize(r.title + ' ' + r.role + ' ' + (r.author || '')).includes(q)); },
    statusClass(status) { return status === 'بررسی شده' ? 'status-reviewed' : status === 'نیاز به پیگیری' ? 'status-attention' : 'status-new'; },
    clearReportFilters() { this.reportFilter = 'all'; this.reportSearch = ''; },
    loadReports() { this.reports = [...validLocalReports(readStore('reports', [])), ...seedReports].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)); },

    notify(message) { clearTimeout(toastTimer); this.toastMessage = message; toastTimer = setTimeout(() => { this.toastMessage = ''; },4500); },
    navigateTo(id) { this.activeSection = id; document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); },
    goPublic(id = 'building') { this.closeModal(); this.view = 'public'; this.$nextTick(() => { mapInstance?.refresh(); this.navigateTo(id); }); },
    enterControl() { if (this.phone) this.showControl(); else { this.phoneInput = ''; this.phoneError = ''; this.modal = 'login'; this.$nextTick(() => setTimeout(() => this.$refs.phoneInput?.focus(),60)); } },
    showControl() { this.view = 'control'; this.modal = ''; this.$nextTick(() => { window.scrollTo({ top:0, behavior:'auto' }); hydrateIcons(); }); },
    login() {
      const phone = normalizePhone(this.phoneInput);
      if (!phone) { this.phoneError = 'شماره موبایل معتبر ۱۱ رقمی وارد کنید؛ مانند ۰۹۱۲۳۴۵۶۷۸۹.'; this.$refs.phoneInput?.focus(); return; }
      try { localStorage.setItem(PREFIX + 'session', JSON.stringify(phone)); }
      catch { this.notify('ذخیره ورود ممکن نیست؛ پنل در همین نشست باز می‌شود.'); }
      this.phone = phone; this.loadDraft(); this.showControl();
    },
    logout() { if (this.modal === 'report') this.saveDraft(); try { localStorage.removeItem(PREFIX + 'session'); } catch {} this.phone = ''; this.draft = blankDraft(); this.hasDraft = false; this.goPublic(); this.notify('از پنل کارشناسی خارج شدید.'); },
    setControlTab(tab) { this.controlTab = tab; this.$nextTick(hydrateIcons); },
    focusControlTab(tab) { this.setControlTab(tab); this.$nextTick(() => document.getElementById(tab + '-tab')?.focus()); },
    cycleControlTab(direction) { const tabs = ['reports','labs','letters']; this.focusControlTab(tabs[(tabs.indexOf(this.controlTab) + direction + tabs.length) % tabs.length]); },
    closeModal() { if (this.submitting) return; if (this.modal === 'report') { clearTimeout(draftTimer); this.saveDraft(); } if (this.modal === 'map') { expandedMap?.destroy(); expandedMap = null; this.mapConnection = mapInstance?.status || 'unavailable'; } this.modal = ''; },

    loadDraft() { this.draft = this.phone ? validDraft(readStore('draft:' + this.phone, null)) : blankDraft(); this.hasDraft = !!(this.draft.title || this.draft.body); this.draftState = this.hasDraft ? 'پیش‌نویس قبلی بازیابی شد' : ''; },
    openReportForm() { if (!this.phone) { this.enterControl(); return; } this.loadDraft(); this.formErrors = {}; this.submitting = false; this.modal = 'report'; this.$nextTick(() => setTimeout(() => this.$refs.reportTitle?.focus(),60)); },
    saveDraft() {
      if (!this.phone || this.submitting) return;
      const hasContent = !!(this.draft.title.trim() || this.draft.body.trim() || this.draft.role);
      try { if (hasContent) localStorage.setItem(PREFIX + 'draft:' + this.phone, JSON.stringify(this.draft)); else localStorage.removeItem(PREFIX + 'draft:' + this.phone); this.hasDraft = hasContent; this.draftState = hasContent ? 'پیش‌نویس ذخیره شد' : ''; }
      catch { this.draftState = 'ذخیره پیش‌نویس در این مرورگر ممکن نیست'; }
    },
    submitReport() {
      if (!this.phone || this.submitting) return;
      this.formErrors = {};
      if (this.draft.title.trim().length < 3) this.formErrors.title = 'عنوان گزارش را با حداقل ۳ کاراکتر بنویسید.';
      if (!ROLE_NAMES.includes(this.draft.role)) this.formErrors.role = 'سمت خود را انتخاب کنید.';
      if (this.draft.body.trim().length < 10) this.formErrors.body = 'شرح گزارش را با حداقل ۱۰ کاراکتر بنویسید.';
      if (Object.keys(this.formErrors).length) { this.$nextTick(() => document.querySelector('#report-form-title')?.closest('section').querySelector('[aria-invalid="true"]')?.focus()); return; }
      this.submitting = true;
      const date = new Date().toISOString();
      const random = window.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const local = validLocalReports(readStore('reports', []));
      const code = 'RPT–' + String(Date.now()).slice(-6);
      const report = { id:'LOCAL-' + random, code, title:this.draft.title.trim().slice(0,100), role:this.draft.role, author:'کارشناس پروژه', kind:['مجری','سرپرست پروژه'].includes(this.draft.role) ? 'executor' : 'supervisor', date, stage:STAGES.includes(this.draft.stage) ? this.draft.stage : STAGES[0], status:this.draft.outcome === OUTCOMES[1] ? OUTCOMES[1] : 'ثبت‌شده', outcome:this.draft.outcome, body:this.draft.body.trim().slice(0,4000), ownerPhone:this.phone };
      try { localStorage.setItem(PREFIX + 'reports', JSON.stringify([report,...local])); }
      catch { this.submitting = false; this.formErrors.storage = 'گزارش ذخیره نشد. فضای ذخیره مرورگر پر یا غیرفعال است؛ متن گزارش شما حفظ شده است.'; return; }
      try { localStorage.removeItem(PREFIX + 'draft:' + this.phone); } catch {}
      this.loadReports(); this.draft = blankDraft(); this.hasDraft = false; this.draftState = ''; this.controlTab = 'reports'; this.reportFilter = 'all'; this.reportSearch = ''; this.submitting = false; this.modal = '';
      this.$nextTick(hydrateIcons); this.notify('گزارش بازدید شما با موفقیت ثبت شد.');
    },

    openDocument(doc,kind) { if (!this.phone) return; this.selectedDocument = doc; this.documentKind = kind; this.modal = 'document'; },
    downloadDocument() {
      const doc = this.selectedDocument; if (!doc || !this.phone) return;
      const text = ['شناسنامه ساختمان — پروژه نمونه بهشتی', 'شناسه پروژه: BS–1405–1184', 'عنوان: ' + doc.title, 'شماره: ' + (doc.number || doc.code), 'تاریخ: ' + this.dateFa(doc.date), 'ثبت‌کننده: ' + (doc.author || doc.role), 'سمت: ' + (doc.role || '—'), '', doc.body, '', 'این فایل مربوط به نسخه نمایشی است و اعتبار اجرایی یا اداری ندارد.'].join('\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF',text], { type:'text/plain;charset=utf-8' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `building-${doc.id.replace(/[^a-zA-Z0-9-]/g,'')}.txt`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); this.notify('نسخه متنی مدرک آماده دریافت است.');
    },
    openQr() { const qr = window.qrcode(0,'M'); qr.addData(this.publicUrl); qr.make(); this.qrImage = qr.createDataURL(5,0); this.modal = 'qr'; },
    async copyProjectLink() {
      try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(this.publicUrl); else { const input = document.createElement('textarea'); input.value = this.publicUrl; input.style.position='fixed'; input.style.opacity='0'; document.body.appendChild(input); input.select(); const result = document.execCommand('copy'); input.remove(); if (!result) throw new Error('copy failed'); } this.notify('لینک شناسنامه ساختمان کپی شد.'); }
      catch { this.notify('کپی خودکار ممکن نشد؛ لینک نمایش‌داده‌شده را انتخاب کنید.'); }
    },
    get mapStatusLabel() { return ({loading:'در حال اتصال به نقشه',osm:'نقشه آنلاین',offline:'اتصال نقشه برقرار نشد',partial:'بارگیری ناقص نقشه',unavailable:'نقشه در دسترس نیست'})[this.mapConnection] || 'موقعیت پروژه'; },
    get mapHasError() { return ['offline','partial','unavailable'].includes(this.mapConnection); },
    get mapErrorMessage() { return this.mapConnection === 'partial' ? 'بخشی از نقشه بارگیری نشد؛ دوباره تلاش کنید.' : 'برای نمایش نقشه، اتصال اینترنت را بررسی کنید یا مسیریابی را باز کنید.'; },
    openMap() { if (expandedMap) return; this.modal = 'map'; this.mapConnection = 'loading'; this.$nextTick(() => { if (this.modal !== 'map' || expandedMap) return; expandedMap = window.ProjectMap?.create('expanded-project-map', { expanded:true, onStatus:status => { this.mapConnection = status; } }); if (!expandedMap) this.mapConnection = 'unavailable'; hydrateIcons(); }); },
    recenterMap() { (this.modal === 'map' ? expandedMap : mapInstance)?.recenter(); },
    retryMap() { const controller = this.modal === 'map' ? expandedMap : mapInstance; if (controller) controller.retry(); else if (this.modal === 'map') this.openMap(); else setupMap(this); },
  });

  document.addEventListener('alpine:init', () => { window.Alpine.data('buildingPortal', window.buildingPortal); });
})();
