/**
 * PowerTruck Poland - raportare agenti / dealeri - backend Google Apps Script
 * -----------------------------------------------------------------------
 * 1. Creati un Google Sheet nou.
 * 2. Extensions > Apps Script, stergeti codul exemplu si lipiti tot acest fisier.
 * 3. Schimbati APP_TOKEN mai jos cu acelasi cuvant secret pus in config.js din aplicatie.
 * 4. In editorul de script, selectati functia "setupSheets" din meniul de sus si apasati Run
 *    (o singura data) - creeaza foile "Discutii", "Puncte" si "Setari" cu anteturile corecte.
 * 5. Deploy > New deployment > tip "Web app" > Execute as: Me > Who has access: Anyone.
 * 6. Copiati URL-ul (se termina in /exec) in config.js, la API_URL.
 */

var APP_TOKEN = "powertruck2026"; // trebuie sa fie identic cu APP_TOKEN din config.js

var SHEET_DISCUTII = "Discutii";
var SHEET_PUNCTE = "Puncte";
var SHEET_SETARI = "Setari";

var DISCUTII_HEADERS = [
  "Znacznik czasu", "Data rozmowy", "Agent", "Dealer / Firma", "Osoba kontaktowa",
  "Telefon", "Email", "Wojewodztwo", "Miasto", "Status rozmowy", "Potencjal",
  "Kolejne dzialanie", "Data kolejnego dzialania", "Uwagi", "Powod ukrycia",
];
var COL_HIDE_REASON = DISCUTII_HEADERS.length; // 15 - ultima coloana (O): completata cand un dealer e "sters" din aplicatie
var DEFAULT_HIDE_REASON = "Negocjacje nieudane"; // "negociere esuata"

var PUNKTY_HEADERS = [
  "Znacznik czasu", "Dealer", "Miasto", "Wojewodztwo", "Adres", "Telefon", "Agent", "Uwagi",
];

var DEFAULT_AGENTI = Array.from({ length: 10 }, function (_, i) { return "Agent " + (i + 1); });
var DEFAULT_WOJEWODZTWA = [
  "Dolnoslaskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Lodzkie", "Malopolskie",
  "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie", "Pomorskie", "Slaskie",
  "Swietokrzyskie", "Warminsko-Mazurskie", "Wielkopolskie", "Zachodniopomorskie",
];
var DEFAULT_STATUS = [
  "Do skontaktowania", "Skontaktowano - zainteresowany", "Skontaktowano - niezainteresowany",
  "Zaplanowane spotkanie", "Wyslano oferte", "W negocjacjach", "Umowa podpisana",
  "Odrzucony", "Odroczone",
];
var DEFAULT_POTENTIAL = ["Wysoki", "Sredni", "Niski"];

// ---------------------------------------------------------------------------
// SETUP (rulati o singura data manual din editorul Apps Script)
// ---------------------------------------------------------------------------
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var discSheet = ss.getSheetByName(SHEET_DISCUTII) || ss.insertSheet(SHEET_DISCUTII);
  if (discSheet.getLastRow() === 0) {
    discSheet.getRange(1, 1, 1, DISCUTII_HEADERS.length).setValues([DISCUTII_HEADERS]);
    discSheet.setFrozenRows(1);
    discSheet.getRange(1, 1, 1, DISCUTII_HEADERS.length).setFontWeight("bold");
  } else {
    // Migrare: daca Sheet-ul a fost creat inainte de coloana "Powod ukrycia", o adaugam acum
    // fara sa atingem datele existente.
    var existingHeader = discSheet.getRange(1, COL_HIDE_REASON).getValue();
    if (String(existingHeader || "").trim() !== "Powod ukrycia") {
      discSheet.getRange(1, COL_HIDE_REASON).setValue("Powod ukrycia").setFontWeight("bold");
    }
  }

  var punktySheet = ss.getSheetByName(SHEET_PUNCTE) || ss.insertSheet(SHEET_PUNCTE);
  if (punktySheet.getLastRow() === 0) {
    punktySheet.getRange(1, 1, 1, PUNKTY_HEADERS.length).setValues([PUNKTY_HEADERS]);
    punktySheet.setFrozenRows(1);
    punktySheet.getRange(1, 1, 1, PUNKTY_HEADERS.length).setFontWeight("bold");
  }

  var setariSheet = ss.getSheetByName(SHEET_SETARI) || ss.insertSheet(SHEET_SETARI);
  if (setariSheet.getLastRow() === 0) {
    setariSheet.getRange(1, 1, 1, 4).setValues([["Agenci", "Wojewodztwa", "Status rozmowy", "Potencjal"]]);
    setariSheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    writeColumn(setariSheet, 1, DEFAULT_AGENTI);
    writeColumn(setariSheet, 2, DEFAULT_WOJEWODZTWA);
    writeColumn(setariSheet, 3, DEFAULT_STATUS);
    writeColumn(setariSheet, 4, DEFAULT_POTENTIAL);
    setariSheet.setFrozenRows(1);
  }

  var def = ss.getSheetByName("Sheet1");
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 3) ss.deleteSheet(def);

  SpreadsheetApp.getUi().alert("Gotowe! Arkusze 'Discutii', 'Puncte' i 'Setari' zostaly utworzone/zweryfikowane.");
}

