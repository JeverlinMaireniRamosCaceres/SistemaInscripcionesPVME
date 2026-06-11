import { Dropbox } from "dropbox";

export const handler = async (event) => {
  console.log('=== FUNCIÓN INICIADA (DROPBOX) ===');
  console.log('Method:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // 1. Parsear el archivo del formulario
    const { nombreArchivo, archivo } = JSON.parse(event.body);
    console.log('Archivo recibido para Dropbox:', nombreArchivo);

    // 2. Validar que las credenciales estén cargadas
    if (!process.env.DROPBOX_REFRESH_TOKEN) throw new Error('Variable DROPBOX_REFRESH_TOKEN no definida');
    if (!process.env.DROPBOX_APP_KEY)       throw new Error('Variable DROPBOX_APP_KEY no definida');
    if (!process.env.DROPBOX_APP_SECRET)    throw new Error('Variable DROPBOX_APP_SECRET no definida');

    // 3. Conectar a la API con renovación de token automática
    const dbx = new Dropbox({
      clientId: process.env.DROPBOX_APP_KEY,
      clientSecret: process.env.DROPBOX_APP_SECRET,
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN
    });

    // 4. Convertir la cadena Base64 a un Buffer binario nativo
    const bufferArchivo = Buffer.from(archivo, 'base64');

    console.log('Enviando binario a la carpeta de Dropbox...');

    // 5. Subir el archivo (Se guardará directamente en la raíz de tu carpeta de la app)
    const response = await dbx.filesUpload({
      path: `/${nombreArchivo}`,
      contents: bufferArchivo,
      mode: { '.tag': 'overwrite' },
      autorename: true,
      mute: false
    });

    console.log('¡ÉXITO ROTUNDO! Guardado en Dropbox:', response.result.path_display);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, path: response.result.path_display }),
    };

  } catch (err) {
    console.log('ERROR CRÍTICO EN DROPBOX:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};