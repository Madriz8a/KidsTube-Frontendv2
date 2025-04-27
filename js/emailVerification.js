document.addEventListener('DOMContentLoaded', function() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const token = urlParams.get('token');
    
    // Verificar que existan los parámetros necesarios
    if (!id || !token) {
        showError('Enlace de verificación inválido o incompleto.');
        return;
    }
    
    // Realizar la verificación
    verifyEmail(id);
    
    /**
     * Función para verificar el email con el API
     * @param {string} userId - ID del usuario a verificar
     */
    async function verifyEmail(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/confirm?id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al verificar el correo electrónico');
            }
            
            // Mostrar mensaje de éxito
            loadingIndicator.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Opcional: Redirigir automáticamente después de un tiempo
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Ha ocurrido un error al verificar tu correo electrónico.');
        }
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    function showError(message) {
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
        errorText.textContent = message;
        
        // Si está disponible, usar el sistema de notificaciones
        if (window.Notifications && window.Notifications.showError) {
            window.Notifications.showError('verification_failed', 'Error de verificación');
        }
    }
});