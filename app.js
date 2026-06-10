// configuracion

//const GOOGLE_CLIENT_ID = '824761200010-golr4lnu260ou3mbhvjj8udl8qcdvlr7.apps.googleusercontent.com';
//const NOMBRE_CARPETA   = 'Inscripciones 2026';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxkdGFo1l9n9v9V1Ef6M6YC5s_YJBdgCg9NINAHv_CtdnEIejyLGrBSKGr06NR1TgxDpQ/exec';
const PLANTILLA        = 'plantilla.docx';

let plantillaDocx = null;

// cargar la plantilla de word al iniciar la aplicacion
(async () => {
  try {
    const r = await fetch(PLANTILLA);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    plantillaDocx = await r.arrayBuffer();
  } catch (e) {
    console.warn('plantilla no cargada:', e.message);
  }
})();


// formato de cedula dominicana 
function formatearCedula(input) {

  let digits = input.value.replace(/\D/g, '').slice(0, 11);
  let result = digits;

  if (digits.length > 3)  result = digits.slice(0,3)  + '-' + digits.slice(3);
  if (digits.length > 10) result = digits.slice(0,3)  + '-' + digits.slice(3,10) + '-' + digits.slice(10);

  input.value = result;
}

// formato de telefono dominicano
function formatearTelefono(input) {
  let digits = input.value.replace(/\D/g, '').slice(0, 10);
  let result = digits;

  if (digits.length > 3) result = digits.slice(0,3) + '-' + digits.slice(3);
  if (digits.length > 6) result = digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);

  input.value = result;
}

// calcular edad a partir de fecha de nacimiento
function calcularEdad() {
  const fechaInput = document.getElementById('fecha_nacimiento').value;
  const edadInput  = document.getElementById('edad');

  if (!fechaInput) {
    edadInput.value = '';
    return;
  }

  const partes = fechaInput.split('/');

  if (partes.length !== 3) {
    edadInput.value = '';
    return;
  }

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const anio = parseInt(partes[2], 10);

  const nacimiento = new Date(anio, mes, dia);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  edadInput.value = edad >= 0 ? edad : '';
}

// autocompletado de correos con dominios comunes
const DOMINIOS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

  // funcion para cerrar sugerencias de correo
    function cerrarSugerencias(input, sugg) {
    sugg.classList.remove('visible');
    sugg.innerHTML = '';
    input._activeIndex = -1;
  }

function iniciarCorreoAutoComplete(inputId, suggId) {
  const input = document.getElementById(inputId);
  const sugg  = document.getElementById(suggId);
  if (!input || !sugg) return;

  input._activeIndex = -1;

  input.addEventListener('input', () => {
    const val = input.value;
    sugg.innerHTML = '';
    input._activeIndex = -1;

    // mostrar sugerencias solo cuando haya un @ o texto antes
    if (!val || val.includes('@')) {
      const atPos  = val.indexOf('@');
      const prefix = atPos >= 0 ? val.slice(0, atPos) : val;
      const typed  = atPos >= 0 ? val.slice(atPos)    : '';

      if (!prefix) { sugg.classList.remove('visible'); return; }

      const matches = DOMINIOS.filter(d => d.startsWith(typed) && d !== typed);
      if (!matches.length) { sugg.classList.remove('visible'); return; }

      matches.forEach((dominio, i) => {
        const item = document.createElement('div');
        item.className    = 'correo-sugg-item';
        item.textContent  = prefix + dominio;
        item.addEventListener('mousedown', e => {
          e.preventDefault();

          input.value = prefix + dominio;

          cerrarSugerencias(input, sugg);
        });
        sugg.appendChild(item);
      });

      sugg.classList.add('visible');
    } else {

      // sin @ todavia, mostrar todos los dominios como sugerencia
      const prefix = val;
      DOMINIOS.forEach(dominio => {
        const item = document.createElement('div');
        item.className   = 'correo-sugg-item';
        item.textContent = prefix + dominio;
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          input.value = prefix + dominio;
          sugg.classList.remove('visible');
        });
        sugg.appendChild(item);
      });
      sugg.classList.add('visible');
    }
  });

  // navegacion con teclado
  input.addEventListener('keydown', e => {
    const items = sugg.querySelectorAll('.correo-sugg-item');
    if (!items.length) return;


    if (e.key === 'ArrowDown') {
      e.preventDefault();
     input._activeIndex = Math.min(input._activeIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      input._activeIndex = Math.max(input._activeIndex - 1, 0);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (input._activeIndex >= 0) {
        e.preventDefault();
        input.value = items[input._activeIndex].textContent;
        cerrarSugerencias(input, sugg);
        return;
      }
    } else if (e.key === 'Escape') {
      sugg.classList.remove('visible');
      input._activeIndex = -1;
      return;
    }

    items.forEach((item, i) => item.classList.toggle('active', i === input._activeIndex));
    if (input._activeIndex >= 0) input.value = items[input._activeIndex].textContent;
  });

  // cerrar sugerencias al perder foco
  input.addEventListener('blur', () => {
    setTimeout(() => cerrarSugerencias(input, sugg), 150);
  });
}


