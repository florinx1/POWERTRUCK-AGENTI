(function () {
  "use strict";

  var CONFIG = window.APP_CONFIG || {};
  var QUEUE_KEY = "pt_pending_entries_v1";
  var QUEUE_PUNKT_KEY = "pt_pending_puncte_v1";
  var CACHE_META_KEY = "pt_meta_cache_v1";
  var CACHE_REPORT_KEY = "pt_report_cache_v1";
  var CACHE_AGENT_KEY = "pt_last_agent_v1";
  var CACHE_DEALERS_KEY = "pt_dealer_index_v1";
  var LANG_KEY = "pt_lang_v1";

  var DEFAULT_META = {
    agenti: Array.from({ length: 10 }, function (_, i) { return "Agent " + (i + 1); }),
    judete: ["Dolnoslaskie","Kujawsko-Pomorskie","Lubelskie","Lubuskie","Lodzkie","Malopolskie",
      "Mazowieckie","Opolskie","Podkarpackie","Podlaskie","Pomorskie","Slaskie",
      "Swietokrzyskie","Warminsko-Mazurskie","Wielkopolskie","Zachodniopomorskie"],
    statusuri: ["Do skontaktowania","Skontaktowano - zainteresowany","Skontaktowano - niezainteresowany",
      "Zaplanowane spotkanie","Wyslano oferte","W negocjacjach","Umowa podpisana","Odrzucony","Odroczone"],
    potential: ["Wysoki", "Sredni", "Niski"],
  };

  // ---------------------------------------------------------------------
  // I18N
  // ---------------------------------------------------------------------
  var currentLang = localStorage.getItem(LANG_KEY) || "pl";

  var I18N = {
    pl: {
      offlineBadge: "rozmow(y) niezapisane - wysle sie automatycznie",
      cancel: "Anuluj",
      fAgent: "Agent", fDate: "Data rozmowy *", fDealer: "Dealer / Firma *",
      fDealerPh: "np. Auto Przyklad Sp. z o.o.", fContact: "Osoba kontaktowa",
      fContactPh: "np. Jan Kowalski", fPhone: "Telefon", fEmail: "Email",
      fRegion: "Wojewodztwo *", fCity: "Miasto", fCityPh: "np. Warszawa",
      fStatus: "Status rozmowy *", fPotential: "Potencjal",
      fNextAction: "Kolejne dzialanie", fNextActionPh: "np. Wyslanie oferty",
      fNextDate: "Data kolejnego dzialania", fNotes: "Uwagi",
      fNotesPh: "Istotne szczegoly z rozmowy...",
      saveBtn: "Zapisz rozmowe", updateBtn: "Aktualizuj rozmowe", editBtn: "Edytuj / uzupelnij",
      pointsAddHeading: "Dodaj punkt", pointsAddIntro: "Jesli dealer ma dodatkowe miejsca dzialalnosci oprocz siedziby glownej, dodaj je tutaj.",
      pDealerPh: "Wpisz lub wybierz istniejacego dealera", pAddress: "Adres",
      pAddressPh: "np. ul. Przykladowa 12", pSaveBtn: "Zapisz punkt",
      pointsListHeading: "Punkty dodane",
      tabAdd: "Dodaj", tabPoints: "Punkty", tabReport: "Raport",
      refreshBtn: "Odswiez raport",
      statusCardTitle: "Status dealerow", agentCardTitle: "Aktywnosc agentow",
      geoCardTitle: "Dystrybucja geograficzna (top wojewodztwa)", mapCardTitle: "Mapa dealerow",
      restanteCardTitle: "Zalegle dzialania", allDiscutiiCardTitle: "Wszystkie rozmowy",
      searchPh: "Szukaj dealera lub agenta...",
      kpiTotal: "Wszystkie rozmowy", kpiSigned: "Podpisane umowy",
      kpiOverdue: "Zalegle dzialania", kpiRejected: "Odrzuceni dealerzy",
      emptyNoData: "Brak dodanych rozmow.", restanteEmpty: "Brak zaleglych dzialan - bardzo dobrze!",
      allEmpty: "Nie znaleziono zadnej rozmowy.", pointsEmpty: "Brak dodanych punktow.",
      msgRequiredFields: "Uzupelnij wymagane pola (*).",
      msgDuplicatePrefix: "Ten dealer zostal juz skontaktowany przez ", msgDuplicateSuffix: ". Rozmowa nie zostala zapisana.",
      msgSaved: "Rozmowa zapisana pomyslnie.", msgUpdated: "Rozmowa zaktualizowana pomyslnie.",
      msgNotConfigured: "Aplikacja nie jest jeszcze skonfigurowana (config.js) - rozmowa zapisana lokalnie.",
      msgOffline: "Brak polaczenia - rozmowa zapisana na telefonie i wysle sie automatycznie.",
      msgEditNotFound: "Rozmowa nie zostala znaleziona (mozliwe, ze zostala usunieta). Odswiez raport i sprobuj ponownie.",
      editBannerPrefix: "Edytujesz rozmowe dla \"", editBannerSuffix: "\".",
      editCancelled: "Edycja anulowana.",
      dealerWarningPrefix: "Uwaga: ten dealer zostal juz skontaktowany przez ",
      pMsgRequired: "Uzupelnij dealera, miasto i wojewodztwo.",
      pMsgSaved: "Punkt zapisany pomyslnie.",
      pMsgNotConfigured: "Aplikacja nie jest jeszcze skonfigurowana (config.js) - punkt zapisany lokalnie.",
      pMsgOffline: "Brak polaczenia - punkt zapisany na telefonie i wysle sie automatycznie.",
      pointsFilterNote: "Wpisz nazwe dealera powyzej, aby filtrowac liste.",
      mapNoteHint: "Dotknij wojewodztwa na mapie, aby zobaczyc szczegoly.",
      mapNoteEmpty: "Brak dodanych rozmow.",
      mapNoConn: "Mapa niedostepna (wymaga polaczenia z internetem).",
      mapPopupCount: " lokalizacji dealerow",
      mapTagHQ: "Siedziba", mapTagPoint: "Punkt",
      legendSuffix: " lok.",
      listShowing: "Wyswietlono najnowsze ", listOf: " z ", listDiscutii: " rozmow", listFiltered: " (filtrowane)",
      listResultsFor: " wynik(ow) dla \"", listResultsSuffix: "\".",
      listTotalSuffix: " rozmow(a) razem.",
      dot: ".",
    },
    en: {
      offlineBadge: "discussion(s) unsaved - will send automatically",
      cancel: "Cancel",
      fAgent: "Agent", fDate: "Discussion date *", fDealer: "Dealer / Company *",
      fDealerPh: "e.g. Auto Example Ltd", fContact: "Contact person",
      fContactPh: "e.g. John Smith", fPhone: "Phone", fEmail: "Email",
      fRegion: "Voivodeship *", fCity: "City", fCityPh: "e.g. Warsaw",
      fStatus: "Discussion status *", fPotential: "Potential",
      fNextAction: "Next action", fNextActionPh: "e.g. Send offer",
      fNextDate: "Next action date", fNotes: "Notes",
      fNotesPh: "Relevant details from the discussion...",
      saveBtn: "Save discussion", updateBtn: "Update discussion", editBtn: "Edit / complete",
      pointsAddHeading: "Add a point", pointsAddIntro: "If a dealer has extra locations besides its head office, add them here.",
      pDealerPh: "Type or pick an existing dealer", pAddress: "Address",
      pAddressPh: "e.g. 12 Example St", pSaveBtn: "Save point",
      pointsListHeading: "Points added",
      tabAdd: "Add", tabPoints: "Points", tabReport: "Report",
      refreshBtn: "Refresh report",
      statusCardTitle: "Dealer status", agentCardTitle: "Agent activity",
      geoCardTitle: "Geographic distribution (top voivodeships)", mapCardTitle: "Dealer map",
      restanteCardTitle: "Overdue actions", allDiscutiiCardTitle: "All discussions",
      searchPh: "Search dealer or agent...",
      kpiTotal: "Total discussions", kpiSigned: "Signed contracts",
      kpiOverdue: "Overdue actions", kpiRejected: "Rejected dealers",
      emptyNoData: "No discussions added yet.", restanteEmpty: "No overdue actions - great job!",
      allEmpty: "No discussion found.", pointsEmpty: "No points added yet.",
      msgRequiredFields: "Fill in the required fields (*).",
      msgDuplicatePrefix: "This dealer has already been contacted by ", msgDuplicateSuffix: ". The discussion was not saved.",
      msgSaved: "Discussion saved successfully.", msgUpdated: "Discussion updated successfully.",
      msgNotConfigured: "The app isn't configured yet (config.js) - discussion saved locally.",
      msgOffline: "No connection - the discussion was saved on your phone and will send automatically.",
      msgEditNotFound: "The discussion could not be found (it may have been deleted). Refresh the report and try again.",
      editBannerPrefix: "Editing the discussion for \"", editBannerSuffix: "\".",
      editCancelled: "Edit cancelled.",
      dealerWarningPrefix: "Warning: this dealer has already been contacted by ",
      pMsgRequired: "Fill in dealer, city and voivodeship.",
      pMsgSaved: "Point saved successfully.",
      pMsgNotConfigured: "The app isn't configured yet (config.js) - point saved locally.",
      pMsgOffline: "No connection - the point was saved on your phone and will send automatically.",
      pointsFilterNote: "Type a dealer name above to filter the list.",
      mapNoteHint: "Tap a voivodeship on the map for details.",
      mapNoteEmpty: "No discussions added yet.",
      mapNoConn: "Map unavailable (requires an internet connection).",
      mapPopupCount: " dealer location(s)",
      mapTagHQ: "HQ", mapTagPoint: "Point",
      legendSuffix: " loc.",
      listShowing: "Showing the latest ", listOf: " of ", listDiscutii: " discussions", listFiltered: " (filtered)",
      listResultsFor: " result(s) for \"", listResultsSuffix: "\".",
      listTotalSuffix: " discussion(s) in total.",
      dot: ".",
    },
  };

  function T(key) { return (I18N[currentLang] && I18N[currentLang][key]) || key; }

  var STATUS_TRANSLATE = {
    "Do skontaktowania": { pl: "Do skontaktowania", en: "To contact" },
    "Skontaktowano - zainteresowany": { pl: "Skontaktowano - zainteresowany", en: "Contacted - interested" },
    "Skontaktowano - niezainteresowany": { pl: "Skontaktowano - niezainteresowany", en: "Contacted - not interested" },
    "Zaplanowane spotkanie": { pl: "Zaplanowane spotkanie", en: "Meeting scheduled" },
    "Wyslano oferte": { pl: "Wysłano ofertę", en: "Offer sent" },
    "W negocjacjach": { pl: "W negocjacjach", en: "In negotiation" },
    "Umowa podpisana": { pl: "Umowa podpisana", en: "Contract signed" },
    "Odrzucony": { pl: "Odrzucony", en: "Rejected" },
    "Odroczone": { pl: "Odroczone", en: "Postponed" },
  };
  var POTENTIAL_TRANSLATE = {
    "Wysoki": { pl: "Wysoki", en: "High" },
    "Sredni": { pl: "Średni", en: "Medium" },
    "Niski": { pl: "Niski", en: "Low" },
  };
  var REGION_TRANSLATE = {
    "Dolnoslaskie": { pl: "Dolnośląskie", en: "Lower Silesian" },
    "Kujawsko-Pomorskie": { pl: "Kujawsko-Pomorskie", en: "Kuyavian-Pomeranian" },
    "Lubelskie": { pl: "Lubelskie", en: "Lublin" },
    "Lubuskie": { pl: "Lubuskie", en: "Lubusz" },
    "Lodzkie": { pl: "Łódzkie", en: "Lodz" },
    "Malopolskie": { pl: "Małopolskie", en: "Lesser Poland" },
    "Mazowieckie": { pl: "Mazowieckie", en: "Masovian" },
    "Opolskie": { pl: "Opolskie", en: "Opole" },
    "Podkarpackie": { pl: "Podkarpackie", en: "Subcarpathian" },
    "Podlaskie": { pl: "Podlaskie", en: "Podlaskie" },
    "Pomorskie": { pl: "Pomorskie", en: "Pomeranian" },
    "Slaskie": { pl: "Śląskie", en: "Silesian" },
    "Swietokrzyskie": { pl: "Świętokrzyskie", en: "Holy Cross" },
    "Warminsko-Mazurskie": { pl: "Warmińsko-Mazurskie", en: "Warmian-Masurian" },
    "Wielkopolskie": { pl: "Wielkopolskie", en: "Greater Poland" },
    "Zachodniopomorskie": { pl: "Zachodniopomorskie", en: "West Pomeranian" },
  };

  function trStatus(s) { return (STATUS_TRANSLATE[s] && STATUS_TRANSLATE[s][currentLang]) || s; }
  function trPotential(s) { return (POTENTIAL_TRANSLATE[s] && POTENTIAL_TRANSLATE[s][currentLang]) || s; }
  function trRegion(s) { return (REGION_TRANSLATE[s] && REGION_TRANSLATE[s][currentLang]) || s; }

  // Coordonate aproximative (capitala regiunii) pentru harta interactiva din Raport.
  var JUDET_COORDS = {
    "Dolnoslaskie": [51.1079, 17.0385], "Kujawsko-Pomorskie": [53.1235, 18.0084],
    "Lubelskie": [51.2465, 22.5684], "Lubuskie": [51.9356, 15.5062],
    "Lodzkie": [51.7592, 19.4560], "Malopolskie": [50.0647, 19.9450],
    "Mazowieckie": [52.2297, 21.0122], "Opolskie": [50.6751, 17.9213],
    "Podkarpackie": [50.0412, 21.9991], "Podlaskie": [53.1325, 23.1688],
    "Pomorskie": [54.3520, 18.6466], "Slaskie": [50.2649, 19.0238],
    "Swietokrzyskie": [50.8661, 20.6286], "Warminsko-Mazurskie": [53.7784, 20.4801],
    "Wielkopolskie": [52.4064, 16.9252], "Zachodniopomorskie": [53.4285, 14.5528],
  };

  var lastDiscutii = [];
  var lastDiscutiiTotal = 0;
  var lastPuncte = [];
  var dealerIndex = [];
  var lastMeta = DEFAULT_META;
  var editingKey = null; // normalized dealer key of the discussion currently being edited, or null when adding new

  function normalizeDealerJS(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findDuplicateLocal(dealerName) {
    var target = normalizeDealerJS(dealerName);
    if (!target) return null;
    for (var i = 0; i < dealerIndex.length; i++) {
      if (normalizeDealerJS(dealerIndex[i].dealer) === target) return dealerIndex[i];
    }
    return null;
  }

  function formatDateDisplay(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    if (parts.length !== 3) return iso;
    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  function addToDealerIndexCache(dealer, agent, data) {
    dealerIndex.push({ dealer: dealer, agent: agent, data: data || "" });
    localStorage.setItem(CACHE_DEALERS_KEY, JSON.stringify(dealerIndex));
  }

  function updateDealerIndexCache(dealer, agent, data) {
    var key = normalizeDealerJS(dealer);
    for (var i = 0; i < dealerIndex.length; i++) {
      if (normalizeDealerJS(dealerIndex[i].dealer) === key) {
        dealerIndex[i] = { dealer: dealer, agent: agent, data: data || "" };
        localStorage.setItem(CACHE_DEALERS_KEY, JSON.stringify(dealerIndex));
        return;
      }
    }
    addToDealerIndexCache(dealer, agent, data);
  }

  function checkDealerWarning() {
    var name = $("f_dealer").value.trim();
    var warnEl = $("dealerWarning");
    var dup = findDuplicateLocal(name);
    if (dup) {
      warnEl.textContent = T("dealerWarningPrefix") + dup.agent + (dup.data ? " (" + dup.data + ")" : "") + T("dot");
      warnEl.hidden = false;
    } else {
      warnEl.hidden = true;
      warnEl.textContent = "";
    }
    return dup;
  }

  var $ = function (id) { return document.getElementById(id); };

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function fillSelect(select, options, translateFn, keepValue) {
    var prev = keepValue ? select.value : null;
    select.innerHTML = "";
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt;
      o.textContent = translateFn ? translateFn(opt) : opt;
      select.appendChild(o);
    });
    if (prev && options.indexOf(prev) !== -1) select.value = prev;
  }

  function apiUrl(params) {
    var base = CONFIG.API_URL || "";
    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + qs;
  }

  function isConfigured() {
    return CONFIG.API_URL && CONFIG.API_URL.indexOf("PUNE_AICI") === -1 && CONFIG.API_URL.indexOf("TU_URL") === -1;
  }

  // ---------------------------------------------------------------------
  // I18N apply + language switch
  // ---------------------------------------------------------------------
  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = T(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = T(el.getAttribute("data-i18n-placeholder"));
    });
    $("submitBtn").textContent = editingKey ? T("updateBtn") : T("saveBtn");
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
    });
    document.documentElement.setAttribute("lang", currentLang);
  }

  function applyMetaOptions() {
    fillSelect($("f_judet"), lastMeta.judete, trRegion, true);
    fillSelect($("p_judet"), lastMeta.judete, trRegion, true);
    fillSelect($("f_status"), lastMeta.statusuri, trStatus, true);
    fillSelect($("f_potential"), lastMeta.potential, trPotential, true);
  }

  function setLang(lang) {
    if (lang !== "pl" && lang !== "en") return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyStaticText();
    applyMetaOptions();
    updateOfflineBadge();
    checkDealerWarning();
    if (lastDiscutii.length || lastPuncte.length) {
      applyListFilter();
      renderDealerMap(lastDiscutii, lastPuncte);
      renderPointsList();
    }
  }

  // ---------------------------------------------------------------------
  // META (dropdown lists)
  // ---------------------------------------------------------------------
  function applyMeta(meta) {
    lastMeta = meta;
    fillSelect($("f_agent"), meta.agenti, null, false);
    applyMetaOptions();
    var lastAgent = localStorage.getItem(CACHE_AGENT_KEY);
    if (lastAgent) $("f_agent").value = lastAgent;
  }

  function loadMeta() {
    var cached = localStorage.getItem(CACHE_META_KEY);
    applyMeta(cached ? JSON.parse(cached) : DEFAULT_META);

    if (!isConfigured()) return;
    fetch(apiUrl({ action: "meta", token: CONFIG.APP_TOKEN }))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok && data.meta) {
          localStorage.setItem(CACHE_META_KEY, JSON.stringify(data.meta));
          applyMeta(data.meta);
        }
      })
      .catch(function () { /* keep cached/default meta, likely offline */ });
  }

  function loadDealerIndex() {
    var cached = localStorage.getItem(CACHE_DEALERS_KEY);
    if (cached) {
      try { dealerIndex = JSON.parse(cached); } catch (e) { dealerIndex = []; }
    }
    refreshDealerDatalist();
    if (!isConfigured()) return;
    fetch(apiUrl({ action: "dealeri", token: CONFIG.APP_TOKEN }))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok && data.dealeri) {
          dealerIndex = data.dealeri;
          localStorage.setItem(CACHE_DEALERS_KEY, JSON.stringify(dealerIndex));
          refreshDealerDatalist();
        }
      })
      .catch(function () { /* keep cached index, likely offline */ });
  }

  function refreshDealerDatalist() {
    var dl = $("dealerList");
    if (!dl) return;
    var seen = {};
    var names = [];
    dealerIndex.forEach(function (d) {
      var key = normalizeDealerJS(d.dealer);
      if (!seen[key]) { seen[key] = true; names.push(d.dealer); }
    });
    dl.innerHTML = names.map(function (n) { return '<option value="' + escapeHtml(n) + '"></option>'; }).join("");
  }

  // ---------------------------------------------------------------------
  // EDIT MODE (completare/modificare discutie existenta din Raport)
  // ---------------------------------------------------------------------
  function enterEditMode(record) {
    editingKey = normalizeDealerJS(record.dealer);
    $("f_agent").value = record.agent || "";
    $("f_date").value = record.dataISO || "";
    $("f_dealer").value = record.dealer || "";
    $("f_contact").value = record.contact || "";
    $("f_telefon").value = record.telefon || "";
    $("f_email").value = record.email || "";
    $("f_judet").value = record.judet || "";
    $("f_localitate").value = record.localitate || "";
    $("f_status").value = record.status || "";
    $("f_potential").value = record.potential || "";
    $("f_next_action").value = record.nextAction || "";
    $("f_next_date").value = record.nextActionDateISO || "";
    $("f_obs").value = record.observatii || "";

    $("f_dealer").readOnly = true;
    $("dealerWarning").hidden = true;
    $("editBanner").hidden = false;
    $("editBannerText").textContent = T("editBannerPrefix") + record.dealer + T("editBannerSuffix");
    $("submitBtn").textContent = T("updateBtn");

    showTab("form");
    window.scrollTo(0, 0);
  }

  function exitEditMode() {
    editingKey = null;
    $("f_dealer").readOnly = false;
    $("editBanner").hidden = true;
    $("submitBtn").textContent = T("saveBtn");
  }

  // ---------------------------------------------------------------------
  // FORM SUBMIT + OFFLINE QUEUE
  // ---------------------------------------------------------------------
  function getQueue(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (e) { return []; }
  }
  function saveQueue(key, q) { localStorage.setItem(key, JSON.stringify(q)); }

  function queueEntry(entry, action) {
    var q = getQueue(QUEUE_KEY);
    q.push({ action: action || "add", entry: entry });
    saveQueue(QUEUE_KEY, q);
    updateOfflineBadge();
  }

  function readForm() {
    return {
      agent: $("f_agent").value,
      data: $("f_date").value,
      dealer: $("f_dealer").value.trim(),
      contact: $("f_contact").value.trim(),
      telefon: $("f_telefon").value.trim(),
      email: $("f_email").value.trim(),
      judet: $("f_judet").value,
      localitate: $("f_localitate").value.trim(),
      status: $("f_status").value,
      potential: $("f_potential").value,
      nextAction: $("f_next_action").value.trim(),
      nextActionDate: $("f_next_date").value,
      observatii: $("f_obs").value.trim(),
      clientTs: Date.now(),
    };
  }

  function sendEntry(entry, action) {
    return fetch(apiUrl({ action: action || "add", token: CONFIG.APP_TOKEN }), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight to Apps Script
      body: JSON.stringify(entry),
    }).then(function (r) { return r.json(); });
  }

  function flushQueue() {
    var q = getQueue(QUEUE_KEY);
    if (q.length && isConfigured()) {
      var remaining = [];
      var duplicatesDropped = [];
      var chain = Promise.resolve();
      q.forEach(function (item) {
        var action = (item && item.action) ? item.action : "add";
        var entry = (item && item.entry) ? item.entry : item; // backward-compat
        chain = chain.then(function () {
          return sendEntry(entry, action).then(function (res) {
            if (res && res.ok) {
              if (action === "update") updateDealerIndexCache(entry.dealer, entry.agent, formatDateDisplay(entry.data));
              else addToDealerIndexCache(entry.dealer, entry.agent, formatDateDisplay(entry.data));
            } else if (res && res.error === "duplicate") {
              duplicatesDropped.push({ entry: entry, res: res });
            } else {
              remaining.push({ action: action, entry: entry });
            }
          }).catch(function () {
            remaining.push({ action: action, entry: entry });
          });
        });
      });
      chain.then(function () {
        saveQueue(QUEUE_KEY, remaining);
        updateOfflineBadge();
        if (duplicatesDropped.length) {
          var d = duplicatesDropped[0];
          showMsg(T("msgDuplicatePrefix") + (d.res.agent || "") + (d.res.data ? " (" + d.res.data + ")" : "") + T("msgDuplicateSuffix"), "err");
        }
      });
    }
    flushPunctQueue();
  }

  function updateOfflineBadge() {
    var q = getQueue(QUEUE_KEY).concat(getQueue(QUEUE_PUNKT_KEY));
    var badge = $("offlineBadge");
    if (q.length > 0) {
      badge.hidden = false;
      badge.textContent = q.length + " " + T("offlineBadge");
    } else {
      badge.hidden = true;
    }
  }

  function resetFormKeepAgent() {
    var agent = $("f_agent").value;
    $("entryForm").reset();
    $("f_date").value = todayISO();
    $("f_agent").value = agent;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    var entry = readForm();
    if (!entry.agent || !entry.dealer || !entry.judet || !entry.status || !entry.data) {
      showMsg(T("msgRequiredFields"), "err");
      return;
    }

    var isEdit = !!editingKey;

    if (!isEdit) {
      var localDup = checkDealerWarning();
      if (localDup) {
        showMsg(T("msgDuplicatePrefix") + localDup.agent + (localDup.data ? " (" + localDup.data + ")" : "") + T("msgDuplicateSuffix"), "err");
        return;
      }
    }

    localStorage.setItem(CACHE_AGENT_KEY, entry.agent);
    var btn = $("submitBtn");
    btn.disabled = true;
    var action = isEdit ? "update" : "add";

    if (!isConfigured()) {
      queueEntry(entry, action);
      showMsg(T("msgNotConfigured"), "pending");
      resetFormKeepAgent();
      exitEditMode();
      btn.disabled = false;
      return;
    }

    sendEntry(entry, action).then(function (res) {
      btn.disabled = false;
      if (res && res.ok) {
        if (isEdit) updateDealerIndexCache(entry.dealer, entry.agent, formatDateDisplay(entry.data));
        else addToDealerIndexCache(entry.dealer, entry.agent, formatDateDisplay(entry.data));
        refreshDealerDatalist();
        showMsg(isEdit ? T("msgUpdated") : T("msgSaved"), "ok");
        resetFormKeepAgent();
        exitEditMode();
        $("dealerWarning").hidden = true;
      } else if (!isEdit && res && res.error === "duplicate") {
        if (res.agent) addToDealerIndexCache(entry.dealer, res.agent, res.data || "");
        showMsg(T("msgDuplicatePrefix") + (res.agent || "") + (res.data ? " (" + res.data + ")" : "") + T("msgDuplicateSuffix"), "err");
        checkDealerWarning();
      } else if (isEdit && res && res.error === "discutie negasita") {
        showMsg(T("msgEditNotFound"), "err");
      } else {
        throw new Error((res && res.error) || "eroare necunoscuta");
      }
    }).catch(function () {
      queueEntry(entry, action);
      showMsg(T("msgOffline"), "pending");
      resetFormKeepAgent();
      exitEditMode();
      btn.disabled = false;
    });
  }

  function showMsg(text, cls, targetId) {
    var el = $(targetId || "formMsg");
    el.textContent = text;
    el.className = "form-msg " + cls;
    setTimeout(function () {
      if (el.textContent === text) el.textContent = "";
    }, 6000);
  }

  // ---------------------------------------------------------------------
  // PUNCTE (puncte de lucru suplimentare pentru un dealer existent)
  // ---------------------------------------------------------------------
  function readPunctForm() {
    return {
      dealer: $("p_dealer").value.trim(),
      oras: $("p_oras").value.trim(),
      judet: $("p_judet").value,
      adresa: $("p_adresa").value.trim(),
      telefon: $("p_telefon").value.trim(),
      agent: $("f_agent").value || localStorage.getItem(CACHE_AGENT_KEY) || "",
      observatii: $("p_obs").value.trim(),
      clientTs: Date.now(),
    };
  }

  function queuePunct(entry) {
    var q = getQueue(QUEUE_PUNKT_KEY);
    q.push(entry);
    saveQueue(QUEUE_PUNKT_KEY, q);
    updateOfflineBadge();
  }

  function resetPunctForm() {
    $("punktForm").reset();
  }

  function handlePunctSubmit(evt) {
    evt.preventDefault();
    var entry = readPunctForm();
    if (!entry.dealer || !entry.oras || !entry.judet) {
      showMsg(T("pMsgRequired"), "err", "punktMsg");
      return;
    }
    var btn = $("punktSubmitBtn");
    btn.disabled = true;

    if (!isConfigured()) {
      queuePunct(entry);
      showMsg(T("pMsgNotConfigured"), "pending", "punktMsg");
      resetPunctForm();
      btn.disabled = false;
      return;
    }

    fetch(apiUrl({ action: "addpunct", token: CONFIG.APP_TOKEN }), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry),
    }).then(function (r) { return r.json(); }).then(function (res) {
      btn.disabled = false;
      if (res && res.ok) {
        lastPuncte.push({
          dealer: entry.dealer, oras: entry.oras, judet: entry.judet, adresa: entry.adresa,
          telefon: entry.telefon, agent: entry.agent, observatii: entry.observatii, data: todayISO(),
        });
        showMsg(T("pMsgSaved"), "ok", "punktMsg");
        resetPunctForm();
        renderPointsList();
      } else {
        throw new Error((res && res.error) || "eroare necunoscuta");
      }
    }).catch(function () {
      queuePunct(entry);
      showMsg(T("pMsgOffline"), "pending", "punktMsg");
      resetPunctForm();
      btn.disabled = false;
    });
  }

  function flushPunctQueue() {
    var q = getQueue(QUEUE_PUNKT_KEY);
    if (!q.length || !isConfigured()) return;
    var remaining = [];
    var chain = Promise.resolve();
    q.forEach(function (entry) {
      chain = chain.then(function () {
        return fetch(apiUrl({ action: "addpunct", token: CONFIG.APP_TOKEN }), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(entry),
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (!res || !res.ok) remaining.push(entry);
        }).catch(function () { remaining.push(entry); });
      });
    });
    chain.then(function () {
      saveQueue(QUEUE_PUNKT_KEY, remaining);
      updateOfflineBadge();
    });
  }

  function renderPointsList() {
    var el = $("pointsList");
    var noteEl = $("pointsListNote");
    if (!el) return;
    var filterQ = ($("p_dealer") && $("p_dealer").value || "").trim().toLowerCase();
    var list = !filterQ ? lastPuncte : lastPuncte.filter(function (p) {
      return (p.dealer || "").toLowerCase().indexOf(filterQ) !== -1;
    });
    if (noteEl) noteEl.textContent = list.length + T("listTotalSuffix");
    el.innerHTML = "";
    if (!list.length) {
      el.innerHTML = '<div class="empty-note">' + T("pointsEmpty") + '</div>';
      return;
    }
    list.slice().reverse().forEach(function (p) {
      var item = document.createElement("div");
      item.className = "punct-item";
      item.innerHTML =
        '<div class="p-top"><span class="p-dealer">' + escapeHtml(p.dealer) + '</span></div>' +
        '<div class="p-sub">' + escapeHtml(p.oras) + ', ' + escapeHtml(trRegion(p.judet)) +
        (p.telefon ? ' &middot; ' + escapeHtml(p.telefon) : '') + '</div>' +
        (p.adresa ? '<div class="p-sub">' + escapeHtml(p.adresa) + '</div>' : '') +
        (p.observatii ? '<div class="p-obs">' + escapeHtml(p.observatii) + '</div>' : '');
      el.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------
  function bar(row, label, count, max, cls) {
    var pct = max > 0 ? Math.round((count / max) * 100) : 0;
    var wrap = document.createElement("div");
    wrap.className = "bar-row";
    wrap.innerHTML =
      '<div class="bar-row-top"><span>' + escapeHtml(label) + '</span><span class="bar-count">' + count + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill' + (cls ? " " + cls : "") + '" style="width:' + pct + '%"></div></div>';
    row.appendChild(wrap);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderReport(data) {
    $("kpiGrid").innerHTML =
      kpiTile(T("kpiTotal"), data.total, "blue") +
      kpiTile(T("kpiSigned"), data.semnate, "good") +
      kpiTile(T("kpiOverdue"), data.restante, "critical") +
      kpiTile(T("kpiRejected"), data.respinse, "muted");

    var statusEl = $("statusBars"); statusEl.innerHTML = "";
    var maxStatus = Math.max.apply(null, data.byStatus.map(function (s) { return s.count; }).concat([1]));
    if (data.byStatus.every(function (s) { return s.count === 0; })) {
      statusEl.innerHTML = '<div class="empty-note">' + T("emptyNoData") + '</div>';
    } else {
      data.byStatus.forEach(function (s) { bar(statusEl, trStatus(s.status), s.count, maxStatus); });
    }

    var agentEl = $("agentBars"); agentEl.innerHTML = "";
    var maxAgent = Math.max.apply(null, data.byAgent.map(function (a) { return a.count; }).concat([1]));
    var activeAgents = data.byAgent.filter(function (a) { return a.count > 0; });
    if (!activeAgents.length) {
      agentEl.innerHTML = '<div class="empty-note">' + T("emptyNoData") + '</div>';
    } else {
      activeAgents.sort(function (a, b) { return b.count - a.count; })
        .forEach(function (a) { bar(agentEl, a.agent, a.count, maxAgent); });
    }

    var geoEl = $("geoBars"); geoEl.innerHTML = "";
    var topGeo = data.byJudet.filter(function (j) { return j.count > 0; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 10);
    var maxGeo = Math.max.apply(null, topGeo.map(function (j) { return j.count; }).concat([1]));
    if (!topGeo.length) {
      geoEl.innerHTML = '<div class="empty-note">' + T("emptyNoData") + '</div>';
    } else {
      topGeo.forEach(function (j) { bar(geoEl, trRegion(j.judet), j.count, maxGeo); });
    }

    var restEl = $("restanteList"); restEl.innerHTML = "";
    if (!data.restanteList.length) {
      restEl.innerHTML = '<div class="empty-note">' + T("restanteEmpty") + '</div>';
    } else {
      data.restanteList.forEach(function (r) {
        var item = document.createElement("div");
        item.className = "restanta-item";
        item.innerHTML =
          '<div class="r-top"><span>' + escapeHtml(r.agent) + ' &middot; ' + escapeHtml(r.dealer) + '</span>' +
          '<span class="r-days">' + r.zileIntarziere + '</span></div>' +
          '<div class="r-sub">' + escapeHtml(trRegion(r.judet)) + (r.telefon ? " &middot; " + escapeHtml(r.telefon) : "") + '</div>' +
          (r.observatii ? '<div class="r-obs">' + escapeHtml(r.observatii) + '</div>' : "");
        restEl.appendChild(item);
      });
    }

    lastDiscutii = data.discutii || [];
    lastDiscutiiTotal = data.discutiiTotal || lastDiscutii.length;
    lastPuncte = data.puncte || [];
    applyListFilter();
    renderDealerMap(lastDiscutii, lastPuncte);
    renderPointsList();
  }

  function statusPillClass(status) {
    if (status === "Umowa podpisana") return "good";
    if (status === "Odrzucony") return "critical";
    return "neutral";
  }

  function renderAllList(list) {
    var el = $("allDiscutiiList");
    el.innerHTML = "";
    if (!list.length) {
      el.innerHTML = '<div class="empty-note">' + T("allEmpty") + '</div>';
      return;
    }
    list.forEach(function (r) {
      var item = document.createElement("div");
      item.className = "discutie-item";
      item.innerHTML =
        '<div class="d-top"><span class="d-dealer">' + escapeHtml(r.dealer) + '</span>' +
        '<span class="status-pill ' + statusPillClass(r.status) + '">' + escapeHtml(trStatus(r.status)) + '</span></div>' +
        '<div class="d-sub">' + escapeHtml(r.agent) + ' &middot; ' + escapeHtml(trRegion(r.judet)) +
        (r.localitate ? ", " + escapeHtml(r.localitate) : "") + ' &middot; ' + escapeHtml(r.data) + '</div>' +
        (r.nextAction ? '<div class="d-next">' + escapeHtml(r.nextAction) +
          (r.nextActionDate ? " (" + escapeHtml(r.nextActionDate) + ")" : "") + '</div>' : "") +
        '<div class="d-actions"><button type="button" class="btn-edit" data-key="' +
          escapeHtml(normalizeDealerJS(r.dealer)) + '">' + escapeHtml(T("editBtn")) + '</button></div>';
      el.appendChild(item);
    });
  }

  function applyListFilter() {
    var q = ($("searchInput").value || "").trim().toLowerCase();
    var filtered = !q ? lastDiscutii : lastDiscutii.filter(function (r) {
      return (r.dealer || "").toLowerCase().indexOf(q) !== -1 ||
        (r.agent || "").toLowerCase().indexOf(q) !== -1;
    });
    var noteEl = $("listNote");
    if (lastDiscutiiTotal > lastDiscutii.length) {
      noteEl.textContent = T("listShowing") + lastDiscutii.length + T("listOf") + lastDiscutiiTotal + T("listDiscutii") + (q ? T("listFiltered") : "") + T("dot");
    } else if (q) {
      noteEl.textContent = filtered.length + T("listResultsFor") + q + T("listResultsSuffix");
    } else {
      noteEl.textContent = lastDiscutii.length + T("listTotalSuffix");
    }
    renderAllList(filtered);
  }

  function kpiTile(label, value, cls) {
    return '<div class="kpi-tile"><div class="kpi-label">' + escapeHtml(label) + '</div>' +
      '<div class="kpi-value ' + cls + '">' + value + '</div></div>';
  }

  function loadReport(forceRefresh) {
    var cached = localStorage.getItem(CACHE_REPORT_KEY);
    if (cached && !forceRefresh) {
      var parsed = JSON.parse(cached);
      renderReport(parsed.data);
      $("reportUpdated").textContent = new Date(parsed.ts).toLocaleString(currentLang === "pl" ? "pl-PL" : "en-GB");
    }
    if (!isConfigured()) {
      if (!cached) $("reportUpdated").textContent = "";
      return;
    }
    fetch(apiUrl({ action: "report", token: CONFIG.APP_TOKEN }))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error("raspuns invalid");
        renderReport(res.data);
        localStorage.setItem(CACHE_REPORT_KEY, JSON.stringify({ data: res.data, ts: Date.now() }));
        $("reportUpdated").textContent = new Date().toLocaleString(currentLang === "pl" ? "pl-PL" : "en-GB");
      })
      .catch(function () { /* keep cached report if any, likely offline */ });
  }

  // ---------------------------------------------------------------------
  // HARTA DEALERI
  // ---------------------------------------------------------------------
  var dealerMap = null;
  var dealerMapLayer = null;

  function ensureDealerMap() {
    if (dealerMap || typeof L === "undefined") return dealerMap;
    dealerMap = L.map("dealerMap", {
      center: [52.0, 19.4],
      zoom: 6,
      minZoom: 5,
      maxZoom: 12,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(dealerMap);
    dealerMapLayer = L.layerGroup().addTo(dealerMap);
    return dealerMap;
  }

  function judetBucketColor(count) {
    if (count >= 8) return "#184f95";
    if (count >= 5) return "#2a78d6";
    if (count >= 3) return "#5598e7";
    if (count >= 2) return "#86b6ef";
    return "#b7d3f6";
  }

  function buildMapPopup(judet, items) {
    var rows = items.slice(0, 30).map(function (it) {
      var tag = it.type === "hq" ? T("mapTagHQ") : T("mapTagPoint");
      var label = it.type === "hq" ? it.dealer : it.dealer + " — " + it.oras;
      return '<div class="mp-row"><span class="mp-dealer">' + escapeHtml(label) + '</span>' +
        '<span class="mp-tag">' + escapeHtml(tag) + '</span></div>';
    }).join("");
    var more = items.length > 30 ? '<div class="muted-text" style="margin-top:4px;">+ ' + (items.length - 30) + '</div>' : "";
    return '<div class="map-popup"><div class="mp-title">' + escapeHtml(trRegion(judet)) + '</div>' +
      '<div class="mp-count">' + items.length + T("mapPopupCount") + '</div>' +
      '<div class="mp-list">' + rows + '</div>' + more + '</div>';
  }

  function renderMapLegend() {
    var el = $("mapLegend");
    if (!el) return;
    var buckets = [
      { label: "1", color: "#b7d3f6" },
      { label: "2", color: "#86b6ef" },
      { label: "3-4", color: "#5598e7" },
      { label: "5-7", color: "#2a78d6" },
      { label: "8+", color: "#184f95" },
    ];
    el.innerHTML = buckets.map(function (b) {
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + b.color + '"></span>' + b.label + T("legendSuffix") + '</span>';
    }).join("");
  }

  function renderDealerMap(discutii, puncte) {
    var container = $("dealerMap");
    if (!container || container.offsetParent === null) return; // ascuns (alt tab activ) - se randeaza cand devine vizibil
    var noteEl = $("mapNote");
    if (typeof L === "undefined") {
      if (noteEl) noteEl.textContent = T("mapNoConn");
      return;
    }
    var map = ensureDealerMap();
    if (!map || !dealerMapLayer) return;
    dealerMapLayer.clearLayers();

    var byJudet = {};
    (discutii || []).forEach(function (r) {
      var key = r.judet || "";
      if (!key) return;
      if (!byJudet[key]) byJudet[key] = [];
      byJudet[key].push({ type: "hq", dealer: r.dealer, oras: r.localitate });
    });
    (puncte || []).forEach(function (p) {
      var key = p.judet || "";
      if (!key) return;
      if (!byJudet[key]) byJudet[key] = [];
      byJudet[key].push({ type: "point", dealer: p.dealer, oras: p.oras });
    });

    var judeteWithData = Object.keys(byJudet).filter(function (j) { return JUDET_COORDS[j]; });
    if (noteEl) noteEl.textContent = judeteWithData.length ? T("mapNoteHint") : T("mapNoteEmpty");

    judeteWithData.forEach(function (judet) {
      var list = byJudet[judet];
      var coords = JUDET_COORDS[judet];
      var radius = 8 + 6 * Math.sqrt(list.length);
      var marker = L.circleMarker(coords, {
        radius: radius,
        color: "#184f95",
        weight: 1.5,
        fillColor: judetBucketColor(list.length),
        fillOpacity: 0.82,
      });
      marker.bindPopup(buildMapPopup(judet, list), { maxWidth: 270 });
      marker.addTo(dealerMapLayer);
    });

    renderMapLegend();
  }

  // ---------------------------------------------------------------------
  // TABS
  // ---------------------------------------------------------------------
  function showTab(tab) {
    var isForm = tab === "form";
    var isPoints = tab === "points";
    var isReport = tab === "report";
    $("view-form").hidden = !isForm;
    $("view-points").hidden = !isPoints;
    $("view-report").hidden = !isReport;
    $("tabFormBtn").classList.toggle("active", isForm);
    $("tabPointsBtn").classList.toggle("active", isPoints);
    $("tabReportBtn").classList.toggle("active", isReport);
    if (isPoints) renderPointsList();
    if (isReport) loadReport(false);
  }

  // ---------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------
  function init() {
    $("f_date").value = todayISO();
    applyStaticText();
    loadMeta();
    loadDealerIndex();
    loadReport(false);
    updateOfflineBadge();

    $("entryForm").addEventListener("submit", handleSubmit);
    $("f_dealer").addEventListener("input", checkDealerWarning);
    $("f_dealer").addEventListener("blur", checkDealerWarning);
    $("cancelEditBtn").addEventListener("click", function () {
      resetFormKeepAgent();
      exitEditMode();
      showMsg(T("editCancelled"), "pending");
    });
    $("allDiscutiiList").addEventListener("click", function (evt) {
      var btn = evt.target.closest ? evt.target.closest(".btn-edit") : null;
      if (!btn) return;
      var key = btn.getAttribute("data-key");
      var record = null;
      for (var i = 0; i < lastDiscutii.length; i++) {
        if (normalizeDealerJS(lastDiscutii[i].dealer) === key) { record = lastDiscutii[i]; break; }
      }
      if (record) enterEditMode(record);
    });

    $("punktForm").addEventListener("submit", handlePunctSubmit);
    $("p_dealer").addEventListener("input", renderPointsList);

    $("tabFormBtn").addEventListener("click", function () { showTab("form"); });
    $("tabPointsBtn").addEventListener("click", function () { showTab("points"); });
    $("tabReportBtn").addEventListener("click", function () { showTab("report"); });
    $("refreshBtn").addEventListener("click", function () { loadReport(true); });
    $("searchInput").addEventListener("input", applyListFilter);
    $("langSwitch").addEventListener("click", function (evt) {
      var btn = evt.target.closest ? evt.target.closest(".lang-btn") : null;
      if (!btn) return;
      setLang(btn.getAttribute("data-lang"));
    });

    window.addEventListener("online", flushQueue);
    flushQueue();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
