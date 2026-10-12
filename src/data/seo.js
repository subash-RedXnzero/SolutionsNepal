/**
 * Centralized SEO metadata for SolutionsNepal.
 *
 * Usage in pages:
 *   import { getSeo } from '../../data/seo.js';
 *   const seo = getSeo('/nepal/calendar');
 *   <BaseLayout title={seo.title} description={seo.description} ... />
 *
 * Or in BaseLayout (auto-detected from Astro.url.pathname):
 *   <BaseLayout>  ← uses getSeo(Astro.url.pathname) automatically
 */

import { SEO_DB } from './seo-database.js';

const SITE_NAME = 'SolutionsNepal';
const SITE_URL = 'https://solutionsnepal.com';
const DEFAULT_OG_IMAGE = 'https://solutionsnepal.com/og-default.png';

/**
 * Auto-generate a WebApplication / WebPage / CollectionPage JSON-LD block
 * from the centralized SEO database so every tool has valid schema even
 * when no hand-written jsonLd exists.
 */
function inferAppCategory(path) {
  if (path.includes('/education') || path.includes('/gpa') || path.includes('/cgpa') || path.includes('/likhit')) return 'EducationalApplication';
  if (path.includes('/bmi') || path.includes('/health') || path.includes('/baby')) return 'HealthApplication';
  if (path.includes('/qr') || path.includes('/photo') || path.includes('/image') || path.includes('/pdf') || path.includes('/compress') || path.includes('/merge') || path.includes('/jpg') || path.includes('/date') || path.includes('/calendar') || path.includes('/age') || path.includes('/unicode') || path.includes('/translator') || path.includes('/number') || path.includes('/words') || path.includes('/cheque') || path.includes('/names') || path.includes('/weather') || path.includes('/fuel-cost') || path.includes('/fuel-price') || path.includes('/ownership') || path.includes('/resale') || path.includes('/kukl') || path.includes('/electricity') || path.includes('/lpg') || path.includes('/paint') || path.includes('/cost-of-living') || path.includes('/tola') || path.includes('/gram') || path.includes('/aana') || path.includes('/ropani') || path.includes('/gold-price') || path.includes('/silver-price') || path.includes('/exchange')) return 'UtilitiesApplication';
  if (path.includes('/business') || path.includes('/construction') || path.includes('/property') || path.includes('/land')) return 'BusinessApplication';
  return 'FinanceApplication';
}

function autoJsonLd(path, rec) {
  if (!rec) return null;
  if (rec.schema === 'WebPage' || rec.schema === 'CollectionPage') {
    return {
      '@context': 'https://schema.org',
      '@type': rec.schema === 'CollectionPage' ? 'CollectionPage' : 'WebPage',
      name: rec.tool_name,
      description: rec.meta_description,
      url: rec.canonical_url,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    };
  }
  // Default: WebApplication tool
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: rec.tool_name,
    description: rec.meta_description,
    url: rec.canonical_url,
    applicationCategory: inferAppCategory(path),
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
  };
}

/**
 * Page metadata indexed by canonical path.
 *
 * Each entry may contain:
 *   title        — <title> and og:title (site name appended if missing)
 *   description  — <meta description> and og:description
 *   ogImage      — og:image (defaults to /og-default.png)
 *   noindex      — true to add <meta name="robots" content="noindex">
 *   jsonLd       — static JSON-LD object or null
 */
