import React, { useMemo, useState, useEffect, useRef } from "react";

// --- Firebase (Realtime across devices) ---
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  where,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// 🔁 REPLACE THESE with your Firebase project config (Console → Project settings → Your apps → Web)
const firebaseConfig = {
  apiKey: "AIzaSyBNP267y8Nu8sMNod-XePen7L-iTPU_Ca0",
  authDomain: "devansh-veggie.firebaseapp.com",
  projectId: "devansh-veggie",
  storageBucket: "devansh-veggie.firebasestorage.app",
  messagingSenderId: "90314469787",
  appId: "1:90314469787:web:5c4499525e9429cfd2713e",
};

// Initialize once (safe even if hot-reloaded)
let _app;
try { _app = initializeApp(firebaseConfig); } catch (e) { /* already initialized */ }
const db = getFirestore();

// All devices share this vendor bucket for orders/products/discounts
const VENDOR_ID = "DevanshOverseasLLP"; // ← change only if you want a different shared bucket id

// ----------------- THEME -----------------
const BRAND_RED = "#D32F2F";
const BRAND_YELLOW = "#FFC107";
const STATUS_COLORS = {
  new: "#ef4444",
  accepted: "#16a34a",
  preparing: "#f59e0b",
  ready: "#2563eb",
  delivered: "#111827",
};

const CATEGORIES = ["Roots", "Leafy", "Salad/Gourd", "Other"];

const langs = [
  { code: "en", label: "English", vcl: "en-IN" },
  { code: "mr", label: "मराठी", vcl: "mr-IN" },
  { code: "hi", label: "हिन्दी", vcl: "hi-IN" },
];

const tdict = {
  en: {
    appTitle: "Devansh Overseas LLP",
    selectLanguage: "Choose your language",
    selectSociety: "Select Society",
    apartmentNumber: "Apartment Number",
    customerName: "Customer Name (optional)",
    saveAndContinue: "Save & Continue",
    products: "Products",
    addAll: "Add All to Cart",
    qty: "Qty",
    gotoCart: "Go to Cart",
    gotoOrders: "My Orders",
    checkout: "Checkout",
    codOnly: "Cash on Delivery only",
    delivery: "Delivery",
    today: "Today",
    tomorrow: "Tomorrow (pre-order)",
    back: "Back",
    placeOrder: "Place Order",
    orderConfirmed: "Order Confirmed!",
    orderNumber: "Order Number",
    myOrders: "My Orders",
    total: "Total",
    savings: "You saved",
    kg: "kg",
    kioskTitle: "Vendor Kiosk",
    salesToday: "Sales Today",
    ordersToday: "Orders Today",
    tabToday: "Today",
    tabTomorrow: "Tomorrow",
    tabArchived: "Archived",
    newOrder: "NEW ORDER",
    orderFrom: "Order from Apartment",
    accept: "Accept",
    preparing: "Preparing",
    ready: "Ready",
    delivered: "Delivered",
    productsMgmt: "Products",
    discounts: "Discounts",
    dashboard: "Dashboard",
    poweredBy: "Powered by Devansh Overseas LLP",
    tutorialTitle: "How to use",
    productDiscount: "Product discount (%)",
    customerDiscount: "Customer discount (%)",
    apt: "Apartment",
    name: "Name",
    addDiscount: "Add Discount",
    image: "Image",
    chooseEmoji: "Choose from list",
    imageURL: "Image URL",
    upload: "Upload",
    discount: "Discount",
    status: "Status",
    archiveTotal: "Archived total",
    simulate: "Simulate New Order",
    next: "Next",
    noOrders: "No orders yet.",
    addNewProduct: "Add New Product",
    existingProducts: "Existing Products",
    delete: "Delete",
    confirmDelete: "Delete this product? This can't be undone.",
    cancel: "Cancel",
    confirm: "Confirm",
    deleted: "Product deleted",
    undo: "Undo",
    category: "Category",
    filter: "Filter",
    all: "All",
    remove: "Remove",
    vendorLogin: "Vendor Login",
    enterPin: "Enter PIN",
    pin: "PIN",
    login: "Login",
    wrongPin: "Wrong PIN",
    changePin: "Change PIN",
    savePin: "Save PIN",
    logout: "Logout",
  },
  mr: {
    appTitle: "Devansh Overseas LLP",
    selectLanguage: "भाषा निवडा",
    selectSociety: "सोसायटी निवडा",
    apartmentNumber: "फ्लॅट क्रमांक",
    customerName: "ग्राहक नाव (ऐच्छिक)",
    saveAndContinue: "सेव्ह करा व पुढे जा",
    products: "भाज्या",
    addAll: "कार्टमध्ये जोडा",
    qty: "प्रमाण",
    gotoCart: "कार्टला जा",
    gotoOrders: "माझ्या ऑर्डर्स",
    checkout: "चेकआउट",
    codOnly: "फक्त डिलिव्हरीवर रोख",
    delivery: "डिलिव्हरी",
    today: "आज",
    tomorrow: "उद्या (प्री-ऑर्डर)",
    back: "मागे",
    placeOrder: "ऑर्डर करा",
    orderConfirmed: "ऑर्डर निश्चित!",
    orderNumber: "ऑर्डर क्रमांक",
    myOrders: "माझ्या ऑर्डर्स",
    total: "एकूण",
    savings: "तुमची बचत",
    kg: "कि.ग्राम",
    kioskTitle: "विक्रेता किऑस्क",
    salesToday: "आजची विक्री",
    ordersToday: "आजच्या ऑर्डर्स",
    tabToday: "आज",
    tabTomorrow: "उद्या",
    tabArchived: "आर्काइव्ह",
    newOrder: "नवीन ऑर्डर",
    orderFrom: "ऑर्डर - फ्लॅट",
    accept: "स्वीकारा",
    preparing: "तयार करत आहे",
    ready: "तयार",
    delivered: "पोचवली",
    productsMgmt: "प्रॉडक्ट्स",
    discounts: "सवलती",
    dashboard: "डॅशबोर्ड",
    poweredBy: "Powered by Devansh Overseas LLP",
    tutorialTitle: "कसे वापरायचे",
    productDiscount: "प्रॉडक्ट सवलत (%)",
    customerDiscount: "ग्राहक सवलत (%)",
    apt: "फ्लॅट",
    name: "नाव",
    addDiscount: "सवलत जोडा",
    image: "प्रतिमा",
    chooseEmoji: "सूचीमधून निवडा",
    imageURL: "प्रतिमेचा URL",
    upload: "अपलोड",
    discount: "सवलत",
    status: "स्थिती",
    archiveTotal: "आर्काइव्ह एकूण",
    simulate: "नवीन ऑर्डर दाखवा",
    next: "पुढे",
    noOrders: "अजून ऑर्डर्स नाहीत.",
    addNewProduct: "नवीन प्रॉडक्ट जोडा",
    existingProducts: "अस्तित्वातील प्रॉडक्ट्स",
    delete: "काढून टाका",
    confirmDelete: "हा प्रॉडक्ट हटवायचा? ही क्रिया परत आणता येणार नाही.",
    cancel: "रद्द",
    confirm: "ठीक",
    deleted: "प्रॉडक्ट हटवला",
    undo: "पूर्ववत",
    category: "वर्ग",
    filter: "फिल्टर",
    all: "सर्व",
    remove: "काढा",
    vendorLogin: "विक्रेता लॉगिन",
    enterPin: "PIN टाका",
    pin: "PIN",
    login: "लॉगिन",
    wrongPin: "चुकीचा PIN",
    changePin: "PIN बदला",
    savePin: "PIN सेव्ह करा",
    logout: "लॉगआऊट",
  },
  hi: {
    appTitle: "Devansh Overseas LLP",
    selectLanguage: "भाषा चुनें",
    selectSociety: "सोसायटी चुनें",
    apartmentNumber: "फ्लैट नंबर",
    customerName: "ग्राहक नाम (वैकल्पिक)",
    saveAndContinue: "सेव करें और आगे बढ़ें",
    products: "सब्ज़ियाँ",
    addAll: "कार्ट में जोड़ें",
    qty: "मात्रा",
    gotoCart: "मेरी कार्ट",
    gotoOrders: "मेरी ऑर्डर",
    checkout: "चेकआउट",
    codOnly: "केवल कैश ऑन डिलीवरी",
    delivery: "डिलीवरी",
    today: "आज",
    tomorrow: "कल (प्री-ऑर्डर)",
    back: "वापस",
    placeOrder: "ऑर्डर करें",
    orderConfirmed: "ऑर्डर कन्फर्म!",
    orderNumber: "ऑर्डर नंबर",
    myOrders: "मेरी ऑर्डर",
    total: "कुल",
    savings: "आपकी बचत",
    kg: "किलो",
    kioskTitle: "वेंडर कियोस्क",
    salesToday: "आज की बिक्री",
    ordersToday: "आज के ऑर्डर",
    tabToday: "आज",
    tabTomorrow: "कल",
    tabArchived: "आर्काइव्ड",
    newOrder: "नया ऑर्डर",
    orderFrom: "ऑर्डर - फ्लैट",
    accept: "स्वीकारें",
    preparing: "तैयार हो रहा है",
    ready: "तैयार",
    delivered: "डिलीवर",
    productsMgmt: "प्रोडक्ट्स",
    discounts: "डिस्काउंट",
    dashboard: "डैशबोर्ड",
    poweredBy: "Powered by Devansh Overseas LLP",
    tutorialTitle: "कैसे उपयोग करें",
    productDiscount: "प्रोडक्ट डिस्काउंट (%)",
    customerDiscount: "कस्टमर डिस्काउंट (%)",
    apt: "फ्लैट",
    name: "नाम",
    addDiscount: "डिस्काउंट जोड़ें",
    image: "इमेज",
    chooseEmoji: "सूची से चुनें",
    imageURL: "इमेज URL",
    upload: "अपलोड",
    discount: "छूट",
    status: "स्टेटस",
    archiveTotal: "आर्काइव कुल",
    simulate: "नया ऑर्डर दिखाएँ",
    next: "आगे",
    noOrders: "अभी कोई ऑर्डर नहीं।",
    addNewProduct: "नया प्रोडक्ट जोड़ें",
    existingProducts: "मौजूदा प्रोडक्ट्स",
    delete: "डिलीट",
    confirmDelete: "क्या आप इस प्रोडक्ट को हटाना चाहते हैं? यह क्रिया वापस नहीं होगी।",
    cancel: "रद्द",
    confirm: "कन्फर्म",
    deleted: "प्रोडक्ट हटाया गया",
    undo: "पूर्ववत",
    category: "श्रेणी",
    filter: "फ़िल्टर",
    all: "सभी",
    remove: "हटाएँ",
    vendorLogin: "वेंडर लॉगिन",
    enterPin: "PIN दर्ज करें",
    pin: "PIN",
    login: "लॉगिन",
    wrongPin: "गलत PIN",
    changePin: "PIN बदलें",
    savePin: "PIN सेव करें",
    logout: "लॉगआउट",
  },
};

