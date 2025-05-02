document.addEventListener('DOMContentLoaded', function() {
    const completeProfileForm = document.getElementById('completeProfileForm');
    const phoneInput = document.getElementById('phone');
    const countryInput = document.getElementById('country');
    const birthdateInput = document.getElementById('birthdate');
    const pinInput = document.getElementById('pin');
    
    // Obtener el token del hash fragment o URL parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const urlParams = new URLSearchParams(window.location.search);
    const hashToken = hashParams.get('token');
    const queryToken = urlParams.get('token');
    
    // Decidir qué token usar (prioridad al hash fragment)
    let token = hashToken || queryToken;
    
    console.log('Comprobando token en fragmento de hash o parámetros URL...');
    
    // Si no hay token, intentar obtenerlo de localStorage como respaldo
    if (!token) {
        token = localStorage.getItem('token');
        console.log('No se encontró token en URL, usando token de localStorage.');
    }
    
    // Si todavía no hay token, redirigir a la página de login
    if (!token) {
        console.error('No se encontró token en el hash fragment ni en localStorage');
        window.location.href = 'login.html#error=missing_token';
        return;
    }
    
    // Guardar el token en localStorage para usar en las peticiones
    localStorage.setItem('token', token);
    console.log('Token guardado en localStorage');
    
    // Limpiar hash fragment y URL parameters para mayor seguridad
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Configurar validaciones en tiempo real
    setupValidations();
    
    // Manejar envío del formulario
    completeProfileForm.addEventListener('submit', handleFormSubmit);
    
    /**
     * Configura las validaciones en tiempo real
     */
    function setupValidations() {
        // Validación de teléfono
        phoneInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else if (!window.Notifications.validatePhone(this.value)) {
                window.Notifications.showFieldError(this, 'validation_phone_format');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        // Validación de país
        countryInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        // Validación de fecha de nacimiento
        birthdateInput.addEventListener('blur', function() {
            if (this.value === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else {
                // Validar que el usuario sea mayor de 18 años
                const birthdate = new Date(this.value);
                const today = new Date();
                let age = today.getFullYear() - birthdate.getFullYear();
                const monthDiff = today.getMonth() - birthdate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                    age--;
                }
                
                if (age < 18) {
                    window.Notifications.showFieldError(this, 'validation_age_requirement');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            }
        });
        
        // Validación de PIN
        pinInput.addEventListener('input', function() {
            // Permitir solo números
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a 6 dígitos
            if (this.value.length > 6) {
                this.value = this.value.slice(0, 6);
            }
        });
        
        pinInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else if (this.value.length !== 6) {
                window.Notifications.showFieldError(this, 'validation_pin_format');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
    }
    
    /**
     * Maneja el envío del formulario
     * @param {Event} e - Evento de submit
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }
        
        // Activar estado de carga
        window.Notifications.toggleFormLoading(completeProfileForm, true, 'Completando perfil...');
        
        try {
            // Preparar datos del perfil
            const profileData = {
                phone_number: phoneInput.value.trim(),
                country: countryInput.value.trim(),
                birthdate: birthdateInput.value,
                pin: pinInput.value.trim()
            };
            
            // Enviar solicitud para completar el perfil
            const response = await fetch('http://localhost:3000/api/auth/complete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al completar el perfil');
            }
            
            // Guardar el PIN de administrador
            localStorage.setItem('adminPin', pinInput.value.trim());
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('profile_complete_success');
            
            // Guardar token temporal y teléfono en sessionStorage para verificación SMS
            if (data.tempToken) {
                // Este es el flujo esperado donde después de completar el perfil
                // se requiere verificación SMS
                sessionStorage.setItem('tempToken', data.tempToken);
                if (data.phone) {
                    sessionStorage.setItem('phoneNumber', data.phone);
                }
                
                // Redireccionar a la página de verificación SMS después de un breve retraso
                setTimeout(() => {
                    window.location.href = 'smsVerification.html';
                }, 1500);
            } else if (data.token) {
                // En caso que la API cambie y devuelva directamente un token completo
                // (aunque esto no debería ocurrir según el diseño actual)
                localStorage.setItem('token', data.token);
                
                // Redireccionar a la página de selección de perfiles después de un breve retraso
                setTimeout(() => {
                    window.location.href = '../users/profileSelection.html';
                }, 1500);
            } else {
                // Si no recibimos token ni tempToken, algo está mal
                throw new Error('Respuesta inesperada del servidor');
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(completeProfileForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('profile_complete_failed');
        }
    }
    
    /**
     * Valida el formulario antes de enviarlo
     * @returns {boolean} - True si el formulario es válido, false en caso contrario
     */
    function validateForm() {
        let isValid = true;
        
        // Validar teléfono
        if (phoneInput.value.trim() === '') {
            window.Notifications.showFieldError(phoneInput, 'validation_required');
            isValid = false;
        } else if (!window.Notifications.validatePhone(phoneInput.value)) {
            window.Notifications.showFieldError(phoneInput, 'validation_phone_format');
            isValid = false;
        }
        
        // Validar país
        if (countryInput.value.trim() === '') {
            window.Notifications.showFieldError(countryInput, 'validation_required');
            isValid = false;
        }
        
        // Validar fecha de nacimiento
        if (birthdateInput.value === '') {
            window.Notifications.showFieldError(birthdateInput, 'validation_required');
            isValid = false;
        } else {
            // Validar que el usuario sea mayor de 18 años
            const birthdate = new Date(birthdateInput.value);
            const today = new Date();
            let age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                window.Notifications.showFieldError(birthdateInput, 'validation_age_requirement');
                isValid = false;
            }
        }
        
        // Validar PIN
        if (pinInput.value.trim() === '') {
            window.Notifications.showFieldError(pinInput, 'validation_required');
            isValid = false;
        } else if (pinInput.value.length !== 6) {
            window.Notifications.showFieldError(pinInput, 'validation_pin_format');
            isValid = false;
        }
        
        return isValid;
    }
});