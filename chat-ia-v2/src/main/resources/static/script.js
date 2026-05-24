// ===== Estado de la aplicación =====
let conversacionActivaId = null;

// ===== Referencias a elementos del DOM =====
const botonNueva = document.getElementById('boton-nueva');
const listaConversaciones = document.getElementById('lista-conversaciones');
const tituloConversacion = document.getElementById('titulo-conversacion');
const contenedorMensajes = document.getElementById('mensajes');
const formMensaje = document.getElementById('form-mensaje');
const inputMensaje = document.getElementById('input-mensaje');
const botonEnviar = document.getElementById('boton-enviar');
const buscador = document.getElementById('buscador');


// ===== Cargar conversaciones al iniciar =====
async function cargarConversaciones() {
    const respuesta = await fetch('/conversaciones');
    const conversaciones = await respuesta.json();

    listaConversaciones.innerHTML = '';
    for (const c of conversaciones) {
        anadirAlMenuLateral(c);
    }

    // Reaplicamos el filtro actual a la lista recién cargada
    buscador.dispatchEvent(new Event('input'));
}

// Añade un elemento <li> a la lista lateral
function anadirAlMenuLateral(conversacion) {
    const li = document.createElement('li');
    li.dataset.id = conversacion.id;

    const span = document.createElement('span');
    span.textContent = conversacion.nombre;
    span.className = 'nombre-conversacion';
    li.appendChild(span);

    // Botón de editar
    const botonEditar = document.createElement('button');
    botonEditar.className = 'boton-editar';
    botonEditar.textContent = '✎';
    botonEditar.title = 'Renombrar';
    botonEditar.addEventListener('click', (e) => {
        e.stopPropagation();
        renombrarConversacion(conversacion.id, conversacion.nombre);
    });
    li.appendChild(botonEditar);

    // Botón de borrar
    const botonBorrar = document.createElement('button');
    botonBorrar.className = 'boton-borrar';
    botonBorrar.textContent = '×';
    botonBorrar.title = 'Borrar';
    botonBorrar.addEventListener('click', (e) => {
        e.stopPropagation();
        borrarConversacion(conversacion.id);
    });
    li.appendChild(botonBorrar);

    li.addEventListener('click', () => seleccionarConversacion(conversacion.id));
    listaConversaciones.appendChild(li);
}