// inicializacion de todos los inputs al cargar la pagina
document.addEventListener('DOMContentLoaded', () => {
  // cedulas
  ['cedula', 'padre_cedula', 'madre_cedula', 'tutor_cedula'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => formatearCedula(el));
  });

  // fechas
  const fecha = document.getElementById('fecha_nacimiento');

  if (fecha) {
    fecha.addEventListener('input', () => formatearFecha(fecha));
    fecha.addEventListener('input', calcularEdad);
  }

  // telefonos
  [
    'telefono_estudiante',
    'dir_telefono', 'dir_celular',
    'padre_tel_casa', 'padre_celular', 'padre_tel_trabajo',
    'madre_tel_casa', 'madre_celular', 'madre_tel_trabajo',
    'tutor_tel_casa', 'tutor_celular', 'tutor_tel_trabajo',
    'emerg_contacto_tel'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => formatearTelefono(el));
  });



  // correos
  iniciarCorreoAutoComplete('correo_estudiante', 'correo_estudiante_sugg');
  iniciarCorreoAutoComplete('padre_correo',      'padre_correo_sugg');
  iniciarCorreoAutoComplete('madre_correo',      'madre_correo_sugg');
  iniciarCorreoAutoComplete('tutor_correo',      'tutor_correo_sugg');

  document.getElementById('form-screen').style.display = 'block';
    document.getElementById('action-bar').style.display  = 'flex';

});


// autenticacion con Google y obtencion de carpeta en Drive
/*function signIn() {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file ' +
           'https://www.googleapis.com/auth/userinfo.profile',
    callback: async (response) => {
      if (response.error) { showToast('Error al iniciar sesión: ' + response.error, 'error'); return; }
      accessToken = response.access_token;

      try {
        const me = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + accessToken }
        }).then(r => r.json());
        document.getElementById('user-display').textContent = me.name || me.email || 'Usuario';
      } catch(_) {
        document.getElementById('user-display').textContent = 'Usuario Google';
      }

      document.getElementById('counter').textContent      = 'Guardados: ' + contadorLocal;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('form-screen').style.display  = 'block';
      document.getElementById('action-bar').style.display   = 'flex';

      carpetaId = await obtenerOCrearCarpeta(NOMBRE_CARPETA);
      showToast('✅ Sesión iniciada. Carpeta Drive lista.', 'success');
    }
  });
  client.requestAccessToken();
}*/

/*async function obtenerOCrearCarpeta(nombre) {
  const q   = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${nombre}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  ).then(r => r.json());

  if (res.files && res.files.length > 0) return res.files[0].id;

  const crear = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, mimeType: 'application/vnd.google-apps.folder' })
  }).then(r => r.json());

  return crear.id;
}*/