function writeColumn(sheet, col, values) {
  if (!values.length) return;
  sheet.getRange(2, col, values.length, 1).setValues(values.map(function (v) { return [v]; }));
}

// ---------------------------------------------------------------------------
// HTTP ENTRY POINTS
// ---------------------------------------------------------------------------
// NOTA CORS: aplicatia (gazduita pe github.io) NU poate citi raspunsul lui
// script.google.com printr-un fetch() POST/GET obisnuit - Google nu trimite
// anteturile CORS necesare pentru domenii straine. Solutia: TOATE cererile
// (inclusiv salvarile) vin ca GET cu parametrul "callback" (tehnica JSONP,
// care ocoleste complet CORS pentru ca foloseste un <script src="..."> in loc
// de fetch). doPost() ramane mai jos doar ca rezerva / pentru testare manuala.
function doGet(e) {
  var action = (e.parameter.action || "").toLowerCase();
  var callback = e.parameter.callback || "";

  if (!checkToken(e.parameter.token)) return outResult({ ok: false, error: "token invalid" }, callback);

  if (action === "meta") return outResult({ ok: true, meta: readMeta() }, callback);
  if (action === "report") return outResult({ ok: true, data: buildReport() }, callback);
  if (action === "dealeri") return outResult({ ok: true, dealeri: readDealerIndex() }, callback);

  if (action === "add" || action === "update" || action === "addpunct" || action === "hide") {
    var entry;
    try {
      entry = JSON.parse(e.parameter.payload || "{}");
    } catch (err) {
      return outResult({ ok: false, error: "corp cerere invalid" }, callback);
    }
    var result;
    if (action === "add") result = processAdd(entry);
    else if (action === "update") result = processUpdate(entry);
    else if (action === "addpunct") result = processAddPunct(entry);
    else result = processHide(entry);
    return outResult(result, callback);
  }

  return outResult({ ok: true, message: "PowerTruck API active. Use ?action=meta, ?action=report or ?action=dealeri." }, callback);
}

// Rezerva / testare manuala (nu mai este folosita de aplicatie - vezi nota CORS de mai sus).
function doPost(e) {
  var action = (e.parameter.action || "add").toLowerCase();
  if (!checkToken(e.parameter.token)) return jsonOut({ ok: false, error: "token invalid" });
  if (["add", "update", "addpunct", "hide"].indexOf(action) === -1) {
    return jsonOut({ ok: false, error: "actiune necunoscuta" });
  }

  var entry;
  try {
    entry = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "corp cerere invalid" });
  }

  if (action === "add") return jsonOut(processAdd(entry));
  if (action === "update") return jsonOut(processUpdate(entry));
  if (action === "addpunct") return jsonOut(processAddPunct(entry));
  return jsonOut(processHide(entry));
}