const pages = {
  // ── Homepage ──────────────────────────────────────────────
  '/': {
    title: 'SolutionsNepal — Free Calculators & Tools for Nepal',
    description:
      'Free Nepal-focused calculators, converters, price checkers and everyday utility tools. Salary, tax, gold, fuel, currency, calendar and more.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        description:
          'Free calculators, converters, and utilities for everyday life in Nepal.',
        sameAs: [],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/nepal?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is SolutionsNepal?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'SolutionsNepal is a free collection of calculators, converters, and utility tools built for everyday life in Nepal. It includes salary calculators, date converters, gold weight converters, vehicle tax calculators, and more. All calculations run in your browser — no data is sent to any server.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is SolutionsNepal free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, SolutionsNepal is completely free. There are no sign-ups, no subscriptions, no ads, and no data collection. All tools work entirely in your browser.',
            },
          },
          {
            '@type': 'Question',
            name: 'How accurate are SolutionsNepal calculators?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'SolutionsNepal uses verified tax rules from IRD Nepal, SSF rates from the Social Security Fund, and NRB exchange rates. The salary calculator supports multiple fiscal years with verified rates. However, always confirm with your employer or IRD Nepal for official purposes.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does SolutionsNepal work on mobile phones?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, SolutionsNepal is fully responsive and works on all devices — phones, tablets, and desktops. The calculators are optimized for mobile use with comfortable touch targets and clean layouts.',
            },
          },
          {
            '@type': 'Question',
            name: 'What Nepal-specific tools does SolutionsNepal offer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'SolutionsNepal offers BS ↔ AD date converter, Nepal salary calculator with SSF and income tax, vehicle tax and fine calculator, NEA electricity bill calculator, KUKL water bill calculator, gold weight converter (Tola ↔ Gram), land measurement converter (Ropani ↔ Aana), NEPSE profit/loss calculator, remittance calculator with NRB rates, and Nepali Unicode typing tool.',
            },
          },
        ],
      },
    ],
  },

  '/business-registration-cost-nepal': {
    title: 'Business Registration Cost Estimator Nepal | SolutionsNepal',
    description:
      'Estimate business registration costs in Nepal for private limited companies, sole proprietorships, partnership firms, and public companies.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Business Registration Cost Estimator Nepal',
      description: 'Estimate business registration costs in Nepal for private limited companies, sole proprietorships, partnership firms, and public companies.',
      url: `${SITE_URL}/business-registration-cost-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Calendar & Dates ──────────────────────────────────────
  '/nepal/date/bs-to-ad': {
    title: 'BS to AD Converter — Bikram Sambat to Gregorian | SolutionsNepal',
    description:
      'Convert Nepali Bikram Sambat (BS) dates to Gregorian AD dates accurately. Free online BS to AD date converter for Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'BS to AD Converter',
      description: 'Convert Bikram Sambat dates to Gregorian AD dates.',
      url: `${SITE_URL}/nepal/date/bs-to-ad`,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/date/ad-to-bs': {
    title: 'AD to BS Converter | Gregorian to Bikram Sambat Date | SolutionsNepal',
    description:
      'Convert Gregorian AD dates to Nepali Bikram Sambat (BS) dates accurately. Free online AD to BS date converter for Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AD to BS Converter',
      description: 'Convert Gregorian AD dates to Bikram Sambat dates.',
      url: `${SITE_URL}/nepal/date/ad-to-bs`,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Finance ───────────────────────────────────────────────
  '/nepal/finance/vat-calculator': {
    title: 'VAT Calculator Nepal – Calculate 13% VAT Online | SolutionsNepal',
    description:
      "Calculate VAT in Nepal instantly. Add 13% VAT to any price with SolutionsNepal's free VAT calculator.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'VAT Calculator Nepal',
      description: 'Add 13% VAT to any price instantly with the free Nepal VAT calculator.',
      url: `${SITE_URL}/nepal/finance/vat-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/finance/sip-calculator': {
    title: 'SIP Calculator Nepal – Calculate SIP Returns & Investment Growth | SolutionsNepal',
    description:
      'Calculate SIP returns in Nepal. Estimate total investment, expected returns and final value with monthly SIP, annual SIP, step-up SIP and SIP vs FD comparisons.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'SIP Calculator Nepal',
      description: 'Calculate SIP returns in Nepal with monthly SIP, annual SIP, step-up SIP and SIP vs FD comparisons.',
      url: `${SITE_URL}/nepal/finance/sip-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/finance/fd-calculator': {
    title: 'FD Calculator Nepal – Fixed Deposit Maturity & Interest | SolutionsNepal',
    description:
      'Calculate fixed deposit returns in Nepal. Estimate FD maturity value, interest and after-tax payout with quarterly, monthly or annual compounding.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'FD Calculator Nepal',
      description: 'Calculate fixed deposit maturity value, interest and after-tax payout in Nepal.',
      url: `${SITE_URL}/nepal/finance/fd-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/finance/rent-vs-buy': {
    title: 'Rent vs Buy Calculator Nepal — Should You Rent or Buy? | SolutionsNepal',
    description:
      'Compare renting vs buying a home in Nepal. Total rent, loan EMI, maintenance, appreciation and breakeven year side by side.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Rent vs Buy Calculator Nepal',
      description: 'Compare the true net cost of renting vs buying a home in Nepal.',
      url: `${SITE_URL}/nepal/finance/rent-vs-buy`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/transport/likhit-mock-test': {
    title: 'Driving Likhit Mock Test नेपाल — अभ्यास प्रश्नहरू | SolutionsNepal',
    description:
      'नेपालका लागि निःशुल्क Driving Likhit Mock Test: संकेत, नियम र कागजातमा २० वटा अनियमित प्रश्न — तत्काल उत्तर, टाइमर र स्कोरसहित।',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Driving Likhit Mock Test नेपाल',
      description: 'नेपालको ड्राइभिङ लिखित परीक्षाको अभ्यास — २० वटा अनियमित प्रश्न, टाइमर, तत्काल व्याख्या र स्कोरसहित।',
      url: `${SITE_URL}/nepal/transport/likhit-mock-test`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/finance/emi-calculator': {
    title: 'EMI Calculator Nepal | Monthly Loan Payment Calculator | SolutionsNepal',
    description:
      'Calculate your monthly EMI for home loans, car loans, and personal loans in Nepal. Free online EMI calculator.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal EMI Calculator',
      description: 'Calculate monthly EMI for loans in Nepal.',
      url: `${SITE_URL}/nepal/finance/emi-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/finance/overtime-calculator': {
    title: 'Nepal Overtime Calculator | Calculate Overtime Pay | SolutionsNepal',
    description:
      'Calculate your estimated overtime pay in Nepal using your basic salary, working hours, working days, and overtime hours.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Overtime Calculator',
      description: 'Calculate overtime pay in Nepal.',
      url: `${SITE_URL}/nepal/finance/overtime-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/finance/dashain-bonus-calculator': {
    title: 'Dashain Bonus Calculator Nepal 2083 | SolutionsNepal',
    description:
      'Calculate your Dashain bonus (festival expense) under Labour Act, 2074 Section 37 — one month’s basic remuneration, proportional for service under a year.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Dashain Bonus Calculator Nepal',
      description: 'Estimate Dashain bonus in Nepal from monthly basic salary and months worked.',
      url: `${SITE_URL}/nepal/finance/dashain-bonus-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/wedding-budget-calculator': {
    title: 'Wedding Budget Calculator Nepal | SolutionsNepal',
    description:
      'Plan your wedding budget in Nepal. Estimate food, venue, jewellery, decoration, photography, clothing and other wedding expenses.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Wedding Budget Calculator Nepal',
      description: 'Plan your wedding budget in Nepal. Estimate food, venue, jewellery, decoration, photography, clothing and other wedding expenses.',
      url: `${SITE_URL}/nepal/wedding-budget-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/finance/salary-checker': {
    title: 'Nepal Salary Calculator | SSF, Tax & Take-Home Salary | SolutionsNepal',
    description:
      'Calculate your take-home salary in Nepal. Enter your basic salary and allowances, and get your net salary, SSF and tax instantly. Works fully in your browser.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Nepal Salary Calculator',
        description:
          'Calculate your take-home salary in Nepal with SSF, income tax, and TDS deductions. Free online calculator.',
        url: `${SITE_URL}/nepal/finance/salary-checker`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Nepal Salary Calculator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is take-home salary?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Take-home salary is what you actually receive after deductions — your SSF contribution, income tax, and any other deductions — are subtracted from your gross salary.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is salary tax calculated in Nepal?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Nepal uses progressive tax slabs. Your annual taxable income (salary minus allowed deductions) is taxed at rates that rise with income. Monthly TDS is your annual tax divided by 12.',
            },
          },
        ],
      },
    ],
  },
  '/nepal/finance/salary-tax': {
    title: 'Nepal Income Tax Calculator | Salary Tax Rates & Calculation | SolutionsNepal',
    description: 'This page has moved. Use the Nepal Salary Calculator.',
    noindex: true,
  },
  '/nepal/finance/house-rent-tax': {
    title: 'House Rent Tax Calculator Nepal | Rental Income Tax | SolutionsNepal',
    description:
      'Calculate house rent tax, rental income, applicable withholding, and estimated net rental income in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal House Rent Tax Calculator',
      description:
        'Calculate house rent tax, rental income, applicable withholding, and estimated net rental income in Nepal.',
      url: `${SITE_URL}/nepal/finance/house-rent-tax`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/finance/rent-tax': {
    title: 'Nepal Rent Tax | Rental Income Tax Information | SolutionsNepal',
    description:
      'Calculate rental income, taxable rent, applicable deductions, tax, TDS, and estimated net rental income in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Rental Income Tax Calculator',
      description:
        'Calculate rental income, taxable rent, applicable deductions, tax, TDS, and estimated net rental income in Nepal.',
      url: `${SITE_URL}/nepal/finance/rent-tax`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/foreign-employment-cost-calculator': {
    title: 'Foreign Employment Cost Calculator Nepal | SolutionsNepal',
    description:
      'Estimate the cost of going abroad for work from Nepal, including visa, medical, insurance, recruitment, airfare and other expenses.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Foreign Employment Cost Calculator Nepal',
      description: 'Estimate the cost of going abroad for work from Nepal, including visa, medical, insurance, recruitment, airfare and other expenses.',
      url: `${SITE_URL}/nepal/foreign-employment-cost-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/finance/remittance-calculator': {
    title: 'Nepal Remittance Calculator | Foreign Currency to NPR | SolutionsNepal',
    description:
      'Convert USD, EUR, GBP, INR and other currencies to Nepalese Rupees using the latest Nepal Rastra Bank reference exchange rates.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Remittance Calculator',
      description: 'Convert foreign currency to NPR using NRB reference rates.',
      url: `${SITE_URL}/nepal/finance/remittance-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  // ── NEPSE ─────────────────────────────────────────────────
  '/nepal/nepse/profit-loss': {
    title: 'NEPSE Profit Loss Calculator | Nepal Share Trading Calculator | SolutionsNepal',
    description:
      'Calculate profit or loss from NEPSE stock trades including broker fees, SEBON fees, and DP charges.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'NEPSE Profit/Loss Calculator',
      description: 'Calculate profit or loss from NEPSE stock trades.',
      url: `${SITE_URL}/nepal/nepse/profit-loss`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Land & Property ──────────────────────────────────────
  '/nepal/land/ropani-to-aana': {
    title: 'Ropani to Aana Converter | Nepal Land Measurement | SolutionsNepal',
    description:
      'Convert Ropani to Aana for Nepal land measurements. Quick and accurate online converter.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Ropani to Aana Converter',
      description: 'Convert Ropani to Aana for Nepal land measurements.',
      url: `${SITE_URL}/nepal/land/ropani-to-aana`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/land/aana-to-ropani': {
    title: 'Aana to Ropani Converter | Nepal Land Measurement | SolutionsNepal',
    description:
      'Convert Aana to Ropani for Nepal land measurements. Quick and accurate online converter.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Aana to Ropani Converter',
      description: 'Convert Aana to Ropani for Nepal land measurements.',
      url: `${SITE_URL}/nepal/land/aana-to-ropani`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/property/land-registration': {
    title: 'Land Registration Fee Calculator Nepal | Property Costs | SolutionsNepal',
    description:
      'Estimate land registration fees, surcharges and transfer costs in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Land Registration Fee Calculator',
      description: 'Estimate land registration fees in Nepal.',
      url: `${SITE_URL}/nepal/property/land-registration`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/property/property-registration-cost': {
    title: 'Property Registration Cost Calculator Nepal | SolutionsNepal',
    description:
      'Calculate full property registration and land transfer cost estimate in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Property Registration Cost Calculator',
      description: 'Calculate property registration costs in Nepal.',
      url: `${SITE_URL}/nepal/property/property-registration-cost`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Gold & Silver ─────────────────────────────────────────
  '/nepal/gold-price-nepal': {
    title: 'Gold Price Nepal Today | Gold Rate per Tola & Gram | SolutionsNepal',
    description:
      'Check the latest gold price in Nepal, price per tola, gram and 10 gram rates, daily changes and gold price trends.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Gold Price Nepal Today',
      description: 'Check the latest gold price in Nepal per tola and gram.',
      url: `${SITE_URL}/nepal/gold-price-nepal`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  },
  '/silver-price-nepal': {
    title: 'Silver Price Nepal Today | Silver Rate per Tola & Gram | SolutionsNepal',
    description:
      'Check the latest silver price in Nepal, price per tola, 10 gram and gram rates, daily changes and silver price trends.',
    noindex: true,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Silver Price Nepal Today',
      description: 'Check the latest silver price in Nepal per tola and gram.',
      url: `${SITE_URL}/silver-price-nepal`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  },
  '/nepal/gold/tola-to-gram': {
    title: 'Tola to Gram Converter Nepal | Gold & Silver Weight | SolutionsNepal',
    description:
      'Convert Tola to Gram for gold and silver measurements. Quick and accurate online converter.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tola to Gram Converter',
      description: 'Convert Tola to Gram for gold and silver.',
      url: `${SITE_URL}/nepal/gold/tola-to-gram`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/gold/gram-to-tola': {
    title: 'Gram to Tola Converter Nepal | Gold & Silver Weight | SolutionsNepal',
    description:
      'Convert Gram to Tola for gold and silver measurements. Quick and accurate online converter.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gram to Tola Converter',
      description: 'Convert Gram to Tola for gold and silver.',
      url: `${SITE_URL}/nepal/gold/gram-to-tola`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Education ─────────────────────────────────────────────
  '/nepal/education/see-gpa': {
    title: 'SEE GPA Calculator Nepal | Calculate SEE GPA | SolutionsNepal',
    description:
      'Calculate your SEE (Secondary Education Examination) GPA from subject grades. Free online GPA calculator for Nepal students.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'SEE GPA Calculator',
      description: 'Calculate SEE GPA from subject grades.',
      url: `${SITE_URL}/nepal/education/see-gpa`,
      applicationCategory: 'EducationApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/education/neb-gpa-calculator': {
    title: 'NEB GPA Calculator Class 11 & 12 | Nepal | SolutionsNepal',
    description:
      'Calculate your NEB +2 GPA for Class 11 or 12 using your subject marks, theory, internal and practical assessment.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'NEB GPA Calculator',
      description: 'Calculate NEB Class 11 and 12 GPA.',
      url: `${SITE_URL}/nepal/education/neb-gpa-calculator`,
      applicationCategory: 'EducationApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  // ── Electricity ──────────────────────────────────────────
  '/nepal/electricity/bill-calculator': {
    title: 'NEA Electricity Bill Calculator | Estimate Bill | SolutionsNepal',
    description: 'This page has moved. Use the NEA Electricity Bill Calculator.',
    noindex: true,
  },

  // ── Fuel & Transport ─────────────────────────────────────
  '/nepal/fuel-price-nepal': {
    title: 'Petrol & Diesel Price Nepal Today | Fuel Rates | SolutionsNepal',
    description:
      'Check today\'s petrol, diesel and kerosene prices in Nepal across major cities. Updated NOC retail prices.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Petrol & Diesel Price Nepal Today',
      description: 'Check petrol and diesel prices in Nepal.',
      url: `${SITE_URL}/nepal/fuel-price-nepal`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  },
  '/nepal/vehicle/fuel-cost': {
    title: 'Trip Fuel Cost Calculator Nepal | Trip Cost & Cost per KM | SolutionsNepal',
    description:
      'Calculate trip fuel cost and cost per kilometer for your journey in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Trip Fuel Cost Calculator',
      description: 'Calculate trip fuel cost in Nepal.',
      url: `${SITE_URL}/nepal/vehicle/fuel-cost`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/vehicle/ownership-cost-calculator': {
    title: 'Bike & Car Ownership Cost Calculator Nepal | SolutionsNepal',
    description:
      'Calculate the real cost of owning a bike, scooter, or car in Nepal including fuel, EMI, tax, insurance, maintenance, parking and depreciation.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Bike & Car Ownership Cost Calculator Nepal',
      description: 'Calculate the real cost of owning a bike, scooter, or car in Nepal including fuel, EMI, tax, insurance, maintenance, parking and depreciation.',
      url: `${SITE_URL}/nepal/vehicle/ownership-cost-calculator`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/construction/house-construction-cost': {
    title: 'House Construction Cost Calculator Nepal | SolutionsNepal',
    description:
      'Estimate house construction cost in Nepal by location, house size, floors, and construction quality. Calculate cost per sq.ft., total budget, contingency, and what you can build with your budget.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'House Construction Cost Calculator Nepal',
      description: 'Estimate house construction cost in Nepal by location, house size, floors, and construction quality.',
      url: `${SITE_URL}/nepal/construction/house-construction-cost`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/construction/construction-material-calculator': {
    title: 'Construction Material Calculator Nepal 2026 | SolutionsNepal',
    description: 'Calculate estimated cement, sand, aggregate, bricks and steel quantities for construction projects in Nepal with SolutionsNepal\'s construction material calculator.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Construction Material Calculator Nepal',
      description: 'Calculate estimated cement, sand, aggregate, bricks and steel quantities for construction projects in Nepal.',
      url: `${SITE_URL}/nepal/construction/construction-material-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/education/study-abroad-total-cost-calculator-nepal': {
    title: 'Study Abroad Total Cost Calculator Nepal (2026) | SolutionsNepal',
    description: 'Estimate how much you need to study abroad from Nepal, including tuition, visa, travel, living expenses and other major costs.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Study Abroad Total Cost Calculator Nepal',
      description: 'Estimate total study-abroad cost from Nepal: tuition, visa, living, funding and gap.',
      url: `${SITE_URL}/nepal/education/study-abroad-total-cost-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/finance/new-baby-cost-calculator-nepal': {
    title: 'New Baby Cost Calculator Nepal (2026) | SolutionsNepal',
    description: "Estimate how much you may need for your baby's first year, from delivery and newborn essentials to diapers, feeding and healthcare.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'New Baby Cost Calculator Nepal',
      description: 'Estimate first-year baby costs in Nepal: delivery, essentials, diapers, feeding and healthcare.',
      url: `${SITE_URL}/nepal/finance/new-baby-cost-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/utilities/paint-calculator-nepal': {
    title: 'Paint Calculator Nepal (2026) | SolutionsNepal',
    description: 'Calculate how much paint you need and estimate the cost for your room, house or project in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Paint Calculator Nepal',
      description: 'Estimate paint quantity, cans, primer and cost for rooms and houses in Nepal.',
      url: `${SITE_URL}/nepal/utilities/paint-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/utilities/lpg-gas-cost-duration-calculator-nepal': {
    title: 'LPG Gas Cost & Duration Calculator Nepal (2026) | SolutionsNepal',
    description: 'Estimate how long your LPG cylinder will last, your daily gas cost and monthly cooking-gas spend in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'LPG Gas Cost & Duration Calculator Nepal',
      description: 'Estimate LPG cylinder duration, daily cost and monthly spend in Nepal.',
      url: `${SITE_URL}/nepal/utilities/lpg-gas-cost-duration-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/vehicles/vehicle-resale-value-calculator-nepal': {
    title: 'Vehicle Resale Value Calculator Nepal (2026) | SolutionsNepal',
    description: "Estimate your car or bike's current resale value in Nepal based on age, mileage, condition and market factors.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Vehicle Resale Value Calculator Nepal',
      description: "Estimate a used vehicle's resale value in Nepal by age, mileage and condition.",
      url: `${SITE_URL}/nepal/vehicles/vehicle-resale-value-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/finance/home-loan-down-payment-calculator-nepal': {
    title: 'Home Loan Down Payment Calculator Nepal (2026) | SolutionsNepal',
    description: 'Calculate your estimated down payment, home loan amount, upfront cash, EMI and LTV for buying a home in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Home Loan Down Payment Calculator Nepal',
      description: 'Estimate down payment, loan amount, upfront cash, EMI and LTV for a home purchase in Nepal.',
      url: `${SITE_URL}/nepal/finance/home-loan-down-payment-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/finance/gold-loan-calculator': {
    title: 'Gold Loan Calculator Nepal – Calculate Gold Loan & EMI | SolutionsNepal',
    description: 'Calculate your estimated gold loan amount, EMI, interest and repayment using gold weight, purity, Nepal gold price and loan-to-value.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gold Loan Calculator Nepal',
      description: 'Estimate gold loan amount and EMI in Nepal.',
      url: `${SITE_URL}/nepal/finance/gold-loan-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/finance/loan-eligibility-calculator-nepal': {
    title: 'Loan Eligibility Calculator Nepal (2026) | SolutionsNepal',
    description: 'Estimate how much you may be able to borrow and comfortably repay in Nepal — check affordable loan amount, EMI, DTI and tenure based on income and existing EMIs.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Loan Eligibility Calculator Nepal',
      description: 'Estimate affordable loan amount, EMI and DTI in Nepal.',
      url: `${SITE_URL}/nepal/finance/loan-eligibility-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/land/land-affordability-calculator': {
    title: 'Land Affordability Calculator Nepal | SolutionsNepal',
    description: 'Calculate how much land you can afford in Nepal based on your income, savings, expenses, down payment and estimated loan EMI.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Land Affordability Calculator Nepal',
      description: 'Calculate how much land you can afford in Nepal based on your income, savings, expenses, down payment and estimated loan EMI.',
      url: `${SITE_URL}/nepal/land/land-affordability-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/finance/online-selling-profit-calculator-nepal': {
    title: 'Online Selling Profit Calculator Nepal (2026) | SolutionsNepal',
    description: 'Calculate your real profit per sale after product cost, delivery, platform fees, ads, discounts and other selling expenses.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Online Selling Profit Calculator Nepal',
      description: 'Calculate real online selling profit per order in Nepal.',
      url: `${SITE_URL}/nepal/finance/online-selling-profit-calculator-nepal`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/business/break-even-calculator': {
    title: 'Business Break-Even Calculator Nepal (2026) – Calculate Break-Even Point | SolutionsNepal',
    description: 'Calculate your business break-even point in Nepal. Find required sales, break-even revenue, profit, margin of safety and target sales using Rs.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Business Break-Even Calculator Nepal',
      description: 'Find out how much you need to sell to cover your costs and reach your break-even point.',
      url: `${SITE_URL}/nepal/business/break-even-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },
  '/nepal/government-service-cost': {
    title: 'Government Service Fees & Document Checklist Nepal | SolutionsNepal',
    description:
      'Check Nepal government service fees, required documents, processing time, application steps, and official sources with SolutionsNepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Government Service Cost & Document Checklist Nepal',
      description: 'Check Nepal government service fees, required documents, processing time, application steps, and official sources.',
      url: `${SITE_URL}/nepal/government-service-cost`,
    },
  },
  '/nepal/finance/foreign-job-salary-savings': {
    title: 'Foreign Job Salary & Real Savings Calculator Nepal | SolutionsNepal',
    description:
      'See how much you could actually save, send to Nepal, and keep after monthly expenses. Foreign job salary and savings calculator for Nepali workers.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Foreign Job Salary & Real Savings Calculator Nepal',
      description: 'Estimate take home salary, living expenses, remittance costs and real savings for Nepali workers abroad, with NPR conversion.',
      url: `${SITE_URL}/nepal/finance/foreign-job-salary-savings`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  // ── Utilities ────────────────────────────────────────────
  '/nepal/utilities/kukl-water-bill': {
    title: 'KUKL Water Bill Calculator Nepal | Estimate Water Bill | SolutionsNepal',
    description:
      'Estimate your KUKL water bill based on consumption. Free online water bill calculator for Kathmandu.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'KUKL Water Bill Calculator',
      description: 'Estimate KUKL water bill in Nepal.',
      url: `${SITE_URL}/nepal/utilities/kukl-water-bill`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },
  '/nepal/utilities/electricity-bill': {
    title: 'NEA Electricity Bill Calculator Nepal | Estimate Bill | SolutionsNepal',
    description:
      'Estimate your NEA electricity bill quickly and easily. Enter your units and connection ampere for an instant slab-based estimate.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'NEA Electricity Bill Calculator',
      description: 'Estimate your NEA electricity bill in Nepal by entering your units consumed and connection ampere.',
      url: `${SITE_URL}/nepal/utilities/electricity-bill`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  // ── Transport ────────────────────────────────────────────
  '/nepal/transport/vehicle-tax': {
    title: 'Vehicle Tax, Fine & Renewal Calculator Nepal | SolutionsNepal',
    description:
      'Calculate vehicle tax, overdue fines, renewal penalties and related costs for motorcycles, cars and EVs in Nepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Vehicle Tax Calculator',
      description: 'Calculate vehicle tax and fines in Nepal.',
      url: `${SITE_URL}/nepal/transport/vehicle-tax`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        price: '0',
        priceCurrency: 'NPR',
      },
    },
  },

  '/nepal/utilities/cost-of-living-calculator': {
    title: 'Nepal Cost of Living Calculator (2026) – Monthly Expenses | SolutionsNepal',
    description:
      'Calculate your estimated cost of living in Nepal. Compare rent, food, transportation, utilities and other monthly expenses by city and household size.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepal Cost of Living Calculator',
      description: 'Estimate your monthly and yearly living expenses in Nepal based on city, household, housing, and lifestyle.',
      url: `${SITE_URL}/nepal/utilities/cost-of-living-calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  // ── Tools ─────────────────────────────────────────────────
  '/nepal/tools/nepali-number-to-words': {
    title: 'Nepali Number to Words Converter – Rupees in Words | SolutionsNepal',
    description: 'Convert numbers into Nepali words, Nepali digits and rupees in words. Perfect for cheques, bills, agreements, invoices and documents.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepali Number to Words Converter',
      description: 'Convert numbers into Nepali words, Nepali digits and rupees in words for cheques, bills and documents.',
      url: `${SITE_URL}/nepal/tools/nepali-number-to-words`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/nepal/tools/rupees-to-words': {
    title: 'Rupees to Words Converter – रुपैयाँ in Words for Cheques | SolutionsNepal',
    description: 'Convert any rupee amount into Nepali and English words instantly. Rs. 12,50,000 → रुपैयाँ बाह्र लाख पचास हजार मात्र. Ideal for cheques, bills and agreements.',
  },

  '/nepal/tools/number-to-words-nepali': {
    title: 'Number to Nepali Words – अंक शब्दमा लेख्नुहोस् | SolutionsNepal',
    description: 'Convert numbers to Nepali words instantly: 1,00,000 → एक लाख, 1,00,00,000 → एक करोड. Accurate Devanagari number wording for any value, up to neel.',
  },

  '/nepal/tools/cheque-amount-in-words': {
    title: 'Cheque Amount in Words Nepal – Write Cheque Amounts Correctly | SolutionsNepal',
    description: 'Write cheque amounts in words correctly in Nepal: रुपैयाँ … मात्र and Rupees … Only, generated automatically for any amount including paisa.',
  },

  '/nepal/tools/nepali-number-converter': {
    title: 'Nepali Number Converter – Digits, Words & Grouping | SolutionsNepal',
    description: 'Convert between Nepali digits, English numbers, grouping styles and words. १२५०००० ↔ 12,50,000 ↔ बाह्र लाख पचास हजार — instant and offline.',
  },

  '/nepal/tools/nepali-unicode': {
    title: 'Nepali Unicode Converter | Romanized Nepali to Unicode | SolutionsNepal',
    description:
      'Type Nepali using English letters and convert Romanized Nepali into Nepali Unicode instantly. Free online Nepali typing tool.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepali Unicode Converter',
      description: 'Convert Romanized Nepali to Unicode.',
      url: `${SITE_URL}/nepal/tools/nepali-unicode`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  // ── Age Calculator ────────────────────────────────────────
  '/nepal/age-calculator': {
    title: 'Nepali Age Calculator | Calculate Age in BS & AD | SolutionsNepal',
    description:
      'Calculate your exact age in years, months and days using Nepali Bikram Sambat or Gregorian dates. Free Nepali age calculator with BS and AD support.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Nepali Age Calculator',
      description:
        'Calculate your exact age in years, months and days using Nepali Bikram Sambat or Gregorian dates.',
      url: `${SITE_URL}/nepal/age-calculator`,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  // ── Foreign Exchange ─────────────────────────────────────
  '/foreign-exchange-nepal': {
    title: 'Foreign Exchange Nepal | Today\'s Currency Exchange Rates | SolutionsNepal',
    description:
      'Today\'s official foreign exchange rates in Nepal, including USD, EUR, GBP, INR and other currencies published by Nepal Rastra Bank.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Foreign Exchange Nepal',
      description: 'Official NRB exchange rates for major currencies.',
      url: `${SITE_URL}/foreign-exchange-nepal`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  },

  // ── Weather ──────────────────────────────────────────────
  '/weather': {
    title: "Today's Weather in Nepal | Live Forecast for Cities Across Nepal | SolutionsNepal",
    description:
      "Live weather conditions, hourly and 7-day forecasts, air quality, humidity, wind and UV index for Kathmandu, Pokhara, Lalitpur and cities across Nepal.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: "Today's Weather in Nepal",
      description:
        "Live weather conditions, hourly and 7-day forecasts, and air quality for major cities across Nepal.",
      url: `${SITE_URL}/weather`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  },

  // ── Tools ───────────────────────────────────────────────
  '/tools/qr-code-generator': {
    title: 'QR Code Generator – Free QR Codes for URL, WiFi, WhatsApp & More | SolutionsNepal',
    description: 'Create free QR codes for URLs, text, WiFi, phone numbers, email, WhatsApp, vCards and more. Download your QR code as PNG or SVG with SolutionsNepal.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'QR Code Generator',
      description: 'Create free QR codes for URLs, text, WiFi, phone numbers, email, WhatsApp, vCards and more, downloadable as PNG or SVG.',
      url: `${SITE_URL}/tools/qr-code-generator`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/wifi-qr-code-generator': {
    title: 'WiFi QR Code Generator – Share Wi-Fi Without Typing Passwords | SolutionsNepal',
    description: 'Create a Wi-Fi QR code guests can scan to connect instantly. Supports WPA/WPA2, WEP and open networks. Generated privately in your browser — your password is never uploaded.',
  },

  '/tools/url-qr-code-generator': {
    title: 'URL QR Code Generator – Turn Any Link Into a QR Code | SolutionsNepal',
    description: 'Convert any website link into a free QR code instantly. Auto-completes bare domains, supports http and https, downloads as PNG or SVG.',
  },

  '/tools/whatsapp-qr-code-generator': {
    title: 'WhatsApp QR Code Generator – wa.me Links as QR | SolutionsNepal',
    description: 'Create a WhatsApp QR code that opens a chat with your number — optionally with a pre-filled message. Uses the official wa.me format. Free and private.',
  },

  '/tools/vcard-qr-code-generator': {
    title: 'vCard QR Code Generator – Digital Business Card QR | SolutionsNepal',
    description: 'Turn your contact details into a scannable vCard QR code. Name, phone, email, organization, website and address saved straight to the phone\u2019s contacts.',
  },

  '/tools/email-qr-code-generator': {
    title: 'Email QR Code Generator – mailto QR with Subject & Body | SolutionsNepal',
    description: 'Create an email QR code that opens a draft to your address with subject and body pre-filled. Perfect for feedback forms, support desks and flyers.',
  },

  '/tools/image-compressor': {
    title: 'Smart Image Compressor - Compress Images to 20KB, 50KB, 100KB & More | SolutionsNepal',
    description:
      'Compress JPG, PNG and WebP images to your target file size. Smart compression automatically optimizes your image while keeping the best possible quality.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Image Compressor',
      description: 'Compress and optimize JPG, PNG and WebP images to your target file size.',
      url: `${SITE_URL}/tools/image-compressor`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/jpg-to-png': {
    title: 'JPG to PNG Converter — Convert JPG to PNG Online Free | SolutionsNepal',
    description:
      'Convert JPG images to lossless PNG online for free. In-browser conversion — no upload, no signup, no watermark.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'JPG to PNG Converter',
      description: 'Convert JPG images to lossless PNG format free in your browser.',
      url: `${SITE_URL}/tools/jpg-to-png`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/png-to-jpg': {
    title: 'PNG to JPG Converter — Convert PNG to JPG Online Free | SolutionsNepal',
    description:
      'Convert PNG images to JPG online for free. Shrink screenshots and photos by up to 80% with adjustable quality — in your browser, no upload.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PNG to JPG Converter',
      description: 'Convert PNG images to smaller JPG files free in your browser.',
      url: `${SITE_URL}/tools/png-to-jpg`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/webp-converter': {
    title: 'Image to WebP Converter — Convert JPG & PNG to WebP Free | SolutionsNepal',
    description:
      'Convert JPG and PNG images to WebP online for free. Files ~30% smaller at the same quality, with adjustable compression — in your browser, no upload.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Image to WebP Converter',
      description: 'Convert JPG and PNG images to WebP format free in your browser.',
      url: `${SITE_URL}/tools/webp-converter`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/passport-photo-resizer': {
    title: 'Passport Size Photo Resizer – Resize Photo Online | SolutionsNepal',
    description:
      'Passport Size Photo Resizer: crop to 35×45 mm or 2×2 inch and compress photos to exact KB targets. Free, private, in-browser.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Passport Size Photo Resizer',
      description: 'Passport photo maker: crop, resize photo to passport size and compress photos to exact sizes and target file sizes directly in your browser.',
      url: `${SITE_URL}/tools/passport-photo-resizer`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
    },
  },

  '/tools/compress-passport-photo-to-200kb': {
    title: 'Compress Passport Photo to 200 KB Online Free | SolutionsNepal',
    description: 'Compress a passport or visa photo to 200 KB online. Smart compression lands as close to 200 KB as possible — never far below, never above your original. 100% in your browser.',
  },

  '/tools/compress-photo-to-100kb': {
    title: 'Compress Photo to 100 KB - Resize Image to 100KB Online | SolutionsNepal',
    description: 'Compress any photo to 100 KB online free. Smart compression finds the highest quality that lands closest to 100 KB — with optional cropping to passport or visa sizes. Runs in your browser.',
  },

  '/tools/compress-photo-to-50kb': {
    title: 'Compress Photo to 50 KB - Resize Image to 50KB | SolutionsNepal',
    description: 'Compress a photo to 50 KB online for strict upload limits (signature-size photos, small ID images). Smart dimension + quality search gets as close to 50 KB as quality allows.',
  },

  // ── Informational ─────────────────────────────────────────
  '/404': {
    title: 'Page Not Found | SolutionsNepal',
    description: 'The page you are looking for does not exist. Browse SolutionsNepal tools, calculators and guides for Nepal.',
    noindex: true,
  },
  '/about': {
    title: 'About SolutionsNepal',
    description:
      'Learn about SolutionsNepal — a free collection of calculators, converters, and utility tools built for everyday life in Nepal.',
  },
  '/contact': {
    title: 'Contact SolutionsNepal',
    description:
      'Get in touch with the SolutionsNepal team. Feedback, suggestions, and bug reports welcome.',
  },
  '/privacy': {
    title: 'Privacy Policy — What We Collect | SolutionsNepal',
    description:
      'SolutionsNepal privacy: calculators run in your browser with no accounts. Analytics measures visits; the contact form sends only what you type.',
  },
  '/terms': {
    title: 'Terms of Use — Free Tools, Honest Limits | SolutionsNepal',
    description:
      'The rules for using SolutionsNepal: free tools provided as-is, estimates not professional advice, original content, and contact details for issues.',
  },
  '/blog': {
    title: 'Blog | SolutionsNepal',
    description:
      'Stories, cost-of-living comparisons, legal explainers and current rates for Nepal.',
  },
  '/guides': {
    title: 'Guides — Step-by-Step How-Tos for Nepal | SolutionsNepal',
    description:
      'Practical step-by-step guides for documents, money, vehicles, dates and daily life in Nepal.',
  },

  // ── Names ───────────────────────────────────────────────────
  '/nepal/names': {
    title: 'Nepali Names & Meanings – Baby Boy & Girl Names | SolutionsNepal',
    description: 'Explore Nepali, Sanskrit, Hindu, modern, traditional, and meaningful baby names with their meanings and origins.',
  },
  '/nepal/names/boy': {
    title: 'Nepali Baby Boy Names – Meanings & Origins | SolutionsNepal',
    description: 'Discover meaningful Nepali baby boy names with Sanskrit origins, meanings, and pronunciations.',
  },
  '/nepal/names/girl': {
    title: 'Nepali Baby Girl Names – Meanings & Origins | SolutionsNepal',
    description: 'Discover beautiful Nepali baby girl names with Sanskrit origins, meanings, and pronunciations.',
  },
  '/nepal/names/sanskrit': {
    title: 'Sanskrit Names – Meanings & Origins | SolutionsNepal',
    description: 'Explore Sanskrit baby names with their meanings and origins.',
  },
  '/nepal/names/hindu': {
    title: 'Hindu Names – Meanings & Origins | SolutionsNepal',
    description: 'Explore Hindu baby names with their meanings and origins.',
  },
  '/nepal/names/modern': {
    title: 'Modern Nepali Names – Meanings & Origins | SolutionsNepal',
    description: 'Discover modern Nepali baby names with contemporary appeal and meaningful origins.',
  },
  '/nepal/names/traditional': {
    title: 'Traditional Nepali Names – Meanings & Origins | SolutionsNepal',
    description: 'Explore traditional Nepali baby names with deep cultural and Sanskrit roots.',
  },
};

// ── Title/description length + uniqueness fixes ─────────────────
// Titles target 50–60 chars incl. brand; descriptions 140–160 chars.
const SEO_FIXES = {
  '/about': { title: 'About SolutionsNepal — Free Tools for Nepal | SolutionsNepal', description: 'SolutionsNepal is a free collection of calculators and utilities built for Nepal. No sign-up, no tracking — everything runs in your browser.' },
  '/blog': { title: 'Nepal Blog — Money, Costs & How-To Guides | SolutionsNepal', description: 'Practical stories and explainers for Nepal: cost of living, salaries, taxes, documents, vehicles and everyday money decisions with current rates.' },
  '/contact': { title: 'Contact SolutionsNepal — Feedback & Bug Reports | SolutionsNepal', description: 'Contact the SolutionsNepal team with feedback, tool requests, corrections or bug reports. We reply to every useful message about Nepal tools.' },
  '/foreign-exchange-nepal': { title: 'Dollar Price in Nepal — NRB Rates Today | SolutionsNepal', description: "Today's official NRB exchange rates: USD, EUR, GBP, INR and all currencies to NPR. Live foreign-exchange rates for Nepal." },
  '/nepal/business/break-even-calculator': { title: 'Break-Even Calculator — Sales to Profit | SolutionsNepal', description: 'Find break-even sales in Nepal: required units, revenue, profit and margin of safety from fixed and variable costs. Free for shops.' },
  '/nepal/finance/sip-calculator': { title: 'SIP Calculator Nepal — Returns & Growth | SolutionsNepal', description: 'Project SIP growth in Nepal: monthly, annual and step-up SIPs with invested amount, gains and final value. Includes SIP vs FD compare.' },
  '/nepal/finance/fd-calculator': { title: 'FD Calculator Nepal — Fixed Deposit Maturity | SolutionsNepal', description: 'Calculate FD returns in Nepal: maturity value, interest and after-tax payout with quarterly, monthly or annual compounding. Free.' },
  '/nepal/finance/rent-vs-buy': { title: 'Rent vs Buy Calculator Nepal — Rent or Buy? | SolutionsNepal', description: 'Should you rent or buy in Nepal? Compare total rent, EMI, maintenance, appreciation and breakeven year. Free calculator.' },
  '/nepal/transport/likhit-mock-test': { title: 'Driving Likhit Mock Test नेपाल — अभ्यास | SolutionsNepal', description: 'निःशुल्क लिखित मक टेस्ट: संकेत, नियम र कागजातमा २० वटा अनियमित प्रश्न — टाइमर, व्याख्या र स्कोरसहित।' },
  '/nepal/nepse/profit-loss': { title: 'NEPSE Profit Calculator — After Fees | SolutionsNepal', description: 'Calculate NEPSE stock profit or loss after broker commission, SEBON fee and DP charges. Free Nepal share-trading calculator.' },
  '/nepal/property/land-registration': { title: 'Land Registration Fee Calculator Nepal | SolutionsNepal', description: 'Estimate land registration fees, surcharges and transfer costs in Nepal. Free jagga-pass cost calculator with location factors.' },
  '/nepal/tools/cheque-amount-in-words': { title: 'Cheque Amount in Words Nepal — Guide | SolutionsNepal', description: 'Cheque amounts in words done right: रुपैयाँ … मात्र plus Rupees … Only with paisa, auto-generated for any amount. Avoid bounces.' },
  '/nepal/tools/rupees-to-words': { title: 'Rupees to Words Converter — Cheque Text | SolutionsNepal', description: 'Rupee amounts to words for cheques: Rs. 12,50,000 to Nepali and English wording with paisa. Free cheque-text generator.' },
  '/nepal/utilities/cost-of-living-calculator': { title: 'Cost of Living Calculator Nepal — Expenses | SolutionsNepal', description: 'Estimate monthly living costs in Nepal by city and household: rent, food, transport, utilities and lifestyle. Compare cities.' },
  '/nepal/construction/house-construction-cost': { description: 'Estimate house construction cost in Nepal by location, size, floors and quality. Per-sq-ft rate, total budget and contingency included.' },
  '/nepal/names/sanskrit': { description: 'Sanskrit baby names with meanings, origins and pronunciations. Classic, timeless picks with deep roots for Nepali families.' },
  '/nepal/names/hindu': { description: 'Hindu baby names with meanings, spiritual significance and origins. Traditional picks for Nepali families with pronunciations.' },
  '/tools/compress-passport-photo-to-200kb': { description: 'Compress a passport or visa photo to 200 KB online. Smart compression lands close to 200 KB without going over. In-browser and free.' },
  '/tools/compress-photo-to-100kb': { description: 'Compress any photo to 100 KB online free. Smart compression finds the best quality near 100 KB with optional ID-size cropping.' },
  '/tools/compress-photo-to-50kb': { description: 'Compress a photo to 50 KB for strict upload limits like signatures and small IDs. Smart quality search gets closest to 50 KB.' },
  '/tools/passport-photo-resizer': { title: 'Passport Size Photo Resizer – Resize Photo Online | SolutionsNepal', description: 'Passport Size Photo Resizer: crop to 35×45 mm or 2×2 inch and compress photos to exact KB targets. Free, private, in-browser.' },
  '/tools/wifi-qr-code-generator': { title: 'WiFi QR Code Generator — Share WiFi Fast | SolutionsNepal', description: 'Wi-Fi QR guests scan to connect instantly. WPA/WPA2, WEP and open networks supported. Generated privately in your browser.' },
  '/tools/qr-code-generator': { title: 'QR Code Generator — URL, WiFi & More | SolutionsNepal', description: 'Create free QR codes for URL, text, WiFi, WhatsApp, vCard and email. Download PNG/SVG privately in your browser.' },
  '/tools/image-compressor': { title: 'Image Compressor — Shrink to Exact KB | SolutionsNepal', description: 'Compress JPG, PNG and WebP to your target KB (20/50/100/200) with smart quality search. Free, private, in-browser.' },
  '/tools/jpg-to-png': { title: 'JPG to PNG Converter — Lossless & Free | SolutionsNepal', description: 'Convert JPG to lossless PNG online free. No upload, no signup, no watermark.' },
  '/tools/png-to-jpg': { title: 'PNG to JPG Converter — Shrink PNGs Free | SolutionsNepal', description: 'Convert PNG to JPG with adjustable quality. Up to 80% smaller files, free in-browser.' },
  '/tools/webp-converter': { title: 'Image to WebP Converter — Free | SolutionsNepal', description: 'Convert JPG & PNG to WebP online free. ~30% smaller files at the same quality.' },
  '/tools/compress-photo-to-100kb': { title: 'Compress Photo to 100 KB Online Free | SolutionsNepal', description: 'Compress any photo to 100 KB free. Smart quality search lands closest to 100 KB with optional ID-size cropping. In-browser.' },
  '/tools/email-qr-code-generator': { title: 'Email QR Code Generator — mailto QR | SolutionsNepal' },
  '/weather': { title: "Today's Weather in Nepal — Forecast & AQI | SolutionsNepal", description: 'Live weather, hourly and 7-day forecasts plus air quality for Kathmandu, Pokhara and cities across Nepal. Updated frequently.' },
  '/nepal/finance/emi-calculator': { title: 'EMI Calculator Nepal — Monthly Loan EMI | SolutionsNepal' },
  '/nepal/date/ad-to-bs': { title: 'AD to BS Converter — Gregorian to BS | SolutionsNepal' },
};
Object.entries(SEO_FIXES).forEach(([k, v]) => {
  if (pages[k]) Object.assign(pages[k], v);
  else pages[k] = v;
});

// ── Category pages (unique titles, intros, schema) ─────────────
const CATEGORY_SEO = {
  '/nepal/date': { title: 'Nepali Date Tools — Calendar & BS/AD Converters | SolutionsNepal', description: 'Nepali calendar, BS to AD and AD to BS converters, age and date-difference calculators. Every date tool for Nepal in one place.' },
  '/nepal/finance': { title: 'Nepal Finance Calculators — Salary, EMI & Tax | SolutionsNepal', description: 'Salary, SSF, VAT, EMI, SIP, loans, rent-tax and remittance calculators for Nepal. Free finance tools with current rules.' },
  '/nepal/nepse': { title: 'NEPSE Calculators — Profit, Fees & Returns | SolutionsNepal', description: 'NEPSE profit/loss with broker, SEBON and DP charges plus SIP tools. Nepal stock-market calculators for smart trades.' },
  '/nepal/land': { title: 'Nepal Land Tools — Ropani, Aana & Costs | SolutionsNepal', description: 'Ropani↔Aana converters, land affordability and registration-cost estimators. Land measurement and pass costs for Nepal.' },
  '/nepal/gold': { title: 'Gold & Silver Tools Nepal — Price & Weight | SolutionsNepal', description: 'Today’s gold/silver context plus tola↔gram converters and gold-loan estimator. Weight and price tools for Nepal buyers.' },
  '/nepal/education': { title: 'Education Calculators Nepal — GPA & Costs | SolutionsNepal', description: 'SEE GPA, NEB +2 GPA, CGPA, GPA-to-percentage and study-abroad cost planner. Academic tools for Nepal students.' },
  '/nepal/tools': { title: 'Nepali Language Tools — Unicode & Words | SolutionsNepal', description: 'Nepali Unicode typing, English-to-Nepali translator and number-to-words for cheques. Language tools that work offline.' },
  '/nepal/utilities': { title: 'Nepal Utility Tools — Bills, Gas & Living Cost | SolutionsNepal', description: 'NEA bill, KUKL water, LPG duration, paint, cost-of-living, QR and BMI. Everyday utilities for life in Nepal.' },
  '/nepal/vehicle': { title: 'Vehicle Tools Nepal — Fuel & Ownership Cost | SolutionsNepal', description: 'Fuel prices, trip fuel cost, ownership cost and resale value for bikes and cars in Nepal. True driving costs.' },
  '/nepal/transport': { title: 'Vehicle Tax Nepal — Tax, Fine & Renewal | SolutionsNepal', description: 'Vehicle tax, late fines and bluebook renewal for all 7 provinces. Motorbike, car and EV rates with penalty slabs.' },
  '/nepal/construction': { title: 'Construction Calculators Nepal — Cost & Material | SolutionsNepal', description: 'House construction cost per sq ft and material quantities (cement, sand, bricks, steel). Plan builds anywhere in Nepal.' },
  '/tools/photo': { title: 'Passport & ID Photo Tools — Resize Online | SolutionsNepal', description: 'Passport, visa, DV lottery and citizenship photos: crop to exact size and compress to KB targets. Free, private, in-browser.' },
  '/tools/convert': { title: 'Image Converters — JPG, PNG & WebP Online | SolutionsNepal', description: 'Convert between JPG, PNG and WebP in your browser. Free image conversion with quality control — no uploads.' },
  '/tools/pdf': { title: 'Free PDF Tools — Merge, Compress & Convert | SolutionsNepal', description: 'Merge, compress, convert and edit PDFs entirely in your browser. JPG↔PDF, PDF↔Word, signatures — free and private.' },
  '/nepal/names': { title: 'Nepali Baby Names — Meanings A–Z | SolutionsNepal', description: 'Searchable Nepali baby names with meanings and origins: boy, girl, unisex, Sanskrit, Hindu, modern and traditional lists.' },
};
Object.entries(CATEGORY_SEO).forEach(([k, v]) => {
  if (!pages[k]) pages[k] = { ...v, jsonLd: autoJsonLd(k, { tool_name: v.title.split(' | ')[0], meta_description: v.description, canonical_url: `${SITE_URL}${k}`, schema: 'CollectionPage' }) };
  else Object.assign(pages[k], v);
});

// ── Auto-fill every SEO_DB record missing from pages ───────────
Object.entries(SEO_DB).forEach(([path, rec]) => {
  if (!pages[path]) {
    pages[path] = {
      title: `${rec.seo_title} | SolutionsNepal`,
      description: rec.meta_description,
      jsonLd: autoJsonLd(path, rec),
    };
  } else if (!pages[path].jsonLd) {
    pages[path].jsonLd = autoJsonLd(path, rec);
  }
});

// ── Public API ──────────────────────────────────────────────

/**
 * Get SEO metadata for a given pathname.
 * Falls back to the tools registry so NO page ever gets a generic "SolutionsNepal" title.
 */
export function getSeo(pathname) {
  // Normalize: strip trailing slash (except root)
  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;
  const entry = pages[path];
  if (entry) {
    // Auto schema: every indexable page gets valid JSON-LD even if no hand-written block exists.
    // FAQPage/HowTo stay page-owned (only when visible content exists) — never auto-faked.
    const jsonLd = entry.jsonLd || (entry.noindex ? null : {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: entry.title.split(' | ')[0],
      description: entry.description,
      url: `${SITE_URL}${path}`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    });
    return {
      title: entry.title,
      description: entry.description,
      ogTitle: entry.title,
      ogDescription: entry.description,
      ogImage: entry.ogImage || DEFAULT_OG_IMAGE,
      noindex: entry.noindex || false,
      jsonLd,
    };
  }
  // Smart fallback: derive from SEO_DB record or prettified slug
  const rec = SEO_DB[path];
  if (rec) {
    const title = `${rec.seo_title} | SolutionsNepal`;
    return { title, description: rec.meta_description, ogTitle: title, ogDescription: rec.meta_description, ogImage: DEFAULT_OG_IMAGE, noindex: false, jsonLd: autoJsonLd(path, rec) };
  }
  const pretty = path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || SITE_NAME;
  const title = `${pretty} | SolutionsNepal`;
  const description = `${pretty} — free online tool on SolutionsNepal. Fast, private and mobile-friendly; everything runs in your browser.`;
  return { title, description, ogTitle: title, ogDescription: description, ogImage: DEFAULT_OG_IMAGE, noindex: false, jsonLd: null };
}

export { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE };
