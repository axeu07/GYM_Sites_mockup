/* Fitness Solutions — Direction B "The Academy".
   Renders the 2026–27 prospectus from window.FS and wires: the admit-card generator, the course
   catalogue, the yearbook (pinned on desktop, swipeable on touch), the EN/हिं toggle, dialogs and motion. */
(() => {
  const FS = window.FS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HAS_GSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  root.classList.add("js");
  if (RM) root.classList.add("rm");
  if (!FS) { root.classList.add("intro-seen"); return; }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const srcset = (k) => `${FS.img(k, true)} 800w, ${FS.img(k)} 1600w`;
  const roman = (n) => [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const YEARS = FS.brand.years;
  const WORDS = { 15: ["Fifteen", "पंद्रह"], 16: ["Sixteen", "सोलह"], 17: ["Seventeen", "सत्रह"], 18: ["Eighteen", "अठारह"], 19: ["Nineteen", "उन्नीस"], 20: ["Twenty", "बीस"] };
  const YW = WORDS[YEARS] || [String(YEARS), String(YEARS)];
  const TAG = (kind) => kind === "confirm"
    ? '<span class="tag tag--confirm" data-i18n="tag.confirm">To confirm</span>'
    : '<span class="tag tag--sample" data-i18n="tag.sample">Illustrative</span>';

  /* =========================================================================
     i18n — EN text lives in the DOM; HI replaces it. Dynamic strings use t().
     ========================================================================= */
  let LANG = root.lang === "hi" ? "hi" : "en";
  const HI = {
    "brand.tag": "एक संपूर्ण फ़िटनेस अकादमी",
    "nav.history": "इतिहास", "nav.curriculum": "पाठ्यक्रम", "nav.faculty": "प्रशिक्षक", "nav.campus": "कैंपस", "nav.fees": "शुल्क", "nav.apply": "आवेदन",
    "toc.title": "विषय-सूची", "toc.inside": "इस विवरणिका में",
    "cta.apply": "प्रवेश के लिए आवेदन करें", "cta.tour": "कैंपस टूर बुक करें",
    "cover.prospectus": "विवरणिका 2026–27", "cover.place": "लक्ष्मण चौक, देहरादून", "cover.est": "स्थापना 2009",
    "hero.title1": "प्रवेश", "hero.title2": '<em class="hl hl--draw">शुरू हैं।</em>',
    "hero.deck": `${YW[1]} वर्षों से देहरादून को ट्रेनिंग सिखाते हुए।`,
    "hero.lede": "लक्ष्मण चौक पर चार मंज़िलों में स्ट्रेंथ, स्पिन, भांगड़ा और BODYPUMP™ — ऐसे कोच जो आपको नाम से जानते हैं। आपका पहला सत्र हमारी ओर से।",
    "cover.cap": "मालवीय रोड पर, मुख्य द्वार के सामने बैटल रोप्स।",
    "tag.confirm": "पुष्टि बाकी", "tag.sample": "उदाहरण", "tag.adapted": "उदाहरण · क्लब के अपने शब्दों पर आधारित", "tag.portraits": "पोर्ट्रेट जल्द", "tag.offer": "उदाहरण ऑफ़र", "tag.answers": "उत्तरों की पुष्टि बाकी",
    "ch.note": "निदेशक का संदेश", "h.note": "निदेशक की <em>ओर से।</em>",
    "alm.h": "अकादमी एक नज़र में", "alm.kit": "उपकरण", "alm.rated": "सदस्यों की रेटिंग", "alm.cap": "मालवीय रोड पर हमारी इमारत।",
    "ch.history": "संक्षिप्त इतिहास", "h.history": `${YW[1]} साल, <em>पाँच अध्याय।</em>`,
    "i.history": 'देहरादून की शुरुआती ट्रेडमिलों में से एक से लेकर <span class="hl">चार मंज़िलों और अस्सी से ज़्यादा स्टेशनों तक</span> — पन्ना-दर-पन्ना ईयरबुक।',
    "yb.hint": "पन्ना पलटने के लिए स्क्रॉल करें →",
    "ch.curriculum": "पाठ्यक्रम", "h.curriculum": "ग्यारह कोर्स। <em>एक ज़रूरी शुरुआत।</em>",
    "i.curriculum": 'हर कोर्स <span class="hl">FS 001 से शुरू होता है — बॉडी-कंपोज़िशन जाँच</span> — ताकि आपका कोच अंदाज़े से नहीं, तथ्यों से शुरू करे। अपना लक्ष्य चुनें, सिलेबस खोलें और नामांकन करें।',
    "f.goal": "लक्ष्य", "f.format": "प्रारूप", "c.code": "कोड", "c.course": "कोर्स", "c.brief": "संक्षेप में", "c.format": "प्रारूप", "c.credits": "सत्र / सप्ताह", "c.intensity": "तीव्रता",
    "c.note": "क्लब द्वारा समय-सारिणी की पुष्टि होने तक सिलेबस और समय उदाहरण स्वरूप हैं।",
    "goal.all": "सभी लक्ष्य", "goal.lose": "वज़न घटाएँ", "goal.strong": "ताक़त बढ़ाएँ", "goal.move": "बेहतर मूवमेंट", "goal.enjoy": "मज़े से फ़िट",
    "fmt.all": "सभी प्रारूप", "fmt.class": "क्लास", "fmt.pt": "1:1", "fmt.floor": "ओपन फ़्लोर",
    "c.prereq": "हर कोर्स से पहले ज़रूरी", "c.syll": "सिलेबस · 4 सप्ताह", "c.sched": "समय", "c.fac": "प्रशिक्षक", "c.team": "कोचिंग टीम",
    "ch.faculty": "हमारे प्रशिक्षक", "h.faculty": "ऐसे प्रशिक्षक <em>जो आपको नाम से जानते हैं।</em>",
    "i.faculty": '<span class="hl">सदस्य सबसे ज़्यादा हमारे ट्रेनर्स की तारीफ़ करते हैं।</span> नौ लोग फ़्लोर, स्टूडियो और फ़्रंट डेस्क संभालते हैं।',
    "fac.atwork": "काम पर प्रशिक्षक", "fac.note": "पूरी साइट के लिए हर प्रशिक्षक का पोर्ट्रेट खींचा जाएगा।",
    "role.Director": "निदेशक", "role.Manager": "मैनेजर", "role.Head Trainer": "हेड ट्रेनर", "role.Trainer": "ट्रेनर",
    "ch.campus": "कैंपस", "h.campus": "चार मंज़िलें। <em>अस्सी से ज़्यादा स्टेशन।</em>",
    "i.campus": "सेक्शन ड्रॉइंग पर कोई मंज़िल चुनें और उसे देखें। उपकरण: Matrix, Hoist, Life Fitness और Star Trac।",
    "essay.h": "कैंपस की एक सैर",
    "floor.G": "रिसेप्शन और कार्डियो", "floor.1": "स्ट्रेंथ फ़्लोर", "floor.2": "फ़ंक्शनल और मोबिलिटी", "floor.3": "ग्रुप स्टूडियो और स्पिन",
    "ch.alumni": "हमारे सदस्य", "h.alumni": "ऐसे नतीजे जो <em>तस्वीरों के बाद भी टिके रहें।</em>",
    "i.alumni": '<span class="hl">असली लोग, असली धैर्य।</span> क्लब द्वारा प्रकाशित नतीजे, और सदस्यों के अपने शब्द — जहाँ उन्होंने लिखे।',
    "alu.note": "नाम और नतीजे क्लब की साइट से; इन्हें दिखाने की अनुमति की पुष्टि बाकी।", "alu.voices": "सदस्यों की आवाज़", "alu.voicecap": "एक सदस्य, अपने शब्दों में।",
    "rep.card": "रिपोर्ट कार्ड", "rep.name": "नाम", "rep.subject": "विषय", "rep.stamp": "नतीजा",
    "ch.fees": "शुल्क", "h.fees": "शुल्क संरचना <em>2026–27।</em>", "i.fees": 'एक शुल्क, हर मंज़िल। <span class="hl">जितनी लंबी प्रतिबद्धता, उतना कम रोज़ का ख़र्च।</span>',
    "fee.duration": "अवधि", "fee.fee": "शुल्क", "fee.month": "प्रति माह", "fee.day": "प्रति दिन", "fee.includes": "हर सदस्यता में शामिल",
    "fee.fn1": "शुल्क fitnesssolutions.co.in पर प्रकाशित, नवंबर 2026।", "fee.fn2": "जीएसटी लागू अनुसार। पर्सनल ट्रेनिंग का शुल्क अलग।",
    "fee.pop": "सबसे लोकप्रिय", "fee.choose": "चुनें",
    "plan.m1": "मासिक", "plan.m3": "3 महीने", "plan.m6": "6 महीने", "plan.m12": "वार्षिक",
    "pline.m1": "अपनी दिनचर्या बनाना शुरू करें", "pline.m3": "रफ़्तार और लचीलेपन का सबसे अच्छा संतुलन", "pline.m6": "लंबी दौड़ के लिए प्रतिबद्ध हों", "pline.m12": "आपका सबसे मज़बूत साल यहीं से शुरू",
    "inc.0": "चारों मंज़िलें", "inc.1": "ग्रुप क्लासेज़", "inc.2": "InBody जाँच", "inc.3": "पर्सनल न्यूट्रिशन चार्ट", "inc.4": "लॉकर और चेंजिंग रूम",
    "ch.apply": "आवेदन", "h.apply": "आपका प्रवेश पत्र <em>बस एक फ़ॉर्म दूर है।</em>",
    "i.apply": 'फ़ॉर्म भरें और <span class="hl">अपना प्रवेश पत्र ख़ुद बनते देखें।</span> इसे — या सिर्फ़ अपना नाम — फ़्रंट डेस्क पर लाएँ और निःशुल्क ट्रायल सत्र पाएँ।',
    "form.h": "प्रवेश हेतु आवेदन", "form.name": "पूरा नाम", "form.phone": "मोबाइल नंबर", "form.age": "आयु वर्ग", "form.plan": "सदस्यता (वैकल्पिक)",
    "form.course": "कार्यक्रम", "form.batch": "बैच", "form.date": "शुरुआत की तारीख", "form.submit": "मेरा प्रवेश पत्र जारी करें",
    "batch.morning": "सुबह", "batch.evening": "शाम", "batch.women": "महिला बैच",
    "card.title": "प्रवेश पत्र", "card.valid": "निःशुल्क ट्रायल सत्र", "card.photo": "फ़ोटो डेस्क पर", "card.name": "नाम", "card.course": "कार्यक्रम",
    "card.batch": "बैच", "card.date": "तारीख और समय", "card.no": "प्रवेश संख्या", "card.plan": "सदस्यता",
    "card.where": "फ़्रंट डेस्क पर दिखाएँ · प्लॉट नं. 6, मालवीय रोड, लक्ष्मण चौक", "card.admitted": "प्रवेश स्वीकृत",
    "card.print": "प्रिंट / PDF सहेजें", "card.wa": "व्हाट्सऐप पर भेजें", "card.cal": "कैलेंडर में जोड़ें", "card.edit": "विवरण बदलें",
    "ch.visit": "हमसे मिलें", "h.visit": "हमें <em>लक्ष्मण चौक</em> पर पाएँ।", "v.card": "कैंपस का पता",
    "v.hoursnote": "समय को लेकर लिस्टिंग में अंतर है; क्लब से पुष्टि बाकी।", "v.mapcap": "मालवीय रोड, लक्ष्मण चौक — सहारनपुर रोड के पास। पर्याप्त पार्किंग।",
    "v.openmap": "Google Maps में खोलें ↗", "v.schem": "रेखाचित्र · पैमाने पर नहीं",
    "v.dir": "रास्ता देखें", "v.call": "कॉल करें", "v.wa": "व्हाट्सऐप", "v.mail": "ईमेल",
    "faq.h": "अक्सर पूछे जाने वाले सवाल",
    "foot.est": "स्थापना 2009, देहरादून।", "foot.visit": "पता", "foot.contact": "संपर्क", "foot.top": "कवर पर वापस ↑",
    "foot.mock": "डिज़ाइन-दिशा मॉकअप। “उदाहरण” या “पुष्टि बाकी” वाले हिस्से अस्थायी हैं।",
    "tour.kicker": "कैंपस टूर", "tour.title": "किसी कोच के साथ चारों मंज़िलें देखें।", "tour.lede": "तीस मिनट, कोई दबाव नहीं। हम आपको फ़्लोर दिखाएँगे और आपके सवालों के जवाब देंगे।",
    "tour.day": "दिन", "tour.time": "समय", "tour.submit": "मेरा टूर बुक करें", "tour.booked": "टूर बुक हो गया", "tour.done": "ठीक है",
    "tl.0": "लक्ष्मण चौक पर दरवाज़े खुले", "tl.1": "क्लासेज़ की शुरुआत", "tl.2": "चार मंज़िलें, 80+ स्टेशन", "tl.3": "अंदाज़ा नहीं, माप", "tl.4": `${YW[1]} साल का सफ़र`,
    // revamp: margin notes, page curl, ticker
    "mn.cover": "पहला सत्र हमारी ओर से!", "mn.letter": "यहीं से शुरुआत हुई", "mn.cat": "सब यहीं से शुरू करते हैं",
    "mn.fac": "सबसे ज़्यादा तारीफ़ इन्हीं की", "mn.apply": "बस एक मिनट · कोई भुगतान नहीं", "curl": "पन्ना पलटें",
    "fact.years": "साल देहरादून में", "fact.floors": "मंज़िलों में ट्रेनिंग", "fact.stations": "वर्कआउट स्टेशन", "fact.coaches": "प्रशिक्षक और स्टाफ़",
  };
  const STR = {
    en: {
      count: (n, total) => `Showing ${n} of ${total} courses`,
      chapter: (i, n) => `Chapter ${i} of ${n}`,
      open: () => FS.openStatus().text,
      yourName: "Your name",
      planNone: "Decide after my trial",
      errName: "Please write your name.",
      errPhone: "Enter a 10-digit Indian mobile number.",
      errFix: "A couple of details need fixing.",
      issued: (no) => `Admit card ${no} issued — see you at the front desk.`,
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      closed: "Closed",
      today: "today",
      enrol: (c) => `Enrol in ${c} →`,
      byAppt: "By appointment, any open hour",
      openFloor: "Open floor · all club hours",
      floorWord: "Floor",
      prev: "← Previous floor", next: "Next floor →",
      plate: "Plate",
      tourSummary: (d, t, n) => `${n}, your campus tour is booked for ${d} at ${t}. A coach will meet you at the front desk on Malviya Road.`,
      seeYou: "See you soon.",
    },
    hi: {
      count: (n, total) => `${total} में से ${n} कोर्स`,
      chapter: (i, n) => `अध्याय ${i} / ${n}`,
      open: () => (FS.openStatus().open ? "अभी खुला है" : "अभी बंद है"),
      yourName: "आपका नाम",
      planNone: "ट्रायल के बाद तय करूँगा",
      errName: "कृपया अपना नाम लिखें।",
      errPhone: "10 अंकों का भारतीय मोबाइल नंबर लिखें।",
      errFix: "कुछ जानकारी ठीक करनी है।",
      issued: (no) => `प्रवेश पत्र ${no} जारी — फ़्रंट डेस्क पर मिलते हैं।`,
      days: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
      closed: "बंद",
      today: "आज",
      enrol: (c) => `${c} में नामांकन करें →`,
      byAppt: "अपॉइंटमेंट से, किसी भी समय",
      openFloor: "ओपन फ़्लोर · क्लब के सभी घंटे",
      floorWord: "मंज़िल",
      prev: "← पिछली मंज़िल", next: "अगली मंज़िल →",
      plate: "प्लेट",
      tourSummary: (d, t, n) => `${n}, आपका कैंपस टूर ${d} को ${t} बजे बुक है। मालवीय रोड पर फ़्रंट डेस्क पर एक कोच आपसे मिलेंगे।`,
      seeYou: "जल्द मिलते हैं।",
    },
  };
  const t = (k, ...a) => { const v = STR[LANG][k] ?? STR.en[k]; return typeof v === "function" ? v(...a) : v; };

  function applyLang() {
    $$("[data-i18n]").forEach((el) => {
      if (!("en" in el.dataset)) el.dataset.en = el.innerHTML;
      const key = el.dataset.i18n;
      el.innerHTML = LANG === "hi" && HI[key] != null ? HI[key] : el.dataset.en;
    });
  }

  /* =========================================================================
     Chapters (TOC, rail, running head)
     ========================================================================= */
  const CHAPTERS = [
    { id: "top", n: "", en: "Cover", hi: "कवर", p: "01" },
    { id: "note", n: "I", en: "Principal's note", hi: "निदेशक का संदेश", p: "03" },
    { id: "history", n: "II", en: "A short history", hi: "संक्षिप्त इतिहास", p: "05" },
    { id: "curriculum", n: "III", en: "The Curriculum", hi: "पाठ्यक्रम", p: "09" },
    { id: "faculty", n: "IV", en: "The Faculty", hi: "हमारे प्रशिक्षक", p: "13" },
    { id: "campus", n: "V", en: "The Campus", hi: "कैंपस", p: "15" },
    { id: "alumni", n: "VI", en: "Alumni", hi: "हमारे सदस्य", p: "19" },
    { id: "fees", n: "VII", en: "Fees", hi: "शुल्क", p: "23" },
    { id: "apply", n: "VIII", en: "Apply", hi: "आवेदन", p: "25" },
    { id: "visit", n: "IX", en: "Visiting", hi: "हमसे मिलें", p: "27" },
  ];
  CHAPTERS.forEach((c) => { HI[`chap.${c.id}`] = c.hi; });
  const tocHTML = (list) => list.map((c) => `
    <li><a href="#${c.id}"><span class="toc__n">${c.n}</span><span class="toc__t" data-i18n="chap.${c.id}">${c.en}</span><span class="toc__dots" aria-hidden="true"></span><span class="toc__p">p.&nbsp;${c.p}</span></a></li>`).join("");
  const BODY_CH = CHAPTERS.slice(1);
  $("#coverToc").innerHTML = tocHTML(BODY_CH);
  $$("#coverToc li").forEach((li, i) => li.style.setProperty("--k", i));
  $("#menuToc").innerHTML = tocHTML(BODY_CH);
  $("#footToc").innerHTML = tocHTML(BODY_CH);
  $("#rail").innerHTML = BODY_CH.map((c) => `<a href="#${c.id}" data-ch="${c.id}"><span class="rail__n">${c.n}</span><span class="rail__t" data-i18n="chap.${c.id}">${c.en}</span></a>`).join("");

  /* =========================================================================
     Cover
     ========================================================================= */
  const VOL = roman(YEARS);
  $("#coverVol").textContent = `Vol. ${VOL}`;
  $("#footVol").textContent = VOL;
  $("#coverDeck").textContent = `${YW[0]} years of teaching Dehradun to train.`;
  const coverVideo = $("#coverVideo");
  // Media plan: every still/clip family appears once on this page (see research/media-catalogue.md).
  // Cover = the front door. The floor pan stays out: it is the same shot as the Floor 1 plate in chapter V.
  // Hero media is the camera's native 1080×1920 (HQ encode). The arch is capped so it never shows the clip above ~1.3×.
  coverVideo.poster = FS.posterHQ("ropes");
  coverVideo.src = FS.vidHQ("ropes");

  function renderStatus() {
    const s = FS.openStatus();
    [["#coverDot", "#coverStatus"], ["#visitDot", "#visitStatus"]].forEach(([d, txt]) => {
      $(d).classList.toggle("is-closed", !s.open);
      $(txt).textContent = t("open");
    });
  }

  /* =========================================================================
     I. Principal's note — almanac
     ========================================================================= */
  const now = FS.nowIST();
  $("#letterDate").textContent = `Laxman Chowk, Dehradun · ${now.date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
  $("#facts").innerHTML = FS.stats.map((s) => `
    <div><dt><span class="count" data-to="${s.value}">${s.value}</span>${s.suffix}</dt><dd data-i18n="fact.${s.id}">${s.label}</dd></div>`).join("");
  $("#kit").textContent = FS.equipment.join(" · ");
  $("#ratings").innerHTML = FS.ratings.map((r) => `
    <li><b>${r.score.toFixed(1)}★</b> <a href="${r.url}" target="_blank" rel="noopener">${r.source}</a> <span>· ${r.count} ratings</span> ${r.confirm ? TAG("confirm") : ""}</li>`).join("");

  /* =========================================================================
     II. Yearbook
     ========================================================================= */
  const TL_IMG = [
    { k: "treadmill-row", cap: "Where it began: the treadmill. Today's cardio deck." },   // 2009: the first treadmills
    { k: "bosu-squat", cap: "A class in the group studio: BOSU balance work." },         // the classes arrive
    { k: "floor-day", cap: "Stations on the strength floor." },                           // four floors, 80+ stations
    { k: "inbody-scan", cap: "An InBody result, read beside the analyser. Illustrative stock photograph.", pos: "40% 50%" }, // measured, not guessed
    { k: "member-woman", cap: "A member of the academy." },                               // today
  ];
  const TILTS = [-1.4, 1.1, -.8, 1.3, -1];
  const ybTrack = $("#ybTrack");
  ybTrack.innerHTML = FS.timeline.map((e, i) => `
    <article class="yb__page" style="--tilt:${TILTS[i % TILTS.length]}deg" aria-label="${esc(e.year)} — ${esc(e.title)}">
      <div class="yb__photo">
        <img src="${FS.img(TL_IMG[i].k, true)}" srcset="${srcset(TL_IMG[i].k)}" sizes="(min-width: 1024px) 30vw, 70vw" alt="${esc(TL_IMG[i].cap)}" loading="lazy"${TL_IMG[i].pos ? ` style="object-position:${TL_IMG[i].pos}"` : ""} />
        <span class="tape tape--l" aria-hidden="true"></span><span class="tape tape--r" aria-hidden="true"></span>
        <p class="yb__cap">${esc(TL_IMG[i].cap)}</p>
      </div>
      <div class="yb__text">
        <span class="yb__year">${esc(e.year)}</span>
        <h3 class="yb__title" data-i18n="tl.${i}">${esc(e.title)}</h3>
        <p class="yb__copy">${esc(e.copy)}</p>
        ${e.confirm ? TAG("confirm") : ""}
        <span class="yb__folio">p. ${String(5 + i).padStart(2, "0")}</span>
      </div>
    </article>`).join("");
  const ybPages = $$(".yb__page", ybTrack);
  let ybIndex = 0;
  function ybHud(i) {
    ybIndex = i;
    $("#ybCount").textContent = t("chapter", i + 1, ybPages.length);
    $("#ybBar").style.transform = `scaleX(${(i + 1) / ybPages.length})`;
    const prev = $("#ybPrev"), next = $("#ybNext");
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === ybPages.length - 1;
  }
  // Page-turn: each page swings on Y depending on its distance from the centre of the viewport.
  // Album slide: the centred page sits full size; its neighbours rest a little lower, smaller and dimmer.
  // 2D transform + opacity only (composited). Geometry is read once per layout, never per frame.
  let ybGeo = null;
  const ybX = () => (yb.classList.contains("is-pinned") && window.gsap ? +window.gsap.getProperty(ybTrack, "x") || 0 : 0);
  function ybMeasure() {
    ybGeo = { left: ybTrack.getBoundingClientRect().left - ybX(), centres: ybPages.map((p) => p.offsetLeft + p.offsetWidth / 2) };
  }
  function ybTurn(remeasure) {
    if (remeasure === true || !ybGeo) ybMeasure();
    const vw = window.innerWidth;
    const base = ybGeo.left + ybX() - ybTrack.scrollLeft;
    let best = 0, bestD = Infinity;
    ybPages.forEach((p, i) => {
      const d = (base + ybGeo.centres[i] - vw / 2) / vw;
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      if (RM || Math.abs(d) > 1.25) return; // well off screen: keeps its resting pose
      const a = Math.min(1, Math.abs(d));
      p.style.transform = `translate3d(0, ${(a * 22).toFixed(1)}px, 0) scale(${(1 - a * 0.07).toFixed(4)}) rotate(var(--tilt))`;
      p.style.opacity = (1 - a * 0.3).toFixed(3);
    });
    if (best !== ybIndex) ybHud(best);
  }
  ybHud(0);

  /* =========================================================================
     III. Curriculum
     ========================================================================= */
  // Figure photos that differ from the shared programme photo: the InBody tablet photo illustrates the yearbook's
  // "Measured, not guessed" page, so FS 001 shows the analyser's results screen (one photo, one place).
  const FIG_IMG = { assessment: "inbody-console" };
  const COURSES = [
    { code: "FS 001", id: "assessment", prereq: true, format: "pt", credits: "1×", goals: ["lose", "strong", "move", "enjoy"],
      weeks: ["Body-composition scan: muscle, fat and water", "Goal conversation and injury history", "Your personal nutrition chart", "Re-scan every 4–6 weeks to prove progress"] },
    { code: "FS 101", id: "strength", title: "Strength Foundations", format: "floor", credits: "3", goals: ["strong", "lose"],
      weeks: ["Movement screen and machine basics", "Squat, hinge, push and pull patterns", "Free weights and progressive overload", "Your first programme review"] },
    { code: "FS 110", id: "pt", format: "pt", credits: "2–5", goals: ["lose", "strong", "move"],
      weeks: ["Consultation and assessment", "A programme built around your week", "Form, load and recovery tuning", "Progress check and your next block"] },
    { code: "FS 120", id: "bodypump", format: "class", credits: "2", goals: ["strong", "enjoy"],
      weeks: ["Learn the tracks with light weights", "Build endurance: more reps, same form", "Add load where you're ready", "Full-class confidence"] },
    { code: "FS 130", id: "spinning", format: "class", credits: "3", goals: ["lose", "enjoy"],
      weeks: ["Bike set-up and cadence", "Intervals and recovery", "Climbs and standing work", "Ride the full playlist"] },
    { code: "FS 140", id: "bhangra", format: "class", credits: "2", goals: ["enjoy", "lose"],
      weeks: ["Basic steps and rhythm", "Combinations at half tempo", "Full routines", "Bring-a-friend week"] },
    { code: "FS 150", id: "step", format: "class", credits: "2", goals: ["lose", "enjoy"],
      weeks: ["Step basics and safety", "Simple combinations", "Tempo and choreography", "The full routine"] },
    { code: "FS 160", id: "hiit", format: "class", credits: "2", goals: ["lose"],
      weeks: ["Work/rest ratios and form", "Ropes, sleds and air bikes", "Longer work blocks", "Benchmark re-test"] },
    { code: "FS 170", id: "functional", format: "class", credits: "2", goals: ["move", "strong"],
      weeks: ["Mobility screen", "Carry, push, pull and rotate", "Conditioning circuits", "Re-screen and plan"] },
    { code: "FS 180", id: "zumba", format: "class", credits: "2", goals: ["enjoy", "lose"],
      weeks: ["Learn the rhythms", "Merengue, salsa and reggaeton basics", "A full-length session", "Party week"] },
    { code: "FS 190", id: "women", format: "class", credits: "3", goals: ["strong", "lose", "move"],
      weeks: ["Welcome and assessment", "Strength basics in a small group", "Cardio and class rotation", "Progress check"] },
  ].map((c) => ({ ...c, p: FS.program(c.id), img: FIG_IMG[c.id] || FS.program(c.id).img, title: c.title || FS.program(c.id).name }));
  // What each course's figure actually shows (figures are numbered by course code). Bhangra and Zumba have no class
  // photographs from the club yet, so their figures are licensed stock photographs and say so (FS.credits).
  const FIG = {
    assessment: "An InBody analyser's results screen: weight, muscle and body fat. Illustrative stock photograph.",
    strength: "Dumbbell presses under the hexagon lamps.",
    pt: "A coach adjusts a member's grip.",
    bodypump: "The studio stage, set with barbell and step.",
    spinning: "A rider in the spinning studio.",
    bhangra: "A Bhangra fitness class, arms raised. Illustrative stock photograph.",
    step: "Step platforms in the group studio.",
    hiit: "A sled push in the functional studio.",
    functional: "The air bike in the functional studio.",
    zumba: "An instructor leads a dance-fitness class. Illustrative stock photograph.",
    women: "Cable work in the violet bay.",
  };
  const FMT = { class: "Class", pt: "1:1", floor: "Open floor" };
  const GOALS = [["all", "All goals"], ["lose", "Lose fat"], ["strong", "Get stronger"], ["move", "Move better"], ["enjoy", "Enjoy it"]];
  const FORMATS = [["all", "All formats"], ["class", "Class"], ["pt", "1:1"], ["floor", "Open floor"]];
  const DAY3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysLabel = (days) => {
    const s = [...days].sort((a, b) => a - b);
    const run = s.every((d, i) => i === 0 || d === s[i - 1] + 1);
    if (run && s.length > 2) return `${DAY3[s[0]]}–${DAY3[s[s.length - 1]]}`;
    return s.map((d) => DAY3[d]).join(" · ");
  };
  const schedule = (id) => {
    const slots = FS.timetable.slots.filter((s) => s.cls === id);
    if (!slots.length) return null;
    return slots.sort((a, b) => FS.toMins(a.t) - FS.toMins(b.t)).map((s) => `${daysLabel(s.days)} — ${FS.fmtTime(s.t)} · ${s.d} min`);
  };
  const dots = (n) => `<span class="course__dots" aria-label="Intensity ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  $("#goalChips").innerHTML = GOALS.map(([v, l], i) => `<button class="chip" type="button" data-goal="${v}" aria-pressed="${i === 0}" data-i18n="goal.${v}">${l}</button>`).join("");
  $("#formatChips").innerHTML = FORMATS.map(([v, l], i) => `<button class="chip" type="button" data-format="${v}" aria-pressed="${i === 0}" data-i18n="fmt.${v}">${l}</button>`).join("");
  const RING = '<svg class="ring__svg" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M60 5 C 30 1, 3 12, 5 28 C 7 45, 54 49, 82 41 C 104 33, 99 9, 70 5 C 60 4, 50 6, 43 9" /></svg>';
  $("#courses").innerHTML = COURSES.map((c, ci) => {
    const sched = schedule(c.id);
    return `
    <li class="course${c.prereq ? " course--prereq" : ""}" id="course-${c.id}" data-goals="${c.goals.join(" ")}" data-format="${c.format}" style="--k:${ci}">
      <button class="course__row" type="button" aria-expanded="false" aria-controls="panel-${c.id}">
        <span class="course__code">${c.prereq ? `<span class="ring">${c.code}${RING}</span>` : c.code}</span>
        <span class="course__main">
          <span class="course__title">${esc(c.title)}${c.prereq ? ` <span class="course__badge" data-i18n="c.prereq">Prerequisite for every course</span>` : ""}</span>
          <span class="course__short">${esc(c.p.short)}</span>
        </span>
        <span class="course__meta">
          <span class="course__format" data-i18n="fmt.${c.format}">${FMT[c.format]}</span>
          <span class="course__credits">${c.credits} <span class="visually-hidden">sessions a week</span></span>
          ${dots(c.p.intensity)}
        </span>
        <span class="course__toggle" aria-hidden="true"></span>
      </button>
      <div class="course__panel" id="panel-${c.id}" role="region" aria-label="${esc(c.code)} syllabus">
        <div class="course__inner">
          <div class="syll">
            <figure class="syll__fig">
              <img class="syll__img" src="${FS.img(c.img, true)}" srcset="${srcset(c.img)}" sizes="(min-width: 744px) 14rem, 22rem" alt="${esc(FIG[c.id])}" loading="lazy" />
              <figcaption class="plate-cap"><span class="plate-cap__n" data-fig="${c.code.replace("FS ", "")}">Fig. ${c.code.replace("FS ", "")}.</span> ${esc(FIG[c.id])}</figcaption>
            </figure>
            <div>
              <p class="syll__long">${esc(c.p.long)}</p>
              <p class="syll__h"><span data-i18n="c.syll">Syllabus · 4 weeks</span> ${TAG("sample")}</p>
              <ol class="syll__weeks">${c.weeks.map((w, i) => `<li><b>Wk ${i + 1}</b><span>${esc(w)}</span></li>`).join("")}</ol>
            </div>
            <div class="syll__aside">
              <div class="syll__box">
                <p class="syll__h" data-i18n="c.sched">Schedule</p>
                <ul class="syll__sched">${sched ? sched.map((l) => `<li>${l}</li>`).join("") : `<li data-sched="${c.format === "floor" ? "floor" : "appt"}">${c.format === "floor" ? t("openFloor") : t("byAppt")}</li>`}</ul>
              </div>
              <div class="syll__box">
                <p class="syll__h" data-i18n="c.fac">Faculty</p>
                <p class="syll__fac" data-i18n="c.team">Coaching team</p>
              </div>
              <button class="btn btn--ink btn--sm" type="button" data-enrol="${c.id}">${t("enrol", c.code)}</button>
            </div>
          </div>
        </div>
      </div>
    </li>`;
  }).join("");

  const filt = { goal: "all", format: "all" };
  function applyFilters() {
    let n = 0;
    $$(".course").forEach((li) => {
      const isPre = li.classList.contains("course--prereq");
      const okG = filt.goal === "all" || li.dataset.goals.split(" ").includes(filt.goal);
      const okF = filt.format === "all" || li.dataset.format === filt.format;
      const show = isPre || (okG && okF);
      li.hidden = !show;
      if (show) n++;
    });
    $("#courseCount").textContent = t("count", n, COURSES.length);
  }
  $("#goalChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goal]"); if (!b) return;
    filt.goal = b.dataset.goal; $$("#goalChips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b))); applyFilters();
  });
  $("#formatChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-format]"); if (!b) return;
    filt.format = b.dataset.format; $$("#formatChips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b))); applyFilters();
  });
  $("#courses").addEventListener("click", (e) => {
    const enrol = e.target.closest("[data-enrol]");
    if (enrol) { enrolIn(enrol.dataset.enrol); return; }
    const row = e.target.closest(".course__row"); if (!row) return;
    const li = row.closest(".course");
    polHide();
    const open = !li.classList.contains("is-open");
    li.classList.toggle("is-open", open);
    row.setAttribute("aria-expanded", String(open));
    setTimeout(refreshST, 600);
  });

  /* =========================================================================
     IV. Faculty
     ========================================================================= */
  const ROTS = [-1.6, 1.2, -.9, 1.5, -1.3, .8, -1.1, 1.4, -.7];
  $("#faculty-cards").innerHTML = FS.team.map((m, i) => `
    <article class="icard${m.lead ? " icard--lead" : ""} reveal-card" style="--rot:${ROTS[i % ROTS.length]}deg">
      <span class="icard__no">No. ${String(i + 1).padStart(2, "0")}</span>
      <span class="icard__mono" aria-hidden="true">${FS.initials(m.name)}</span>
      <h3 class="icard__name">${esc(m.name)}</h3>
      <p class="icard__role" data-i18n="role.${m.role}">${esc(m.role)}</p>
      ${m.creds ? `<ul class="icard__creds">${m.creds.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
      ${m.quote ? `<p class="icard__quote">“${esc(m.quote)}”</p>` : ""}
      ${m.credsConfirm ? `<span class="icard__tag">${TAG("confirm")}</span>` : ""}
    </article>`).join("");
  // Coaching shots only (a coach is in every frame); none of them is used anywhere else on the page.
  const ATWORK = [["coach-chest", "Setting up the chest press."], ["coach-crunch", "Under the CONSISTENCY · DISCIPLINE sign."], ["coach-stretch", "An assisted stretch by the racks."], ["rower-coach", "Rowing technique in the functional studio."]];
  $("#atwork").innerHTML = ATWORK.map(([k, cap], i) => `
    <figure class="develop" style="--k:${i}"><img src="${FS.img(k, true)}" alt="A Fitness Solutions coach at work: ${esc(cap)}" loading="lazy" /><figcaption class="plate-cap"><span class="plate-cap__n" data-pn="${roman(i + 3)}">Plate ${roman(i + 3)}.</span> ${esc(cap)}</figcaption></figure>`).join("");

  /* =========================================================================
     V. Campus — section drawing + floor panel + photo essay
     ========================================================================= */
  // Floor bands in the drawing (top → bottom)
  const BANDS = { "3": [96, 222], "2": [230, 356], "1": [364, 490], "G": [498, 648] };
  const svg = $("#sectionSvg");
  const floorsTopDown = ["3", "2", "1", "G"];
  const sectionArt = () => {
    const L = 150, R = 470;
    const hatch = Array.from({ length: 26 }, (_, i) => `<path class="ln ln--thin" d="M${40 + i * 22} 670 l14 -18" />`).join("");
    const stairs = (y0, y1) => {
      let d = `M410 ${y1}`; const steps = 8, h = (y1 - y0) / steps, w = 52 / steps;
      for (let i = 0; i < steps; i++) d += ` v${-h.toFixed(1)} h${w.toFixed(1)}`;
      return `<path class="ln ln--thin" d="${d}" /><path class="ln ln--dash" d="M410 ${y1} L462 ${y0}" />`;
    };
    const hexes = [200, 262, 324].map((x) => `<path class="ln ln--thin" d="M${x - 14} 372 l7 -6 h14 l7 6 l-7 6 h-14z" /><path class="ln ln--thin" d="M${x} 364 v-0" />`).join("");
    const person = (x, yFeet, s = 1) => `<g class="ln" transform="translate(${x} ${yFeet}) scale(${s})"><circle cx="0" cy="-46" r="6" /><path d="M0 -40 v22 M0 -18 l-8 18 M0 -18 l8 18 M0 -34 l-10 10 M0 -34 l10 10" /></g>`;
    return `
      <g class="art">
        <!-- ground + hatch -->
        <path class="ln ln--thick" d="M20 650 H620" />${hatch}
        <!-- rooftop sign -->
        <path class="ln" d="M220 70 V56 M400 70 V56" />
        <rect x="190" y="26" width="240" height="30" rx="2" class="fill-ink" />
        <text x="310" y="46" text-anchor="middle" class="txt--sign">FITNESS SOLUTIONS</text>
        <!-- parapet + roof slab -->
        <path class="ln" d="M${L - 4} 70 H${R + 4} V88 H${L - 4} Z" />
        <!-- walls -->
        <path class="ln ln--thick" d="M${L} 88 V560 M${L} 640 V650 M${R} 88 V650" />
        <!-- entrance door + swing -->
        <path class="ln ln--thin" d="M${L} 560 h30 M${L} 640 h0" /><path class="ln ln--thin" d="M${L} 560 a80 80 0 0 1 80 80" />
        <!-- slabs -->
        ${[222, 356, 490].map((y) => `<path class="ln" d="M${L} ${y} H${R} M${L} ${y + 8} H${R}" />`).join("")}
        <!-- windows on the far wall (dashed) -->
        ${[[110, 200], [244, 334], [378, 468]].map(([a, b]) => `<path class="ln ln--dash" d="M${R - 70} ${a} V${b} M${R - 30} ${a} V${b}" />`).join("")}
        <!-- interior column -->
        <path class="ln ln--dash" d="M318 88 V650" />
        <!-- stairs -->
        ${stairs(230, 356)}${stairs(364, 490)}${stairs(498, 648)}${stairs(96, 222)}
        <!-- F3: spin bikes + mirror -->
        ${[184, 246, 308].map((x) => `<g class="ln"><circle cx="${x}" cy="206" r="13" /><path d="M${x} 206 L${x + 14} 172 M${x + 14} 172 h-10 M${x} 206 L${x + 30} 168 h6 M${x + 14} 186 L${x + 24} 206" /></g>`).join("")}
        <path class="ln ln--thin" d="M392 104 V214" /><path class="ln ln--thin" d="M386 120 l10 -10 M386 140 l10 -10" />
        ${person(360, 222, .82)}
        <!-- F2: sled, kettlebells, bag, rope -->
        <path class="ln" d="M176 356 l8 -18 h44 l8 18 M190 338 l-6 -26 M222 338 l6 -26" />
        ${[256, 280].map((x) => `<g class="ln"><circle cx="${x}" cy="347" r="8" /><path d="M${x - 5} 340 q5 -9 10 0" /></g>`).join("")}
        <path class="ln ln--thin" d="M334 230 V250" /><rect class="ln" x="322" y="250" width="24" height="62" rx="9" />
        <path class="ln" d="M360 352 q10 -14 20 0 t20 0 t20 0" />
        ${person(372, 356, .82)}
        <!-- F1: rack, bench, dumbbells, hex lamps -->
        ${hexes}
        <path class="ln" d="M184 490 V404 M228 490 V404 M168 426 H244" /><circle class="ln" cx="172" cy="426" r="15" /><circle class="ln" cx="240" cy="426" r="15" />
        <path class="ln" d="M266 474 h64 M276 474 v16 M322 474 v16" />
        <rect class="ln" x="350" y="452" width="46" height="38" />${[358, 370, 382].map((x) => `<circle class="ln ln--thin" cx="${x}" cy="462" r="4" /><circle class="ln ln--thin" cx="${x}" cy="478" r="4" />`).join("")}
        ${person(206, 490, .82)}
        <!-- G: desk, treadmills -->
        <path class="ln" d="M190 648 V612 H246 V648 M184 612 H252" />
        ${person(222, 612, .7)}
        ${[268, 340].map((x) => `<g class="ln"><path d="M${x} 646 L${x + 56} 636 M${x + 50} 637 L${x + 58} 596 h-16" /></g>`).join("")}
      </g>`;
  };
  const floorGroups = () => floorsTopDown.map((n) => {
    const f = FS.floors.find((x) => x.n === n);
    const [y0, y1] = BANDS[n];
    const cy = (y0 + y1) / 2;
    return `
      <g class="floor" data-floor="${n}" tabindex="0" role="button" aria-label="Floor ${n === "G" ? "G" : n}: ${esc(f.name)}">
        <rect class="floor__hit" x="150" y="${y0}" width="320" height="${y1 - y0}" />
        <rect x="40" y="${y0}" width="430" height="${y1 - y0}" fill="transparent" />
        <path class="ln ln--thin" d="M88 ${cy} H150" style="fill:none;stroke:var(--ink)" />
        <circle class="floor__tagbg" cx="70" cy="${cy}" r="18" />
        <text class="txt--label" x="70" y="${cy + 5.5}" text-anchor="middle">${n}</text>
        <text class="floor__name" x="486" y="${cy + 5}" data-i18n="floor.${n}">${esc(f.name.replace(" & ", " & "))}</text>
      </g>`;
  }).join("");
  svg.innerHTML = floorGroups() + sectionArt();
  // Narrow drawings drop the side labels (the floor tabs name them) and zoom onto the building.
  const fitDrawing = () => {
    const narrow = svg.getBoundingClientRect().width < 430;
    svg.setAttribute("viewBox", narrow ? "34 16 456 650" : "0 0 664 720");
    svg.classList.toggle("is-narrow", narrow);
  };
  if ("ResizeObserver" in window) new ResizeObserver(fitDrawing).observe(document.querySelector(".drawing")); else fitDrawing();

  let floorIdx = 1; // start on the strength floor
  const FLOORS = FS.floors;
  $("#floorTabs").innerHTML = FLOORS.map((f, i) => `<button class="chip" type="button" role="tab" data-fi="${i}" aria-selected="false" aria-pressed="false"><b>${f.n}</b> <span data-i18n="floor.${f.n}">${esc(f.name)}</span></button>`).join("");
  function renderFloor(i, focus) {
    floorIdx = (i + FLOORS.length) % FLOORS.length;
    const f = FLOORS[floorIdx];
    $$("#sectionSvg .floor").forEach((g) => g.classList.toggle("is-active", g.dataset.floor === f.n));
    $$("#floorTabs .chip").forEach((b, j) => { b.setAttribute("aria-selected", String(j === floorIdx)); b.setAttribute("aria-pressed", String(j === floorIdx)); });
    const name = LANG === "hi" ? HI[`floor.${f.n}`] : f.name;
    $("#floorBody").innerHTML = `
      <div class="fp">
        <figure class="fp__media">
          <img src="${FS.img(f.img, true)}" srcset="${srcset(f.img)}" sizes="(min-width: 1024px) 40vw, 90vw" alt="${esc(f.name)} at Fitness Solutions" />
          <figcaption class="plate-cap"><span class="plate-cap__n">${t("floorWord")} ${f.n}.</span> ${esc(f.line)}</figcaption>
        </figure>
        <div>
          <p class="fp__n">${t("floorWord")} ${f.n} / ${FLOORS.length}</p>
          <h3 class="fp__name">${esc(name)}</h3>
          <ul class="ticks">${f.zones.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
          <div class="fp__nav">
            <button class="btn btn--line btn--sm" type="button" data-fstep="-1">${t("prev")}</button>
            <button class="btn btn--line btn--sm" type="button" data-fstep="1">${t("next")}</button>
            ${f.sample ? `<span class="tag tag--sample" data-i18n="tag.floororder">Floor order illustrative</span>` : ""}
          </div>
        </div>
      </div>`;
    HI["tag.floororder"] = "मंज़िलों का क्रम उदाहरण";
    if (LANG === "hi") $$("#floorBody [data-i18n]").forEach((el) => { el.dataset.en = el.innerHTML; el.innerHTML = HI[el.dataset.i18n] ?? el.innerHTML; });
    if (focus) $(`#floorTabs .chip[data-fi="${floorIdx}"]`).focus({ preventScroll: true });
  }
  svg.addEventListener("click", (e) => { const g = e.target.closest(".floor"); if (g) renderFloor(FLOORS.findIndex((f) => f.n === g.dataset.floor)); });
  // SVG elements have no .click(); give the floor buttons one so scripts and assistive tools can activate them.
  $$("#sectionSvg .floor").forEach((g) => { if (typeof g.click !== "function") g.click = function () { this.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }; });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest(".floor"); if (!g) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); renderFloor(FLOORS.findIndex((f) => f.n === g.dataset.floor)); }
  });
  $("#floorTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-fi]"); if (b) renderFloor(+b.dataset.fi); });
  $("#floorTabs").addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); renderFloor(floorIdx + (e.key === "ArrowRight" ? 1 : -1), true); }
  });
  $("#floorBody").addEventListener("click", (e) => { const b = e.target.closest("[data-fstep]"); if (b) renderFloor(floorIdx + +b.dataset.fstep); });

  const PLATES = [
    ["signboard", "The signboard on Malviya Road."],
    ["lane", "Down the lane to the front door."],
    ["logo-cardio", "The logo wall above the cardio bikes.", true],
    ["stairmaster", "StairMasters on the cardio deck."],
    ["red-machines", "Plate-loaded machines on the strength floor."],
    ["dumbbells-purple", "Dumbbells under violet light."],
    ["kettlebells", "Kettlebells by the studio window.", false, "50% 92%"],
    ["turf-wide", "The turf lane, ready for sleds.", true],
    ["lockers", "Lockers, numbered and waiting."],
    ["night-exterior", "After dark, the lights stay on."],
  ];
  // optional 4th value = focal point, for portrait photos whose subject sits low or high in the frame
  $("#essay").innerHTML = PLATES.map(([k, cap, wide, focus], i) => `
    <button class="plate develop${wide ? " plate--wide" : ""}" type="button" data-plate="${i}" style="--k:${i % 4}" aria-label="Open photo: ${esc(cap)}">
      <img src="${FS.img(k, true)}" alt="" loading="lazy"${focus ? ` style="object-position: ${focus}"` : ""} />
      <span class="plate-cap"><span class="plate-cap__n">${t("plate")} ${roman(i + 7)}.</span> ${esc(cap)}</span>
    </button>`).join("");
  $("#essayCount").textContent = `${PLATES.length} plates`;

  /* =========================================================================
     VI. Alumni
     ========================================================================= */
  const SUBJECT = { loss: "Fat loss", gain: "Muscle & mass", form: "Posture & form" };
  const RR = [-1.4, 1.1, -.7, 1.3, -1, .8];
  $("#reports").innerHTML = FS.transformations.map((tr, i) => {
    const big = tr.kg != null ? `${tr.kg > 0 ? "+" : "−"}<span class="report__n" data-to="${Math.abs(tr.kg)}">${Math.abs(tr.kg)}</span> kg` : esc(tr.result);
    return `
    <article class="report reveal-card" style="--k:${i};--rr:${RR[i % RR.length]}deg">
      <i class="ink-ring report__ink" aria-hidden="true"></i>
      <div class="report__head"><span data-i18n="rep.card">Report card</span><small>No. ${String(i + 1).padStart(2, "0")}</small></div>
      <dl class="report__rows">
        <div><dt data-i18n="rep.name">Name</dt><dd>${esc(tr.name)}</dd></div>
        <div><dt data-i18n="rep.subject">Subject</dt><dd>${SUBJECT[tr.kind]}</dd></div>
      </dl>
      <p class="report__result${tr.kg == null ? " report__result--word" : ""}">${big}${/~|approx/i.test(tr.result) ? '<small class="report__approx">approximately</small>' : ""}</p>
      <span class="report__stamp" aria-hidden="true" data-i18n="rep.stamp">Result</span>
    </article>`;
  }).join("");
  const LR = [-.8, .6, -.45, .9, -.6, .5];
  $("#letters").innerHTML = FS.reviews.map((r, i) => r.press ? `
    <figure class="lt lt--press reveal-card" style="--k:${i};--lr:${LR[i % LR.length]}deg">
      <p class="lt__kick">In the press</p>
      <blockquote class="lt__q">${esc(r.text)}</blockquote>
      <figcaption class="lt__who">${esc(r.who)}<span class="lt__where">${esc(r.where)}</span></figcaption>
    </figure>` : `
    <figure class="lt reveal-card" style="--k:${i};--lr:${LR[i % LR.length]}deg">
      <blockquote class="lt__q">${esc(r.text)}</blockquote>
      <figcaption class="lt__who">— ${esc(r.who)}${r.stars ? ` <span class="lt__stars" aria-label="${r.stars} out of 5 stars">${"★".repeat(r.stars)}</span>` : ""}
        <span class="lt__where">${esc(r.where)}${r.year ? ", " + r.year : ""}</span></figcaption>
    </figure>`).join("");
  $("#voiceRate").innerHTML = FS.ratings.map((r) => `<b>${r.score.toFixed(1)}★</b> ${r.source} (${r.count})`).join(" · ");

  /* =========================================================================
     VII. Fees
     ========================================================================= */
  const CIRCLE = '<svg class="fee__circle" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M30 18 C 80 2, 170 4, 190 40 C 205 78, 120 98, 60 92 C 10 86, -2 52, 22 30 C 40 14, 90 8, 118 12" /></svg>';
  $("#feeRows").innerHTML = FS.plans.map((p, i) => `
    <tr class="${p.popular ? "is-popular" : ""}" style="--k:${i}">
      <td class="fee__durcell"><span class="fee__dur" data-i18n="plan.${p.id}">${esc(p.name)}</span><span class="fee__line" data-i18n="pline.${p.id}">${esc(p.line)}</span>${p.popular ? `<span class="fee__pop" data-i18n="fee.pop">Most popular</span>` : ""}</td>
      <td class="fee__pricecell"><span class="fee__price">${FS.money(p.price)}${p.popular ? CIRCLE : ""}</span></td>
      <td class="fee__unit" data-label="Per month"><span class="fee__small">${FS.money(FS.perMonth(p))}</span></td>
      <td class="fee__unit" data-label="Per day"><span class="fee__small fee__perday">${FS.money(FS.perDay(p))}</span></td>
      <td class="fee__cta"><button class="btn ${p.popular ? "btn--ink" : "btn--line"} btn--sm" type="button" data-plan="${p.id}"><span data-i18n="fee.choose">Choose</span></button></td>
    </tr>`).join("");
  const ANNUAL = FS.plans.reduce((a, p) => (p.months > a.months ? p : a), FS.plans[0]);
  // The red-pencil note hangs from the annual plan's per-day price, its arrow pointing up at the figure.
  const notedRow = document.querySelectorAll("#feeRows tr")[FS.plans.indexOf(ANNUAL)];
  notedRow.classList.add("fee--noted");
  notedRow.querySelector(".fee__perday").append(document.getElementById("mnFeesTpl").content.firstElementChild);
  $("#mnFees").textContent = `just ${FS.money(FS.perDay(ANNUAL))} a day!`;
  HI["mn.fees"] = `सिर्फ़ ${FS.money(FS.perDay(ANNUAL))} रोज़!`;
  $("#includes").innerHTML = FS.planIncludes.items.map((x, i) => `<li data-i18n="inc.${i}">${esc(x)}</li>`).join("");
  $("#feeRows").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan]"); if (!b) return;
    $("#fPlan").value = b.dataset.plan; updateCard(); goTo("#apply"); flashCard();
  });

  /* =========================================================================
     VIII. Apply — form + live admit card
     ========================================================================= */
  const form = $("#admission");
  const fName = $("#fName"), fPhone = $("#fPhone"), fCourse = $("#fCourse"), fPlan = $("#fPlan"), fAge = $("#fAge");
  fCourse.innerHTML = COURSES.map((c) => `<option value="${c.id}">${c.code} — ${esc(c.title)}</option>`).join("");
  const planOptions = () => `<option value="">${t("planNone")}</option>` + FS.plans.map((p) => `<option value="${p.id}">${LANG === "hi" ? HI[`plan.${p.id}`] : p.name} · ${FS.money(p.price)}</option>`).join("");
  fPlan.innerHTML = planOptions();
  const BATCHES = [{ id: "morning", label: "Morning", time: "07:00" }, { id: "evening", label: "Evening", time: "18:30" }, { id: "women", label: "Women's batch", time: "08:00" }];
  let batch = "morning";
  $("#batchChips").innerHTML = BATCHES.map((b) => `<button class="chip" type="button" role="radio" aria-checked="${b.id === batch}" data-batch="${b.id}"><span data-i18n="batch.${b.id}">${b.label}</span> <small>${FS.fmtTime(b.time)}</small></button>`).join("");

  // The next six open days (skips Sunday), in IST.
  const openDays = (count = 6) => {
    const base = FS.nowIST().date; const out = [];
    for (let o = 1; out.length < count && o < 14; o++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + o);
      if (FS.hours.days[d.getDay()]) out.push({ o, d });
    }
    return out;
  };
  const DAYS = openDays();
  const dayLabel = (d) => d.toLocaleDateString(LANG === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" });
  let dayPick = 0;
  const renderDateChips = () => {
    $("#dateChips").innerHTML = DAYS.map((x, i) => `<button class="chip" type="button" role="radio" aria-checked="${i === dayPick}" data-day="${i}">${dayLabel(x.d)}</button>`).join("");
  };
  renderDateChips();
  $("#batchChips").addEventListener("click", (e) => { const b = e.target.closest("[data-batch]"); if (!b) return; batch = b.dataset.batch; $$("#batchChips .chip").forEach((c) => c.setAttribute("aria-checked", String(c === b))); updateCard(); });
  $("#dateChips").addEventListener("click", (e) => { const b = e.target.closest("[data-day]"); if (!b) return; dayPick = +b.dataset.day; $$("#dateChips .chip").forEach((c) => c.setAttribute("aria-checked", String(c === b))); updateCard(); });

  const cleanPhone = (v) => { let d = String(v).replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1); return d; };
  const validPhone = (v) => /^[6-9]\d{9}$/.test(cleanPhone(v));
  const fmtPhone = (v) => { const d = cleanPhone(v); return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : v; };
  const admissionNo = () => {
    const nm = fName.value.trim();
    if (!nm) return "FS/26/····";
    return `FS/26/${String((hash(nm.toLowerCase() + cleanPhone(fPhone.value)) % 9000) + 1000)}`;
  };
  function barcode(seedStr) {
    const r = rng(hash(seedStr || "fitness solutions"));
    let x = 0, out = "";
    while (x < 196) { const w = 1 + Math.floor(r() * 3); out += `<rect x="${x}" y="0" width="${w}" height="36" />`; x += w + 1 + Math.floor(r() * 3); }
    $("#cBarcode").innerHTML = out;
  }
  const course = () => COURSES.find((c) => c.id === fCourse.value) || COURSES[0];
  const batchObj = () => BATCHES.find((b) => b.id === batch);
  function updateCard() {
    const nm = fName.value.trim();
    const cName = $("#cName");
    cName.textContent = nm || t("yourName");
    cName.classList.toggle("is-empty", !nm);
    $("#cInitials").textContent = nm ? FS.initials(nm) : "FS";
    const c = course();
    $("#cCourse").textContent = `${c.code} · ${c.title}`;
    const b = batchObj();
    $("#cBatch").textContent = LANG === "hi" ? HI[`batch.${b.id}`] : b.label;
    $("#cDate").textContent = `${dayLabel(DAYS[dayPick].d)}, ${FS.fmtTime(b.time)}`;
    $("#cNo").textContent = admissionNo();
    const p = FS.plans.find((x) => x.id === fPlan.value);
    $("#cPlan").textContent = p ? `${LANG === "hi" ? HI[`plan.${p.id}`] : p.name} · ${FS.money(p.price)}` : "—";
    barcode(nm + cleanPhone(fPhone.value));
  }
  [fName, fPhone, fCourse, fPlan, fAge].forEach((el) => el.addEventListener("input", () => {
    updateCard();
    if (el.getAttribute("aria-invalid") === "true") validateField(el);
  }));
  function validateField(el) {
    if (el === fName) {
      const ok = fName.value.trim().length >= 2;
      fName.setAttribute("aria-invalid", String(!ok)); $("#fNameErr").textContent = ok ? "" : t("errName"); return ok;
    }
    if (el === fPhone) {
      const ok = validPhone(fPhone.value);
      fPhone.setAttribute("aria-invalid", String(!ok)); $("#fPhoneErr").textContent = ok ? "" : t("errPhone"); return ok;
    }
    return true;
  }
  let issued = null;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const okN = validateField(fName), okP = validateField(fPhone);
    const status = $("#formStatus");
    if (!okN || !okP) {
      status.textContent = t("errFix"); status.classList.add("is-error");
      (okN ? fPhone : fName).focus();
      return;
    }
    status.classList.remove("is-error");
    updateCard();
    const c = course(), b = batchObj(), d = DAYS[dayPick];
    issued = { no: admissionNo(), name: fName.value.trim(), phone: fmtPhone(fPhone.value), c, b, d, plan: FS.plans.find((x) => x.id === fPlan.value), age: fAge.value };
    status.textContent = t("issued", issued.no);
    const card = $("#admitCard");
    card.classList.remove("is-stamped"); void card.offsetWidth; card.classList.add("is-stamped");
    $("#cardActions").hidden = false;
    $("#cWa").href = FS.wa(`Hi Fitness Solutions! I'd like my free trial session.\nName: ${issued.name}\nPhone: ${issued.phone}\nAge group: ${issued.age}\nProgramme: ${c.code} ${c.title}\nBatch: ${b.label} (${FS.fmtTime(b.time)})\nDate: ${dayLabel(d.d)}\n${issued.plan ? `Membership interest: ${issued.plan.name}\n` : ""}Admit card: ${issued.no}`);
    if (window.innerWidth < 1024) goTo("#admitCard");
  });
  $("#cPrint").addEventListener("click", () => {
    let area = $("#printArea");
    if (!area) { area = document.createElement("div"); area.id = "printArea"; document.body.appendChild(area); }
    const clone = $("#admitCard").cloneNode(true);
    clone.removeAttribute("id"); $$("[id]", clone).forEach((n) => n.removeAttribute("id"));
    area.innerHTML = "";
    area.appendChild(clone);
    const note = document.createElement("p"); note.className = "print__note";
    note.textContent = `${FS.brand.name} · ${FS.contact.address}, ${FS.contact.cityLine} · ${FS.contact.phone}`;
    area.appendChild(note);
    window.print();
  });
  $("#cCal").addEventListener("click", () => {
    if (!issued) return;
    FS.ics({ title: `Free trial — ${issued.c.title} · Fitness Solutions`, start: FS.istDate(issued.d.o, issued.b.time), minutes: 60, details: `Admit card ${issued.no}\nProgramme: ${issued.c.code} ${issued.c.title}\nBring this card, or just your name, to the front desk.` });
  });
  $("#cEdit").addEventListener("click", () => { goTo("#admission"); setTimeout(() => fName.focus({ preventScroll: true }), 500); });
  function flashCard() { const c = $("#admitCard"); c.classList.remove("is-flash"); void c.offsetWidth; c.classList.add("is-flash"); }
  function enrolIn(id) {
    fCourse.value = id; updateCard(); goTo("#apply"); flashCard();
    setTimeout(() => fName.focus({ preventScroll: true }), 900);
  }

  /* =========================================================================
     IX. Visiting
     ========================================================================= */
  const C = FS.contact;
  $("#addr").innerHTML = `Fitness Solutions<br>${esc(C.address)}<small>${esc(C.locality)}<br>${esc(C.cityLine)}</small>`;
  function renderHours() {
    const today = FS.nowIST().day;
    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#hours tbody").innerHTML = order.map((d) => {
      const h = FS.hours.days[d];
      return `<tr class="${d === today ? "is-today" : ""}"><td>${t("days")[d]}${d === today ? ` <small>(${t("today")})</small>` : ""}</td><td>${h ? `${FS.fmtTime(h[0])} – ${FS.fmtTime(h[1])}` : t("closed")}</td></tr>`;
    }).join("");
  }
  $("#visitActions").innerHTML = `
    <a class="btn btn--ink btn--sm" href="${C.mapsUrl}" target="_blank" rel="noopener"><span data-i18n="v.dir">Directions</span> ↗</a>
    <a class="btn btn--line btn--sm" href="${C.phoneHref}"><span data-i18n="v.call">Call</span></a>
    <a class="btn btn--line btn--sm" href="${FS.wa("Hi Fitness Solutions! I'd like to visit the campus.")}" target="_blank" rel="noopener"><span data-i18n="v.wa">WhatsApp</span></a>
    <a class="btn btn--line btn--sm" href="mailto:${C.email}?subject=${encodeURIComponent("Campus visit — Fitness Solutions")}"><span data-i18n="v.mail">Email</span></a>
    <p class="libcard__social"><a href="${C.instagram.url}" target="_blank" rel="noopener">Instagram ${esc(C.instagram.handle)}</a>${TAG("confirm")}<a href="${C.facebook.url}" target="_blank" rel="noopener">Facebook</a></p>`;
  $("#mapOpen").href = C.mapsUrl;
  // Schematic map plate (not to scale), engraved like a prospectus map: hatched blocks on a graph-paper ground,
  // cased roads with their names set along them, and the way in marked in red pen — along Saharanpur Road, through
  // Laxman Chowk, down Malviya Road to the club — then the plot is ringed and its name highlighted. The plate fills
  // its frame (slice), so everything that matters sits in the middle; the road names come from the address.
  const ROAD = (String(C.locality).match(/near (.+)$/) || [, "Saharanpur Road"])[1];
  const SAH = "M-40 486 C 80 436, 196 334, 300 252 S 500 104, 640 62";
  const MAL = "M300 252 C 336 300, 372 338, 398 372 S 448 470, 476 600";
  const ROUTE = "M-40 486 C 80 436, 196 334, 300 252 C 336 300, 372 338, 398 372";
  const blocks = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    const x = -84 + i * 86, y = -52 + j * 78;
    if (i === 2 && j === 2) blocks.push(`<rect class="mp-park" x="${x}" y="${y}" width="66" height="58" rx="3" />`);
    else blocks.push(`<rect class="mp-blk" x="${x}" y="${y}" width="${66 - ((i + j) % 3) * 6}" height="${58 - ((i * 2 + j) % 3) * 5}" rx="2" />`);
  }
  $("#mapPlate").innerHTML = `
    <title id="mapPlateT">Schematic map, not to scale: along ${esc(ROAD)}, through Laxman Chowk, down Malviya Road to Fitness Solutions, Plot No. 6</title>
    <defs>
      <pattern id="mpGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="rgba(23,20,15,.06)" stroke-width="1" /></pattern>
      <pattern id="mpHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(23,20,15,.16)" stroke-width="1.1" /></pattern>
      <pattern id="mpStip" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(31,74,58,.42)" /><circle cx="6" cy="6" r="1" fill="rgba(31,74,58,.42)" /></pattern>
      <path id="mpSah" d="${SAH}" /><path id="mpMal" d="${MAL}" />
      <mask id="mpMask" maskUnits="userSpaceOnUse" x="-60" y="-60" width="720" height="680"><path class="mp-routemask" pathLength="1" d="${ROUTE}" /></mask>
    </defs>
    <rect x="-60" y="-60" width="720" height="680" fill="#F6F0E3" /><rect x="-60" y="-60" width="720" height="680" fill="url(#mpGrid)" />
    <g transform="rotate(-14 300 280)">${blocks.join("")}</g>
    <use href="#mpSah" class="mp-case" stroke-width="31" /><use href="#mpSah" class="mp-fill" stroke-width="28" />
    <use href="#mpMal" class="mp-case" stroke-width="23" /><use href="#mpMal" class="mp-fill" stroke-width="20" />
    <circle cx="300" cy="252" r="28" fill="#F6F0E3" stroke="rgba(23,20,15,.6)" stroke-width="1.5" />
    <circle cx="300" cy="252" r="10" fill="url(#mpHatch)" stroke="rgba(23,20,15,.55)" stroke-width="1" />
    <text class="mp-road"><textPath href="#mpSah" startOffset="31%"><tspan dy="-20">${esc(ROAD)}</tspan></textPath></text>
    <text class="mp-road mp-road--sm"><textPath href="#mpMal" startOffset="53%"><tspan dy="-15">Malviya Road</tspan></textPath></text>
    <text class="mp-area" x="268" y="236" text-anchor="end">Laxman Chowk</text>
    <text class="mp-area mp-area--soft" x="170" y="494">Indresh Nagar</text>
    <path class="mp-route" d="${ROUTE}" mask="url(#mpMask)" />
    <g class="mp-compass" transform="translate(436 104)"><path d="M0 -26 L7 6 L0 1 L-7 6 Z" /><path class="mp-compass__half" d="M0 -26 L0 1 L-7 6 Z" /><text y="-32" text-anchor="middle">N</text></g>
    <rect class="mp-hl" id="mpHl" x="232" y="389" width="140" height="13" />
    <text class="mp-name" id="mpName" x="370" y="399" text-anchor="end">Fitness Solutions</text>
    <text class="mp-plot" x="370" y="416" text-anchor="end">Plot No. 6</text>
    <path class="mp-pen" pathLength="1" d="M431 330 C 444 360, 424 394, 394 394 C 362 394, 354 360, 366 336 C 380 310, 420 308, 438 342" />
    <g class="mp-pin"><path d="M398 372 c-13 -15 -19 -24 -19 -32 a19 19 0 0 1 38 0 c0 8 -6 17 -19 32z" /><circle cx="398" cy="340" r="6.5" /></g>`;
  // the highlighter fits the name once the serif has loaded
  const fitHl = () => { const n = $("#mpName"), h = $("#mpHl"); if (!n || !h) return; try { const b = n.getBBox(); h.setAttribute("x", (b.x - 5).toFixed(1)); h.setAttribute("width", (b.width + 10).toFixed(1)); } catch (e) { /* not rendered yet */ } };
  fitHl(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHl);
  matchMedia("(max-width: 743px)").addEventListener("change", () => requestAnimationFrame(fitHl)); // phones set the name larger

  $("#faq").innerHTML = FS.faqs.items.map((f) => `<details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}${f.sample ? " " + TAG("sample") : ""}</p></details>`).join("");
  $("#footAddr").innerHTML = `${esc(C.address)},<br>${esc(C.cityLine)}`;
  $("#footHours").textContent = `${FS.hours.label} · ${FS.hours.sunday}`;
  $("#footContact").innerHTML = `
    <li><a href="${C.phoneHref}">☎ ${esc(C.phone)}</a></li>
    <li><a href="${FS.wa()}" target="_blank" rel="noopener">WhatsApp ${esc(C.whatsapp)}</a></li>
    <li><a href="mailto:${C.email}">${esc(C.email)}</a></li>
    <li><a href="${C.instagram.url}" target="_blank" rel="noopener">Instagram ${esc(C.instagram.handle)}</a></li>
    <li><a href="${C.facebook.url}" target="_blank" rel="noopener">Facebook</a></li>
    <li><a href="${C.mapsUrl}" target="_blank" rel="noopener">Directions ↗</a></li>`;
  $("#menuCall").href = C.phoneHref;

  /* =========================================================================
     Dialogs: campus tour, member video, lightbox
     ========================================================================= */
  let lastFocus = null;
  function openDialog(d) {
    lastFocus = document.activeElement;
    if (lenis) lenis.stop();
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  function closeDialog(d) {
    if (d.open) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
  }
  $$("dialog").forEach((d) => {
    d.setAttribute("data-lenis-prevent", "");
    d.addEventListener("close", () => {
      if (lenis) lenis.start();
      const v = $("video", d); if (v) v.pause();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { e.preventDefault(); closeDialog(d); return; }
      if (e.target === d) closeDialog(d); // click on the backdrop
    });
  });

  // Campus tour
  const tour = $("#tourModal");
  const TOUR_TIMES = ["07:00", "11:00", "18:00"];
  let tourDay = 0, tourTime = 2, tourBooked = null;
  const renderTourChips = () => {
    $("#tourDays").innerHTML = DAYS.map((x, i) => `<button class="chip" type="button" role="radio" aria-checked="${i === tourDay}" data-tday="${i}">${dayLabel(x.d)}</button>`).join("");
    $("#tourTimes").innerHTML = TOUR_TIMES.map((tm, i) => `<button class="chip" type="button" role="radio" aria-checked="${i === tourTime}" data-ttime="${i}">${FS.fmtTime(tm)}</button>`).join("");
  };
  renderTourChips();
  $("#tourDays").addEventListener("click", (e) => { const b = e.target.closest("[data-tday]"); if (!b) return; tourDay = +b.dataset.tday; $$("#tourDays .chip").forEach((c) => c.setAttribute("aria-checked", String(c === b))); });
  $("#tourTimes").addEventListener("click", (e) => { const b = e.target.closest("[data-ttime]"); if (!b) return; tourTime = +b.dataset.ttime; $$("#tourTimes .chip").forEach((c) => c.setAttribute("aria-checked", String(c === b))); });
  $$("[data-open-tour]").forEach((b) => b.addEventListener("click", () => {
    $("#tourStep").hidden = false; $("#tourDone").hidden = true;
    if (fName.value && !$("#tName").value) $("#tName").value = fName.value;
    if (fPhone.value && !$("#tPhone").value) $("#tPhone").value = fPhone.value;
    openDialog(tour);
    setTimeout(() => $("#tName").focus(), 60);
  }));
  $("#tourForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const n = $("#tName"), p = $("#tPhone");
    const okN = n.value.trim().length >= 2, okP = validPhone(p.value);
    n.setAttribute("aria-invalid", String(!okN)); p.setAttribute("aria-invalid", String(!okP));
    $("#tNameErr").textContent = okN ? "" : t("errName");
    $("#tPhoneErr").textContent = okP ? "" : t("errPhone");
    if (!okN || !okP) { (okN ? p : n).focus(); return; }
    const d = DAYS[tourDay], tm = TOUR_TIMES[tourTime];
    tourBooked = { name: n.value.trim(), phone: fmtPhone(p.value), d, tm };
    $("#tourDoneTitle").textContent = t("seeYou");
    $("#tourSummary").textContent = t("tourSummary", dayLabel(d.d), FS.fmtTime(tm), tourBooked.name.split(" ")[0]);
    $("#tourWa").href = FS.wa(`Hi Fitness Solutions! I've booked a campus tour.\nName: ${tourBooked.name}\nPhone: ${tourBooked.phone}\nWhen: ${dayLabel(d.d)}, ${FS.fmtTime(tm)}`);
    $("#tourStep").hidden = true; $("#tourDone").hidden = false;
    $("#tourCal").focus();
  });
  $("#tourCal").addEventListener("click", () => {
    if (!tourBooked) return;
    FS.ics({ title: "Campus tour — Fitness Solutions", start: FS.istDate(tourBooked.d.o, tourBooked.tm), minutes: 30, details: `Campus tour for ${tourBooked.name}. Meet a coach at the front desk.` });
  });

  // Member video
  const vModal = $("#videoModal"), vEl = $("#voiceVideo");
  $("#voicePlay").addEventListener("click", () => {
    if (!vEl.src) { vEl.poster = FS.poster("voice-senior"); vEl.src = FS.vid("voice-senior"); }
    openDialog(vModal);
    const pr = vEl.play(); if (pr && pr.catch) pr.catch(() => {});
  });

  // Lightbox
  const lb = $("#lightbox");
  let lbI = 0;
  const lbShow = (i) => {
    lbI = (i + PLATES.length) % PLATES.length;
    const [k, cap] = PLATES[lbI];
    const im = $("#lbImg"); im.src = FS.img(k); im.alt = cap;
    $("#lbCap").innerHTML = `<span class="plate-cap__n">${t("plate")} ${roman(lbI + 7)}.</span> ${esc(cap)}`;
  };
  $("#essay").addEventListener("click", (e) => { const b = e.target.closest("[data-plate]"); if (!b) return; lbShow(+b.dataset.plate); openDialog(lb); });
  $("#lbPrev").addEventListener("click", () => lbShow(lbI - 1));
  $("#lbNext").addEventListener("click", () => lbShow(lbI + 1));
  lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") lbShow(lbI - 1); if (e.key === "ArrowRight") lbShow(lbI + 1); });
  let tx0 = null;
  lb.addEventListener("touchstart", (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { if (tx0 == null) return; const dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1)); tx0 = null; });

  /* =========================================================================
     Nav, menu, language, running head
     ========================================================================= */
  const burger = $("#burger"), menu = $("#menu");
  const setMenu = (open) => {
    menu.hidden = !open; burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close contents" : "Open contents");
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); } });

  function setLang(lang) {
    LANG = lang === "hi" ? "hi" : "en";
    root.lang = LANG;
    try { localStorage.setItem("fs-lang-b", LANG); } catch (e) {}
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
    applyLang();
    // dynamic bits
    $("#coverDeck").textContent = LANG === "hi" ? HI["hero.deck"] : `${YW[0]} years of teaching Dehradun to train.`;
    renderStatus(); renderHours(); applyFilters(); ybHud(ybIndex); renderDateChips(); renderTourChips();
    // The phone layout labels each fee figure from data-label: keep those in the chosen language too.
    $$(".fee__unit").forEach((td, i) => { const k = i % 2 ? "fee.day" : "fee.month"; td.dataset.label = LANG === "hi" ? HI[k] : (i % 2 ? "Per day" : "Per month"); });
    $$('[data-sched="floor"]').forEach((el) => { el.textContent = t("openFloor"); });
    $$('[data-sched="appt"]').forEach((el) => { el.textContent = t("byAppt"); });
    $$("[data-enrol]").forEach((b) => { b.textContent = t("enrol", COURSES.find((c) => c.id === b.dataset.enrol).code); });
    const pv = fPlan.value; fPlan.innerHTML = planOptions(); fPlan.value = pv;
    renderFloor(floorIdx); updateCard(); setRunhead(currentCh);
    $("#essayCount").textContent = LANG === "hi" ? `${PLATES.length} प्लेट` : `${PLATES.length} plates`;
    $$(".plate .plate-cap__n").forEach((n, i) => { n.textContent = `${t("plate")} ${roman(i + 7)}.`; });
    // Every numbered caption follows the language: Plates I–VI (cover, almanac, faculty) and the course figures.
    $$("[data-pn]").forEach((n) => { n.textContent = `${t("plate")} ${n.dataset.pn}.`; });
    $$("[data-fig]").forEach((n) => { n.textContent = `${LANG === "hi" ? "चित्र" : "Fig."} ${n.dataset.fig}.`; });
    inkAll(); renderTicker(); setFolios();
    refreshST();
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  let currentCh = "top";
  const turnOver = (el) => {
    if (RM || !el.animate) return;
    el.animate([{ transform: "translateY(70%)", clipPath: "inset(0 0 70% 0)", opacity: .2 }, { transform: "none", clipPath: "inset(0 0 0 0)", opacity: 1 }],
      { duration: 520, easing: "cubic-bezier(.22, .9, .24, 1)" });
  };
  function setRunhead(id) {
    if (id !== currentCh) { turnOver($("#runChapter")); turnOver($("#runFolio")); }
    currentCh = id;
    const c = CHAPTERS.find((x) => x.id === id) || CHAPTERS[0];
    $("#runChapter").innerHTML = `${c.n ? `<b>${c.n}</b>` : ""}${LANG === "hi" ? c.hi : c.en}`;
    $("#runFolio").textContent = `p. ${c.p}`;
    $$("#rail a").forEach((a) => a.classList.toggle("is-current", a.dataset.ch === id));
    $$(".nav__links a").forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${id}`));
    $("#rail").classList.toggle("is-visible", id !== "top");
  }
  const chObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setRunhead(en.target.dataset.chapter === "cover" ? "top" : en.target.id); });
  }, { rootMargin: "-46% 0px -52% 0px" });
  $$("main > section").forEach((s) => chObs.observe(s));
  new IntersectionObserver(([en]) => $("#rail").classList.toggle("is-off", en.isIntersecting), { rootMargin: "0px 0px -35% 0px" }).observe($(".colophon"));
  // The full-bleed yearbook owns the margins while it's on screen.
  new IntersectionObserver(([en]) => $("#rail").classList.toggle("is-hushed", en.isIntersecting), { rootMargin: "-18% 0px -18% 0px" }).observe($("#yearbook"));

  const runProgress = $("#runProgress");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      runProgress.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max, 0, 1) : 0})`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* =========================================================================
     Reveals, counters, video in view
     ========================================================================= */
  // A photograph is mounted only once it is decoded, so it never settles in as an empty frame.
  function mountPhoto(el) {
    const im = el.querySelector("img"), show = () => el.classList.add("in");
    if (!im) return show();
    const decode = () => (im.decode ? im.decode() : Promise.resolve()).then(show, show);
    if (im.complete) return void decode();
    im.addEventListener("load", decode, { once: true });
    im.addEventListener("error", show, { once: true });
    setTimeout(show, 2500);
  }
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      if (en.target.matches(".develop")) { revealObs.unobserve(en.target); mountPhoto(en.target); return; }
      en.target.classList.add("in");
      if (en.target.matches(".almanac")) countUp(en.target);
      if (en.target.matches(".report")) countKg(en.target);
      revealObs.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .reveal-card, .letter, .almanac, .hl, .feebook, .report, .ch-head, .catalog, .develop, .mnote:not(.mnote--cover)").forEach((el) => revealObs.observe(el));
  function countUp(scope) {
    if (RM) return;
    $$(".count", scope).forEach((el) => {
      const to = +el.dataset.to, t0 = performance.now(), dur = 1300;
      const step = (now) => { const p = clamp((now - t0) / dur, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  function countKg(card) {
    const n = $(".report__n", card); if (!n || RM) return;
    const to = +n.dataset.to, k = +getComputedStyle(card).getPropertyValue("--k") || 0, t0 = performance.now() + 450 + k * 95, dur = 1100;
    n.textContent = "0";
    const step = (now) => { const p = clamp((now - t0) / dur, 0, 1); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  // Loop videos play only while in view
  const vidObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting && !document.hidden) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    });
  }, { threshold: 0.15 });
  vidObs.observe(coverVideo);
  if (RM) coverVideo.removeAttribute("loop");

  /* =========================================================================
     Smooth scroll + scroll-driven motion (GSAP/Lenis when available)
     ========================================================================= */
  let lenis = null;
  const headH = () => $("#nav").getBoundingClientRect().height;
  function goTo(sel) {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -headH() - 12, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headH() - 12, behavior: RM ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    if (id === "#top") { lenis ? lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }); }
    else goTo(el);
    history.replaceState(null, "", id);
  });

  function refreshST() { if (HAS_GSAP) window.ScrollTrigger.refresh(); }

  const yb = $("#yearbook");
  const canPin = () => HAS_GSAP && !RM && FINE && window.innerWidth >= 1024;
  let ybST = null;
  function setupYearbook() {
    if (ybST) { ybST.scrollTrigger && ybST.scrollTrigger.kill(); ybST.kill(); ybST = null; window.gsap.set(ybTrack, { clearProps: "x" }); }
    ybGeo = null;
    yb.classList.toggle("is-pinned", canPin());
    if (canPin()) {
      const dist = () => Math.max(0, ybTrack.scrollWidth - window.innerWidth);
      // scrub: true, so the spread tracks the scroll exactly (a smoothed scrub made the photos trail behind it).
      ybST = window.gsap.to(ybTrack, {
        x: () => -dist(), ease: "none", onUpdate: () => ybTurn(),
        scrollTrigger: {
          trigger: yb, start: "top top", end: () => "+=" + dist() * 1.1, pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1, onRefresh: () => ybTurn(true),
        },
      });
    }
    ybTurn(true);
  }
  // Swipe mode: native horizontal scroll with the page-turn effect and arrow buttons.
  ybTrack.addEventListener("scroll", () => { if (!yb.classList.contains("is-pinned")) requestAnimationFrame(() => ybTurn()); }, { passive: true });
  window.addEventListener("resize", () => { ybGeo = null; }, { passive: true });
  const ybGo = (dir) => {
    const i = clamp(ybIndex + dir, 0, ybPages.length - 1);
    const p = ybPages[i];
    ybTrack.scrollTo({ left: p.offsetLeft - (ybTrack.clientWidth - p.offsetWidth) / 2, behavior: RM ? "auto" : "smooth" });
  };
  $("#ybPrev").addEventListener("click", () => ybGo(-1));
  $("#ybNext").addEventListener("click", () => ybGo(1));

  if (HAS_GSAP && !RM) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", onScroll);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    // Seal turns as you leave the cover; the footer seal turns as it arrives
    gsap.to("#coverSeal", { rotation: 240, ease: "none", scrollTrigger: { trigger: ".cover", start: "top top", end: "bottom top", scrub: 0.8 } });
    gsap.fromTo(".seal--foot", { rotation: -60 }, { rotation: 30, ease: "none", scrollTrigger: { trigger: ".colophon", start: "top bottom", end: "bottom bottom", scrub: 0.8 } });
    // Arch: the video settles as the plate scrolls through
    gsap.fromTo(coverVideo, { scale: 1.06, yPercent: -1.5 }, { scale: 1, yPercent: 1.5, ease: "none", scrollTrigger: { trigger: ".arch", start: "top bottom", end: "bottom top", scrub: 0.6 } });
    // Chapter numerals drift a little against the heading
    $$(".ch-num").forEach((n) => gsap.fromTo(n, { yPercent: 18 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: n, start: "top bottom", end: "bottom top", scrub: 0.6 } }));
    setupYearbook();
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      lastW = window.innerWidth;
      const want = canPin();
      if (want !== yb.classList.contains("is-pinned")) { setupYearbook(); ScrollTrigger.refresh(); }
    });
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    ybTurn(true);
  }


  /* =========================================================================
     Motion (revamp): ink-set headings, chapter turns, newsprint ticker, cursor polaroid, dealt cards.
     Everything plays once on arrival; the ticker is the only ambient motion and it pauses off-screen.
     ========================================================================= */
  // Ink-set headings: wrap every word so it can be wiped on like fresh type. Re-run after a language switch.
  function inkSplit(el) {
    if (!el || el.querySelector(".w")) return;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const w = document.createElement("span"); w.className = "w"; w.textContent = part; frag.appendChild(w); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) walk(n);
      });
    };
    walk(el);
    $$(".w", el).forEach((w, k) => w.style.setProperty("--k", k));
    el.classList.add("ink");
  }
  function inkAll() { if (!RM) $$(".cover__title, .ch-title").forEach(inkSplit); }

  // Chapter turns: numeral stamped (with an ink spread), rule drawn across, folio slid in.
  $$(".ch-num").forEach((n) => { n.innerHTML = `<i class="ink-ring" aria-hidden="true"></i><span class="ch-num__i">${n.textContent}</span>`; });
  function setFolios() {
    CHAPTERS.forEach((c) => { const sec = document.getElementById(c.id); if (sec && sec.classList.contains("chapter")) sec.dataset.folio = `${LANG === "hi" ? "पृ." : "p."} ${c.p}`; });
  }
  setFolios();
  const turnObs = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-turned"); turnObs.unobserve(en.target); } }), { rootMargin: "0px 0px -12% 0px" });
  $$(".chapter").forEach((c) => turnObs.observe(c));
  const almFig = $(".almanac__fig"); almFig.classList.add("develop"); revealObs.observe(almFig);

  // Newsprint ticker: a compositor animation at a steady pace.
  const ticker = $("#ticker"), tTrack = $("#tickerTrack");
  const fit = FS.ratings.find((r) => /fitpass/i.test(r.source)) || FS.ratings[0];
  const dateline = () => FS.nowIST().date.toLocaleDateString(LANG === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" });
  const TICK = {
    en: () => [["Today", dateline()], ["Admissions", "open for 2026–27"], ["Batches", "morning, evening & women's"], ["FS 001", "InBody assessment with every membership"],
      ["Campus", "four floors · 80+ stations"], ["Rated", `${fit.score.toFixed(1)}★ on ${fit.source}`], ["Trial", "your first session is on us"], ["Since", "2009 · Laxman Chowk, Dehradun"]],
    hi: () => [["आज", dateline()], ["प्रवेश", "2026–27 के लिए शुरू"], ["बैच", "सुबह, शाम और महिला बैच"], ["FS 001", "हर सदस्यता के साथ InBody जाँच"],
      ["कैंपस", "चार मंज़िलें · 80+ स्टेशन"], ["रेटिंग", `${fit.source} पर ${fit.score.toFixed(1)}★`], ["ट्रायल", "पहला सत्र हमारी ओर से"], ["स्थापना", "2009 · लक्ष्मण चौक, देहरादून"]],
  };
  let tAnim = null, tVisible = false, tRate = 1, tDecaying = false, tLastY = window.scrollY, tLastT = performance.now(), tHover = false;
  const setRate = (r) => { if (!tAnim) return; if (tAnim.updatePlaybackRate) tAnim.updatePlaybackRate(r); else tAnim.playbackRate = r; };
  const tickerShouldRun = () => tVisible && !document.hidden && !tHover;
  function startTicker() {
    if (tAnim) { tAnim.cancel(); tAnim = null; }
    if (RM || !tTrack.animate) return;
    const w = tTrack.firstElementChild.getBoundingClientRect().width;
    if (!w) return;
    tAnim = tTrack.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-w}px,0,0)` }], { duration: (w / 40) * 1000, iterations: Infinity });
    if (!tickerShouldRun()) tAnim.pause();
  }
  function renderTicker() {
    const run = TICK[LANG]().map(([b, txt]) => `<span class="ticker__item"><b>${esc(b)}</b>${esc(txt)}</span><span class="ticker__sep" aria-hidden="true">✦</span>`).join("");
    tTrack.innerHTML = `<div class="ticker__run">${run}</div><div class="ticker__run" aria-hidden="true">${run}</div>`;
    startTicker();
  }
  function tickerDecay(now) {
    const dt = Math.min(64, now - tLastT); tLastT = now;
    tRate = 1 + (tRate - 1) * Math.pow(0.9, dt / 16.7);
    if (tRate < 1.03) { tRate = 1; tDecaying = false; }
    setRate(tRate);
    if (tDecaying) requestAnimationFrame(tickerDecay);
  }
  // The ticker keeps a steady pace; tying its speed to scrolling read as stutter on high-refresh screens.
  const TICKER_FOLLOWS_SCROLL = false;
  window.addEventListener("scroll", () => {
    if (!TICKER_FOLLOWS_SCROLL) return;
    const now = performance.now(), y = window.scrollY;
    const v = Math.abs(y - tLastY) / Math.max(8, now - tLastT);
    tLastY = y;
    if (!tAnim || !tickerShouldRun()) { tLastT = now; return; }
    const target = 1 + Math.min(v * 2.4, 6);
    if (target > tRate + 0.05) { tRate = target; setRate(tRate); }
    if (!tDecaying) { tDecaying = true; tLastT = now; requestAnimationFrame(tickerDecay); } else tLastT = Math.min(tLastT, now);
  }, { passive: true });
  new IntersectionObserver(([en]) => { tVisible = en.isIntersecting; if (tAnim) tickerShouldRun() ? tAnim.play() : tAnim.pause(); }).observe(ticker);
  document.addEventListener("visibilitychange", () => { if (tAnim) tickerShouldRun() ? tAnim.play() : tAnim.pause(); });
  ticker.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { tHover = true; if (tAnim) tAnim.pause(); } });
  ticker.addEventListener("pointerleave", () => { tHover = false; if (tAnim && tickerShouldRun()) tAnim.play(); });
  let tW = window.innerWidth;
  window.addEventListener("resize", () => { if (Math.abs(window.innerWidth - tW) > 30) { tW = window.innerWidth; startTicker(); } });

  // Curriculum preview: a polaroid of the hovered course follows the cursor (fine pointers, wide screens only).
  const POL_MQ = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
  const pol = $("#polaroid"), polImg = $("#polImg"), polCap = $("#polCap");
  const P = { x: 0, y: 0, tx: 0, ty: 0, w: 220, h: 300, on: false, raf: 0, last: 0, row: null, hideT: 0 };
  const polTarget = (e) => {
    P.tx = clamp(e.clientX + 30, 8, window.innerWidth - P.w - 8);
    P.ty = clamp(e.clientY - P.h * 0.5, headH() + 8, window.innerHeight - P.h - 8);
  };
  function polLoop(now) {
    const dt = Math.min(48, now - (P.last || now)); P.last = now;
    const k = 1 - Math.pow(0.78, dt / 16.7);
    const dx = P.tx - P.x, dy = P.ty - P.y;
    P.x += dx * k; P.y += dy * k;
    const r = clamp(dx * 0.07, -9, 9);
    pol.style.transform = `translate3d(${P.x.toFixed(1)}px, ${P.y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
    if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) P.raf = requestAnimationFrame(polLoop); else { P.raf = 0; P.last = 0; }
  }
  function polShow(li, e) {
    const c = COURSES.find((x) => `course-${x.id}` === li.id); if (!c) return;
    P.row = li; clearTimeout(P.hideT);
    polImg.src = FS.img(c.img, true);
    polCap.textContent = `${c.code} · ${c.title}`;
    pol.style.display = "block";
    P.w = pol.offsetWidth || P.w; P.h = pol.offsetHeight || P.h;
    if (!P.on) { polTarget(e); P.x = P.tx; P.y = P.ty + 14; pol.style.transform = `translate3d(${P.x}px, ${P.y}px, 0)`; }
    P.on = true;
    requestAnimationFrame(() => { if (P.on) pol.classList.add("is-on"); });
  }
  function polHide() {
    if (!P.on) return;
    P.on = false; P.row = null; pol.classList.remove("is-on");
    clearTimeout(P.hideT); P.hideT = setTimeout(() => { if (!P.on) { pol.style.display = "none"; polImg.removeAttribute("src"); } }, 280);
  }
  if (!RM) {
    $("#courses").addEventListener("pointermove", (e) => {
      if (!POL_MQ.matches || e.pointerType !== "mouse") return;
      const row = e.target.closest(".course__row"), li = row && row.closest(".course");
      const want = li && !li.classList.contains("is-open") ? li : null;
      if (want !== P.row) { if (want) polShow(want, e); else polHide(); }
      if (!P.on) return;
      polTarget(e);
      if (!P.raf) P.raf = requestAnimationFrame(polLoop);
    });
    $("#courses").addEventListener("pointerleave", polHide);
    window.addEventListener("scroll", () => { if (P.on) polHide(); }, { passive: true });
  }

  // Faculty: the index cards wait in a deck, then are dealt into the grid as the section arrives.
  const cardsEl = $("#faculty-cards"), icards = $$(".icard", cardsEl);
  let dealt = false;
  function deckUp() {
    if (dealt || RM) return;
    const cx = cardsEl.offsetWidth / 2, cy = Math.min(cardsEl.offsetHeight / 2, 240);
    const R = rng(11);
    icards.forEach((c, i) => {
      const x = c.offsetLeft + c.offsetWidth / 2, y = c.offsetTop + c.offsetHeight / 2;
      c.style.setProperty("--dx", `${(cx - x).toFixed(1)}px`);
      c.style.setProperty("--dy", `${(cy - y).toFixed(1)}px`);
      c.style.setProperty("--dr", `${((R() - 0.5) * 18).toFixed(1)}deg`);
      c.style.setProperty("--di", String(i));
      c.style.zIndex = String(i + 1);
    });
    cardsEl.classList.add("is-deck");
  }
  function deal() {
    if (dealt || RM) return;
    dealt = true;
    cardsEl.classList.remove("is-deck"); void cardsEl.offsetWidth;
    cardsEl.classList.add("is-dealing");
    icards.forEach((c) => { c.style.removeProperty("--dx"); c.style.removeProperty("--dy"); c.style.removeProperty("--dr"); });
    setTimeout(() => { cardsEl.classList.remove("is-dealing"); icards.forEach((c) => { c.style.zIndex = ""; }); }, 1900);
  }
  if (!RM) {
    deckUp();
    const dealObs = new IntersectionObserver(([en]) => { if (en.isIntersecting) { dealObs.disconnect(); deal(); } }, { rootMargin: "0px 0px -22% 0px" });
    dealObs.observe(cardsEl);
    let fW = window.innerWidth;
    window.addEventListener("resize", () => { if (!dealt && Math.abs(window.innerWidth - fW) > 30) { fW = window.innerWidth; cardsEl.classList.remove("is-deck"); deckUp(); } });
  }

  /* =========================================================================
     Loader + first paint
     ========================================================================= */
  applyLang();
  if (LANG === "hi") setLang("hi");
  renderStatus(); renderHours(); applyFilters(); renderFloor(floorIdx); updateCard(); setRunhead("top");
  inkAll(); renderTicker();
  setInterval(renderStatus, 60000);

  const loader = $("#loader");
  const loaderOn = !!loader && getComputedStyle(loader).display !== "none";
  if (loaderOn) {
    setTimeout(() => loader.classList.add("is-done"), 1450);
    setTimeout(() => loader.remove(), 2500);
  } else if (loader) loader.remove();
  // The cover is printed in sequence once the seal has been stamped (or straight away on a return visit).
  const coverEl = $(".cover");
  setTimeout(() => {
    coverEl.classList.add("in");
    setTimeout(() => $(".mnote--cover").classList.add("in"), RM ? 0 : 1700);
  }, loaderOn ? 1250 : 60);
})();
