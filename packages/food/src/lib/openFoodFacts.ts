import { parseOffProduct, type OffLookup } from "./nutrition";

/**
 * Open Food Facts asks every app to send a User-Agent «AppName/Version (ContactEmail)»
 * (https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-server/main/docs/api/index.md).
 * The repository is public, so a link to it stands in for an e-mail address.
 */
const USER_AGENT = "Ecosystem/1.0 (https://github.com/guyrichie156-lab/Ecosystem)";

/** EAN-8, UPC-A, EAN-13 and ITF-14 are 8 to 14 digits. */
export function isBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code);
}

/** Open Food Facts answered with an error status, e.g. 429 when more than 15 products were read in a minute. */
export class OffHttpError extends Error {
  constructor(readonly status: number) {
    super(`Open Food Facts answered ${status}`);
  }
}

/**
 * Looks a barcode up in Open Food Facts (database under ODbL). One request per scan; the API allows
 * 15 product reads a minute, counted per user for a phone app. Throws `OffHttpError` on an error
 * status, and a plain error when there is no connection.
 */
export async function lookUpBarcode(code: string): Promise<OffLookup> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}?fields=product_name,product_name_ru,brands,nutriments`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  // A product that isn't in the database comes back as 404 with status 0.
  if (response.status === 404) return { found: false };
  if (!response.ok) throw new OffHttpError(response.status);
  return parseOffProduct(await response.json());
}
