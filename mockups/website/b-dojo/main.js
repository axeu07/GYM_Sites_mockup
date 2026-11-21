/* IKIGAI Fitness Club — Direction B "The Dojo" (道場).
   Renders the dojo handbook from window.IK and wires: the trial-pass (入門) generator, the course catalogue
   (seven ways in), the day-at-Ikigai album (pinned on desktop, swipeable on touch), the four-circle diagram,
   the EN/हिं toggle, dialogs and motion. Japanese appears as accents beside the English. */
(() => {
  const IK = window.IK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HAS_GSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  root.classList.add("js");
  if (RM) root.classList.add("rm");
  if (!IK) { root.classList.add("intro-seen"); return; }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const LANDSCAPE = new Set(["steam-room", "washroom", "air-bikes", "boxing-sign"]);
  const srcset = (k) => LANDSCAPE.has(k) ? `${IK.img(k, true)} 670w` : `${IK.img(k, true)} 800w, ${IK.img(k)} 1600w`;
  const roman = (n) => [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const TAG = (kind) => kind === "confirm"
    ? '<span class="tag tag--confirm" data-i18n="tag.confirm">To confirm</span>'
    : '<span class="tag tag--sample" data-i18n="tag.sample">Sample</span>';

  /* =========================================================================
     i18n — EN text lives in the DOM; HI replaces it. Dynamic strings use t().
     Japanese words stay in Japanese in both languages (they are the accent).
     ========================================================================= */
  let LANG = root.lang === "hi" ? "hi" : "en";
  const HI = {
    "brand.tag": "जीने की वजह ढूँढिए",
    "nav.history": "दिनचर्या", "nav.curriculum": "क्लासेज़", "nav.faculty": "कोच", "nav.campus": "चार वृत्त", "nav.fees": "शुल्क", "nav.apply": "फ़्री ट्रायल",
    "toc.title": "विषय-सूची", "toc.inside": "इस पुस्तिका में",
    "cta.apply": "फ़्री ट्रायल बुक करें", "cta.tour": "जिम देखने आएँ",
    "cover.prospectus": "डोजो पुस्तिका 2026", "cover.place": "जाखन, राजपुर रोड, देहरादून", "cover.est": "यूनिसेक्स · महिलाओं के लिए सहज",
    "hero.title1": "अपना", "hero.title2": '<em class="hl hl--draw">इकिगाई</em> खोजिए।',
    "hero.deck": "हिलने-डुलने की अपनी वजह ढूँढिए।",
    "hero.lede": "स्ट्रेंथ, कार्डियो, बॉक्सिंग, ज़ुम्बा, भांगड़ा, योग और स्टीम — सब एक छत के नीचे। एक यूनिसेक्स, महिलाओं के लिए सहज जिम, ऐसे लोगों के साथ जो आपको बार-बार वापस लाएँ। पहला दिन हमारी ओर से।",
    "cover.cap": "इकिगाई स्टूडियो में एक डांस क्लास।",
    "tag.confirm": "पुष्टि बाकी", "tag.sample": "उदाहरण", "tag.adapted": "उदाहरण · क्लब के अपने शब्दों पर आधारित", "tag.portraits": "पोर्ट्रेट जल्द", "tag.offer": "उदाहरण ऑफ़र", "tag.answers": "उत्तरों की पुष्टि बाकी",
    "ch.note": "入門 · शुरुआत से पहले", "h.note": "नए सदस्य के <em>नाम एक पत्र।</em>",
    "alm.h": "क्लब एक नज़र में", "alm.kit": "फ़्लोर पर", "alm.rated": "सदस्यों की रेटिंग", "alm.cap": "रात में डून ज़ोन टावर — पहली मंज़िल पर इकिगाई।",
    "ch.history": "一日 · इकिगाई में एक दिन", "h.history": "सुबह 6 से रात 10 तक, <em>पाँच अध्याय।</em>",
    "i.history": 'सुबह की पहली रेप से <span class="hl">रात की स्टीम तक</span> — पन्ना-दर-पन्ना एक दिन।',
    "yb.hint": "पन्ना पलटने के लिए स्क्रॉल करें →",
    "ch.curriculum": "道 · क्लासेज़", "h.curriculum": "सात रास्ते। <em>एक वजह।</em>",
    "i.curriculum": 'अपना लक्ष्य या प्रारूप चुनें, किसी क्लास का <span class="hl">चार हफ़्ते का सिलेबस</span> खोलें, फिर फ़्री ट्रायल बुक करें।',
    "f.goal": "लक्ष्य", "f.format": "प्रारूप", "c.code": "कोड", "c.course": "क्लास", "c.brief": "संक्षेप में", "c.format": "प्रारूप", "c.credits": "सत्र / सप्ताह", "c.intensity": "तीव्रता",
    "c.note": "क्लब द्वारा समय-सारिणी की पुष्टि होने तक सिलेबस और समय उदाहरण स्वरूप हैं।",
    "goal.all": "सभी लक्ष्य", "goal.lose": "वज़न घटाएँ", "goal.strong": "ताक़त बढ़ाएँ", "goal.box": "बॉक्सिंग सीखें", "goal.enjoy": "डांस और मस्ती", "goal.calm": "योग और मोबिलिटी",
    "fmt.all": "सभी प्रारूप", "fmt.class": "क्लास", "fmt.pt": "1:1", "fmt.floor": "ओपन फ़्लोर",
    "c.prereq": "यहीं से शुरुआत", "c.syll": "सिलेबस · 4 सप्ताह", "c.sched": "समय", "c.fac": "कोच", "c.team": "कोचिंग टीम",
    "ch.faculty": "先生 · कोच", "h.faculty": "ऐसे कोच <em>जो आपको नाम से जानते हैं।</em>",
    "i.faculty": '<span class="hl">रिव्यू में सबसे ज़्यादा तारीफ़ ट्रेनर्स की होती है</span> — दोस्ताना, योग्य और फ़ॉर्म पर ध्यान देने वाले। नाम और फ़ोटो क्लब से आएँगे।',
    "fac.atwork": "फ़्लोर पर", "fac.note": "पूरी साइट के लिए हर कोच का पोर्ट्रेट खींचा जाएगा।",
    "role.Coach": "कोच", "role.Ikigai Boxing Club": "इकिगाई बॉक्सिंग क्लब", "role.Gym floor": "जिम फ़्लोर", "role.Dance instructor": "डांस इंस्ट्रक्टर", "role.Yoga instructor": "योग इंस्ट्रक्टर", "role.Memberships & trials": "सदस्यता और ट्रायल",
    "ch.campus": "生き甲斐 · चार वृत्त", "h.campus": "चार वृत्त। <em>एक वजह।</em>",
    "i.campus": "इकिगाई वहाँ है जहाँ चार वृत्त मिलते हैं: जो आपको पसंद है, जिसमें आप अच्छे हैं, जिसकी दुनिया को ज़रूरत है और जिसकी आपको ज़रूरत है। किसी वृत्त को चुनें।",
    "essay.h": "क्लब की एक सैर",
    "floor.1": "आनंद", "floor.2": "शक्ति", "floor.3": "साथी", "floor.4": "आराम",
    "ch.alumni": "改善 · काइज़ेन", "h.alumni": "छोटे कदम। <em>असली नतीजे।</em>",
    "i.alumni": '<span class="hl">रिव्यू में बार-बार आने वाली चार बातें</span> — हमारे शब्दों में सार, उद्धरण नहीं। और क्लब के नोटिस बोर्ड से।',
    "alu.note": "Google और Justdial रिव्यू का सार; बिफ़ोर-आफ़्टर कहानियाँ सदस्यों की सहमति के बाद।", "alu.voices": "इकिगाई में एक दिन", "alu.voicecap": "ज़ुम्बा क्लास, आवाज़ के साथ।",
    "rep.card": "रिव्यू का विषय", "rep.name": "विषय", "rep.subject": "कांजी", "rep.stamp": "सार",
    "ch.fees": "約束 · शुल्क", "h.fees": "ख़ुद से <em>एक वादा।</em>", "i.fees": 'प्रीमियम जिम, लोकल दाम। <span class="hl">जितनी लंबी प्रतिबद्धता, उतना कम रोज़ का ख़र्च।</span>',
    "fee.duration": "अवधि", "fee.fee": "शुल्क", "fee.month": "प्रति माह", "fee.day": "प्रति दिन", "fee.includes": "सदस्यता में शामिल",
    "fee.fn1": "₹8,000 / 6 महीने और ₹12,000 / 12 महीने क्लब की रील्स में दिखे (ऑफ़र हो सकते हैं)। बाकी दाम पूछें।", "fee.fn2": "जीएसटी लागू अनुसार। पर्सनल ट्रेनिंग का शुल्क अलग।",
    "fee.pop": "सबसे किफ़ायती", "fee.choose": "चुनें",
    "plan.m1": "मासिक", "plan.m3": "3 महीने", "plan.m6": "6 महीने", "plan.m12": "12 महीने",
    "pline.m1": "अपनी दिनचर्या शुरू करें", "pline.m3": "आदत बनाइए", "pline.m6": "इसे ज़िंदगी का हिस्सा बनाइए", "pline.m12": "जीने लायक एक साल",
    "inc.0": "जिम फ़्लोर और कार्डियो", "inc.1": "ग्रुप क्लासेज़", "inc.2": "इकिगाई बॉक्सिंग क्लब ज़ोन", "inc.3": "स्टीम रूम और शावर", "inc.4": "लॉकर",
    "ch.apply": "入門 · फ़्री ट्रायल", "h.apply": "आपका पहला दिन <em>हमारी ओर से।</em>",
    "i.apply": 'फ़ॉर्म भरें और <span class="hl">अपना ट्रायल पास ख़ुद बनते देखें।</span> इसे — या सिर्फ़ अपना नाम — फ़्रंट डेस्क पर लाएँ।',
    "form.h": "फ़्री ट्रायल के लिए", "form.name": "पूरा नाम", "form.phone": "मोबाइल नंबर", "form.age": "आयु वर्ग", "form.plan": "सदस्यता (वैकल्पिक)",
    "form.course": "क्लास", "form.batch": "बैच", "form.date": "तारीख", "form.submit": "मेरा ट्रायल पास बनाएँ",
    "batch.morning": "सुबह", "batch.evening": "शाम", "batch.women": "महिला बैच",
    "card.title": "ट्रायल पास", "card.valid": "पहला दिन निःशुल्क", "card.photo": "फ़ोटो डेस्क पर", "card.name": "नाम", "card.course": "क्लास",
    "card.batch": "बैच", "card.date": "तारीख और समय", "card.no": "पास संख्या", "card.plan": "सदस्यता",
    "card.where": "फ़्रंट डेस्क पर दिखाएँ · 138/345, पहली मंज़िल, डून ज़ोन टावर, जाखन", "card.admitted": "स्वागत",
    "card.print": "प्रिंट / PDF सहेजें", "card.wa": "व्हाट्सऐप पर भेजें", "card.cal": "कैलेंडर में जोड़ें", "card.edit": "विवरण बदलें",
    "ch.visit": "訪 · हमसे मिलें", "h.visit": "हमें <em>राजपुर रोड</em> पर पाएँ।", "v.card": "पता",
    "v.hoursnote": "रविवार का समय और बाकी समय क्लब से पुष्टि बाकी।", "v.mapcap": "डून ज़ोन टावर, जाखन, राजपुर रोड। साइट पर पार्किंग (पुष्टि बाकी)।",
    "v.openmap": "Google Maps में खोलें ↗", "v.schem": "रेखाचित्र · पैमाने पर नहीं",
    "v.dir": "रास्ता देखें", "v.call": "कॉल करें", "v.wa": "व्हाट्सऐप", "v.mail": "ईमेल",
    "faq.h": "अक्सर पूछे जाने वाले सवाल",
    "foot.est": "जाखन, राजपुर रोड, देहरादून।", "foot.visit": "पता", "foot.contact": "संपर्क", "foot.top": "कवर पर वापस ↑",
    "foot.mock": "डिज़ाइन-दिशा मॉकअप। “उदाहरण” या “पुष्टि बाकी” वाले हिस्से अस्थायी हैं।",
    "tour.kicker": "जिम देखने आएँ", "tour.title": "किसी कोच के साथ पूरा क्लब देखें।", "tour.lede": "तीस मिनट, कोई दबाव नहीं। फ़्लोर, बॉक्सिंग क्लब, स्टूडियो और स्टीम रूम।",
    "tour.day": "दिन", "tour.time": "समय", "tour.submit": "मेरी विज़िट बुक करें", "tour.booked": "विज़िट बुक हो गई", "tour.done": "ठीक है",
    "tl.0": "हाजिमे · दरवाज़े खुले", "tl.1": "चिकारा · पावर आवर", "tl.2": "योरोकोबी · स्टूडियो जागा", "tl.3": "केन · बॉक्सिंग क्लब", "tl.4": "इयाशी · आराम",
    "mn.cover": "पहला दिन हमारी ओर से!", "mn.letter": "यही असली मतलब है", "mn.cat": "हमारा बॉक्सिंग क्लब",
    "mn.fac": "सबसे ज़्यादा तारीफ़ इन्हीं की", "mn.apply": "बस एक मिनट · कोई भुगतान नहीं", "curl": "पन्ना पलटें",
    "fact.facilities": "सुविधाएँ एक छत के नीचे", "fact.ways": "ट्रेनिंग के तरीके", "fact.reviews": "Google रिव्यू · 4.8★", "fact.posts": "इंस्टाग्राम पोस्ट",
  };
  const STR = {
    en: {
      count: (n, total) => `Showing ${n} of ${total} ways in`,
      chapter: (i, n) => `Chapter ${i} of ${n}`,
      open: () => IK.openStatus().text,
      yourName: "Your name",
      planNone: "Decide after my trial",
      errName: "Please write your name.",
      errPhone: "Enter a 10-digit Indian mobile number.",
      errFix: "A couple of details need fixing.",
      issued: (no) => `Trial pass ${no} issued. See you at the front desk.`,
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      closed: "To confirm",
      today: "today",
      enrol: (c) => `Try ${c} free →`,
      byAppt: "Scheduled with your coach",
      openFloor: "Open floor · all club hours",
      floorWord: "Circle",
      prev: "← Previous circle", next: "Next circle →",
      plate: "Plate",
      tourSummary: (d, t, n) => `${n}, your visit is booked for ${d} at ${t}. A coach will meet you at the front desk, first floor, Doon Zone Tower.`,
      seeYou: "See you soon.",
    },
    hi: {
      count: (n, total) => `${total} में से ${n} रास्ते`,
      chapter: (i, n) => `अध्याय ${i} / ${n}`,
      open: () => (IK.openStatus().open ? "अभी खुला है" : "अभी बंद है"),
      yourName: "आपका नाम",
      planNone: "ट्रायल के बाद तय करूँगा",
      errName: "कृपया अपना नाम लिखें।",
      errPhone: "10 अंकों का भारतीय मोबाइल नंबर लिखें।",
      errFix: "कुछ जानकारी ठीक करनी है।",
      issued: (no) => `ट्रायल पास ${no} जारी — फ़्रंट डेस्क पर मिलते हैं।`,
      days: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
      closed: "पुष्टि बाकी",
      today: "आज",
      enrol: (c) => `${c} फ़्री आज़माएँ →`,
      byAppt: "आपके कोच के साथ तय",
      openFloor: "ओपन फ़्लोर · क्लब के सभी घंटे",
      floorWord: "वृत्त",
      prev: "← पिछला वृत्त", next: "अगला वृत्त →",
      plate: "प्लेट",
      tourSummary: (d, t, n) => `${n}, आपकी विज़िट ${d} को ${t} बजे बुक है। डून ज़ोन टावर की पहली मंज़िल पर फ़्रंट डेस्क पर एक कोच आपसे मिलेंगे।`,
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
     Chapters (TOC, rail, running head) — each one carries its kanji
     ========================================================================= */
  const CHAPTERS = [
    { id: "top", n: "", jp: "", en: "Cover", hi: "कवर", p: "01" },
    { id: "note", n: "I", jp: "入門", en: "Before you begin", hi: "शुरुआत से पहले", p: "03" },
    { id: "history", n: "II", jp: "一日", en: "A day at Ikigai", hi: "इकिगाई में एक दिन", p: "05" },
    { id: "curriculum", n: "III", jp: "道", en: "Seven ways in", hi: "सात रास्ते", p: "09" },
    { id: "faculty", n: "IV", jp: "先生", en: "The coaches", hi: "कोच", p: "13" },
    { id: "campus", n: "V", jp: "生き甲斐", en: "The four circles", hi: "चार वृत्त", p: "15" },
    { id: "alumni", n: "VI", jp: "改善", en: "Kaizen", hi: "काइज़ेन", p: "19" },
    { id: "fees", n: "VII", jp: "約束", en: "Plans", hi: "शुल्क", p: "23" },
    { id: "apply", n: "VIII", jp: "入門", en: "Free trial", hi: "फ़्री ट्रायल", p: "25" },
    { id: "visit", n: "IX", jp: "訪", en: "Visiting", hi: "हमसे मिलें", p: "27" },
  ];
  CHAPTERS.forEach((c) => { HI[`chap.${c.id}`] = c.hi; });
  const tocHTML = (list) => list.map((c) => `
    <li><a href="#${c.id}"><span class="toc__n">${c.n}</span><span class="toc__t"><span class="toc__jp" aria-hidden="true">${c.jp}</span><span data-i18n="chap.${c.id}">${c.en}</span></span><span class="toc__dots" aria-hidden="true"></span><span class="toc__p">p.&nbsp;${c.p}</span></a></li>`).join("");
  const BODY_CH = CHAPTERS.slice(1);
  $("#coverToc").innerHTML = tocHTML(BODY_CH);
  $$("#coverToc li").forEach((li, i) => li.style.setProperty("--k", i));
  $("#menuToc").innerHTML = tocHTML(BODY_CH);
  $("#footToc").innerHTML = tocHTML(BODY_CH);
  $("#rail").innerHTML = BODY_CH.map((c) => `<a href="#${c.id}" data-ch="${c.id}"><span class="rail__n">${c.n}</span><span class="rail__t" data-i18n="chap.${c.id}">${c.en}</span></a>`).join("");

  /* =========================================================================
     Cover
     ========================================================================= */
  $("#coverVol").textContent = "第一巻 · Vol. I";
  $("#coverWa").href = IK.wa("Hi Ikigai! I'd like to know more about joining.");
  HI["cta.wa"] = "व्हाट्सऐप करें";
  $("#footVol").textContent = "I";
  const coverVideo = $("#coverVideo");
  // The cover arch plays the club's own dance-class clip (phone footage, shown near its native size).
  coverVideo.poster = IK.posterHQ("dance");
  coverVideo.src = IK.vidHQ("dance");

  function renderStatus() {
    const s = IK.openStatus();
    [["#coverDot", "#coverStatus"], ["#visitDot", "#visitStatus"]].forEach(([d, txt]) => {
      $(d).classList.toggle("is-closed", !s.open);
      $(txt).textContent = t("open");
    });
  }

  /* =========================================================================
     I. Before you begin — almanac
     ========================================================================= */
  const now = IK.nowIST();
  $("#letterDate").textContent = `Jakhan, Dehradun · ${now.date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
  $("#facts").innerHTML = IK.stats.map((s) => `
    <div><dt><span class="count" data-to="${s.value}">${s.value}</span>${s.suffix}</dt><dd><span data-i18n="fact.${s.id}">${s.label}</span>${s.confirm ? " " + TAG("confirm") : ""}</dd></div>`).join("");
  $("#kit").textContent = IK.equipment.join(" · ");
  $("#ratings").innerHTML = IK.ratings.map((r) => `
    <li><b>${r.score.toFixed(1)}★</b> <a href="${r.url}" target="_blank" rel="noopener">${r.source}</a> <span>· ${r.count} reviews</span> ${r.confirm ? TAG("confirm") : ""}</li>`).join("");

  /* =========================================================================
     II. A day at Ikigai (album)
     ========================================================================= */
  const TL_IMG = [
    { k: "treadmills", cap: "06:00 · Treadmills by the window." },
    { k: "slogan-floor", cap: "07:00 · Under the wall: “This place will change you, if you let it.”", pos: "50% 30%" },
    { k: "dance-crew", cap: "18:00 · The studio, mid-routine." },
    { k: "boxing-mural", cap: "20:00 · The Ikigai Boxing Club." },
    { k: "washroom", cap: "21:30 · Premium washrooms and showers." },
  ];
  const TILTS = [-1.4, 1.1, -.8, 1.3, -1];
  const ybTrack = $("#ybTrack");
  ybTrack.innerHTML = IK.timeline.map((e, i) => `
    <article class="yb__page" style="--tilt:${TILTS[i % TILTS.length]}deg" aria-label="${esc(e.year)} — ${esc(e.title)}">
      <div class="yb__photo">
        <img src="${IK.img(TL_IMG[i].k, true)}" srcset="${srcset(TL_IMG[i].k)}" sizes="(min-width: 1024px) 30vw, 70vw" alt="${esc(TL_IMG[i].cap)}" loading="lazy"${TL_IMG[i].pos ? ` style="object-position:${TL_IMG[i].pos}"` : ""} />
        <span class="tape tape--l" aria-hidden="true"></span><span class="tape tape--r" aria-hidden="true"></span>
        <p class="yb__cap">${esc(TL_IMG[i].cap)}</p>
      </div>
      <div class="yb__text">
        <span class="yb__year">${esc(e.year)} <span class="yb__jp" aria-hidden="true">${esc(e.jp)}</span></span>
        <h3 class="yb__title" data-i18n="tl.${i}">${esc(e.title)}</h3>
        <p class="yb__copy">${esc(e.copy)}</p>
        ${e.confirm ? TAG("confirm") : e.sample ? TAG("sample") : ""}
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
  // Page-turn: each page swings depending on its distance from the centre of the viewport.
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
     III. Seven ways in (course catalogue)
     ========================================================================= */
  // Figure photos per course (every one is the club's own). Yoga has no photo yet, so its figure is a kanji plate.
  const FIG_IMG = {};
  const COURSES = [
    { code: "道 101", id: "gym", format: "floor", credits: "3", goals: ["strong", "lose"],
      weeks: ["Floor tour, machine set-up and a movement check", "Squat, hinge, push and pull patterns", "Free weights, racks and progressive load", "Your first programme review"] },
    { code: "道 102", id: "boxing", prereq: true, format: "class", credits: "2–3", goals: ["box", "lose"],
      weeks: ["Stance, guard and footwork", "The jab, the cross and the hook", "Bag rounds and pad work", "Conditioning and your first combinations"] },
    { code: "道 103", id: "zumba", format: "class", credits: "3", goals: ["enjoy", "lose"],
      weeks: ["Learn the basic rhythms", "Short combinations at half tempo", "A full-length class", "Bring-a-friend week"] },
    { code: "道 104", id: "bhangra", format: "class", credits: "2", goals: ["enjoy", "lose"],
      weeks: ["Basic steps and the beat", "Combinations at half tempo", "Full routines", "Performance week"] },
    { code: "道 105", id: "cardio", format: "floor", credits: "3", goals: ["lose"],
      weeks: ["Treadmill pacing and heart-rate zones", "Air-bike intervals", "Longer steady sessions", "Re-test your 2 km"] },
    { code: "道 106", id: "yoga", format: "class", credits: "2", goals: ["calm"],
      weeks: ["Breath and posture", "Sun salutations and balance", "Mobility for lifters and dancers", "A full, quiet flow"] },
    { code: "道 107", id: "pt", format: "pt", credits: "2–5", goals: ["strong", "lose", "box", "calm"],
      weeks: ["A conversation: history, injuries, your week", "A programme built around you", "Form, load and recovery tuning", "Progress check and the next block"] },
  ].map((c) => ({ ...c, p: IK.program(c.id), img: FIG_IMG[c.id] || IK.program(c.id).img, title: c.title || IK.program(c.id).name }));
  const FIG = {
    gym: "A red plate-loaded machine on the gym floor.",
    cardio: "The row of air bikes.",
    boxing: "The heavy bag in the boxing zone.",
    zumba: "Zumba in the mirrored studio.",
    bhangra: "A dance class in the Ikigai studio.",
    yoga: "和 · Wa, harmony. Photos to come.",
    pt: "The main floor: racks, plates and the turf lane.",
  };
  const FMT = { class: "Class", pt: "1:1", floor: "Open floor" };
  const GOALS = [["all", "All goals"], ["strong", "Get stronger"], ["lose", "Lose fat"], ["box", "Learn boxing"], ["enjoy", "Dance & joy"], ["calm", "Yoga & mobility"]];
  const FORMATS = [["all", "All formats"], ["class", "Class"], ["pt", "1:1"], ["floor", "Open floor"]];
  const DAY3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysLabel = (days) => {
    const s = [...days].sort((a, b) => a - b);
    const run = s.every((d, i) => i === 0 || d === s[i - 1] + 1);
    if (run && s.length > 2) return `${DAY3[s[0]]}–${DAY3[s[s.length - 1]]}`;
    return s.map((d) => DAY3[d]).join(" · ");
  };
  const schedule = (id) => {
    const slots = IK.timetable.slots.filter((s) => s.cls === id);
    if (!slots.length) return null;
    return slots.sort((a, b) => IK.toMins(a.t) - IK.toMins(b.t)).map((s) => `${daysLabel(s.days)} — ${IK.fmtTime(s.t)} · ${s.d} min`);
  };
  const dots = (n) => `<span class="course__dots" aria-label="Intensity ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  $("#goalChips").innerHTML = GOALS.map(([v, l], i) => `<button class="chip" type="button" data-goal="${v}" aria-pressed="${i === 0}" data-i18n="goal.${v}">${l}</button>`).join("");
  $("#formatChips").innerHTML = FORMATS.map(([v, l], i) => `<button class="chip" type="button" data-format="${v}" aria-pressed="${i === 0}" data-i18n="fmt.${v}">${l}</button>`).join("");
  const RING = '<svg class="ring__svg" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M60 5 C 30 1, 3 12, 5 28 C 7 45, 54 49, 82 41 C 104 33, 99 9, 70 5 C 60 4, 50 6, 43 9" /></svg>';
  const kanjiPlate = (p) => `<span class="syll__kanji" aria-hidden="true">${esc(p.jp || "")}</span>`;
  $("#courses").innerHTML = COURSES.map((c, ci) => {
    const sched = schedule(c.id);
    return `
    <li class="course${c.prereq ? " course--prereq" : ""}" id="course-${c.id}" data-goals="${c.goals.join(" ")}" data-format="${c.format}" style="--k:${ci}">
      <button class="course__row" type="button" aria-expanded="false" aria-controls="panel-${c.id}">
        <span class="course__code">${c.prereq ? `<span class="ring">${c.code}${RING}</span>` : c.code}</span>
        <span class="course__main">
          <span class="course__title">${esc(c.title)}${c.prereq ? ` <span class="course__badge" data-i18n="c.prereq">The club inside the gym</span>` : ""}${c.p.confirm ? " " + TAG("confirm") : ""}</span>
          <span class="course__short">${esc(c.p.short)}</span>
        </span>
        <span class="course__meta">
          <span class="course__format" data-i18n="fmt.${c.format}">${FMT[c.format]}</span>
          <span class="course__credits">${c.credits} <span class="visually-hidden">sessions a week</span></span>
          ${dots(c.p.intensity)}
        </span>
        <span class="course__toggle" aria-hidden="true"></span>
      </button>
      <div class="course__panel" id="panel-${c.id}" role="region" aria-label="${esc(c.title)} syllabus">
        <div class="course__inner">
          <div class="syll">
            <figure class="syll__fig${c.img ? "" : " syll__fig--kanji"}">
              ${c.img ? `<img class="syll__img" src="${IK.img(c.img, true)}" srcset="${srcset(c.img)}" sizes="(min-width: 744px) 14rem, 22rem" alt="${esc(FIG[c.id])}" loading="lazy" />` : kanjiPlate(c.p)}
              <figcaption class="plate-cap"><span class="plate-cap__n" data-fig="${c.code.replace("道 ", "")}">Fig. ${c.code.replace("道 ", "")}.</span> ${esc(FIG[c.id])}</figcaption>
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
                <p class="syll__h" data-i18n="c.fac">Coach</p>
                <p class="syll__fac" data-i18n="c.team">Coaching team</p>
              </div>
              <button class="btn btn--ink btn--sm" type="button" data-enrol="${c.id}">${t("enrol", c.title)}</button>
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
      const okG = filt.goal === "all" || li.dataset.goals.split(" ").includes(filt.goal);
      const okF = filt.format === "all" || li.dataset.format === filt.format;
      const show = okG && okF;
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
     IV. The coaches (先生)
     ========================================================================= */
  const ROTS = [-1.6, 1.2, -.9, 1.5, -1.3, .8, -1.1, 1.4, -.7];
  $("#faculty-cards").innerHTML = IK.team.map((m, i) => `
    <article class="icard${m.lead ? " icard--lead" : ""}${m.placeholder ? " icard--tbc" : ""} reveal-card" style="--rot:${ROTS[i % ROTS.length]}deg">
      <span class="icard__no">No. ${String(i + 1).padStart(2, "0")}</span>
      <span class="icard__mono" aria-hidden="true">${m.placeholder ? "先生" : IK.initials(m.name)}</span>
      <h3 class="icard__name">${esc(m.name)}</h3>
      <p class="icard__role" data-i18n="role.${m.role}">${esc(m.role)}</p>
      ${m.creds ? `<ul class="icard__creds">${m.creds.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
      ${m.quote ? `<p class="icard__quote">“${esc(m.quote)}”<small>${esc(m.quoteBy || "")}</small></p>` : ""}
      ${m.placeholder ? `<p class="icard__tbc">Name and photo to confirm</p>` : ""}
      ${m.confirm || m.placeholder ? `<span class="icard__tag">${TAG("confirm")}</span>` : ""}
    </article>`).join("");
  // Floor photos stand in until the team shoot; captions say what each one shows.
  const ATWORK = [["functional", "The functional zone."], ["dumbbells", "Dumbbells by the racks."], ["airbike-rider", "Air-bike intervals by the mural."], ["power-rack", "A power rack, loaded."]];
  $("#atwork").innerHTML = ATWORK.map(([k, cap], i) => `
    <figure class="develop" style="--k:${i}"><img src="${IK.img(k, true)}" alt="On the Ikigai floor: ${esc(cap)}" loading="lazy" /><figcaption class="plate-cap"><span class="plate-cap__n" data-pn="${roman(i + 3)}">Plate ${roman(i + 3)}.</span> ${esc(cap)}</figcaption></figure>`).join("");

  /* =========================================================================
     V. The four circles — an ikigai diagram you can click + circle panel + photo walk
     ========================================================================= */
  const svg = $("#sectionSvg");
  // Four overlapping circles (top, right, bottom, left) around a centre, drawn like an ink diagram.
  const CX = 332, CY = 360, R = 168, OFF = 112;
  // Same layout as the real ikigai diagram: love (top) faces "what you need / are paid for" (bottom); good-at (left) faces world-needs (right).
  const POS = { 1: [0, -OFF], 2: [-OFF, 0], 3: [OFF, 0], 4: [0, OFF] };
  const LBL = { 1: [0, -OFF - 60], 2: [-OFF - 62, 6], 3: [OFF + 62, 6], 4: [0, OFF + 78] };
  const circleArt = () => `
      <g class="art" aria-hidden="true">
        <circle class="ln ln--thin" cx="${CX}" cy="${CY}" r="${R + OFF + 26}" stroke-dasharray="2 6" />
        <text class="ik__centre" x="${CX}" y="${CY - 2}" text-anchor="middle">生き甲斐</text>
        <text class="ik__centre-en" x="${CX}" y="${CY + 22}" text-anchor="middle">IKIGAI</text>
        ${["MISSION", "VOCATION", "PROFESSION", "PASSION"].map((w, i) => {
          const a = (-45 + i * 90) * Math.PI / 180, d = OFF * 0.98;
          return `<text class="ik__between" x="${(CX + Math.cos(a) * d).toFixed(1)}" y="${(CY + Math.sin(a) * d + 4).toFixed(1)}" text-anchor="middle">${w}</text>`;
        }).join("")}
      </g>`;
  const floorGroups = () => IK.floors.map((f) => {
    const [dx, dy] = POS[f.n], [lx, ly] = LBL[f.n];
    return `
      <g class="floor" data-floor="${f.n}" tabindex="0" role="button" aria-label="Circle ${f.n}: ${esc(f.name)}, ${esc(f.ask)}">
        <circle class="floor__hit ik__circle" cx="${CX + dx}" cy="${CY + dy}" r="${R}" />
        <text class="ik__kanji" x="${CX + lx}" y="${CY + ly - 6}" text-anchor="middle">${esc(f.kanji)}</text>
        <text class="floor__name" x="${CX + lx}" y="${CY + ly + 18}" text-anchor="middle" data-i18n="floor.${f.n}">${esc(f.name)}</text>
        <text class="ik__ask" x="${CX + lx}" y="${CY + ly + 36}" text-anchor="middle">${esc(f.ask)}</text>
      </g>`;
  }).join("");
  svg.innerHTML = floorGroups() + circleArt();
  const fitDrawing = () => {
    const narrow = svg.getBoundingClientRect().width < 430;
    svg.setAttribute("viewBox", narrow ? "40 40 584 640" : "0 0 664 720");
    svg.classList.toggle("is-narrow", narrow);
  };
  if ("ResizeObserver" in window) new ResizeObserver(fitDrawing).observe(document.querySelector(".drawing")); else fitDrawing();

  let floorIdx = 0; // start on Joy
  const FLOORS = IK.floors;
  $("#floorTabs").innerHTML = FLOORS.map((f, i) => `<button class="chip" type="button" role="tab" data-fi="${i}" aria-selected="false" aria-pressed="false"><b class="chip__jp">${esc(f.kanji)}</b> <span data-i18n="floor.${f.n}">${esc(f.name)}</span></button>`).join("");
  function renderFloor(i, focus) {
    floorIdx = (i + FLOORS.length) % FLOORS.length;
    const f = FLOORS[floorIdx];
    $$("#sectionSvg .floor").forEach((g) => g.classList.toggle("is-active", g.dataset.floor === f.n));
    $$("#floorTabs .chip").forEach((b, j) => { b.setAttribute("aria-selected", String(j === floorIdx)); b.setAttribute("aria-pressed", String(j === floorIdx)); });
    const name = LANG === "hi" ? HI[`floor.${f.n}`] : f.name;
    $("#floorBody").innerHTML = `
      <div class="fp">
        <figure class="fp__media">
          <img src="${IK.img(f.img, true)}" srcset="${srcset(f.img)}" sizes="(min-width: 1024px) 40vw, 90vw" alt="${esc(f.name)} at Ikigai: ${esc(f.zones.join(", "))}" />
          <figcaption class="plate-cap"><span class="plate-cap__n">${esc(f.kanji)} ${esc(f.romaji)}.</span> ${esc(f.line)}</figcaption>
        </figure>
        <div>
          <p class="fp__n">${t("floorWord")} ${f.n} / ${FLOORS.length} · ${esc(f.ask)}</p>
          <h3 class="fp__name"><span class="fp__jp" aria-hidden="true">${esc(f.kanji)}</span> ${esc(name)}</h3>
          <ul class="ticks">${f.zones.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
          <div class="fp__nav">
            <button class="btn btn--line btn--sm" type="button" data-fstep="-1">${t("prev")}</button>
            <button class="btn btn--line btn--sm" type="button" data-fstep="1">${t("next")}</button>
            ${f.confirm ? TAG("confirm") : ""}
          </div>
        </div>
      </div>`;
    if (LANG === "hi") $$("#floorBody [data-i18n]").forEach((el) => { el.dataset.en = el.innerHTML; el.innerHTML = HI[el.dataset.i18n] ?? el.innerHTML; });
    if (focus) $(`#floorTabs .chip[data-fi="${floorIdx}"]`).focus({ preventScroll: true });
  }
  svg.addEventListener("click", (e) => { const g = e.target.closest(".floor"); if (g) renderFloor(FLOORS.findIndex((f) => f.n === g.dataset.floor)); });
  // SVG elements have no .click(); give the circle buttons one so scripts and assistive tools can activate them.
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
    ["ikigai-sign", "The four circles on the front door."],
    ["boxing-sign", "The sign over the boxing club.", true],
    ["plate-machine", "Plate-loaded machines on the main floor."],
    ["steam-room", "The steam room.", true],
    ["trek-bridge", "Shadow-boxing on a trek bridge, out in the hills."],
    ["runner", "From the club's reel: build endurance."],
  ];
  // optional 4th value = focal point, for portrait photos whose subject sits low or high in the frame
  $("#essay").innerHTML = PLATES.map(([k, cap, wide, focus], i) => `
    <button class="plate develop${wide ? " plate--wide" : ""}" type="button" data-plate="${i}" style="--k:${i % 4}" aria-label="Open photo: ${esc(cap)}">
      <img src="${IK.img(k, true)}" alt="" loading="lazy"${focus ? ` style="object-position: ${focus}"` : ""} />
      <span class="plate-cap"><span class="plate-cap__n">${t("plate")} ${roman(i + 7)}.</span> ${esc(cap)}</span>
    </button>`).join("");
  $("#essayCount").textContent = `${PLATES.length} plates`;

  /* =========================================================================
     VI. Kaizen (改善) — what reviewers praise, and the notice board
     ========================================================================= */
  const RR = [-1.4, 1.1, -.7, 1.3, -1, .8];
  // One card per review theme. These are paraphrased themes, not quotes, and say so.
  $("#reports").innerHTML = IK.reviews.map((r, i) => `
    <article class="report reveal-card" style="--k:${i};--rr:${RR[i % RR.length]}deg">
      <i class="ink-ring report__ink" aria-hidden="true"></i>
      <div class="report__head"><span data-i18n="rep.card">Review theme</span><small>No. ${String(i + 1).padStart(2, "0")}</small></div>
      <dl class="report__rows">
        <div><dt data-i18n="rep.name">Theme</dt><dd>${esc(r.who)}</dd></div>
        <div><dt>Source</dt><dd>${esc(r.where.replace(/^Paraphrased from /, ""))}</dd></div>
      </dl>
      <p class="report__result report__result--word"><span class="report__kanji" aria-hidden="true">${esc(r.kanji)}</span>${esc(r.text)}</p>
      <span class="report__stamp" aria-hidden="true" data-i18n="rep.stamp">Paraphrased</span>
    </article>`).join("");
  const LR = [-.8, .6, -.45, .9, -.6, .5];
  // The community notice board: events from the club's Instagram (dates to confirm).
  $("#letters").innerHTML = IK.events.map((ev, i) => `
    <figure class="lt lt--press reveal-card" style="--k:${i};--lr:${LR[i % LR.length]}deg">
      <p class="lt__kick"><span class="lt__jp" aria-hidden="true">${esc(ev.jp)}</span> 仲間 · From the notice board</p>
      <blockquote class="lt__q">${esc(ev.name)}. ${esc(ev.copy)}</blockquote>
      <figcaption class="lt__who">${esc(ev.kind)}<span class="lt__where">${ev.confirm ? "Seen on the club's Instagram · dates to confirm" : ""}</span></figcaption>
    </figure>`).join("") + `
    <figure class="lt reveal-card" style="--k:${IK.events.length};--lr:.5deg">
      <blockquote class="lt__q">Before-and-after stories go here, once members give consent.</blockquote>
      <figcaption class="lt__who">— Placeholder<span class="lt__where">Member stories, with permission</span></figcaption>
    </figure>`;
  $("#voiceRate").innerHTML = IK.ratings.map((r) => `<b>${r.score.toFixed(1)}★</b> ${r.source} (${r.count})`).join(" · ") + " " + TAG("confirm");

  /* =========================================================================
     VII. Plans (約束)
     ========================================================================= */
  const CIRCLE = '<svg class="fee__circle" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M30 18 C 80 2, 170 4, 190 40 C 205 78, 120 98, 60 92 C 10 86, -2 52, 22 30 C 40 14, 90 8, 118 12" /></svg>';
  const dash = (n) => (n == null ? "—" : IK.money(n));
  $("#feeRows").innerHTML = IK.plans.map((p, i) => `
    <tr class="${p.popular ? "is-popular" : ""}${p.price == null ? " is-ask" : ""}" style="--k:${i}">
      <td class="fee__durcell"><span class="fee__dur"><span class="fee__jp" aria-hidden="true">${esc(p.jp)}</span> <span data-i18n="plan.${p.id}">${esc(p.name)}</span></span><span class="fee__line" data-i18n="pline.${p.id}">${esc(p.line)}</span>${p.popular ? `<span class="fee__pop" data-i18n="fee.pop">Best value</span>` : ""}</td>
      <td class="fee__pricecell"><span class="fee__price">${IK.money(p.price)}${p.popular ? CIRCLE : ""}</span>${p.confirm ? " " + TAG("confirm") : ""}</td>
      <td class="fee__unit" data-label="Per month"><span class="fee__small">${dash(IK.perMonth(p))}</span></td>
      <td class="fee__unit" data-label="Per day"><span class="fee__small fee__perday">${dash(IK.perDay(p))}</span></td>
      <td class="fee__cta"><button class="btn ${p.popular ? "btn--ink" : "btn--line"} btn--sm" type="button" data-plan="${p.id}"><span data-i18n="fee.choose">Choose</span></button></td>
    </tr>`).join("");
  const ANNUAL = IK.plans.reduce((a, p) => (p.months > a.months ? p : a), IK.plans[0]);
  // The red-pencil note hangs from the 12-month plan's per-day price, its arrow pointing up at the figure.
  const notedRow = document.querySelectorAll("#feeRows tr")[IK.plans.indexOf(ANNUAL)];
  notedRow.classList.add("fee--noted");
  notedRow.querySelector(".fee__perday").append(document.getElementById("mnFeesTpl").content.firstElementChild);
  $("#mnFees").textContent = `just ${IK.money(IK.perDay(ANNUAL))} a day!`;
  HI["mn.fees"] = `सिर्फ़ ${IK.money(IK.perDay(ANNUAL))} रोज़!`;
  $("#includes").innerHTML = IK.planIncludes.items.map((x, i) => `<li data-i18n="inc.${i}">${esc(x)}</li>`).join("");
  $("#feeRows").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan]"); if (!b) return;
    $("#fPlan").value = b.dataset.plan; updateCard(); goTo("#apply"); flashCard();
  });

  /* =========================================================================
     VIII. Free trial (入門) — form + live trial pass
     ========================================================================= */
  const form = $("#admission");
  const fName = $("#fName"), fPhone = $("#fPhone"), fCourse = $("#fCourse"), fPlan = $("#fPlan"), fAge = $("#fAge");
  fCourse.innerHTML = COURSES.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join("");
  const planOptions = () => `<option value="">${t("planNone")}</option>` + IK.plans.map((p) => `<option value="${p.id}">${LANG === "hi" ? HI[`plan.${p.id}`] : p.name} · ${IK.money(p.price)}</option>`).join("");
  fPlan.innerHTML = planOptions();
  const BATCHES = [{ id: "morning", label: "Morning", time: "07:00" }, { id: "evening", label: "Evening", time: "18:30" }, { id: "women", label: "Women-only (ask)", time: "08:00" }];
  let batch = "morning";
  $("#batchChips").innerHTML = BATCHES.map((b) => `<button class="chip" type="button" role="radio" aria-checked="${b.id === batch}" data-batch="${b.id}"><span data-i18n="batch.${b.id}">${b.label}</span> <small>${IK.fmtTime(b.time)}</small></button>`).join("");

  // The next six open days (skips Sunday until its hours are confirmed), in IST.
  const openDays = (count = 6) => {
    const base = IK.nowIST().date; const out = [];
    for (let o = 1; out.length < count && o < 14; o++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + o);
      if (IK.hours.days[d.getDay()]) out.push({ o, d });
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
    if (!nm) return "IKG/26/····";
    return `IKG/26/${String((hash(nm.toLowerCase() + cleanPhone(fPhone.value)) % 9000) + 1000)}`;
  };
  function barcode(seedStr) {
    const r = rng(hash(seedStr || "ikigai fitness club"));
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
    $("#cInitials").textContent = nm ? IK.initials(nm) : "生";
    const c = course();
    $("#cCourse").textContent = `${c.p.jp || ""} ${c.title}`.trim();
    const b = batchObj();
    $("#cBatch").textContent = LANG === "hi" ? HI[`batch.${b.id}`] : b.label;
    $("#cDate").textContent = `${dayLabel(DAYS[dayPick].d)}, ${IK.fmtTime(b.time)}`;
    $("#cNo").textContent = admissionNo();
    const p = IK.plans.find((x) => x.id === fPlan.value);
    $("#cPlan").textContent = p ? `${LANG === "hi" ? HI[`plan.${p.id}`] : p.name} · ${IK.money(p.price)}` : "—";
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
    issued = { no: admissionNo(), name: fName.value.trim(), phone: fmtPhone(fPhone.value), c, b, d, plan: IK.plans.find((x) => x.id === fPlan.value), age: fAge.value };
    status.textContent = t("issued", issued.no);
    const card = $("#admitCard");
    card.classList.remove("is-stamped"); void card.offsetWidth; card.classList.add("is-stamped");
    $("#cardActions").hidden = false;
    $("#cWa").href = IK.wa(`Hi Ikigai! I'd like my free trial.\nName: ${issued.name}\nPhone: ${issued.phone}\nAge group: ${issued.age}\nClass: ${c.title}\nBatch: ${b.label} (${IK.fmtTime(b.time)})\nDate: ${dayLabel(d.d)}\n${issued.plan ? `Membership interest: ${issued.plan.name}\n` : ""}Trial pass: ${issued.no}`);
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
    note.textContent = `${IK.brand.name} · ${IK.contact.address}, ${IK.contact.locality}, ${IK.contact.cityLine} · ${IK.contact.phone}`;
    area.appendChild(note);
    window.print();
  });
  $("#cCal").addEventListener("click", () => {
    if (!issued) return;
    IK.ics({ title: `Free trial — ${issued.c.title} · IKIGAI Fitness Club`, start: IK.istDate(issued.d.o, issued.b.time), minutes: 60, details: `Trial pass ${issued.no}\nClass: ${issued.c.title}\nBring this pass, or just your name, to the front desk (first floor, Doon Zone Tower).` });
  });
  $("#cEdit").addEventListener("click", () => { goTo("#admission"); setTimeout(() => fName.focus({ preventScroll: true }), 500); });
  function flashCard() { const c = $("#admitCard"); c.classList.remove("is-flash"); void c.offsetWidth; c.classList.add("is-flash"); }
  function enrolIn(id) {
    fCourse.value = id; updateCard(); goTo("#apply"); flashCard();
    setTimeout(() => fName.focus({ preventScroll: true }), 900);
  }

  /* =========================================================================
     IX. Visiting (訪)
     ========================================================================= */
  const C = IK.contact;
  $("#addr").innerHTML = `IKIGAI Fitness Club<br>${esc(C.address)}<small>${esc(C.locality)}<br>${esc(C.cityLine)}</small>`;
  function renderHours() {
    const today = IK.nowIST().day;
    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#hours tbody").innerHTML = order.map((d) => {
      const h = IK.hours.days[d];
      return `<tr class="${d === today ? "is-today" : ""}"><td><span class="hours__jp" aria-hidden="true">${IK.jp.days[d]}</span> ${t("days")[d]}${d === today ? ` <small>(${t("today")})</small>` : ""}</td><td>${h ? `${IK.fmtTime(h[0])} – ${IK.fmtTime(h[1])}` : t("closed")}</td></tr>`;
    }).join("");
  }
  $("#visitActions").innerHTML = `
    <a class="btn btn--ink btn--sm" href="${C.mapsUrl}" target="_blank" rel="noopener"><span data-i18n="v.dir">Directions</span> ↗</a>
    <a class="btn btn--line btn--sm" href="${C.phoneHref}"><span data-i18n="v.call">Call</span></a>
    <a class="btn btn--line btn--sm" href="${IK.wa("Hi Ikigai! I'd like to come and see the club.")}" target="_blank" rel="noopener"><span data-i18n="v.wa">WhatsApp</span></a>
    <a class="btn btn--line btn--sm" href="mailto:${C.email}?subject=${encodeURIComponent("Visit — IKIGAI Fitness Club")}"><span data-i18n="v.mail">Email</span></a>
    <p class="libcard__social"><a href="${C.instagram.url}" target="_blank" rel="noopener">Instagram ${esc(C.instagram.handle)}</a>${TAG("confirm")}<a href="${C.facebook.url}" target="_blank" rel="noopener">Facebook</a></p>`;
  $("#mapOpen").href = C.mapsUrl;
  // Schematic map plate (not to scale), engraved like a handbook map: hatched blocks on a graph-paper ground,
  // Rajpur Road running up towards Mussoorie, and the way in marked in red pen up to Doon Zone Tower in Jakhan,
  // where the building is ringed and its name highlighted.
  const RAJ = "M-40 600 C 90 520, 190 420, 270 330 S 430 140, 640 40";
  const SIDE = "M270 330 C 210 300, 130 270, -40 250";
  const ROUTE = "M-40 600 C 90 520, 190 420, 270 330 S 360 220, 392 196";
  const blocks = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    const x = -84 + i * 86, y = -52 + j * 78;
    if (i === 6 && j === 1) blocks.push(`<rect class="mp-park" x="${x}" y="${y}" width="66" height="58" rx="3" />`);
    else blocks.push(`<rect class="mp-blk" x="${x}" y="${y}" width="${66 - ((i + j) % 3) * 6}" height="${58 - ((i * 2 + j) % 3) * 5}" rx="2" />`);
  }
  $("#mapPlate").innerHTML = `
    <title id="mapPlateT">Schematic map, not to scale: up Rajpur Road from the city to Jakhan, to IKIGAI Fitness Club on the first floor of Doon Zone Tower</title>
    <defs>
      <pattern id="mpGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="rgba(15,14,12,.06)" stroke-width="1" /></pattern>
      <pattern id="mpHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(15,14,12,.16)" stroke-width="1.1" /></pattern>
      <pattern id="mpStip" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(194,65,12,.42)" /><circle cx="6" cy="6" r="1" fill="rgba(194,65,12,.42)" /></pattern>
      <path id="mpRaj" d="${RAJ}" /><path id="mpSide" d="${SIDE}" />
      <mask id="mpMask" maskUnits="userSpaceOnUse" x="-60" y="-60" width="720" height="680"><path class="mp-routemask" pathLength="1" d="${ROUTE}" /></mask>
    </defs>
    <rect x="-60" y="-60" width="720" height="680" fill="#F5F1EA" /><rect x="-60" y="-60" width="720" height="680" fill="url(#mpGrid)" />
    <g transform="rotate(-14 300 280)">${blocks.join("")}</g>
    <use href="#mpRaj" class="mp-case" stroke-width="31" /><use href="#mpRaj" class="mp-fill" stroke-width="28" />
    <use href="#mpSide" class="mp-case" stroke-width="19" /><use href="#mpSide" class="mp-fill" stroke-width="16" />
    <text class="mp-road"><textPath href="#mpRaj" startOffset="14%"><tspan dy="-20">Rajpur Road</tspan></textPath></text>
    <text class="mp-road mp-road--sm"><textPath href="#mpRaj" startOffset="74%"><tspan dy="-20">to Mussoorie →</tspan></textPath></text>
    <text class="mp-area" x="226" y="300" text-anchor="end">Jakhan</text>
    <text class="mp-area mp-area--soft" x="120" y="560">← City centre</text>
    <path class="mp-route" d="${ROUTE}" mask="url(#mpMask)" />
    <g class="mp-compass" transform="translate(520 470)"><path d="M0 -26 L7 6 L0 1 L-7 6 Z" /><path class="mp-compass__half" d="M0 -26 L0 1 L-7 6 Z" /><text y="-32" text-anchor="middle">N</text></g>
    <rect class="mp-hl" id="mpHl" x="420" y="214" width="160" height="13" />
    <text class="mp-name" id="mpName" x="424" y="224" text-anchor="start">IKIGAI Fitness Club</text>
    <text class="mp-plot" x="424" y="241" text-anchor="start">Doon Zone Tower · 1st floor</text>
    <path class="mp-pen" pathLength="1" d="M425 154 C 438 184, 418 218, 388 218 C 356 218, 348 184, 360 160 C 374 134, 414 132, 432 166" />
    <g class="mp-pin"><path d="M392 196 c-13 -15 -19 -24 -19 -32 a19 19 0 0 1 38 0 c0 8 -6 17 -19 32z" /><circle cx="392" cy="164" r="6.5" /></g>`;
  // the highlighter fits the name once the serif has loaded
  const fitHl = () => { const n = $("#mpName"), h = $("#mpHl"); if (!n || !h) return; try { const b = n.getBBox(); h.setAttribute("x", (b.x - 5).toFixed(1)); h.setAttribute("width", (b.width + 10).toFixed(1)); } catch (e) { /* not rendered yet */ } };
  fitHl(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHl);
  matchMedia("(max-width: 743px)").addEventListener("change", () => requestAnimationFrame(fitHl)); // phones set the name larger

  $("#faq").innerHTML = IK.faqs.items.map((f) => `<details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}${f.sample ? " " + TAG("sample") : ""}</p></details>`).join("");
  $("#footAddr").innerHTML = `${esc(C.address)},<br>${esc(C.locality)},<br>${esc(C.cityLine)}`;
  $("#footHours").textContent = `${IK.hours.label} · ${IK.hours.sunday}`;
  $("#footContact").innerHTML = `
    <li><a href="${C.phoneHref}">☎ ${esc(C.phone)}</a></li>
    <li><a href="${IK.wa()}" target="_blank" rel="noopener">WhatsApp ${esc(C.whatsapp)}</a></li>
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
    $("#tourTimes").innerHTML = TOUR_TIMES.map((tm, i) => `<button class="chip" type="button" role="radio" aria-checked="${i === tourTime}" data-ttime="${i}">${IK.fmtTime(tm)}</button>`).join("");
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
    $("#tourSummary").textContent = t("tourSummary", dayLabel(d.d), IK.fmtTime(tm), tourBooked.name.split(" ")[0]);
    $("#tourWa").href = IK.wa(`Hi Ikigai! I've booked a visit to the club.\nName: ${tourBooked.name}\nPhone: ${tourBooked.phone}\nWhen: ${dayLabel(d.d)}, ${IK.fmtTime(tm)}`);
    $("#tourStep").hidden = true; $("#tourDone").hidden = false;
    $("#tourCal").focus();
  });
  $("#tourCal").addEventListener("click", () => {
    if (!tourBooked) return;
    IK.ics({ title: "Club visit — IKIGAI Fitness Club", start: IK.istDate(tourBooked.d.o, tourBooked.tm), minutes: 30, details: `Club visit for ${tourBooked.name}. Meet a coach at the front desk, first floor, Doon Zone Tower.` });
  });

  // Member video
  const vModal = $("#videoModal"), vEl = $("#voiceVideo");
  $("#voicePlay").addEventListener("click", () => {
    if (!vEl.src) { vEl.poster = IK.poster("day"); vEl.src = IK.vid("day"); }
    openDialog(vModal);
    const pr = vEl.play(); if (pr && pr.catch) pr.catch(() => {});
  });

  // Lightbox
  const lb = $("#lightbox");
  let lbI = 0;
  const lbShow = (i) => {
    lbI = (i + PLATES.length) % PLATES.length;
    const [k, cap] = PLATES[lbI];
    const im = $("#lbImg"); im.src = IK.img(k); im.alt = cap;
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
    try { localStorage.setItem("ik-lang-b", LANG); } catch (e) {}
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
    applyLang();
    // dynamic bits
    
    renderStatus(); renderHours(); applyFilters(); ybHud(ybIndex); renderDateChips(); renderTourChips();
    // The phone layout labels each fee figure from data-label: keep those in the chosen language too.
    $$(".fee__unit").forEach((td, i) => { const k = i % 2 ? "fee.day" : "fee.month"; td.dataset.label = LANG === "hi" ? HI[k] : (i % 2 ? "Per day" : "Per month"); });
    $$('[data-sched="floor"]').forEach((el) => { el.textContent = t("openFloor"); });
    $$('[data-sched="appt"]').forEach((el) => { el.textContent = t("byAppt"); });
    $$("[data-enrol]").forEach((b) => { b.textContent = t("enrol", COURSES.find((c) => c.id === b.dataset.enrol).title); });
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
  const fit = IK.ratings[0];
  const dateline = () => IK.nowIST().date.toLocaleDateString(LANG === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" });
  const TICK = {
    en: () => [["Today", dateline()], ["生き甲斐", "a reason for being"], ["Hours", "Mon–Sat · 6 am – 10 pm"], ["拳", "the Ikigai Boxing Club is open"],
      ["Studio", "Zumba · Bhangra · Yoga"], ["Rated", `${fit.score.toFixed(1)}★ on ${fit.source} (to confirm)`], ["Trial", "your first day is on us"], ["癒し", "steam room & showers"], ["Find us", "Doon Zone Tower · Jakhan · Rajpur Road"]],
    hi: () => [["आज", dateline()], ["生き甲斐", "जीने की वजह"], ["समय", "सोम–शनि · सुबह 6 – रात 10"], ["拳", "इकिगाई बॉक्सिंग क्लब खुला है"],
      ["स्टूडियो", "ज़ुम्बा · भांगड़ा · योग"], ["रेटिंग", `${fit.source} पर ${fit.score.toFixed(1)}★ (पुष्टि बाकी)`], ["ट्रायल", "पहला दिन हमारी ओर से"], ["癒し", "स्टीम रूम और शावर"], ["पता", "डून ज़ोन टावर · जाखन · राजपुर रोड"]],
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
    polImg.src = IK.img(c.img, true);
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
