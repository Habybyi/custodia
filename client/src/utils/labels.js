export const ROLE_LABELS = {
  OWNER: "Majiteľ",
  TECHNICIAN: "Technik",
  CUSTOMER: "Zákazník",
};

export const CUSTOMER_STATUS_LABELS = {
  LEAD: "Dopyt",
  ACTIVE: "Aktívny",
  INACTIVE: "Neaktívny",
};

export const SOURCE_LABELS = {
  MANUAL: "Zadané ručne",
  PHONE: "Telefonát",
  REFERRAL: "Odporúčanie",
  EMAIL: "E-mail",
  WEB_FORM: "Formulár na webe",
  CALCULATOR: "Kalkulačka na webe",
  CUSTOMER_PORTAL: "Zákaznícky portál",
  IOT: "Senzor v záhrade (IoT)",
};

export const CONTACT_LABELS = {
  PHONE: "Telefonát",
  SMS: "SMS",
  EMAIL: "E-mail",
};

export const WATER_SOURCE_LABELS = {
  MAINS: "Vodovod",
  WELL: "Studňa",
  RAINWATER: "Dažďová voda",
  OTHER: "Iné",
};

export const ZONE_AREA_LABELS = {
  LAWN: "Trávnik",
  BED: "Záhon",
  HEDGE: "Živý plot",
  OTHER: "Iné",
};

export const IRRIGATION_LABELS = {
  SPRINKLER: "Postrekovače",
  DRIP: "Kvapková závlaha",
};

export const REQUEST_TYPE_LABELS = {
  FAULT: "Porucha",
  SPRING_START: "Jarné spustenie",
  WINTERIZATION: "Zazimovanie",
  LAWN_CARE: "Starostlivosť o trávnik",
  INSTALLATION: "Inštalácia",
  INSPECTION: "Obhliadka",
  OTHER: "Iné",
};

export const REQUEST_STATUS_LABELS = {
  NEW: "Nová",
  SCHEDULED: "Naplánovaná",
  IN_PROGRESS: "V riešení",
  DONE: "Hotová",
  CLOSED: "Uzavretá",
  CANCELLED: "Zrušená",
};

export const PRIORITY_LABELS = {
  LOW: "Nízka",
  NORMAL: "Normálna",
  HIGH: "Vysoká",
  EMERGENCY: "Havária",
};

export const NOTIFICATION_LABELS = {
  REQUEST_RECEIVED: "Potvrdenie prijatia",
  REQUEST_DONE: "Oznámenie o vybavení",
  STAFF_NEW_REQUEST: "Upozornenie pre majiteľa",
};

export const NOTIFICATION_STATUS_LABELS = {
  PENDING: "čaká na odoslanie",
  SENT: "odoslané",
  FAILED: "zlyhalo",
  CANCELLED: "zrušené",
};

export const PAYLOAD_LABELS = {
  areaM2: "Plocha (m²)",
  lawnM2: "Trávnik (m²)",
  bedsM2: "Záhony (m²)",
  hedgeM: "Živý plot (m)",
  zones: "Odhad zón",
  priceFrom: "Cena od (€)",
  priceTo: "Cena do (€)",
  waterSource: "Zdroj vody",
  rainSensor: "Dažďový senzor",
  mobileControl: "Ovládanie z mobilu",
};

export const APPOINTMENT_STATUS_LABELS = {
  RESERVED: "Rezervácia (čas treba potvrdiť)",
  CONFIRMED: "Potvrdený",
  DONE: "Hotový",
  CANCELLED: "Zrušený",
};

export const WEEKDAY_LABELS = { 1: "Po", 2: "Ut", 3: "St", 4: "Št", 5: "Pi", 6: "So", 7: "Ne" };

export const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const AUDIT_ACTION_LABELS = {
  LOGIN: "Prihlásenie",
  LOGIN_FAILED: "Neúspešné prihlásenie",
  PASSWORD_CHANGED: "Zmena hesla",
  PASSWORD_RESET: "Nové dočasné heslo",
  PASSWORD_RESET_REQUESTED: "Žiadosť o obnovu hesla e-mailom",
  PASSWORD_RESET_BY_EMAIL: "Heslo obnovené cez e-mail",
  USER_CREATED: "Nový člen tímu",
  USER_UPDATED: "Úprava člena tímu",
  CUSTOMER_CREATED: "Nový zákazník",
  CUSTOMER_UPDATED: "Úprava zákazníka",
  CUSTOMER_DELETED: "Zmazaný zákazník",
  CUSTOMER_EXPORTED: "Export údajov zákazníka (GDPR)",
  GARDEN_CREATED: "Nová záhrada",
  GARDEN_UPDATED: "Úprava záhrady",
  GARDEN_DELETED: "Zmazaná záhrada",
  ZONE_CREATED: "Nová zóna",
  ZONE_UPDATED: "Úprava zóny",
  ZONE_DELETED: "Zmazaná zóna",
  PHOTOS_ADDED: "Pridané fotky",
  PHOTO_DELETED: "Zmazaná fotka",
  REQUEST_CREATED: "Nová požiadavka",
  REQUEST_UPDATED: "Úprava požiadavky",
  REQUEST_STATUS_CHANGED: "Zmena stavu požiadavky",
  APPOINTMENT_CREATED: "Nový termín",
  APPOINTMENT_UPDATED: "Úprava termínu",
  APPOINTMENT_CANCELLED: "Zrušený termín",
  DAY_CAPACITY_SET: "Nastavená kapacita dňa",
  DAY_CAPACITY_RESET: "Obnovená kapacita dňa",
  DAY_PLANNED: "Naplánovaný deň",
  SCHEDULE_SETTINGS_UPDATED: "Nastavenia plánovania",
  MATERIAL_CREATED: "Nový materiál",
  MATERIAL_UPDATED: "Úprava materiálu",
  MATERIAL_RECEIVED: "Príjem materiálu",
  TEMPLATE_SAVED: "Uložená šablóna materiálu",
  TEMPLATE_DELETED: "Zmazaná šablóna materiálu",
  VISIT_COMPLETED: "Dokončený výjazd",
  WORKLOG_CREATED: "Zápis do histórie",
  REMINDER_SETTINGS_UPDATED: "Nastavenia pripomienok",
  SEASONAL_CAMPAIGN_RUN: "Sezónna kampaň",
  DEVICE_CREATED: "Nové IoT zariadenie",
  DEVICE_DELETED: "Odstránené IoT zariadenie",
  DEVICE_TOKEN_REGENERATED: "Nový kľúč IoT zariadenia",
};

export const AUDIT_ENTITY_LABELS = {
  User: "Používateľ",
  Customer: "Zákazník",
  Garden: "Záhrada",
  Zone: "Zóna",
  Photo: "Fotka",
  ServiceRequest: "Požiadavka",
  Appointment: "Termín",
  DayCapacity: "Kapacita dňa",
  Setting: "Nastavenia",
  Material: "Materiál",
  MaterialTemplate: "Šablóna materiálu",
  WorkLog: "História",
  Device: "IoT zariadenie",
};

export const DEVICE_TYPE_LABELS = {
  HUMIDITY_SENSOR: "Senzor vlhkosti pôdy",
  WATER_LEVEL_SENSOR: "Hladina vody (studňa, nádrž)",
  TRIP_SENSOR: "Senzor úniku vody",
  SPRINKLER: "Postrekovač / ventil",
  MOWER: "Robotická kosačka",
  HOME_GATEWAY: "Brána (gateway)",
  OTHER: "Iné zariadenie",
};
