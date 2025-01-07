import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Abrufen eines Secrets aus dem Google Cloud Secret Manager.
 * @param secretName - Der Name des Secrets (z. B. "FIREBASE_SERVICE_ACCOUNT").
 * @returns Der Inhalt des Secrets als JSON- oder String-Wert.
 */
export async function getSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();

  try {
    // Vollständiger Name des Secrets
    const [version] = await client.accessSecretVersion({
      name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });

    // Payload extrahieren
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Das Secret "${secretName}" ist leer oder nicht verfügbar.`);
    }

    return payload;
  } catch (error) {
    console.error(`Fehler beim Abrufen des Secrets "${secretName}":`, error);
    throw error;
  }
}
