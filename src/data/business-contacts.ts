/**
 * @description Defines source-controlled contact details retained for ownership and publication decisions.
 * @remarks Identifiers and operating-base associations are internal metadata and must not be presented as customer-facing copy.
 */
export const BUSINESS_CONTACTS = {
  captainNutsFather: {
    id: 'captain-nuts-father',
    operatingBaseId: 'villa-constitucion',
    operatingBaseLabel: 'Villa Constitución, Santa Fe',
    displayNumber: '+54 9 3400 441365',
    telephoneUri: 'tel:+5493400441365',
    whatsappUrl: 'https://wa.me/5493400441365',
    status: 'used',
  },
  bqRinconNeuquen: {
    id: 'bq-rincon-neuquen',
    operatingBaseId: 'rincon-de-los-sauces',
    operatingBaseLabel: 'Rincón de los Sauces, Neuquén',
    displayNumber: '+54 9 299 615-7699',
    telephoneUri: 'tel:+5492996157699',
    whatsappUrl: 'https://wa.me/5492996157699',
    status: 'used',
  },
  captainNuts: {
    id: 'captain-nuts',
    operatingBaseId: null,
    operatingBaseLabel: null,
    displayNumber: '+54 9 3400 415140',
    telephoneUri: 'tel:+5493400415140',
    whatsappUrl: 'https://wa.me/5493400415140',
    status: 'unused',
  },
} as const;

/**
 * @description Identifies the approved primary WhatsApp destination used by conversion actions.
 */
export const PRIMARY_WHATSAPP_CONTACT = BUSINESS_CONTACTS.bqRinconNeuquen;
