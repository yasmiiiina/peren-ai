export const intentionOptions = [
  "Comprendre mon corps",
  "Prendre de meilleures décisions de vie",
  "Préparer une transition de vie",
  "Suivre les évolutions dans le temps",
  "Accompagner une conversation médicale",
  "Contribuer à la recherche",
];

export const sexOptions = ["Mâle", "Femelle", "Intersexe", "Je préfère ne pas répondre"];

export const ethnicityOptions = [
  "Caucasian (Blanc)",
  "Premières nations",
  "Latino américain",
  "African / Afro-américain (Noir)",
  "Arabe",
  "Nord-africain (Maghrébin)",
  "Asie de l'Ouest (ex : Iranien, Afghan)",
  "Asie du Sud (ex : Indien, Pakistanais)",
  "Asie Sud-Est (ex : Chinois, Japonais, Coréen)",
  "Asie centrale (ex : Kazakh, Ouzbek)",
  "Pacifique / Océanien (ex : Polynésien, Mélanésien)",
  "Métis / Multiethnique",
  "Autre",
  "Je ne sais pas",
  "Je préfère ne pas répondre",
];

export const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Je ne sais pas"];
export const durationOptions = ["Moins d'1 an", "1–5 ans", "6–10 ans", "Plus de 10 ans"];

export const countryCodeOptions = [
  "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
];

const regionDisplay = typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
export const countryOptions = countryCodeOptions
  .map((code) => regionDisplay?.of(code) || code)
  .filter(Boolean)
  .sort((firstCountry, secondCountry) => firstCountry.localeCompare(secondCountry, "fr"));

export const languageOptions = [
  "Arabe", "Français", "Anglais", "Espagnol", "Tamazight", "Néerlandais", "Russe", "Turc", "Persan (Farsi)", "Ourdou", "Hindi", "Bengali", "Pendjabi", "Swahili", "Hausa", "Amharique", "Wolof", "Chinois (Mandarin)", "Japonais", "Coréen", "Thaï", "Vietnamien", "Tagalog", "Allemand", "Italien", "Portugais", "Autre",
];

export const spokenLanguagesCountOptions = ["1", "2", "3", "4 et plus"];

export const heardFromOptions = [
  "Professionnel de santé", "Famille / ami / collègue", "Recherche en ligne", "Réseaux sociaux", "Événement", "Médias", "Démarche directe",
];

export const familyHistoryOptions = [
  "Cardiovasculaire", "Auto-immune", "Neurologique", "Psychiatrique", "Endocrinien", "Gastro-intestinal", "Cancer / chimiothérapie / radiothérapie", "Musculo-squelettique", "Néphrologie", "Hépatologie", "Hématologie",
];

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 350;
export const MIN_HEIGHT_CM = 80;
export const MAX_HEIGHT_CM = 250;
