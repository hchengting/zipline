import { db } from '@/lib/db';
import { urls, files } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CHARSET_LENGTH = CHARSET.length;
const MAX = 256 - (256 % CHARSET_LENGTH);

function getRandomValues(array: Uint8Array) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // TODO: remove any cast when the types are fixed...
    return crypto.getRandomValues(<any>array);
  } else {
    console.error(
      'No secure random number generator available. Please use node@22+ and a supported platform.',
    );

    process.exit(1);
  }
}

export function randomCharacters(length: number) {
  const randomValues = new Uint8Array(Math.ceil(length * 1.5));
  let result = '';

  while (result.length < length) {
    getRandomValues(randomValues);
    for (let i = 0; i !== randomValues.length && result.length !== length; ++i) {
      const value = randomValues[i];
      if (value < MAX) {
        result += CHARSET[value % CHARSET_LENGTH];
      }
    }
  }

  return result;
}

export function randomIndex(length: number) {
  const randomValues = new Uint8Array(1);
  getRandomValues(randomValues);

  return randomValues[0] % length;
}

export async function generateUID(length: number) {
  while (true) {
    const id = randomCharacters(length);

    const [url] = await db
      .select({ id: urls.id })
      .from(urls)
      .where(or(eq(urls.code, id), eq(urls.vanity, id)))
      .limit(1);
    if (url) continue;

    const [file] = await db.select({ id: files.id }).from(files).where(eq(files.name, id)).limit(1);
    if (file) continue;

    return id;
  }
}
