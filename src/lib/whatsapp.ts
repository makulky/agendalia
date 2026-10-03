// Prefijo que se añade a los teléfonos guardados sin código de país (España)
const DEFAULT_COUNTRY_CODE = "34";

// Convierte un teléfono tal como lo escribe el usuario al formato de wa.me (solo dígitos,
// con código de país). Devuelve null si no parece un número válido.
export function toWhatsAppNumber(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) {
    // ya trae código de país
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.length === 9) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsAppLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