// ===== Crear nueva conversación =====
botonNueva.addEventListener('click', async () => {
    const nombre = await abrirModal({
        titulo: 'Nueva conversación',
        mensaje: '¿Cómo quieres llamarla?',
        conInput: true,
        placeholder: 'Ej: Ayuda con Java',
        textoAceptar: 'Crear'
    });
    if (!nombre) return;

    const respuesta = await fetch('/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    const nueva = await respuesta.json();

    anadirAlMenuLateral(nueva);
    seleccionarConversacion(nueva.id);
});


// ===== Seleccionar una conversación =====
async function seleccionarConversacion(id) {
    conversacionActivaId = id;

    // Marcar visualmente la activa en la lista
    document.querySelectorAll('#lista-conversaciones li').forEach(li => {
        li.classList.toggle('activa', li.dataset.id === id);
    });

    // Cargar los mensajes
    const respuesta = await fetch(`/conversaciones/${id}`);
    const conversacion = await respuesta.json();

    tituloConversacion.textContent = conversacion.nombre;
    contenedorMensajes.innerHTML = '';
    for (const m of conversacion.mensajes) {
        pintarMensaje(m.rol, m.texto);
    }

    // Habilitar la entrada de mensajes
    inputMensaje.disabled = false;
    botonEnviar.disabled = false;
    inputMensaje.focus();
}

// Pinta un mensaje en la zona central
function pintarMensaje(rol, texto) {
    const div = document.createElement('div');
    div.className = `mensaje ${rol}`;

    const autor = document.createElement('div');
    autor.className = 'autor';
    autor.textContent = rol === 'user' ? 'Tú' : 'Chat IA';
    div.appendChild(autor);

    const contenido = document.createElement('div');
    contenido.className = 'contenido';

    if (rol === 'model') {
        // Las respuestas de la IA las renderizamos como Markdown
        const html = marked.parse(texto);
        contenido.innerHTML = DOMPurify.sanitize(html);
    } else {
        // Los mensajes del usuario van como texto plano
        contenido.textContent = texto;
    }

    div.appendChild(contenido);

    contenedorMensajes.appendChild(div);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}


// Muestra los puntitos de "escribiendo..."
function mostrarIndicadorEscribiendo() {
    const div = document.createElement('div');
    div.className = 'mensaje model';
    div.id = 'indicador-escribiendo';

    const autor = document.createElement('div');
    autor.className = 'autor';
    autor.textContent = 'Chat IA';
    div.appendChild(autor);

    const contenido = document.createElement('div');
    contenido.className = 'contenido';
    contenido.innerHTML = '<div class="escribiendo"><span></span><span></span><span></span></div>';
    div.appendChild(contenido);

    contenedorMensajes.appendChild(div);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

// Quita los puntitos cuando llega la respuesta
function ocultarIndicadorEscribiendo() {
    const indicador = document.getElementById('indicador-escribiendo');
    if (indicador) indicador.remove();
}


// ===== Borrar una conversación =====
async function borrarConversacion(id) {
    const confirmado = await abrirModal({
        titulo: 'Borrar conversación',
        mensaje: 'Esta acción no se puede deshacer. ¿Quieres borrarla de todas formas?',
        textoAceptar: 'Borrar'
    });
    if (!confirmado) return;

    await fetch(`/conversaciones/${id}`, { method: 'DELETE' });

    if (conversacionActivaId === id) {
        conversacionActivaId = null;
        tituloConversacion.textContent = 'Selecciona o crea una conversación';
        contenedorMensajes.innerHTML = '';
        inputMensaje.disabled = true;
        botonEnviar.disabled = true;
    }

    cargarConversaciones();
}


// ===== Enviar un mensaje =====
formMensaje.addEventListener('submit', async (e) => {
    e.preventDefault();

    const texto = inputMensaje.value.trim();
    if (!texto || !conversacionActivaId) return;

    pintarMensaje('user', texto);
    inputMensaje.value = '';
    inputMensaje.disabled = true;
    botonEnviar.disabled = true;

    // ← Mostramos el indicador antes de la espera
    mostrarIndicadorEscribiendo();

    try {
        const respuesta = await fetch(`/conversaciones/${conversacionActivaId}/mensajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        const conversacionActualizada = await respuesta.json();

        // ← Lo quitamos justo antes de pintar la respuesta real
        ocultarIndicadorEscribiendo();

        const ultimoMensaje = conversacionActualizada.mensajes[conversacionActualizada.mensajes.length - 1];
        pintarMensaje(ultimoMensaje.rol, ultimoMensaje.texto);
    } catch (error) {
        // ← Y también lo quitamos si ha habido error
        ocultarIndicadorEscribiendo();
        pintarMensaje('model', '⚠ Error al obtener respuesta.');
    } finally {
        inputMensaje.disabled = false;
        botonEnviar.disabled = false;
        inputMensaje.focus();
    }
});


// ===== Permitir enviar con Enter (Shift+Enter para nueva línea) =====
inputMensaje.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        formMensaje.requestSubmit();
    }
});


// ===== Arrancar =====
cargarConversaciones();

// ===== Modal reutilizable =====
function abrirModal({ titulo, mensaje, conInput = false, placeholder = '', textoAceptar = 'Aceptar' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal');
        const modalTitulo = document.getElementById('modal-titulo');
        const modalMensaje = document.getElementById('modal-mensaje');
        const modalInput = document.getElementById('modal-input');
        const botonAceptar = document.getElementById('modal-aceptar');
        const botonCancelar = document.getElementById('modal-cancelar');

        // Configurar contenido
        modalTitulo.textContent = titulo;
        modalMensaje.textContent = mensaje;
        botonAceptar.textContent = textoAceptar;
        modalInput.value = '';
        modalInput.placeholder = placeholder;

        // Mostrar u ocultar el input según haga falta
        modalInput.classList.toggle('oculto', !conInput);

        // Mostrar el modal
        modal.classList.remove('oculto');

        // Si tiene input, ponemos foco en él
        if (conInput) {
            setTimeout(() => modalInput.focus(), 50);
        }

        // Función para cerrar y devolver resultado
        const cerrar = (resultado) => {
            modal.classList.add('oculto');
            botonAceptar.onclick = null;
            botonCancelar.onclick = null;
            modalInput.onkeydown = null;
            resolve(resultado);
        };

        botonAceptar.onclick = () => {
            if (conInput) {
                const valor = modalInput.value.trim();
                if (!valor) return;  // no aceptar vacío
                cerrar(valor);
            } else {
                cerrar(true);
            }
        };

        botonCancelar.onclick = () => cerrar(null);

        // Permitir Enter en el input
        modalInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                botonAceptar.click();
            } else if (e.key === 'Escape') {
                botonCancelar.click();
            }
        };
    });
}

// ===== Renombrar una conversación =====
async function renombrarConversacion(id, nombreActual) {
    const nuevoNombre = await abrirModal({
        titulo: 'Renombrar conversación',
        mensaje: 'Escribe el nuevo nombre:',
        conInput: true,
        placeholder: nombreActual,
        textoAceptar: 'Guardar'
    });
    if (!nuevoNombre || nuevoNombre === nombreActual) return;

    await fetch(`/conversaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre })
    });

    // Recargamos la lista para reflejar el nuevo nombre
    cargarConversaciones();

    // Si la renombrada es la activa, actualizamos también el título de arriba
    if (conversacionActivaId === id) {
        tituloConversacion.textContent = nuevoNombre;
    }
}


// ===== Filtrado de conversaciones =====
buscador.addEventListener('input', () => {
    const filtro = buscador.value.toLowerCase().trim();
    const items = listaConversaciones.querySelectorAll('li');

    for (const li of items) {
        const nombre = li.querySelector('.nombre-conversacion').textContent.toLowerCase();
        const coincide = nombre.includes(filtro);
        li.classList.toggle('oculto', !coincide);
    }
});