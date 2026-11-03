/** Makes and models common on US ride-hail fleets. Replace with a VIN/catalog API later. */
export const VEHICLE_CATALOG: Record<string, string[]> = {
  Acura: ["MDX", "RDX", "TLX"],
  Audi: ["A4", "A6", "A8", "Q5", "Q7", "Q8"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7"],
  Buick: ["Enclave", "Envision"],
  Cadillac: ["CT5", "Escalade", "Escalade ESV", "XT5", "XT6"],
  Chevrolet: ["Equinox", "Malibu", "Suburban", "Tahoe", "Traverse"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Dodge: ["Durango", "Grand Caravan"],
  Ford: ["Edge", "Escape", "Expedition", "Explorer", "Transit"],
  Genesis: ["G80", "G90", "GV80"],
  GMC: ["Acadia", "Yukon", "Yukon XL"],
  Honda: ["Accord", "CR-V", "Odyssey", "Pilot"],
  Hyundai: ["Palisade", "Santa Fe", "Sonata", "Tucson"],
  Infiniti: ["QX60", "QX80"],
  Kia: ["Carnival", "K5", "Sorento", "Telluride"],
  "Land Rover": ["Range Rover", "Range Rover Sport"],
  Lexus: ["ES", "GX", "LS", "LX", "RX"],
  Lincoln: ["Aviator", "Navigator", "Navigator L"],
  "Mercedes-Benz": ["E-Class", "GLE", "GLS", "S-Class", "Sprinter"],
  Nissan: ["Altima", "Armada", "Pathfinder", "Rogue"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["Camry", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna"],
  Volkswagen: ["Atlas", "Passat", "Tiguan"],
  Volvo: ["S90", "XC60", "XC90"],
};

export const VEHICLE_MAKES = Object.keys(VEHICLE_CATALOG).sort();

/** Chicago ride-hail rules cap vehicle age, so only recent model years are offered. */
const MAX_VEHICLE_AGE_YEARS = 15;

export function vehicleYears(now = new Date()): string[] {
  const newest = now.getFullYear() + 1;
  return Array.from({ length: MAX_VEHICLE_AGE_YEARS + 1 }, (_, index) =>
    String(newest - index)
  );
}

export const VEHICLE_COLORS = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Beige",
  "Gold",
  "Other",
];
