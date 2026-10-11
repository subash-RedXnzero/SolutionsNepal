#!/usr/bin/env node
// Convert user JSON data → EVENTS array for calendar-events.js

const DATA = [
  { month_bs: "Baisakh 2083", month_num: 1, events: [
    { bs: "2083-01-01", ad: "2026-04-14", tithi: "Dwadashi", events: ["Naya Barsa 2083", "Biska Jatra"] },
    { bs: "2083-01-02", ad: "2026-04-15", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-01-04", ad: "2026-04-17", tithi: "Aamsi", events: ["Matatirtha Aunsi (Mother's Day)"] },
    { bs: "2083-01-05", ad: "2026-04-18", tithi: "Pratipada", events: ["Rato Machhindranath Rath Yatra"] },
    { bs: "2083-01-06", ad: "2026-04-19", tithi: "Dwitiya", events: ["Parashuram Jayanti"] },
    { bs: "2083-01-07", ad: "2026-04-20", tithi: "Tritiya", events: ["Shiv Parvati Vivah"] },
    { bs: "2083-01-11", ad: "2026-04-24", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-01-14", ad: "2026-04-27", tithi: "Ekadashi", events: ["Mohini Ekadashi Vrat"] },
    { bs: "2083-01-16", ad: "2026-04-29", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-01-17", ad: "2026-04-30", tithi: "Chaturdashi", events: ["Narsingha Jayanti"] },
    { bs: "2083-01-18", ad: "2026-05-01", tithi: "Purnima", events: ["Ubhauli Parva", "Buddha Jayanti"] },
    { bs: "2083-01-22", ad: "2026-05-05", tithi: "Chaturthi", events: ["Mangalchauthi Vrat"] },
    { bs: "2083-01-26", ad: "2026-05-09", tithi: "Saptami", events: ["Gorakhkali Puja"] },
    { bs: "2083-01-30", ad: "2026-05-13", tithi: "Ekadashi", events: ["Apara Ekadashi Vrat"] },
    { bs: "2083-01-31", ad: "2026-05-14", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
  ]},
  { month_bs: "Jestha 2083", month_num: 2, events: [
    { bs: "2083-02-01", ad: "2026-05-15", tithi: "Trayodashi", events: ["Sithi Chahre"] },
    { bs: "2083-02-02", ad: "2026-05-16", tithi: "Aunsi", events: ["Vata Savitri Vrat"] },
    { bs: "2083-02-10", ad: "2026-05-24", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-02-12", ad: "2026-05-26", tithi: "Dashami", events: ["Ganga Dashahara Vrat"] },
    { bs: "2083-02-13", ad: "2026-05-27", tithi: "Ekadashi", events: ["Padmini Ekadashi Vrat"] },
    { bs: "2083-02-14", ad: "2026-05-28", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-02-15", ad: "2026-05-29", tithi: "Trayodashi", events: ["Republic Day (Ganatantra Divas)"] },
    { bs: "2083-02-24", ad: "2026-06-07", tithi: "Saptami", events: ["Ravisaptami Vrat"] },
    { bs: "2083-02-25", ad: "2026-06-08", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-02-28", ad: "2026-06-11", tithi: "Ekadashi", events: ["Parama Ekadashi Vrat"] },
    { bs: "2083-02-29", ad: "2026-06-12", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
  ]},
  { month_bs: "Asadh 2083", month_num: 3, events: [
    { bs: "2083-03-01", ad: "2026-06-15", tithi: "Aunsi", events: ["Mithun Sankranti"] },
    { bs: "2083-03-06", ad: "2026-06-20", tithi: "Shasthi", events: ["Sithi Nakha"] },
    { bs: "2083-03-07", ad: "2026-06-21", tithi: "Saptami", events: ["Ravi Saptami Vrat"] },
    { bs: "2083-03-08", ad: "2026-06-22", tithi: "Ashtami", events: ["Vayu Ashtami", "Gorakhkali Puja"] },
    { bs: "2083-03-11", ad: "2026-06-25", tithi: "Ekadashi", events: ["Nirjala Ekadashi Vrat"] },
    { bs: "2083-03-13", ad: "2026-06-27", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-03-15", ad: "2026-06-29", tithi: "Purnima", events: ["Guru Purnima", "Dahi Chiura Khane Din", "National Paddy Day (Rashtriya Dhan Diwas)"] },
    { bs: "2083-03-23", ad: "2026-07-07", tithi: "Saptami", events: ["Gorakhkali Puja"] },
    { bs: "2083-03-24", ad: "2026-07-08", tithi: "Ashtami", events: ["Budhashtami Vrat"] },
    { bs: "2083-03-26", ad: "2026-07-10", tithi: "Ekadashi", events: ["Yogini Ekadashi Vrat"] },
    { bs: "2083-03-28", ad: "2026-07-12", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-03-29", ad: "2026-07-13", tithi: "Chaturdashi", events: ["Bhanu Jayanti"] },
    { bs: "2083-03-32", ad: "2026-07-16", tithi: "Dwitiya", events: ["Saune Sankranti"] },
  ]},
  { month_bs: "Shrawan 2083", month_num: 4, events: [
    { bs: "2083-04-01", ad: "2026-07-17", tithi: "Aunsi", events: ["Saune Sankranti", "Luto Phalne Din"] },
    { bs: "2083-04-05", ad: "2026-07-21", tithi: "Panchami", events: ["Surya Puja"] },
    { bs: "2083-04-06", ad: "2026-07-22", tithi: "Shasthi", events: ["Budhashtami Vrat", "Gorakhkali Puja"] },
    { bs: "2083-04-09", ad: "2026-07-25", tithi: "Ekadashi", events: ["Harishayani Ekadashi Vrat"] },
    { bs: "2083-04-10", ad: "2026-07-26", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-04-13", ad: "2026-07-29", tithi: "Purnima", events: ["Guru Purnima", "Purnima Vrat"] },
    { bs: "2083-04-15", ad: "2026-07-31", tithi: "Chaturdashi", events: ["Kheer Khane Din"] },
    { bs: "2083-04-18", ad: "2026-08-03", tithi: "Dwitiya", events: ["Beetak Katha Arambha"] },
    { bs: "2083-04-21", ad: "2026-08-06", tithi: "Panchami", events: ["Gorakhkali Puja"] },
    { bs: "2083-04-24", ad: "2026-08-09", tithi: "Ashtami", events: ["Kamika Ekadashi Vrat"] },
    { bs: "2083-04-25", ad: "2026-08-10", tithi: "Navami", events: ["Som Pradosh Vrat"] },
    { bs: "2083-04-26", ad: "2026-08-11", tithi: "Dashami", events: ["Gathamuga Chahrhe"] },
    { bs: "2083-04-28", ad: "2026-08-13", tithi: "Dwadashi", events: ["Gunla Parva Arambha"] },
    { bs: "2083-04-30", ad: "2026-08-15", tithi: "Chaturdashi", events: ["Varaha Jayanti"] },
  ]},
  { month_bs: "Bhadra 2083", month_num: 5, events: [
    { bs: "2083-05-01", ad: "2026-08-17", tithi: "Panchami", events: ["Naag Panchami (Snake Worship)", "Singha Sankranti"] },
    { bs: "2083-05-02", ad: "2026-08-18", tithi: "Shasthi", events: ["Kalki Jayanti"] },
    { bs: "2083-05-03", ad: "2026-08-19", tithi: "Saptami", events: ["National Information Day", "Tulsidas Jayanti (Poet Birthday)"] },
    { bs: "2083-05-04", ad: "2026-08-20", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-05-07", ad: "2026-08-23", tithi: "Ekadashi", events: ["Putrada Ekadashi Vrat"] },
    { bs: "2083-05-09", ad: "2026-08-25", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-05-12", ad: "2026-08-28", tithi: "Purnima", events: ["Janai Purnima (Sacred Thread Day)", "Raksha Bandhan", "Kwati Khane Din"] },
    { bs: "2083-05-13", ad: "2026-08-29", tithi: "Pratipada", events: ["Gai Jatra (Cow Festival)"] },
    { bs: "2083-05-16", ad: "2026-09-01", tithi: "Chaturthi", events: ["Mangalchauthi Vrat"] },
    { bs: "2083-05-18", ad: "2026-09-03", tithi: "Saptami", events: ["Gaura Saptami"] },
    { bs: "2083-05-19", ad: "2026-09-04", tithi: "Ashtami", events: ["Gaura Parva", "Krishna Janmashtami (Krishna Birthday)"] },
    { bs: "2083-05-20", ad: "2026-09-05", tithi: "Navami", events: ["Gaun Navami"] },
    { bs: "2083-05-22", ad: "2026-09-07", tithi: "Ekadashi", events: ["Aja Ekadashi (Fasting Day)"] },
    { bs: "2083-05-23", ad: "2026-09-08", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-05-26", ad: "2026-09-11", tithi: "Aunsi", events: ["Kushe Aunsi (Father's Day)"] },
    { bs: "2083-05-27", ad: "2026-09-12", tithi: "Pratipada", events: ["Gundla Parva"] },
    { bs: "2083-05-28", ad: "2026-09-13", tithi: "Dwitiya", events: ["Dar Khane Din (Feast Day)"] },
    { bs: "2083-05-29", ad: "2026-09-14", tithi: "Tritiya", events: ["Haritalika Teej (Women's Festival)"] },
    { bs: "2083-05-30", ad: "2026-09-15", tithi: "Chaturthi", events: ["Rishi Panchami"] },
  ]},
  { month_bs: "Ashwin 2083", month_num: 6, events: [
    { bs: "2083-06-01", ad: "2026-09-17", tithi: "Shasthi", events: ["Surya Sankranti"] },
    { bs: "2083-06-02", ad: "2026-09-18", tithi: "Saptami", events: ["Mahalakshmi Vrat Arambha"] },
    { bs: "2083-06-03", ad: "2026-09-19", tithi: "Ashtami", events: ["Constitution Day (Sambhidhan Divas)"] },
    { bs: "2083-06-06", ad: "2026-09-22", tithi: "Ekadashi", events: ["Hariparivartini Ekadashi Vrat"] },
    { bs: "2083-06-08", ad: "2026-09-24", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-06-09", ad: "2026-09-25", tithi: "Chaturdashi", events: ["Indra Jatra (Kathmandu Festival)"] },
    { bs: "2083-06-17", ad: "2026-10-03", tithi: "Saptami", events: ["Mahalakshmi Vrat Samapti", "Gorakhkali Puja"] },
    { bs: "2083-06-18", ad: "2026-10-04", tithi: "Ashtami", events: ["Jitiya Parva (Mothers Fasting)"] },
    { bs: "2083-06-20", ad: "2026-10-06", tithi: "Ekadashi", events: ["Indira Ekadashi Vrat"] },
    { bs: "2083-06-22", ad: "2026-10-08", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-06-24", ad: "2026-10-10", tithi: "Aunsi", events: ["Pitri Paksha Aunsi"] },
    { bs: "2083-06-25", ad: "2026-10-11", tithi: "Pratipada", events: ["Ghatasthapana (Dashain Begins)"] },
    { bs: "2083-06-31", ad: "2026-10-17", tithi: "Saptami", events: ["Fulpati"] },
  ]},
  { month_bs: "Kartik 2083", month_num: 7, events: [
    { bs: "2083-07-01", ad: "2026-10-18", tithi: "Ashtami", events: ["Maha Ashtami (Dashain)"] },
    { bs: "2083-07-03", ad: "2026-10-20", tithi: "Navami", events: ["Maha Navami (Dashain)"] },
    { bs: "2083-07-04", ad: "2026-10-21", tithi: "Dashami", events: ["Vijaya Dashami (Dashain Tika)"] },
    { bs: "2083-07-05", ad: "2026-10-22", tithi: "Ekadashi", events: ["Papankusha Ekadashi Vrat"] },
    { bs: "2083-07-06", ad: "2026-10-23", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-07-08", ad: "2026-10-25", tithi: "Chaturdashi", events: ["Kojagrat Purnima (Laxmi Night)"] },
    { bs: "2083-07-09", ad: "2026-10-26", tithi: "Purnima", events: ["Kartik Snan Arambha"] },
    { bs: "2083-07-15", ad: "2026-11-01", tithi: "Saptami", events: ["Ravi Saptami Vrat"] },
    { bs: "2083-07-16", ad: "2026-11-02", tithi: "Ashtami", events: ["Radhashtami Vrat", "Gorakhkali Puja"] },
    { bs: "2083-07-19", ad: "2026-11-05", tithi: "Ekadashi", events: ["Rama Ekadashi Vrat"] },
    { bs: "2083-07-20", ad: "2026-11-06", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-07-21", ad: "2026-11-07", tithi: "Trayodashi", events: ["Kaag Tihar (Tihar Day 1)"] },
    { bs: "2083-07-22", ad: "2026-11-08", tithi: "Chaturdashi", events: ["Kukur Tihar (Tihar Day 2)", "Laxmi Puja (Tihar Day 3)"] },
    { bs: "2083-07-23", ad: "2026-11-09", tithi: "Aunsi", events: ["Tihar Bida"] },
    { bs: "2083-07-24", ad: "2026-11-10", tithi: "Pratipada", events: ["Govardhan Puja (Tihar Day 4)"] },
    { bs: "2083-07-25", ad: "2026-11-11", tithi: "Dwitiya", events: ["Bhai Tika (Tihar Day 5)", "Falgunanda Jayanti"] },
    { bs: "2083-07-26", ad: "2026-11-12", tithi: "Tritiya", events: ["Tihar Bida"] },
    { bs: "2083-07-29", ad: "2026-11-15", tithi: "Shasthi", events: ["Chhath Parva"] },
  ]},
  { month_bs: "Mangsir 2083", month_num: 8, events: [
    { bs: "2083-08-01", ad: "2026-11-17", tithi: "Ashtami", events: ["Bhaumashtami Vrat"] },
    { bs: "2083-08-02", ad: "2026-11-18", tithi: "Navami", events: ["Kushmand Navami Vrat"] },
    { bs: "2083-08-04", ad: "2026-11-20", tithi: "Ekadashi", events: ["Haribodhini Ekadashi Vrat", "Tulsi Vivah"] },
    { bs: "2083-08-06", ad: "2026-11-22", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-08-07", ad: "2026-11-23", tithi: "Chaturdashi", events: ["Baikuntha Chaturdashi Vrat"] },
    { bs: "2083-08-08", ad: "2026-11-24", tithi: "Purnima", events: ["Guru Nanak Jayanti"] },
    { bs: "2083-08-15", ad: "2026-12-01", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-08-18", ad: "2026-12-04", tithi: "Ekadashi", events: ["Utpatika Ekadashi Vrat"] },
    { bs: "2083-08-20", ad: "2026-12-06", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-08-21", ad: "2026-12-07", tithi: "Chaturdashi", events: ["Shatbeej Chharne Din"] },
    { bs: "2083-08-28", ad: "2026-12-14", tithi: "Panchami", events: ["Vivah Panchami"] },
    { bs: "2083-08-31", ad: "2026-12-17", tithi: "Saptami", events: ["Dhanu Sankranti"] },
  ]},
  { month_bs: "Poush 2083", month_num: 9, events: [
    { bs: "2083-09-01", ad: "2026-12-16", tithi: "Ashtami", events: ["Dhanu Sankranti"] },
    { bs: "2083-09-02", ad: "2026-12-17", tithi: "Navami", events: ["Gorakhkali Puja"] },
    { bs: "2083-09-05", ad: "2026-12-20", tithi: "Ekadashi", events: ["Mokshada Ekadashi Vrat", "Gita Jayanti"] },
    { bs: "2083-09-08", ad: "2026-12-23", tithi: "Trayodashi", events: ["Dattatreya Jayanti"] },
    { bs: "2083-09-09", ad: "2026-12-24", tithi: "Chaturdashi", events: ["Udhauli Parva", "Yomari Punhi"] },
    { bs: "2083-09-10", ad: "2026-12-25", tithi: "Purnima", events: ["Christmas Day"] },
    { bs: "2083-09-15", ad: "2026-12-30", tithi: "Ashtami", events: ["Tamu Lhosar"] },
    { bs: "2083-09-16", ad: "2026-12-31", tithi: "Navami", events: ["Gorakhkali Puja"] },
    { bs: "2083-09-19", ad: "2027-01-03", tithi: "Dwadashi", events: ["Saphala Ekadashi Vrat"] },
    { bs: "2083-09-21", ad: "2027-01-05", tithi: "Chaturdashi", events: ["Pradosh Vrat"] },
    { bs: "2083-09-23", ad: "2027-01-07", tithi: "Aunsi", events: ["Araniko Smriti Diwas"] },
    { bs: "2083-09-27", ad: "2027-01-11", tithi: "Ashtami", events: ["Prithvi Jayanti (National Unity Day)"] },
    { bs: "2083-09-29", ad: "2027-01-13", tithi: "Dashami", events: ["Rastriya Bhakka Diwas"] },
  ]},
  { month_bs: "Magh 2083", month_num: 10, events: [
    { bs: "2083-10-01", ad: "2027-01-15", tithi: "Saptami", events: ["Maghe Sankranti", "Ghyu Chaku Khane Din"] },
    { bs: "2083-10-02", ad: "2027-01-16", tithi: "Ashtami", events: ["Martyrs Day (Sahid Divas)"] },
    { bs: "2083-10-04", ad: "2027-01-18", tithi: "Ekadashi", events: ["Putrada Ekadashi Vrat"] },
    { bs: "2083-10-06", ad: "2027-01-20", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-10-08", ad: "2027-01-22", tithi: "Purnima", events: ["Shree Swasthani Vrat Katha Arambha"] },
    { bs: "2083-10-15", ad: "2027-01-29", tithi: "Saptami", events: ["Gorakhkali Puja"] },
    { bs: "2083-10-16", ad: "2027-01-30", tithi: "Ashtami", events: ["Martyrs Day (Sahid Divas)"] },
    { bs: "2083-10-19", ad: "2027-02-02", tithi: "Ekadashi", events: ["Shattila Ekadashi"] },
    { bs: "2083-10-20", ad: "2027-02-03", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-10-24", ad: "2027-02-07", tithi: "Pratipada", events: ["Sonam Lhosar"] },
    { bs: "2083-10-27", ad: "2027-02-10", tithi: "Chaturthi", events: ["Tilkund Chaturthi"] },
    { bs: "2083-10-28", ad: "2027-02-11", tithi: "Panchami", events: ["Basanta Panchami (Spring Festival)", "Saraswati Puja"] },
    { bs: "2083-10-29", ad: "2027-02-12", tithi: "Shasthi", events: ["Skanda Shasthi"] },
    { bs: "2083-10-30", ad: "2027-02-13", tithi: "Saptami", events: ["Achala Saptami"] },
  ]},
  { month_bs: "Falgun 2083", month_num: 11, events: [
    { bs: "2083-11-02", ad: "2027-02-14", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-11-03", ad: "2027-02-15", tithi: "Navami", events: ["Dron Navami"] },
    { bs: "2083-11-05", ad: "2027-02-17", tithi: "Ekadashi", events: ["Bhima Ekadashi Vrat"] },
    { bs: "2083-11-06", ad: "2027-02-18", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-11-07", ad: "2027-02-19", tithi: "Trayodashi", events: ["Democracy Day (Prajatantra Divas)"] },
    { bs: "2083-11-08", ad: "2027-02-20", tithi: "Chaturdashi", events: ["Shree Swasthani Vrat Samapti"] },
    { bs: "2083-11-16", ad: "2027-02-28", tithi: "Ashtami", events: ["Gorakhkali Puja"] },
    { bs: "2083-11-20", ad: "2027-03-04", tithi: "Ekadashi", events: ["Vijaya Ekadashi Vrat"] },
    { bs: "2083-11-21", ad: "2027-03-05", tithi: "Dwadashi", events: ["Pradosh Vrat"] },
    { bs: "2083-11-22", ad: "2027-03-06", tithi: "Trayodashi", events: ["Maha Shivaratri"] },
    { bs: "2083-11-24", ad: "2027-03-08", tithi: "Aunsi", events: ["International Women's Day"] },
    { bs: "2083-11-25", ad: "2027-03-09", tithi: "Pratipada", events: ["Gyalpo Lhosar"] },
  ]},
  { month_bs: "Chaitra 2083", month_num: 12, events: [
    { bs: "2083-12-01", ad: "2027-03-15", tithi: "Saptami", events: ["Meen Sankranti"] },
    { bs: "2083-12-02", ad: "2027-03-16", tithi: "Ashtami", events: ["Bhaumashtami Vrat", "Gorakhkali Puja"] },
    { bs: "2083-12-04", ad: "2027-03-18", tithi: "Ekadashi", events: ["Aamalaki Ekadashi Vrat"] },
    { bs: "2083-12-06", ad: "2027-03-20", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-12-07", ad: "2027-03-21", tithi: "Chaturdashi", events: ["Holi (Hilly Districts)"] },
    { bs: "2083-12-08", ad: "2027-03-22", tithi: "Purnima", events: ["Holi (Terai)"] },
    { bs: "2083-12-16", ad: "2027-03-30", tithi: "Ashtami", events: ["Bhaumashtami Vrat", "Gorakhkali Puja"] },
    { bs: "2083-12-21", ad: "2027-04-04", tithi: "Trayodashi", events: ["Pradosh Vrat"] },
    { bs: "2083-12-23", ad: "2027-04-06", tithi: "Aunsi", events: ["Ghode Jatra (Kathmandu Festival)"] },
    { bs: "2083-12-26", ad: "2027-04-09", tithi: "Tritiya", events: ["Gauri Vrat"] },
  ]},
];

// Event name → ID slug
function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Categorize event by name
function categorize(name) {
  const n = name.toLowerCase();
  if (n.includes('vrat') || n.includes('fasting') || n.includes('ekadashi') || n.includes('pradosh') || n.includes('jayanti') || n.includes('puja') || n.includes('sankranti') || n.includes('sraddha') || n.includes('purnima') || n.includes('aunsi')) return 'religious';
  if (n.includes('festival') || n.includes('jatra') || n.includes('tihar') || n.includes('dashain') || n.includes('holi') || n.includes('lhosar') || n.includes('teej') || n.includes('chhath') || n.includes('parva') || n.includes('mela') || n.includes('new year') || n.includes('naya barsa')) return 'festival';
  if (n.includes('day') && !n.includes('ekadashi')) return 'observance';
  return 'religious';
}

// Determine scope
function getScope(name) {
  const n = name.toLowerCase();
  if (n.includes('kathmandu') || n.includes('gai jatra') || n.includes('indra jatra') || n.includes('ghode jatra') || n.includes('bhoto')) return 'kathmandu-valley';
  if (n.includes("women") || n.includes("teej") || n.includes("mahila")) return 'women';
  return 'national';
}

// Is it official (MoHA)?
function isOfficial(name) {
  const n = name.toLowerCase();
  const official = [
    'naya barsa', 'new year', 'buddha jayanti', 'janai purnima', 'raksha bandhan',
    'krishna janmashtami', 'ghatasthapana', 'fulpati', 'maha ashtami', 'maha navami',
    'vijaya dashami', 'kojagrat purnima', 'laxmi puja', 'govardhan puja', 'bhai tika',
    'chhath parva', 'udhauli', 'yomari', 'tamu lhosar', 'maghe sankranti', 'sonam lhosar',
    'maha shivaratri', 'gyalpo lhosar', 'holi', 'ghode jatra', 'gai jatra', 'indra jatra',
    'republic day', 'constitution day', 'prithvi jayanti', 'democracy day', 'martyrs',
    'christmas', 'women', 'labour day', 'international women',
    'gaura parva', 'jitiya', 'haritalika', 'basanta panchami', 'saraswati',
    'nepal sambat', 'falgunanda',
  ];
  return official.some(k => n.includes(k));
}

const events = [];
const seen = new Set();

for (const month of DATA) {
  for (const day of month.events) {
    for (const evName of day.events) {
      const id = slugify(evName);
      if (seen.has(id)) continue;
      seen.add(id);

      const [bsY, bsM, bsD] = day.bs.split('-').map(Number);
      const cat = categorize(evName);
      const scope = getScope(evName);
      const official = isOfficial(evName);

      // Determine Nepali name — use the English name as np if it's already Devanagari-friendly
      const npName = evName;

      events.push({
        id,
        name: evName,
        np: npName,
        category: cat,
        official,
        scope,
        rule: { kind: 'bs', month: month.month_num, day: bsD },
        source: ['MoHA 2083'],
        desc: `${month.month_bs} ${bsD}. ${evName}.`,
      });
    }
  }
}

// Output the EVENTS array
let output = `const EVENTS = [\n`;
for (const ev of events) {
  output += `  {\n`;
  output += `    id: '${ev.id}',\n`;
  output += `    name: '${ev.name.replace(/'/g, "\\'")}',\n`;
  output += `    np: '${ev.np.replace(/'/g, "\\'")}',\n`;
  output += `    category: '${ev.category}',\n`;
  output += `    official: ${ev.official},\n`;
  output += `    scope: '${ev.scope}',\n`;
  output += `    rule: { kind: '${ev.rule.kind}', month: ${ev.rule.month}, day: ${ev.rule.day} },\n`;
  output += `    source: ['MoHA 2083'],\n`;
  output += `    desc: '${ev.desc.replace(/'/g, "\\'")}',\n`;
  output += `  },\n`;
}
output += `];\n`;

console.log(`Generated ${events.length} events`);
console.log(output);
