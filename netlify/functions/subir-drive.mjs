import { google } from "googleapis";
import { Readable } from "stream";

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token'
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('No se pudo obtener access token: ' + JSON.stringify(data));
  return data.access_token;
}

export const handler = async (event) => {
  console.log('=== FUNCIÓN INICIADA ===');
  console.log('Method:', event.httpMethod);
  console.log('Body tamaño:', event.body?.length);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }

  try {
    // 1. Parsear el body
    const { nombreArchivo, archivo } = JSON.parse(event.body);
    console.log('Archivo recibido:', nombreArchivo);

    // 2. Validar variables de entorno
    if (!process.env.GOOGLE_CLIENT_ID)     throw new Error('Variable GOOGLE_CLIENT_ID no definida');
    if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('Variable GOOGLE_CLIENT_SECRET no definida');
    if (!process.env.GOOGLE_REFRESH_TOKEN) throw new Error('Variable GOOGLE_REFRESH_TOKEN no definida');
    if (!process.env.DRIVE_FOLDER_ID)      throw new Error('Variable DRIVE_FOLDER_ID no definida');

    // 3. Obtener access token
    const accessToken = await getAccessToken();
    console.log('Access token obtenido OK');

    // 4. Convertir base64 a stream
    const buffer = Buffer.from(archivo, 'base64');
    const stream = Readable.from(buffer);

    // 5. Autenticar con Google usando el access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    // 6. Subir el archivo
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.create({
      requestBody: {
        name:     nombreArchivo,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        parents:  [process.env.DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body:     stream,
      },
    });

    console.log('Archivo subido, ID:', response.data.id);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, fileId: response.data.id }),
    };

  } catch (err) {
    console.log('ERROR:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};