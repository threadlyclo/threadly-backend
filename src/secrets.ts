// src/secrets.ts

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Ruft den Inhalt eines Secrets aus dem Secret Manager ab.
 * @param secretName - Name des Secrets (z.B. "OPENAI_API_KEY")
 * @returns Promise mit dem Secret-Inhalt (string)
 */
export async function getSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID ist nicht gesetzt. Bitte Umgebungsvariable definieren!');
  }

  // Pfad zum Secret (z.B. "projects/my-project-id/secrets/OPENAI_API_KEY/versions/latest")
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret "${secretName}" ist leer oder nicht verfügbar.`);
    }
    return payload;
  } catch (error) {
    console.error(`Fehler beim Abrufen von Secret "${secretName}":`, error);
    throw error;
  }
}
