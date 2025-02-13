export const economicCalendar2025 = {
    events: [
        // G20 Zirveleri ve Toplantıları
        {
            name: "G20 Leaders' Summit 2025",
            type: "economic",
            impact: "critical",
            date: "2025-11-21",
            countries: ["All G20"],
            description: "Annual G20 Summit in Brazil",
            duration: "2 days"
        },
        {
            name: "G20 Finance Ministers Meeting",
            type: "economic",
            impact: "high",
            date: "2025-04-15",
            countries: ["All G20"],
            description: "Finance Ministers and Central Bank Governors Meeting",
            duration: "2 days"
        },

        // Merkez Bankası Toplantıları
        {
            name: "Federal Reserve FOMC Meeting",
            type: "economic",
            impact: "critical",
            date: "2025-03-19",
            countries: ["United States"],
            description: "Federal Reserve interest rate decision and monetary policy statement"
        },
        {
            name: "ECB Monetary Policy Meeting",
            type: "economic",
            impact: "critical",
            date: "2025-03-06",
            countries: ["European Union"],
            description: "European Central Bank interest rate decision"
        },
        {
            name: "Bank of Japan Policy Meeting",
            type: "economic",
            impact: "high",
            date: "2025-03-11",
            countries: ["Japan"],
            description: "BOJ monetary policy decision"
        },

        // Önemli Ekonomik Raporlar
        {
            name: "IMF World Economic Outlook",
            type: "economic",
            impact: "high",
            date: "2025-04-10",
            countries: ["Global"],
            description: "IMF's global economic growth forecasts and analysis"
        },
        {
            name: "World Bank Annual Meeting",
            type: "economic",
            impact: "high",
            date: "2025-10-15",
            countries: ["Global"],
            description: "Annual meeting of the World Bank Group and IMF"
        },

        // Dini Bayramlar
        {
            name: "Ramazan Bayramı",
            type: "religious",
            impact: "medium",
            date: "2025-03-31",
            countries: ["Turkey", "Saudi Arabia", "Indonesia"],
            description: "İslam dünyasının en önemli bayramlarından biri",
            duration: "3 days"
        },
        {
            name: "Kurban Bayramı",
            type: "religious",
            impact: "medium",
            date: "2025-06-07",
            countries: ["Turkey", "Saudi Arabia", "Indonesia"],
            description: "İslam dünyasının en önemli bayramlarından biri",
            duration: "4 days"
        },

        // Ulusal Tatiller ve Önemli Günler
        {
            name: "Chinese New Year",
            type: "national",
            impact: "high",
            date: "2025-01-29",
            countries: ["China"],
            description: "Year of the Snake celebrations",
            duration: "7 days"
        },
        {
            name: "US Independence Day",
            type: "national",
            impact: "medium",
            date: "2025-07-04",
            countries: ["United States"],
            description: "National holiday in the United States"
        },

        // G20 Ülkeleri Seçimleri
        {
            name: "Russian Presidential Election",
            type: "national",
            impact: "high",
            date: "2025-03-16",
            countries: ["Russia"],
            description: "Presidential election in Russia"
        },
        {
            name: "UK General Election",
            type: "national",
            impact: "high",
            date: "2025-05-15",
            countries: ["United Kingdom"],
            description: "General election in the United Kingdom"
        },

        // Ekonomik Veriler
        {
            name: "US GDP Q1 2025",
            type: "economic",
            impact: "high",
            date: "2025-04-30",
            countries: ["United States"],
            description: "First quarter GDP growth rate"
        },
        {
            name: "Eurozone Inflation Data",
            type: "economic",
            impact: "high",
            date: "2025-01-31",
            countries: ["European Union"],
            description: "January 2025 inflation figures"
        },

        // Ticaret Anlaşmaları ve Zirveler
        {
            name: "RCEP Annual Summit",
            type: "economic",
            impact: "high",
            date: "2025-09-15",
            countries: ["China", "Japan", "South Korea", "Australia"],
            description: "Regional Comprehensive Economic Partnership meeting"
        },
        {
            name: "BRICS Summit 2025",
            type: "economic",
            impact: "high",
            date: "2025-08-20",
            countries: ["Brazil", "Russia", "India", "China", "South Africa"],
            description: "Annual BRICS nations summit"
        }
    ],

    // G20 Ülkeleri
    countries: [
        {
            name: "United States",
            code: "US",
            region: "North America"
        },
        {
            name: "China",
            code: "CN",
            region: "Asia"
        },
        {
            name: "Japan",
            code: "JP",
            region: "Asia"
        },
        {
            name: "Germany",
            code: "DE",
            region: "Europe"
        },
        {
            name: "United Kingdom",
            code: "GB",
            region: "Europe"
        },
        {
            name: "France",
            code: "FR",
            region: "Europe"
        },
        {
            name: "India",
            code: "IN",
            region: "Asia"
        },
        {
            name: "Italy",
            code: "IT",
            region: "Europe"
        },
        {
            name: "Brazil",
            code: "BR",
            region: "South America"
        },
        {
            name: "Canada",
            code: "CA",
            region: "North America"
        },
        {
            name: "Russia",
            code: "RU",
            region: "Europe/Asia"
        },
        {
            name: "South Korea",
            code: "KR",
            region: "Asia"
        },
        {
            name: "Australia",
            code: "AU",
            region: "Oceania"
        },
        {
            name: "Mexico",
            code: "MX",
            region: "North America"
        },
        {
            name: "Indonesia",
            code: "ID",
            region: "Asia"
        },
        {
            name: "Turkey",
            code: "TR",
            region: "Europe/Asia"
        },
        {
            name: "Saudi Arabia",
            code: "SA",
            region: "Middle East"
        },
        {
            name: "Argentina",
            code: "AR",
            region: "South America"
        },
        {
            name: "South Africa",
            code: "ZA",
            region: "Africa"
        },
        {
            name: "European Union",
            code: "EU",
            region: "Europe"
        }
    ],

    // Olay Kategorileri
    categories: {
        economic: "Ekonomik olaylar ve toplantılar",
        religious: "Dini bayramlar ve özel günler",
        national: "Ulusal tatiller ve önemli günler"
    },

    // Etki Seviyeleri
    impactLevels: {
        critical: "Piyasalar üzerinde çok yüksek etki",
        high: "Piyasalar üzerinde yüksek etki",
        medium: "Piyasalar üzerinde orta düzey etki",
        low: "Piyasalar üzerinde düşük etki"
    }
};
