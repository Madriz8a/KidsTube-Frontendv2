const errorMessages = {
    // Errores de autenticación
    'auth_invalid_credentials': 'El correo electrónico o la contraseña son incorrectos.',
    'auth_user_not_found': 'No existe una cuenta con este correo electrónico.',
    'auth_email_exists': 'Ya existe una cuenta con este correo electrónico.',
    'auth_account_locked': 'Tu cuenta ha sido bloqueada temporalmente. Por favor, intenta más tarde.',
    'auth_not_authenticated': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    
    // Errores de validación de formularios
    'validation_required': 'Este campo es obligatorio.',
    'validation_email': 'Por favor, introduce un correo electrónico válido.',
    'validation_password_length': 'La contraseña debe tener al menos 8 caracteres.',
    'validation_password_match': 'Las contraseñas no coinciden.',
    'validation_pin_format': 'El PIN debe tener 6 dígitos numéricos.',
    'validation_phone_format': 'Por favor, introduce un número de teléfono válido.',
    'validation_url_format': 'Por favor, introduce una URL válida.',
    'validation_youtube_url': 'Por favor, introduce una URL válida de YouTube.',
    
    // Errores de perfiles
    'profile_not_found': 'El perfil no se ha encontrado.',
    'profile_create_failed': 'No se pudo crear el perfil. Por favor, inténtalo de nuevo.',
    'profile_update_failed': 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.',
    'profile_delete_failed': 'No se pudo eliminar el perfil. Por favor, inténtalo de nuevo.',
    'profile_pin_incorrect': 'El PIN introducido es incorrecto.',
    
    // Errores de playlists
    'playlist_not_found': 'La playlist no se ha encontrado.',
    'playlist_create_failed': 'No se pudo crear la playlist. Por favor, inténtalo de nuevo.',
    'playlist_update_failed': 'No se pudo actualizar la playlist. Por favor, inténtalo de nuevo.',
    'playlist_delete_failed': 'No se pudo eliminar la playlist. Por favor, inténtalo de nuevo.',
    
    // Errores de videos
    'video_not_found': 'El video no se ha encontrado.',
    'video_create_failed': 'No se pudo añadir el video. Por favor, inténtalo de nuevo.',
    'video_update_failed': 'No se pudo actualizar el video. Por favor, inténtalo de nuevo.',
    'video_delete_failed': 'No se pudo eliminar el video. Por favor, inténtalo de nuevo.',
    'video_invalid_url': 'La URL del video no es válida o no es compatible.',
    
    // Errores genéricos
    'server_error': 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.',
    'network_error': 'Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.',
    'unknown_error': 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    'timeout_error': 'La solicitud ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.'
};

// Diccionario de mensajes de éxito
const successMessages = {
    // Autenticación
    'auth_login_success': 'Has iniciado sesión correctamente.',
    'auth_register_success': 'Registro exitoso. Bienvenido/a a KidsTube.',
    'auth_logout_success': 'Has cerrado sesión correctamente.',
    
    // Perfiles
    'profile_create_success': 'Perfil creado correctamente.',
    'profile_update_success': 'Perfil actualizado correctamente.',
    'profile_delete_success': 'Perfil eliminado correctamente.',
    
    // Playlists
    'playlist_create_success': 'Playlist creada correctamente.',
    'playlist_update_success': 'Playlist actualizada correctamente.',
    'playlist_delete_success': 'Playlist eliminada correctamente.',
    
    // Videos
    'video_add_success': 'Video añadido correctamente.',
    'video_update_success': 'Video actualizado correctamente.',
    'video_delete_success': 'Video eliminado correctamente.',
    
    // General
    'save_success': 'Cambios guardados correctamente.',
    'operation_success': 'Operación completada con éxito.'
};

/**
 * Muestra una notificación utilizando Bootstrap Toast
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duración en milisegundos antes de que la notificación se cierre
 */
function showNotification(title, message, type = 'info', duration = 5000) {
    const notificationEl = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notificationEl && notificationTitle && notificationMessage) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // Remover clases previas
        notificationEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
        
        // Aplicar clase según el tipo
        switch (type) {
            case 'success':
                notificationEl.classList.add('bg-success', 'text-white');
                break;
            case 'error':
                notificationEl.classList.add('bg-danger', 'text-white');
                break;
            case 'warning':
                notificationEl.classList.add('bg-warning', 'text-dark');
                break;
            case 'info':
            default:
                notificationEl.classList.add('bg-info', 'text-white');
                break;
        }
        
        // Mostrar la notificación
        const toast = new bootstrap.Toast(notificationEl, {
            delay: duration,
            autohide: true
        });
        toast.show();
    } else {
        // Fallback si los elementos no existen
        alert(`${title}: ${message}`);
    }
}

/**
 * Muestra un mensaje de éxito utilizando un mensaje predefinido
 * @param {string} messageKey - Clave del mensaje de éxito
 * @param {string} customTitle - Título personalizado opcional
 */
function showSuccessMessage(messageKey, customTitle = '¡Éxito!') {
    const message = successMessages[messageKey] || 'Operación completada con éxito.';
    showNotification(customTitle, message, 'success');
}

/**
 * Muestra un mensaje de error utilizando un mensaje predefinido
 * @param {string} messageKey - Clave del mensaje de error
 * @param {string} customTitle - Título personalizado opcional
 */
