export const nzRegions = {
  seaSpray: {
    // Zone A: <100m from coast, very high salt
    zoneA: [
      "Waiheke Island", "Great Barrier Island", "Coromandel coastal",
      "Piha", "Karekare", "Muriwai", "Raglan"
    ],

    // Zone B: 100m-500m from coast, high salt
    zoneB: [
      "Takapuna", "Mission Bay", "St Heliers", "Devonport",
      "Mairangi Bay", "Browns Bay", "Orewa", "Whangaparaoa",
      "Mt Maunganui", "Papamoa", "Tauranga waterfront"
    ],

    // Zone C: 500m-1km from coast, medium salt
    zoneC: [
      "Auckland CBD", "Parnell", "Remuera coastal", "Ponsonby",
      "Grey Lynn", "Birkenhead", "Bayswater", "Rothesay Bay",
      "Wellington CBD", "Oriental Bay", "Island Bay"
    ],

    // Zone D: >1km from coast, low/no salt
    zoneD: [
      "South Auckland", "West Auckland inland", "Manukau",
      "Hamilton", "Cambridge", "Rotorua", "Taupo",
      "Palmerston North", "Christchurch inland", "Dunedin inland"
    ]
  },

  windZone: {
    // Per NZS 3604
    veryHigh: [
      "Wellington", "Wellington region", "Kapiti Coast", "Wairarapa coast",
      "Cook Strait areas", "Exposed hilltops nationwide",
      // Wellington suburbs
      "Wellington CBD", "Island Bay", "Oriental Bay", "Seatoun", "Lyall Bay",
      "Miramar", "Kilbirnie", "Karori", "Johnsonville", "Petone",
      "Lower Hutt", "Upper Hutt", "Porirua", "Paraparaumu"
    ],

    high: [
      "Auckland North Shore", "Coromandel", "Bay of Plenty coast",
      "Taranaki", "West Coast NI", "Exposed sites",
      // North Shore suburbs
      "Takapuna", "Devonport", "Milford", "Castor Bay",
      "Mairangi Bay", "Browns Bay", "Rothesay Bay", "Campbells Bay",
      "Orewa", "Whangaparaoa", "Bayswater", "Birkenhead",
      // Coastal Auckland
      "Mission Bay", "St Heliers", "Kohimarama", "Piha", "Muriwai",
      // Other coastal
      "Mt Maunganui", "Papamoa", "Raglan"
    ],

    medium: [
      "Auckland Central", "Auckland", "Hamilton", "Tauranga inland",
      "Napier", "Hastings", "Christchurch", "Queenstown",
      "Ponsonby", "Grey Lynn", "Parnell", "Remuera",
      "Tauranga", "Rotorua", "Taupo", "Dunedin"
    ],

    low: [
      "Waikato inland", "Canterbury plains", "Southland inland",
      "Sheltered valleys", "Cambridge"
    ]
  },

  consentThresholds: {
    // Building Act exemptions
    exemption39: {
      maxArea: 30, // m²
      maxHeight: 1000, // mm from ground
      description: "Deck <30m² and <1m high may not need consent"
    },

    requiresConsent: {
      area: ">30m²",
      height: ">1m",
      proximity: "<1m from boundary",
      overBuilding: "Any deck over habitable space"
    }
  }
};

export function lookupZones(suburb, city) {
  const location = `${suburb}, ${city}`.toLowerCase();
  const suburbLower = suburb.toLowerCase().trim();

  let seaSpray = 'D'; // Default inland
  let wind = 'medium'; // Default

  // Match helper: checks if location contains area OR area contains suburb
  const matches = (area) => {
    const areaLower = area.toLowerCase();
    return location.includes(areaLower) || areaLower.includes(suburbLower);
  };

  // Check sea spray zones
  for (const [zone, areas] of Object.entries(nzRegions.seaSpray)) {
    if (areas.some(matches)) {
      seaSpray = zone.replace('zone', '');
      break;
    }
  }

  // Check wind zones
  for (const [zone, areas] of Object.entries(nzRegions.windZone)) {
    if (areas.some(matches)) {
      wind = zone;
      break;
    }
  }

  return { seaSpray, wind, location };
}

export function getFixingRequirements(seaSprayZone) {
  const requirements = {
    A: {
      hangers: "Stainless Steel 316 marine grade",
      screws: "SS316 decking screws only",
      bolts: "SS316 coach screws",
      nails: "SS316 (galv not suitable)",
      warning: "Severe sea spray - only marine grade SS acceptable"
    },
    B: {
      hangers: "Stainless Steel 316 joist hangers",
      screws: "SS304 or SS316 decking screws",
      bolts: "SS304 coach screws minimum",
      nails: "Hot-dip galv or SS304",
      warning: "High sea spray - stainless steel required"
    },
    C: {
      hangers: "SS304 or hot-dip galv joist hangers",
      screws: "SS304 decking screws recommended",
      bolts: "Galv or SS304 coach screws",
      nails: "Hot-dip galvanised acceptable",
      warning: "Medium sea spray - prefer stainless or quality galv"
    },
    D: {
      hangers: "Hot-dip galvanised acceptable",
      screws: "Galv or SS304 decking screws",
      bolts: "Galvanised coach screws",
      nails: "Hot-dip galvanised",
      warning: "Inland location - standard galv suitable"
    }
  };

  return requirements[seaSprayZone] || requirements.D;
}