const PRODUCT_LIBRARY = {
  potato: { img: "🥔", category: "Roots" },
  tomato: { img: "🍅", category: "Other" },
  onion: { img: "🧅", category: "Roots" },
  cucumber: { img: "🥒", category: "Salad/Gourd" },
  carrot: { img: "🥕", category: "Roots" },
  capsicum: { img: "🫑", category: "Other" },
  cabbage: { img: "🥬", category: "Leafy" },
  cauliflower: { img: "🥦", category: "Other" },
  coriander: { img: "🌿", category: "Leafy" },
};

const defaultProducts = [
  { id: "potato", name: { en: "Potato", mr: "બટાટા", hi: "आलू" }, price: 20, unit: "kg", img: PRODUCT_LIBRARY.potato.img, available: true, discountPct: 0, category: PRODUCT_LIBRARY.potato.category },
  { id: "tomato", name: { en: "Tomato", mr: "टोमॅटो", hi: "टमाटर" }, price: 25, unit: "kg", img: PRODUCT_LIBRARY.tomato.img, available: true, discountPct: 0, category: PRODUCT_LIBRARY.tomato.category },
  { id: "onion",  name: { en: "Onion",  mr: "कांदा",  hi: "प्याज़" },  price: 18, unit: "kg", img: PRODUCT_LIBRARY.onion.img, available: true, discountPct: 0, category: PRODUCT_LIBRARY.onion.category },
  { id: "cucumber",  name: { en: "Cucumber",  mr: "काकडी",  hi: "खीरा" },  price: 32, unit: "kg", img: PRODUCT_LIBRARY.cucumber.img, available: true, discountPct: 0, category: PRODUCT_LIBRARY.cucumber.category },
];

function useTranslate(lang) {
  const tt = useMemo(() => tdict[lang], [lang]);
  const name = (item) => item.name?.[lang] || item.name?.en || "";
  return { tt, name };
}

function ProductThumb({ img }) {
  if (typeof img === "string" && (img.startsWith("data:") || img.startsWith("http"))) {
    return <img src={img} alt="" className="w-10 h-10 rounded object-cover" />;
  }
  return <div className="text-3xl">{img || "🛒"}</div>;
}

/* -------- Header (Kiosk hidden, long-press 10s on brand) -------- */
function Header({ lang, setLang, onNavigate, active, title, onGoOrders }) {
  const BRAND_NAME = "Devansh Overseas LLP";

  const holdRef = useRef(null);
  const startHold = (e) => {
    e?.preventDefault?.();
    clearTimeout(holdRef.current);
    holdRef.current = setTimeout(() => {
      onNavigate && onNavigate("kiosk");
    }, 10000); // 10 seconds
  };
  const endHold = () => clearTimeout(holdRef.current);

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-3 sticky top-0 z-20 flex-wrap"
      style={{ background: BRAND_RED, color: "white" }}
    >
      {/* Brand — long-press here to open kiosk login */}
      <div
        className="flex items-center gap-2 select-none"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
      >
        <div className="font-extrabold text-xl leading-tight truncate max-w-[70vw]">
          {BRAND_NAME}
        </div>
        {title && title !== BRAND_NAME && (
          <div className="opacity-90 hidden sm:block">| {title}</div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
        <select
          className="bg-white text-black rounded px-2 py-1"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {langs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => onNavigate && onNavigate("customer")}
          className={`px-3 py-1 rounded ${
            active === "customer" ? "bg-yellow-400 text-black" : "bg-white text-black"
          }`}
        >
          Customer
        </button>

        {/* My Orders hidden on tiny screens to avoid overflow */}
        {active === "customer" && (
          <button
            onClick={onGoOrders}
            className="px-3 py-1 rounded bg-white text-black hidden sm:block"
          >
            {tdict[lang].gotoOrders}
          </button>
        )}
      </div>
    </div>
  );
}

/* -------- Customer: language & society steps -------- */
function LanguageFirst({ lang, setLang, onNext }) {
  const { tt } = useTranslate(lang);
  return (
    <div className="flex flex-col items-center justify-center p-6 h-[calc(100vh-64px)] bg-yellow-50">
      <div className="text-3xl font-extrabold" style={{ color: BRAND_RED }}>
        {tt.selectLanguage}
      </div>
      <select
        className="mt-4 border rounded p-2 text-lg"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <button
        onClick={onNext}
        className="mt-6 px-5 py-3 rounded-2xl shadow font-semibold"
        style={{ background: BRAND_YELLOW, color: "#111" }}
      >
        {tt.next}
      </button>
    </div>
  );
}

function SocietyApartment({ lang, onDone }) {
  const { tt } = useTranslate(lang);
  const SOCIETIES = ["Sai Shanti Park", "Aeroplise Phase 1", "Aeropoise Phase 2"];
  const [society, setSociety] = useState(SOCIETIES[0]);
  const [apt, setApt] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="p-4 max-w-md mx-auto">
      <label className="block text-sm mb-1">{tt.selectSociety}</label>
      <select
        value={society}
        onChange={(e) => setSociety(e.target.value)}
        className="w-full border rounded p-2 mb-4"
      >
        {SOCIETIES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <label className="block text-sm mb-1">{tt.apartmentNumber}</label>
      <input
        type="text"
        value={apt}
        onChange={(e) => setApt(e.target.value)}
        placeholder="3B"
        className="w-full border rounded p-2 mb-3"
      />

      <label className="block text-sm mb-1">{tt.customerName}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ramesh / Suresh"
        className="w-full border rounded p-2"
      />

      <button
        onClick={() =>
          onDone({ society, apt: apt?.trim() || "3B", name: name?.trim() || "" })
        }
        className="mt-4 w-full py-3 rounded-2xl font-semibold"
        style={{ background: BRAND_RED, color: "white" }}
      >
        {tt.saveAndContinue}
      </button>
    </div>
  );
}

/* -------- Products: multi-add with 0.1 kg steps -------- */
function ProductListMultiAdd({
  lang,
  products,
  setSelections,
  selections,
  onGoCart,
  onGoOrders,
}) {
  const { tt, name } = useTranslate(lang);
  const [catFilter, setCatFilter] = useState("All");
  const qtyOptions = Array.from({ length: 50 }).map((_, i) => ((i + 1) / 10).toFixed(1)); // 0.1..5.0
  const cats = Array.from(new Set(["All", ...products.map((p) => p.category || "Other")]));
  const visible = products
    .filter((p) => p.available)
    .filter((p) => (catFilter === "All" ? true : p.category === catFilter));

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">{tt.products}</h2>
        <div className="flex gap-2">
          <button onClick={onGoOrders} className="underline text-sm">
            {tt.gotoOrders}
          </button>
          <button onClick={onGoCart} className="underline text-sm">
            {tt.gotoCart}
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1 rounded-full text-sm ${
              catFilter === c ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {visible.map((v) => (
          <div key={v.id} className="border rounded-xl p-3 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <ProductThumb img={v.img} />
              <div>
                <div className="font-semibold">{name(v)}</div>
                <div className="text-xs text-gray-500">
                  {tdict[lang].category}: {v.category || "Other"}
                </div>
                <div className="text-sm text-gray-600">
                  ₹{v.price}/{tdict[lang].kg}{" "}
                  {v.discountPct ? (
                    <span className="ml-1 text-green-700 font-semibold">(-{v.discountPct}%)</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selections[v.id] || ""}
                onChange={(e) => setSelections((prev) => ({ ...prev, [v.id]: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="">{tt.qty}</option>
                {qtyOptions.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calcItemFinal(price, qty, productDiscountPct = 0, customerDiscountPct = 0) {
  const afterProduct = price * (1 - (productDiscountPct || 0) / 100);
  const afterCustomer = afterProduct * (1 - (customerDiscountPct || 0) / 100);
  return { line: afterCustomer * qty, base: price * qty, saved: price * qty - afterCustomer * qty };
}

/* -------- Cart / Checkout -------- */
function CartCheckout({ lang, cart, setCart, onPlace, onBack, products, customerDiscounts, profile }) {
  const { tt } = useTranslate(lang);
  const [delivery, setDelivery] = useState("today");
  const apt = profile?.apt?.trim();
  const custEntry = apt ? customerDiscounts[apt] || 0 : 0;
  const custDiscPct = typeof custEntry === "object" ? custEntry.pct || 0 : custEntry || 0;
  const custName = typeof custEntry === "object" ? custEntry.name || "" : profile?.name || "";

  const lines = cart.map((c) => {
    const prod = products.find((p) => p.id === c.id) || {};
    const calc = calcItemFinal(prod.price || c.price, c.qty, prod.discountPct || 0, custDiscPct);
    return { ...c, price: prod.price || c.price, productDiscount: prod.discountPct || 0, customerDiscount: custDiscPct, lineTotal: calc.line, saved: calc.saved };
  });
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  const savedTotal = lines.reduce((s, l) => s + l.saved, 0);

  const stepQty = (i, delta) => {
    setCart((prev) => prev
      .map((it, idx) => (idx === i ? { ...it, qty: Math.max(0.1, +(it.qty + delta).toFixed(1)) } : it))
      .filter((it) => it.qty > 0)
    );
  };
  const removeLine = (i) => setCart((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{tt.checkout}</h2>
        <button onClick={onBack} className="underline">← {tt.back}</button>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="border rounded-xl p-3 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-gray-500">₹{l.price.toFixed(2)}/{tdict[lang].kg}</div>
                {(((l.productDiscount ?? 0) > 0) || ((l.customerDiscount ?? 0) > 0)) && (
                   <div className="text-xs text-green-700 mt-1">
                   {tt.discount}:{" "}
                   {((l.productDiscount ?? 0) > 0) ? `-${l.productDiscount}% ` : ""}
                   {((l.customerDiscount ?? 0) > 0) ? `- ${l.customerDiscount}% ${custName ? `(${custName})` : `(apt ${apt})`}` : ""}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => stepQty(i, -0.1)} className="px-2 py-1 rounded bg-gray-200">-</button>
                  <div className="min-w-[48px] text-center font-semibold">{l.qty.toFixed(1)} {tdict[lang].kg}</div>
                  <button onClick={() => stepQty(i, +0.1)} className="px-2 py-1 rounded bg-gray-200">+</button>
                </div>
                <div className="mt-1 font-semibold">₹{l.lineTotal.toFixed(2)}</div>
                <button onClick={() => removeLine(i)} className="mt-1 text-xs underline text-red-700">{tt.remove}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-sm text-gray-600">{tt.codOnly}</div>

      <div className="mt-3">
        <div className="font-semibold mb-1">{tt.delivery}</div>
        <div className="flex gap-2">
          <button onClick={() => setDelivery("today")} className={`px-3 py-2 rounded-2xl ${delivery === "today" ? "bg-green-600 text-white" : "bg-gray-200"}`}>{tt.today}</button>
          <button onClick={() => setDelivery("tomorrow")} className={`px-3 py-2 rounded-2xl ${delivery === "tomorrow" ? "bg-green-600 text-white" : "bg-gray-200"}`}>{tt.tomorrow}</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-lg font-bold">
        <div>{tt.total}</div>
        <div>₹{total.toFixed(2)}</div>
      </div>
      {savedTotal > 0 && (
        <div className="mt-1 text-right text-sm text-green-700">{tt.savings}: ₹{savedTotal.toFixed(2)}</div>
      )}
      <button onClick={() => onPlace({ delivery, totalCalculated: total, lines })} className="mt-4 w-full py-3 rounded-2xl font-semibold" style={{ background: BRAND_RED, color: "white" }}>{tt.placeOrder}</button>
    </div>
  );
}

function Confirmation({ lang, orderId, onDone }) {
  const { tt } = useTranslate(lang);
  return (
    <div className="flex flex-col items-center justify-center p-6 h-[calc(100vh-64px)] bg-green-50">
      <div className="text-6xl">✅</div>
      <div className="mt-2 text-2xl font-bold">{tt.orderConfirmed}</div>
      <div className="mt-1">{tt.orderNumber}: <span className="font-mono">{orderId}</span></div>
      <button onClick={onDone} className="mt-6 px-5 py-3 rounded-2xl shadow font-semibold" style={{ background: BRAND_YELLOW, color: "#111" }}>{tdict[lang].myOrders}</button>
    </div>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return <span className="px-2 py-1 rounded-full text-white text-xs" style={{ background: color }}>{status}</span>;
}

const orderStages = ["new", "accepted", "preparing", "ready", "delivered"];

function speak(text, langCode) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode || "en-IN";
  window.speechSynthesis.speak(u);
}

// Loud alarm + vibration for kiosk
function playAlarm() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const beep = (start) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.6, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      o.start(start);
      o.stop(start + 0.36);
    };
    const t0 = ctx.currentTime;
    [0, 0.45, 0.9].forEach((off) => beep(t0 + off));
  } catch {}
  if (navigator?.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
}

/* -------- Vendor Kiosk -------- */
function Kiosk({
  lang,
  orders,
  setOrders,
  flash,
  setFlash,
  totals,
  lastNewOrder,
  onSimulate,
  view,
  setView,
  customerDiscounts,
  onChangePin,
  onLogout,
}) {
  const { tt } = useTranslate(lang);
  const prevNewId = useRef(null);

  useEffect(() => {
    if (lastNewOrder && lastNewOrder.id !== prevNewId.current) {
      prevNewId.current = lastNewOrder.id;
      setFlash(true);
      const langMeta = langs.find((l) => l.code === lang);
      playAlarm();
      speak(`${tt.newOrder}: ${tt.orderFrom} ${lastNewOrder.apt}`, langMeta?.vcl);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [lastNewOrder, lang, setFlash, tt]);

  const [tab, setTab] = useState("today");
  const [selected, setSelected] = useState(null);

  // Real-time Firestore feed: kiosk sees ALL customer orders
  useEffect(() => {
    try {
      const q = query(collection(db, "vendors", VENDOR_ID, "orders"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setOrders(arr);
      });
      return () => unsub();
    } catch (e) { console.warn("Firestore onSnapshot skipped:", e?.message); }
  }, [setOrders]);

  const filtered = orders.filter((o) => o.when === (tab === "today" ? "today" : tab === "tomorrow" ? "tomorrow" : "archived"));
  const archivedTotal = useMemo(() => orders.filter((o) => o.when === "archived").reduce((s, o) => s + (o.total || 0), 0), [orders]);

  const updateStatus = async (id, status) => {
    // local instant update
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, status };
      if (status === "delivered") updated.when = "archived";
      return updated;
    }));
    setSelected((s) => (s ? { ...s, status, when: status === "delivered" ? "archived" : s.when } : s));

    // remote update (Firestore)
    try {
      const ref = doc(db, "vendors", VENDOR_ID, "orders", id.toString());
      await updateDoc(ref, { status, ...(status === "delivered" ? { when: "archived" } : {}) });
    } catch (e) { console.warn("Firestore updateDoc skipped:", e?.message); }
  };

  return (
    <div className="p-4">
      <div className="rounded-2xl p-4 flex items-center justify-between shadow flex-wrap gap-2" style={{ background: BRAND_YELLOW }}>
        <div className="text-lg font-bold">{tt.ordersToday}: {totals.ordersToday}</div>
        <div className="text-lg font-bold">{tt.salesToday}: ₹{totals.salesToday.toFixed(2)}</div>
        <div className="flex items-center gap-2">
          <button onClick={onSimulate} className="px-2 py-1 rounded bg-white text-black text-xs">{tt.simulate}</button>
          <button onClick={onChangePin} className="px-2 py-1 rounded bg-white text-black text-xs">{tt.changePin}</button>
          <button onClick={onLogout} className="px-2 py-1 rounded bg-white text-black text-xs">{tt.logout}</button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => setView("orders")} className={`px-3 py-2 rounded-2xl ${view === "orders" ? "bg-black text-white" : "bg-gray-200"}`}>Orders</button>
        <button onClick={() => setView("products")} className={`px-3 py-2 rounded-2xl ${view === "products" ? "bg-black text-white" : "bg-gray-200"}`}>{tt.productsMgmt}</button>
        <button onClick={() => setView("discounts")} className={`px-3 py-2 rounded-2xl ${view === "discounts" ? "bg-black text-white" : "bg-gray-200"}`}>{tt.discounts}</button>
        <button onClick={() => setView("dashboard")} className={`px-3 py-2 rounded-2xl ${view === "dashboard" ? "bg-black text-white" : "bg-gray-200"}`}>{tt.dashboard}</button>
      </div>

      {/* Orders tab UI */}
      {view === "orders" && (
        <>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setTab("today")} className={`px-4 py-2 rounded-2xl font-semibold ${tab === "today" ? "bg-green-600 text-white" : "bg-gray-200"}`}>{tt.tabToday}</button>
            <button onClick={() => setTab("tomorrow")} className={`px-4 py-2 rounded-2xl font-semibold ${tab === "tomorrow" ? "bg-green-600 text-white" : "bg-gray-200"}`}>{tt.tabTomorrow}</button>
            <button onClick={() => setTab("archived")} className={`px-4 py-2 rounded-2xl font-semibold ${tab === "archived" ? "bg-green-600 text-white" : "bg-gray-200"}`}>{tt.tabArchived}</button>
          </div>

          {tab === "archived" && (
            <div className="mt-2 text-right font-semibold">{tt.archiveTotal}: ₹{archivedTotal.toFixed(2)}</div>
          )}
          {flash && (
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ background: "rgba(255,255,0,0.25)" }}>
              <div className="text-4xl font-extrabold" style={{ color: BRAND_RED }}>{tdict[lang].newOrder}!</div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((o) => {
              const cd = customerDiscounts?.[o.apt];
              const displayName = typeof cd === "object" && cd?.name ? cd.name : "";
              return (
                <div key={o.id} className="rounded-2xl p-4 shadow bg-white border-2" style={{ borderColor: STATUS_COLORS[o.status] || "#e5e7eb" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-extrabold" style={{ color: BRAND_RED }}>
                      Apt {o.apt}{displayName ? ` — ${displayName}` : ""}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-1 space-y-1">
                    {(o.items || []).map((i, idx) => (
                      <div key={idx} className="text-lg font-semibold">
                        • {i.name} — {i.qty} {i.unit}{" "}
                        {(((i.pdisc ?? 0) > 0) || ((i.cdisc ?? 0) > 0)) && (
                        <span className="text-xs text-green-700 ml-2">
                      ({[
                          ((i.pdisc ?? 0) > 0) ? `-${i.pdisc}%` : null,
                          ((i.cdisc ?? 0) > 0) ? `-${i.cdisc}%` : null,
                          ].filter(Boolean).join(", ")})
                      </span>
                      )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-lg font-bold">₹{(o.total || 0).toFixed(2)}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {orderStages.map((s) => (
                      <span key={s} className={`px-2 py-1 rounded-full text-xs ${o.status === s ? "bg-black text-white" : "bg-gray-200"}`}>{s}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => updateStatus(o.id, "accepted")} className="px-3 py-2 rounded-2xl bg-green-700 text-white">{tt.accept}</button>
                    <button onClick={() => updateStatus(o.id, "preparing")} className="px-3 py-2 rounded-2xl bg-yellow-500">{tt.preparing}</button>
                    <button onClick={() => updateStatus(o.id, "ready")} className="px-3 py-2 rounded-2xl bg-blue-600 text-white">{tt.ready}</button>
                    <button onClick={() => updateStatus(o.id, "delivered")} className="px-3 py-2 rounded-2xl bg-gray-800 text-white">{tt.delivered}</button>
                    <button onClick={() => setSelected(o)} className="ml-auto underline">Details</button>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-4 w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl font-bold">#{selected.orderNum || selected.id} — Apt {selected.apt}</div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="text-sm text-gray-600">{(selected.items || []).map((i) => `${i.name} ${i.qty}${i.unit}`).join(", ")}</div>
                <div className="mt-2 font-semibold">₹{(selected.total || 0).toFixed(2)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {orderStages.map((s) => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} className={`px-3 py-2 rounded-2xl ${selected.status === s ? "bg-green-700 text-white" : "bg-gray-200"}`}>{s}</button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setSelected(null)} className="px-3 py-2 rounded-xl bg-gray-800 text-white">Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* -------- Product Management (Realtime via Firestore) -------- */
function ProductManagement({ lang, products, setProducts }) {
  const { tt } = useTranslate(lang);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [imgMode, setImgMode] = useState("emoji");
  const [emojiKey, setEmojiKey] = useState("potato");
  const [imgURL, setImgURL] = useState("");
  const [uploadData, setUploadData] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const [confirmId, setConfirmId] = useState(null);
  const [undo, setUndo] = useState(null);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setUploadData(fr.result);
    fr.readAsDataURL(file);
  };

  const addProduct = async () => {
    const key = name.trim().toLowerCase() || `p_${Date.now()}`;
    let img = "🛒";
    if (imgMode === "emoji") img = PRODUCT_LIBRARY[emojiKey]?.img || "🛒";
    if (imgMode === "url" && imgURL) img = imgURL.trim();
    if (imgMode === "upload" && uploadData) img = uploadData;

    const localized = { en: name || "New", mr: name || "नवे", hi: name || "नया" };
    const prod = { id: key, name: localized, price: Number(price || 0), unit: "kg", img, available: true, discountPct: Number(discountPct || 0), category };

    // instant UI
    setProducts((prev) => [prod, ...prev.filter((p) => p.id !== key)]);

    // sync to Firestore
    try { await setDoc(doc(db, "vendors", VENDOR_ID, "products", key), prod); }
    catch (e) { console.warn("products setDoc skipped:", e?.message); }

    setName(""); setPrice(""); setDiscountPct(0); setImgURL(""); setUploadData(""); setCategory(CATEGORIES[0]);
  };

  const toggleAvail = async (id) => {
    const curr = products.find((p) => p.id === id);
    const next = !curr?.available;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: next } : p)));
    try { await updateDoc(doc(db, "vendors", VENDOR_ID, "products", id), { available: next }); }
    catch (e) { console.warn("products updateDoc (available) skipped:", e?.message); }
  };

  const setProdDiscount = async (id, v) => {
    const pct = Number(v || 0);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, discountPct: pct } : p)));
    try { await updateDoc(doc(db, "vendors", VENDOR_ID, "products", id), { discountPct: pct }); }
    catch (e) { console.warn("products updateDoc (discountPct) skipped:", e?.message); }
  };

  const setProdCategory = async (id, cat) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, category: cat } : p)));
    try { await updateDoc(doc(db, "vendors", VENDOR_ID, "products", id), { category: cat }); }
    catch (e) { console.warn("products updateDoc (category) skipped:", e?.message); }
  };

  const askDelete = (id) => setConfirmId(id);
  const doDelete = async () => {
    if (!confirmId) return;
    const target = products.find((p) => p.id === confirmId);
    try { await deleteDoc(doc(db, "vendors", VENDOR_ID, "products", confirmId)); }
    catch (e) { console.warn("products deleteDoc skipped:", e?.message); }
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== confirmId);
      const timer = setTimeout(() => setUndo(null), 4000);
      setUndo({ product: target, timer });
      return next;
    });
    setConfirmId(null);
  };
  const undoDelete = async () => {
    if (!undo?.product) return;
    clearTimeout(undo.timer);
    const prod = undo.product;
    setProducts((prev) => [prod, ...prev.filter((p) => p.id !== prod.id)]);
    setUndo(null);
    try { await setDoc(doc(db, "vendors", VENDOR_ID, "products", prod.id), prod); }
    catch (e) { console.warn("products setDoc (undo) skipped:", e?.message); }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">{tt.productsMgmt}</h3>

      <div className="border-2 rounded-2xl p-3 bg-white mb-4" style={{ borderColor: BRAND_YELLOW }}>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{tt.addNewProduct}</div>
        </div>
        <div className="text-xs text-gray-600 mt-1">This section is only for creating a NEW product. Existing products are listed below.</div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Potato" className="border rounded px-2 py-2 w-full" />
          </div>
          <div className="w-36">
            <label className="text-xs">Price/kg (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="20" className="border rounded px-2 py-2 w-full" />
          </div>
          <div className="w-40">
            <label className="text-xs">{tdict[lang].productDiscount}</label>
            <input value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="0" className="border rounded px-2 py-2 w-full" />
          </div>
          <div className="w-40">
            <label className="text-xs">{tdict[lang].category}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-2 py-2 w-full">
              {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs mb-1">{tdict[lang].image}</div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-1">
              <input type="radio" checked={imgMode === "emoji"} onChange={() => setImgMode("emoji")} /> {tdict[lang].chooseEmoji}
              <select className="ml-2 border rounded px-2 py-1" value={emojiKey} onChange={(e) => setEmojiKey(e.target.value)}>
                {Object.keys(PRODUCT_LIBRARY).map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
              <span className="ml-1 text-2xl">{PRODUCT_LIBRARY[emojiKey]?.img}</span>
            </label>

            <label className="flex items-center gap-1">
              <input type="radio" checked={imgMode === "url"} onChange={() => setImgMode("url")} /> {tdict[lang].imageURL}
              <input value={imgURL} onChange={(e) => setImgURL(e.target.value)} placeholder="https://..." className="ml-2 border rounded px-2 py-1 w-56" />
            </label>

            <label className="flex items-center gap-1">
              <input type="radio" checked={imgMode === "upload"} onChange={() => setImgMode("upload")} /> {tdict[lang].upload}
              <input type="file" accept="image/*" onChange={onUpload} className="ml-2" />
            </label>
          </div>
        </div>

        <button onClick={addProduct} className="mt-3 px-4 py-2 rounded-2xl text-white" style={{ background: BRAND_RED }}>Add Product</button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">{tdict[lang].existingProducts}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <div key={p.id} className="border rounded-2xl p-3 bg-white">
            <div className="flex items-center gap-2"><ProductThumb img={p.img} /><div className="font-semibold">{p.name.en}</div></div>
            <div className="text-sm text-gray-600 mt-1">₹{p.price}/kg</div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-sm">Available</label>
              <input type="checkbox" checked={p.available} onChange={() => toggleAvail(p.id)} />
            </div>
            <div className="mt-2">
              <label className="text-xs">{tdict[lang].productDiscount}</label>
              <input value={p.discountPct} onChange={(e) => setProdDiscount(p.id, e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
            <div className="mt-2">
              <label className="text-xs">{tdict[lang].category}</label>
              <select value={p.category || "Other"} onChange={(e) => setProdCategory(p.id, e.target.value)} className="border rounded px-2 py-1 w-full">
                {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
            <div className="mt-3 flex justify-between">
              <button onClick={() => askDelete(p.id)} className="px-3 py-2 rounded-xl text-white" style={{ background: BRAND_RED }}>{tdict[lang].delete}</button>
            </div>
          </div>
        ))}
      </div>

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
            <div className="text-lg font-bold mb-2">{tdict[lang].confirmDelete}</div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-2xl bg-gray-200">{tdict[lang].cancel}</button>
              <button onClick={doDelete} className="px-4 py-2 rounded-2xl text-white" style={{ background: BRAND_RED }}>{tdict[lang].confirm}</button>
            </div>
          </div>
        </div>
      )}

      {undo?.product && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full shadow z-40 flex items-center gap-3">
          <span>{tdict[lang].deleted}</span>
          <button onClick={undoDelete} className="underline">{tdict[lang].undo}</button>
        </div>
      )}
    </div>
  );
}

/* -------- Discounts (Realtime via Firestore) -------- */
function Discounts({ lang, customerDiscounts, setCustomerDiscounts }) {
  const { tt } = useTranslate(lang);
  const [apt, setApt] = useState("");
  const [name, setName] = useState("");
  const [pct, setPct] = useState("");

  const add = async () => {
    const a = (apt || "").trim();
    if (!a) return;
    const p = Number(pct || 0);
    const nm = (name || "").trim();
    setCustomerDiscounts((prev) => ({ ...prev, [a]: { pct: p, name: nm } }));
    try { await setDoc(doc(db, "vendors", VENDOR_ID, "discounts", a), { pct: p, name: nm }); }
    catch (e) { console.warn("discount setDoc skipped:", e?.message); }
    setApt(""); setPct(""); setName("");
  };
  const remove = async (a) => {
    try { await deleteDoc(doc(db, "vendors", VENDOR_ID, "discounts", a)); }
    catch (e) { console.warn("discount deleteDoc skipped:", e?.message); }
    setCustomerDiscounts((prev) => { const cp = { ...prev }; delete cp[a]; return cp; });
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">{tt.discounts}</h3>
      <div className="border rounded-2xl p-3 bg-white mb-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-32">
            <label className="text-xs">{tt.apt}</label>
            <input value={apt} onChange={(e) => setApt(e.target.value)} placeholder="3B" className="border rounded px-2 py-2 w-full" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs">{tt.name}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ramesh" className="border rounded px-2 py-2 w-full" />
          </div>
          <div className="w-40">
            <label className="text-xs">{tt.customerDiscount}</label>
            <input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="5" className="border rounded px-2 py-2 w-full" />
          </div>
          <button onClick={add} className="px-4 py-2 rounded-2xl text-white" style={{ background: BRAND_RED }}>{tt.addDiscount}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(customerDiscounts).map(([a, v]) => (
          <div key={a} className="border rounded-2xl p-3 bg-white flex items-center justify-between">
            <div>
              <div className="font-semibold">Apt {a}{v?.name ? ` — ${v.name}` : ""}</div>
              <div className="text-sm text-gray-600">-{(typeof v === "object" ? v.pct : v)}%</div>
            </div>
            <button onClick={() => remove(a)} className="px-2 py-1 rounded bg-gray-200">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Dashboard -------- */
function Dashboard({ lang, orders, customerDiscounts }) {
  const { tt } = useTranslate(lang);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdDay === todayStr);
  const revenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const count = todayOrders.length;
  const byApt = {}; const byProd = {};
  todayOrders.forEach((o) => {
    byApt[o.apt] = (byApt[o.apt] || 0) + (o.total || 0);
    (o.items || []).forEach((it) => { byProd[it.name] = (byProd[it.name] || 0) + it.qty; });
  });
  const topApt = Object.entries(byApt).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProd = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">{tt.dashboard}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-2xl p-3 bg-white"><div className="text-sm text-gray-600">{tt.ordersToday}</div><div className="text-2xl font-extrabold">{count}</div></div>
        <div className="border rounded-2xl p-3 bg-white"><div className="text-sm text-gray-600">{tt.salesToday}</div><div className="text-2xl font-extrabold">₹{revenue.toFixed(2)}</div></div>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded-2xl p-3 bg-white">
          <div className="font-semibold mb-1">Top Apartments</div>
          {topApt.map(([a, v]) => {
            const nm = typeof customerDiscounts[a] === "object" ? customerDiscounts[a].name : "";
            return (<div key={a} className="flex justify-between"><span>Apt {a}{nm ? ` — ${nm}` : ""}</span><span>₹{v.toFixed(0)}</span></div>);
          })}
        </div>
        <div className="border rounded-2xl p-3 bg-white">
          <div className="font-semibold mb-1">Top Products (kg)</div>
          {topProd.map(([p, v]) => (<div key={p} className="flex justify-between"><span>{p}</span><span>{v}</span></div>))}
        </div>
      </div>
    </div>
  );
}

/* -------- Customer Orders (live via Firestore when available) -------- */
function MyOrders({ lang, orders, kOrders, live, onBack }) {
  const { tt } = useTranslate(lang);
  const list = (live && live.length ? live : orders);
  if (!list.length)
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{tt.myOrders}</h2>
          <button onClick={onBack} className="underline">← {tt.back}</button>
        </div>
        <div className="text-sm text-gray-600">{tt.noOrders}</div>
      </div>
    );
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">{tt.myOrders}</h2>
        <button onClick={onBack} className="underline">← {tt.back}</button>
      </div>
      <div className="space-y-2">
        {list.map((o, idx) => {
          const displayId = o.orderNum || o.id || idx + 1;
          const st = (live && live.length)
            ? (o.status || "new")
            : ((kOrders.find((ko) => ko.orderNum === o.id || ko.id === o.id)?.status) || o.status || "new");
          const items = o.items || [];
          return (
            <div key={displayId} className="border rounded-xl p-3 bg-white flex items-center justify-between">
              <div>
                <div className="font-semibold">#{displayId}</div>
                <div className="text-sm text-gray-600">{items.map((i) => i.name).join(", ")}</div>
              </div>
              <StatusBadge status={st} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Vendor auth -------- */
function VendorLogin({ lang, onCancel, onSuccess }) {
  const { tt } = useTranslate(lang);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const doLogin = () => {
    const saved = localStorage.getItem("vendorPIN") || "1234";
    if (pin.trim() === saved) { onSuccess(); setError(""); } else { setError(tt.wrongPin); }
  };
  return (
    <div className="flex items-center justify-center p-6 h-[calc(100vh-64px)] bg-gray-50">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow">
        <div className="text-xl font-bold mb-3">{tt.vendorLogin}</div>
        <label className="text-sm">{tt.enterPin}</label>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="border rounded px-3 py-2 w-full mt-1" placeholder={tt.pin} />
        {error && <div className="mt-2 text-red-700 text-sm">{error}</div>}
        <div className="mt-4 flex gap-2">
          <button onClick={doLogin} className="px-4 py-2 rounded-2xl text-white" style={{ background: BRAND_RED }}>{tt.login}</button>
          <button onClick={onCancel} className="px-4 py-2 rounded-2xl bg-gray-200">{tdict[lang].cancel}</button>
        </div>
      </div>
    </div>
  );
}

function ChangePinModal({ lang, onClose, onSaved }) {
  const { tt } = useTranslate(lang);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const save = () => { if (!pin1 || pin1 !== pin2) return; localStorage.setItem("vendorPIN", pin1); onSaved(); };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
        <div className="text-lg font-bold mb-2">{tt.changePin}</div>
        <input type="password" value={pin1} onChange={(e) => setPin1(e.target.value)} placeholder={`${tt.pin} (new)`} className="border rounded px-3 py-2 w-full mb-2" />
        <input type="password" value={pin2} onChange={(e) => setPin2(e.target.value)} placeholder={`${tt.pin} (repeat)`} className="border rounded px-3 py-2 w-full" />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl bg-gray-200">{tdict[lang].cancel}</button>
          <button onClick={save} className="px-4 py-2 rounded-2xl text-white" style={{ background: BRAND_RED }}>{tt.savePin}</button>
        </div>
      </div>
    </div>
  );
}

/* -------- Root App -------- */
export default function App() {
  const [lang, setLang] = useState("en");
  const [mode, setMode] = useState("customer");
  const [step, setStep] = useState("lang");
  const [profile, setProfile] = useState(null);

  const [products, setProducts] = useState(defaultProducts);
  const [selections, setSelections] = useState({});
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(null);

  const [customerDiscounts, setCustomerDiscounts] = useState({});
  const [kOrders, setKOrders] = useState([
    { id: 1234, orderNum: 1234, apt: "3B", items: [{ name: "Potato", qty: 2, unit: "kg", price: 20 }], status: "accepted", when: "today", total: 40, createdDay: new Date().toISOString().slice(0, 10) },
  ]);

  const [flash, setFlash] = useState(false);
  const [lastNewOrder, setLastNewOrder] = useState(null);
  const [kioskView, setKioskView] = useState("orders");
  const [custLive, setCustLive] = useState([]); // customer's live orders

  // Vendor auth
  const [vendorAuthed, setVendorAuthed] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const totals = useMemo(() => {
    const todayOrders = kOrders.filter((o) => o.createdDay === todayStr);
    const ordersToday = todayOrders.length;
    const salesToday = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    return { ordersToday, salesToday };
  }, [kOrders, todayStr]);

  // ---- Persistence (localStorage) ----
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem("products") || "null"); if (p?.length) setProducts(p); } catch {} }, []);
  useEffect(() => { try { const d = JSON.parse(localStorage.getItem("customerDiscounts") || "null"); if (d && typeof d === "object") setCustomerDiscounts(d); } catch {} }, []);
  useEffect(() => { try { const ko = JSON.parse(localStorage.getItem("kOrders") || "null"); if (ko?.length) setKOrders(ko); } catch {} }, []);
  useEffect(() => { localStorage.setItem("products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("customerDiscounts", JSON.stringify(customerDiscounts)); }, [customerDiscounts]);
  useEffect(() => { localStorage.setItem("kOrders", JSON.stringify(kOrders)); }, [kOrders]);

  // ---- Persist & restore profile so customers see old orders after reopen ----
  useEffect(() => { try { const pr = JSON.parse(localStorage.getItem("profile") || "null"); if (pr) { setProfile(pr); setStep("products"); } } catch {} }, []);
  useEffect(() => { if (profile) localStorage.setItem("profile", JSON.stringify(profile)); }, [profile]);

  // ---- Realtime: PRODUCTS across devices ----
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "vendors", VENDOR_ID, "products"), (snap) => {
        const arr = []; snap.forEach((d) => { const data = d.data() || {}; arr.push({ id: d.id, ...data }); });
        setProducts(arr.length ? arr : defaultProducts);
      });
      return () => unsub();
    } catch (e) { console.warn("products onSnapshot skipped:", e?.message); }
  }, []);

  // ---- Realtime: CUSTOMER DISCOUNTS across devices ----
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "vendors", VENDOR_ID, "discounts"), (snap) => {
        const map = {}; snap.forEach((d) => { const v = d.data() || {}; map[d.id] = { pct: Number(v.pct || 0), name: v.name || "" }; });
        setCustomerDiscounts(map);
      });
      return () => unsub();
    } catch (e) { console.warn("discounts onSnapshot skipped:", e?.message); }
  }, []);

  // ---- Customer live orders subscription (status + history per flat) ----
  useEffect(() => {
    if (!profile?.apt) return;
    try {
      const q = query(collection(db, "vendors", VENDOR_ID, "orders"), where("apt", "==", profile.apt));
      const unsub = onSnapshot(q, (snap) => {
        const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a,b) => (b?.createdAt?.seconds||0) - (a?.createdAt?.seconds||0) || (b.orderNum||0) - (a.orderNum||0));
        setCustLive(arr);
      });
      return () => unsub();
    } catch (e) { console.warn("customer onSnapshot skipped:", e?.message); }
  }, [profile?.apt]);

  const { tt } = useTranslate(lang);

  const addAllToCart = () => {
    const items = Object.entries(selections)
      .filter(([_, q]) => q && !isNaN(parseFloat(q)))
      .map(([id, q]) => {
        const p = products.find((pp) => pp.id === id);
        return { id, name: p.name?.[lang] || p.name.en, qty: parseFloat(q), price: p.price };
      });
    if (!items.length) return;
    setCart((prev) => [...items, ...prev]);
    setSelections({});
  };

  const placeOrder = async ({ delivery, totalCalculated, lines }) => {
    const id = Math.floor(1000 + Math.random() * 9000);
    setOrderId(id);

    // customer-facing local confirmation
    const newOrderCust = { id, items: lines.map((l) => ({ ...l })), status: "new" };
    setOrders((prev) => [newOrderCust, ...prev]);

    // send to kiosk collection in Firestore
    const apt = profile?.apt || "3B";
    const payload = {
      apt,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, unit: "kg", price: l.price, pdisc: l.productDiscount, cdisc: l.customerDiscount })),
      status: "new",
      when: delivery === "tomorrow" ? "tomorrow" : "today",
      total: totalCalculated,
      createdDay: todayStr,
      createdAt: serverTimestamp(),
      society: profile?.society || "",
      orderNum: id,
    };

    try { await addDoc(collection(db, "vendors", VENDOR_ID, "orders"), payload); }
    catch (e) { console.warn("Firestore addDoc skipped:", e?.message); }

    // local mirror (fallback for same-device testing)
    setKOrders((prev) => [{ id, orderNum: id, apt, items: payload.items, status: payload.status, when: payload.when, total: payload.total, createdDay: payload.createdDay }, ...prev]);
    setLastNewOrder({ id, apt });
    setCart([]);
  };

  const simulateOrder = async () => {
    try {
      await addDoc(collection(db, "vendors", VENDOR_ID, "orders"), {
        apt: "4A",
        items: [{ name: "Potato", qty: 2, unit: "kg", price: 20 }],
        status: "new",
        when: "today",
        total: 40,
        createdDay: todayStr,
        createdAt: serverTimestamp(),
        society: "",
        orderNum: Math.floor(1000 + Math.random() * 9000),
      });
    } catch (e) {
      const id = Math.floor(1000 + Math.random() * 9000);
      const kioskOrder = { id, orderNum: id, apt: "4A", items: [{ name: "Potato", qty: 2, unit: "kg", price: 20 }], status: "new", when: "today", total: 40, createdDay: todayStr };
      setKOrders((prev) => [kioskOrder, ...prev]);
      setLastNewOrder({ id, apt: "4A" });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <Header lang={lang} setLang={setLang} active={mode} onNavigate={setMode} title={mode === "kiosk" ? tdict[lang].kioskTitle : tdict[lang].appTitle} onGoOrders={() => setStep("orders")} />

      {/* CUSTOMER */}
      {mode === "customer" && (
        step === "lang" ? (
          <LanguageFirst lang={lang} setLang={setLang} onNext={() => setStep("society")} />
        ) : step === "society" ? (
          <SocietyApartment lang={lang} onDone={(p) => { setProfile(p); setStep("products"); }} />
        ) : orderId ? (
          <Confirmation lang={lang} orderId={orderId} onDone={() => { setOrderId(null); setStep("orders"); }} />
        ) : step === "checkout" ? (
          <CartCheckout lang={lang} cart={cart} setCart={setCart} onPlace={placeOrder} onBack={() => setStep("products")} products={products} customerDiscounts={customerDiscounts} profile={profile} />
        ) : step === "orders" ? (
          <MyOrders lang={lang} orders={orders} kOrders={kOrders} live={custLive} onBack={() => setStep("products")} />
        ) : (
          <>
            <ProductListMultiAdd lang={lang} products={products} selections={selections} setSelections={setSelections} onGoCart={() => setStep("checkout")} onGoOrders={() => setStep("orders")} />
            <div className="max-w-md mx-auto px-4">
              <button onClick={addAllToCart} className="w-full mt-2 py-3 rounded-2xl font-semibold" style={{ background: BRAND_YELLOW, color: "#111" }}>{tt.addAll}</button>
              {cart.length > 0 && (
                <button onClick={() => setStep("checkout")} className="w-full mt-2 py-3 rounded-2xl font-semibold text-white" style={{ background: BRAND_RED }}>{tdict[lang].gotoCart}</button>
              )}
            </div>
          </>
        )
      )}

      {/* KIOSK (behind PIN) */}
      {mode === "kiosk" && (
        vendorAuthed ? (
          <>
            <Kiosk
              lang={lang}
              orders={kOrders}
              setOrders={setKOrders}
              flash={flash}
              setFlash={setFlash}
              totals={totals}
              lastNewOrder={lastNewOrder}
              onSimulate={simulateOrder}
              view={kioskView}
              setView={setKioskView}
              customerDiscounts={customerDiscounts}
              onChangePin={() => setShowChangePin(true)}
              onLogout={() => { setVendorAuthed(false); setMode("customer"); }}
            />
            {kioskView === "products" && (<ProductManagement lang={lang} products={products} setProducts={setProducts} />)}
            {kioskView === "discounts" && (<Discounts lang={lang} customerDiscounts={customerDiscounts} setCustomerDiscounts={setCustomerDiscounts} />)}
            {kioskView === "dashboard" && (<Dashboard lang={lang} orders={kOrders} customerDiscounts={customerDiscounts} />)}
            <div className="fixed bottom-2 right-3 text-xs opacity-70">{tdict[lang].poweredBy}</div>
          </>
        ) : (
          <VendorLogin lang={lang} onCancel={() => setMode("customer")} onSuccess={() => setVendorAuthed(true)} />
        )
      )}

      {showChangePin && (<ChangePinModal lang={lang} onClose={() => setShowChangePin(false)} onSaved={() => setShowChangePin(false)} />)}
    </div>
  );
}