function showErrorMessage(messageKey, customTitle = 'Error') {
    const message = errorMessages[messageKey] || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
    showNotification(customTitle, message, 'error');
}

/**
 * Mapea un error de la API a un mensaje de error del frontend
 * @param {string} apiError - Mensaje de error de la API o código de error
 * @returns {string} - Clave del mensaje de error del frontend
 */
function mapApiErrorToFrontend(apiError) {
    if (!apiError) return 'unknown_error';
    
    const errorText = typeof apiError === 'string' ? apiError.toLowerCase() : '';
    
    // Errores de autenticación
    if (errorText.includes('invalid credentials') || errorText.includes('incorrect password')) {
        return 'auth_invalid_credentials';
    } else if (errorText.includes('user not found') || errorText.includes('no user')) {
        return 'auth_user_not_found';
    } else if (errorText.includes('already exists') || errorText.includes('duplicate')) {
        return 'auth_email_exists';
    } else if (errorText.includes('not authenticated') || errorText.includes('token expired')) {
        return 'auth_not_authenticated';
    }
    
    // Errores del servidor
    else if (errorText.includes('server error') || errorText.includes('internal error')) {
        return 'server_error';
    } else if (errorText.includes('timeout') || errorText.includes('timed out')) {
        return 'timeout_error';
    } else if (errorText.includes('network') || errorText.includes('connection')) {
        return 'network_error';
    }
    
    // Por defecto
    return 'unknown_error';
}

/**
 * Muestra un mensaje de error para un error de la API
 * @param {string} apiError - Mensaje de error de la API
 * @param {string} fallbackKey - Clave de mensaje de error fallback
 */
function showApiErrorMessage(apiError, fallbackKey = 'unknown_error') {
    const errorKey = mapApiErrorToFrontend(apiError);
    showErrorMessage(errorKey || fallbackKey);
}

/**
 * Añade un mensaje de error a un campo de formulario
 * @param {HTMLElement} inputElement - Elemento input del formulario
 * @param {string} messageKey - Clave del mensaje de error
 */
function showFieldError(inputElement, messageKey) {
    // Obtener el mensaje de error
    const errorMessage = errorMessages[messageKey] || 'Campo inválido';
    
    // Añadir clase de error al input
    inputElement.classList.add('is-invalid');
    
    // Buscar si ya existe un elemento de feedback
    let feedbackElement = inputElement.parentNode.querySelector('.invalid-feedback');
    
    // Si no existe, crear uno nuevo
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.className = 'invalid-feedback';
        
        // Añadir después del input o al final del contenedor
        if (inputElement.nextElementSibling) {
            inputElement.parentNode.insertBefore(feedbackElement, inputElement.nextElementSibling);
        } else {
            inputElement.parentNode.appendChild(feedbackElement);
        }
    }
    
    // Establecer el mensaje de error
    feedbackElement.textContent = errorMessage;
}

/**
 * Elimina el estado de error de un campo de formulario
 * @param {HTMLElement} inputElement - Elemento input del formulario
 */
function clearFieldError(inputElement) {
    inputElement.classList.remove('is-invalid');
}

/**
 * Cambia el estado de carga de un formulario
 * @param {HTMLFormElement} form - Elemento del formulario
 * @param {boolean} isLoading - Estado de carga
 * @param {string} loadingText - Texto a mostrar durante la carga
 */
function toggleFormLoading(form, isLoading, loadingText = 'Procesando...') {
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!submitButton) return;
    
    if (isLoading) {
        // Guardar texto original
        if (!submitButton.dataset.originalText) {
            submitButton.dataset.originalText = submitButton.innerHTML;
        }
        
        // Mostrar estado de carga
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${loadingText}`;
        
        // Deshabilitar todos los campos del formulario
        Array.from(form.elements).forEach(element => {
            if (element !== submitButton && element.tagName !== 'BUTTON') {
                element.disabled = true;
            }
        });
    } else {
        // Restaurar estado original
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.originalText || 'Enviar';
        
        // Habilitar todos los campos del formulario
        Array.from(form.elements).forEach(element => {
            if (element !== submitButton && element.tagName !== 'BUTTON') {
                element.disabled = false;
            }
        });
    }
}

/**
 * Valida un campo de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si el email es válido
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Valida una URL de YouTube
 * @param {string} url - URL a validar
 * @returns {boolean} - True si la URL es válida
 */
function validateYouTubeUrl(url) {
    const re = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return re.test(url);
}

/**
 * Valida un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {boolean} - True si el número es válido
 */
function validatePhone(phone) {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(phone);
}

/**
 * Valida un PIN (6 dígitos)
 * @param {string} pin - PIN a validar
 * @returns {boolean} - True si el PIN es válido
 */
function validatePin(pin) {
    const re = /^[0-9]{6}$/;
    return re.test(pin);
}

// Exportar funciones para uso global
window.Notifications = {
    show: showNotification,
    showSuccess: showSuccessMessage,
    showError: showErrorMessage,
    showApiError: showApiErrorMessage,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    toggleFormLoading: toggleFormLoading,
    validateEmail: validateEmail,
    validateYouTubeUrl: validateYouTubeUrl,
    validatePhone: validatePhone,
    validatePin: validatePin,
    errorMessages: errorMessages,
    successMessages: successMessages
};