// subir el documento a google drive
/*async function subirADrive(blob, nombreArchivo) {
  // Convertir el blob a base64 para enviarlo al script
  const buffer     = await blob.arrayBuffer();
  const bytes      = new Uint8Array(buffer);
  const base64     = btoa(bytes.reduce((acc, b) => acc + String.fromCharCode(b), ''));

  const res = await fetch(SCRIPT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ nombreArchivo, archivo: base64 })
  });

  if (!res.ok) throw new Error('Error al contactar el script: HTTP ' + res.status);

  const json = await res.json();
  if (!json.exito) throw new Error(json.mensaje);
  return json;
}*/

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function subirADrive(blob, nombreArchivo) {
  const archivo = await blobToBase64(blob);

  const res = await fetch("/.netlify/functions/subir-drive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombreArchivo,
      archivo
    })
  });

  if (!res.ok) throw new Error("Error en Netlify Function");

  return await res.json();
}

// guardar y descargar documentos en la maquina
const val = id => { const e = document.getElementById(id); return e ? e.value || '' : ''; };
const chk = id => { const e = document.getElementById(id); return e && e.checked ? '☑' : '☐'; };

async function guardarYDescargar() {
  const primerNombre   = val('primer_nombre').trim();
  const primerApellido = val('primer_apellido').trim();

  if (!primerNombre || !primerApellido) { showToast('Ingresa al menos el nombre y apellido del estudiante.', 'error'); return; }
  // if (!accessToken)   { showToast('Sesión expirada. Recarga la página.', 'error'); return; }
  if (!plantillaDocx) { showToast('FICHA_Inscripcion.docx no encontrada en el servidor.', 'error'); return; }

  setBusy(true);
  showToast('Generando documento...', 'info');

  try {
    const hoy           = new Date();
    const fechaStr      = hoy.toLocaleDateString('es-DO', { day:'2-digit', month:'2-digit', year:'numeric' });
    const nombreArchivo = `${primerApellido}_${primerNombre}_${hoy.toISOString().slice(0,10)}.docx`;

    const datos = {
      grado: val('grado'),
      primer_nombre: primerNombre,           segundo_nombre: val('segundo_nombre'),
      primer_apellido: primerApellido,        segundo_apellido: val('segundo_apellido'),
      cedula: val('cedula'),                  fecha_nacimiento: val('fecha_nacimiento'),
      edad: val('edad'),                      sexo: val('sexo'),
      nacionalidad: val('nacionalidad'),      pasaporte: val('pasaporte'),
      telefono_estudiante: val('telefono_estudiante'), correo_estudiante: val('correo_estudiante'),
      acta_provincia: val('acta_provincia'),  acta_municipio: val('acta_municipio'),
      acta_oficialia: val('acta_oficialia'),  acta_libro: val('acta_libro'),
      acta_folio: val('acta_folio'),          acta_numero: val('acta_numero'),
      acta_anio: val('acta_anio'),
      dir_calle: val('dir_calle'),            dir_barrio: val('dir_barrio'),
      dir_provincia: val('dir_provincia'),    dir_municipio: val('dir_municipio'),
      dir_no_casa: val('dir_no_casa'),        dir_telefono: val('dir_telefono'),
      dir_celular: val('dir_celular'),
      padre_nombres: val('padre_nombres'),    padre_apellidos: val('padre_apellidos'),
      padre_cedula: val('padre_cedula'),      padre_nivel: val('padre_nivel'),
      padre_profesion: val('padre_profesion'), padre_direccion: val('padre_direccion'),
      padre_tel_casa: val('padre_tel_casa'),  padre_celular: val('padre_celular'),
      padre_tel_trabajo: val('padre_tel_trabajo'), padre_correo: val('padre_correo'),
      madre_nombres: val('madre_nombres'),    madre_apellidos: val('madre_apellidos'),
      madre_cedula: val('madre_cedula'),      madre_nivel: val('madre_nivel'),
      madre_profesion: val('madre_profesion'), madre_direccion: val('madre_direccion'),
      madre_tel_casa: val('madre_tel_casa'),  madre_celular: val('madre_celular'),
      madre_tel_trabajo: val('madre_tel_trabajo'), madre_correo: val('madre_correo'),
      tutor_nombres: val('tutor_nombres'),    tutor_parentesco: val('tutor_parentesco'),
      tutor_apellidos: val('tutor_apellidos'), tutor_cedula: val('tutor_cedula'),
      tutor_nivel: val('tutor_nivel'),        tutor_profesion: val('tutor_profesion'),
      tutor_direccion: val('tutor_direccion'), tutor_tel_casa: val('tutor_tel_casa'),
      tutor_celular: val('tutor_celular'),    tutor_tel_trabajo: val('tutor_tel_trabajo'),
      tutor_correo: val('tutor_correo'),
      enfermedad: val('enfermedad'),          vacunado: val('vacunado'),
      enf_alergia: chk('enf_alergia'),        enf_diabetes: chk('enf_diabetes'),
      enf_asma: chk('enf_asma'),              enf_hepatitis: chk('enf_hepatitis'),
      enf_otra: chk('enf_otra'),              enf_otra_desc: val('enf_otra_desc'),
      vac_antipolio: chk('vac_antipolio'),    vac_antisarampion: chk('vac_antisarampion'),
      vac_difteria1: chk('vac_difteria1'),    vac_difteria2: chk('vac_difteria2'),
      vac_difteria3: chk('vac_difteria3'),    vac_gripe: chk('vac_gripe'),
      vac_hepatitis: chk('vac_hepatitis'),    vac_meningitis: chk('vac_meningitis'),
      vac_tuberculosis: chk('vac_tuberculosis'), vac_covid_dosis: val('vac_covid_dosis'),
      emerg_enfermedad: val('emerg_enfermedad'),
      emerg_medicamentos: val('emerg_medicamentos'),
      emerg_contacto_nombre: val('emerg_contacto_nombre'),
      emerg_contacto_tel: val('emerg_contacto_tel'),
      emerg_contacto_parentesco: val('emerg_contacto_parentesco'),
      documentos_pendientes: val('documentos_pendientes'),
      observaciones: val('observaciones'),
      hermano_en_centro: val('hermano_en_centro') || 'No',
      fecha_inscripcion: fechaStr,
    };

    // Generar word con docxtemplater
    const zip         = new PizZip(plantillaDocx);
    const docTemplate = new docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      nullGetter:    () => '',      
      delimiters:    { start: '{{', end: '}}' }
    });
    docTemplate.setData(datos);
    docTemplate.render();
    const blob = docTemplate.getZip().generate({
      type:     'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // subir a Google Drive
    showToast('Subiendo a Google Drive...', 'info');
    await subirADrive(blob, nombreArchivo);

    // descargar localmente
    saveAs(blob, nombreArchivo);

    /*contadorLocal++;
    sessionStorage.setItem('cnt', contadorLocal);
    document.getElementById('counter').textContent = 'Guardados: ' + contadorLocal;*/

    showToast(`✅ "${nombreArchivo}" guardado en Drive y descargado.`, 'success');
    setTimeout(() => limpiarFormulario(), 3500);

  } catch (e) {
    showToast('Error: ' + e.message, 'error');
    console.error(e);
  } finally {
    setBusy(false);
  }
}


// limpiar formulario para nueva inscripcion
function limpiarFormulario() {
  document.querySelectorAll('#form-screen input:not([readonly]), #form-screen select, #form-screen textarea')
    .forEach(el => {
      if      (el.type === 'checkbox') el.checked = false;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else    el.value = '';
    });
  // restaurar valores por defecto
  document.getElementById('nacionalidad').value = 'Dominicana';
  document.getElementById('primer_nombre').focus();
  showToast('Formulario listo para el siguiente estudiante.', 'info');
}

// codigo de la ui
function setBusy(busy) {
  document.getElementById('btn-guardar').disabled     = busy;
  document.getElementById('spinner').style.display    = busy ? 'block' : 'none';
  document.getElementById('btn-text').textContent     = busy ? 'Procesando...' : '💾 Guardar en Drive y Descargar';
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = ''; }, 5000);
}

// funcion para formatear fecha
function formatearFecha(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);

  if (v.length >= 5) {
    input.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  } else if (v.length >= 3) {
    input.value = v.slice(0,2) + '/' + v.slice(2);
  } else {
    input.value = v;
  }
}