// "Sterge" un dealer din aplicatie: NU se sterge randul din Sheet (ramane pentru evidenta),
// doar se completeaza coloana "Powod ukrycia" - rândul dispare din raport, din harta si din
// verificarea de duplicate, dar poate fi recuperat oricand stergand manual acea celula in Sheet.
function processHide(entry) {
  var key = normalizeDealer(entry.dealer);
  if (!key) return { ok: false, error: "dealer lipsa" };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISCUTII);
  var lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return { ok: false, error: "discutie negasita" };

  var dealerCol = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Dealer (D)
  for (var i = 0; i < dealerCol.length; i++) {
    if (normalizeDealer(dealerCol[i][0]) === key) {
      var row = i + 2;
      sheet.getRange(row, COL_HIDE_REASON).setValue(entry.reason || DEFAULT_HIDE_REASON);
      return { ok: true };
    }
  }
  return { ok: false, error: "discutie negasita" };
}

function processAdd(entry) {
  if (!entry.agent || !entry.dealer || !entry.judet || !entry.status || !entry.data) {
    return { ok: false, error: "campuri obligatorii lipsa" };
  }
  var dup = findDuplicateDealer(entry.dealer);
  if (dup) {
    return { ok: false, error: "duplicate", agent: dup.agent, data: dup.data };
  }
  appendEntryRow(entry);
  return { ok: true };
}

function appendEntryRow(entry) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISCUTII);
  sheet.appendRow([
    new Date(),
    entry.data || "",
    entry.agent || "",
    entry.dealer || "",
    entry.contact || "",
    entry.telefon || "",
    entry.email || "",
    entry.judet || "",
    entry.localitate || "",
    entry.status || "",
    entry.potential || "",
    entry.nextAction || "",
    entry.nextActionDate || "",
    entry.observatii || "",
  ]);
}

// Actualizeaza randul existent al unui dealer (identificat dupa numele dealerului,
// care ramane blocat/needitabil in aplicatie cat timp o discutie e in editare).
function processUpdate(entry) {
  var key = normalizeDealer(entry.dealer);
  if (!key) return { ok: false, error: "dealer lipsa pentru actualizare" };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISCUTII);
  var lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return { ok: false, error: "discutie negasita" };

  var dealerCol = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Dealer (D)
  for (var i = 0; i < dealerCol.length; i++) {
    if (normalizeDealer(dealerCol[i][0]) === key) {
      var row = i + 2;
      sheet.getRange(row, 2, 1, 13).setValues([[
        entry.data || "",
        entry.agent || "",
        entry.dealer || "",
        entry.contact || "",
        entry.telefon || "",
        entry.email || "",
        entry.judet || "",
        entry.localitate || "",
        entry.status || "",
        entry.potential || "",
        entry.nextAction || "",
        entry.nextActionDate || "",
        entry.observatii || "",
      ]]);
      return { ok: true, updated: true };
    }
  }
  return { ok: false, error: "discutie negasita" };
}

// Adauga un punct de lucru suplimentar pentru un dealer deja existent (sediu central
// intr-un oras, dar cu puncte si in alte orase/wojewodztwa).
function processAddPunct(entry) {
  if (!entry.dealer || !entry.oras || !entry.judet) {
    return { ok: false, error: "campuri obligatorii lipsa" };
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PUNCTE);
  sheet.appendRow([
    new Date(),
    entry.dealer || "",
    entry.oras || "",
    entry.judet || "",
    entry.adresa || "",
    entry.telefon || "",
    entry.agent || "",
    entry.observatii || "",
  ]);
  return { ok: true };
}

function checkToken(token) {
  return token && token === APP_TOKEN;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Raspuns JSONP: aplicatia cere datele printr-un tag <script>, nu printr-un
// fetch() - asa ocolim CORS. Daca nu vine "callback" (ex. test manual din
// browser, ca ?action=meta&token=...), raspundem simplu, ca JSON normal.
function outResult(obj, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(obj) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOut(obj);
}

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------
function readMeta() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETARI);
  if (!sheet) {
    return { agenti: DEFAULT_AGENTI, judete: DEFAULT_WOJEWODZTWA, statusuri: DEFAULT_STATUS, potential: DEFAULT_POTENTIAL };
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { agenti: DEFAULT_AGENTI, judete: DEFAULT_WOJEWODZTWA, statusuri: DEFAULT_STATUS, potential: DEFAULT_POTENTIAL };
  }
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return {
    agenti: uniqueNonEmpty(values.map(function (r) { return r[0]; })),
    judete: uniqueNonEmpty(values.map(function (r) { return r[1]; })),
    statusuri: uniqueNonEmpty(values.map(function (r) { return r[2]; })),
    potential: uniqueNonEmpty(values.map(function (r) { return r[3]; })),
  };
}

function uniqueNonEmpty(arr) {
  var seen = {};
  var out = [];
  arr.forEach(function (v) {
    var s = String(v || "").trim();
    if (s && !seen[s]) { seen[s] = true; out.push(s); }
  });
  return out;
}

// ---------------------------------------------------------------------------
// DEALERI (verificare duplicate)
// ---------------------------------------------------------------------------
function normalizeDealer(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Returneaza {agent, data} daca dealerul a mai fost introdus (si nu e ascuns/sters), altfel null.
function findDuplicateDealer(dealerName) {
  var target = normalizeDealer(dealerName);
  if (!target) return null;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISCUTII);
  var lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return null;
  var values = sheet.getRange(2, 2, lastRow - 1, COL_HIDE_REASON - 1).getValues(); // B..O: Data(0) Agent(1) Dealer(2) ... Powod ukrycia(12)
  for (var i = 0; i < values.length; i++) {
    var rowDealer = values[i][2];
    var hidden = String(values[i][COL_HIDE_REASON - 2] || "").trim(); // ultima coloana din range
    if (rowDealer && !hidden && normalizeDealer(rowDealer) === target) {
      return { agent: String(values[i][1] || ""), data: fmtDate(values[i][0]) };
    }
  }
  return null;
}

// Lista usoara (dealer, agent, data) pentru verificare instantanee in aplicatie - exclude dealerii ascunsi/stersi.
function readDealerIndex() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISCUTII);
  var lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 2, lastRow - 1, COL_HIDE_REASON - 1).getValues(); // B..O
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var dealer = values[i][2];
    if (!String(dealer || "").trim()) continue;
    var hidden = String(values[i][COL_HIDE_REASON - 2] || "").trim();
    if (hidden) continue;
    out.push({ dealer: String(dealer), agent: String(values[i][1] || ""), data: fmtDate(values[i][0]) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------
function buildReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dateSheet = ss.getSheetByName(SHEET_DISCUTII);
  var meta = readMeta();

  var rows = [];
  var hiddenDealers = {}; // dealeri "stersi" din aplicatie (randul ramane in Sheet, dar iese din raport/harta)
  var lastRow = dateSheet ? dateSheet.getLastRow() : 0;
  if (lastRow >= 2) {
    var values = dateSheet.getRange(2, 1, lastRow - 1, DISCUTII_HEADERS.length).getValues();
    values.forEach(function (r) {
      if (!String(r[3] || "").trim()) return; // skip rows without dealer
      if (String(r[14] || "").trim()) { // ascuns (Powod ukrycia completat) - nu intra in raport
        hiddenDealers[normalizeDealer(r[3])] = true;
        return;
      }
      rows.push({
        data: r[1], agent: String(r[2] || ""), dealer: String(r[3] || ""),
        contact: String(r[4] || ""), telefon: String(r[5] || ""), email: String(r[6] || ""),
        judet: String(r[7] || ""), localitate: String(r[8] || ""), status: String(r[9] || ""),
        potential: String(r[10] || ""), nextAction: String(r[11] || ""), nextActionDate: r[12],
        observatii: String(r[13] || ""),
      });
    });
  }

  var total = rows.length;
  var semnate = rows.filter(function (r) { return r.status === "Umowa podpisana"; }).length;
  var respinse = rows.filter(function (r) { return r.status === "Odrzucony"; }).length;

  var byAgent = meta.agenti.map(function (agent) {
    var rs = rows.filter(function (r) { return r.agent === agent; });
    return {
      agent: agent,
      count: rs.length,
      semnate: rs.filter(function (r) { return r.status === "Umowa podpisana"; }).length,
      respinse: rs.filter(function (r) { return r.status === "Odrzucony"; }).length,
    };
  });

  var byStatus = meta.statusuri.map(function (status) {
    var count = rows.filter(function (r) { return r.status === status; }).length;
    return { status: status, count: count, pct: total ? count / total : 0 };
  });

  var byJudet = meta.judete.map(function (judet) {
    return { judet: judet, count: rows.filter(function (r) { return r.judet === judet; }).length };
  });

  var now = new Date();
  var restanteList = rows.filter(function (r) {
    if (!r.nextActionDate) return false;
    if (r.status === "Umowa podpisana" || r.status === "Odrzucony") return false;
    var d = (r.nextActionDate instanceof Date) ? r.nextActionDate : new Date(r.nextActionDate);
    return d instanceof Date && !isNaN(d) && d < now;
  }).map(function (r) {
    var d = (r.nextActionDate instanceof Date) ? r.nextActionDate : new Date(r.nextActionDate);
    var zile = Math.floor((now - d) / 86400000);
    return {
      agent: r.agent, dealer: r.dealer, judet: r.judet, telefon: r.telefon,
      dataActiune: Utilities.formatDate(d, Session.getScriptTimeZone() || "Europe/Warsaw", "dd.MM.yyyy"),
      zileIntarziere: zile, observatii: r.observatii,
    };
  }).sort(function (a, b) { return b.zileIntarziere - a.zileIntarziere; }).slice(0, 50);

  var MAX_LIST = 500;
  var discutiiSorted = rows.slice().sort(function (a, b) {
    var da = toDateSafe(a.data), db = toDateSafe(b.data);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });
  var discutii = discutiiSorted.slice(0, MAX_LIST).map(function (r) {
    return {
      dealer: r.dealer, agent: r.agent, judet: r.judet, localitate: r.localitate,
      data: fmtDate(r.data), dataISO: isoDate(r.data), status: r.status, potential: r.potential,
      contact: r.contact, telefon: r.telefon, email: r.email,
      nextAction: r.nextAction, nextActionDate: fmtDate(r.nextActionDate), nextActionDateISO: isoDate(r.nextActionDate),
      observatii: r.observatii,
    };
  });

  // Puncte de lucru suplimentare (sediu central = randul din Discutii; puncte = ramuri).
  var puncteSheet = ss.getSheetByName(SHEET_PUNCTE);
  var puncte = [];
  var lastRowP = puncteSheet ? puncteSheet.getLastRow() : 0;
  if (lastRowP >= 2) {
    var valuesP = puncteSheet.getRange(2, 1, lastRowP - 1, PUNKTY_HEADERS.length).getValues();
    valuesP.forEach(function (r) {
      if (!String(r[1] || "").trim()) return; // skip rows without dealer
      if (hiddenDealers[normalizeDealer(r[1])]) return; // dealerul central e ascuns/sters - ascundem si punctele lui
      puncte.push({
        dealer: String(r[1] || ""), oras: String(r[2] || ""), judet: String(r[3] || ""),
        adresa: String(r[4] || ""), telefon: String(r[5] || ""), agent: String(r[6] || ""),
        observatii: String(r[7] || ""), data: fmtDate(r[0]),
      });
    });
  }

  return {
    total: total, semnate: semnate, respinse: respinse, restante: restanteList.length,
    byAgent: byAgent, byStatus: byStatus, byJudet: byJudet, restanteList: restanteList,
    discutii: discutii, discutiiTotal: rows.length, puncte: puncte,
  };
}

function toDateSafe(v) {
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (!v) return null;
  var d = new Date(v);
  return isNaN(d) ? null : d;
}

function fmtDate(v) {
  var d = toDateSafe(v);
  return d ? Utilities.formatDate(d, Session.getScriptTimeZone() || "Europe/Warsaw", "dd.MM.yyyy") : (v ? String(v) : "");
}

// Format yyyy-MM-dd, potrivit pentru campurile <input type="date"> din aplicatie.
function isoDate(v) {
  var d = toDateSafe(v);
  return d ? Utilities.formatDate(d, Session.getScriptTimeZone() || "Europe/Warsaw", "yyyy-MM-dd") : "";
}
