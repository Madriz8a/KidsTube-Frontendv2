document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos DOM
    const phoneDisplay = document.getElementById('phoneDisplay');
    const verificationForm = document.getElementById('smsVerificationForm');
    const verificationCode = document.getElementById('verificationCode');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const countdownTimer = document.getElementById('countdownTimer');
    const countdownValue = document.getElementById('countdownValue');
    
    // Verificar el hash fragment para tokens desde Google auth
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashToken = hashParams.get('token');
    const hashPhone = hashParams.get('phone');
    
    if (hashToken) {
        // Guardar token en sessionStorage
        sessionStorage.setItem('tempToken', hashToken);
        console.log('Token encontrado en hash fragment y guardado');
        
        // Limpiar hash fragment
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    if (hashPhone) {
        // Guardar número de teléfono en sessionStorage
        sessionStorage.setItem('phoneNumber', hashPhone);
    }
    
    // Obtener datos de la sesión
    const tempToken = sessionStorage.getItem('tempToken');
    const phoneNumber = sessionStorage.getItem('phoneNumber');
    
    // Si no hay token temporal, redireccionar al login
    if (!tempToken) {
        console.error('No se encontró token temporal en sessionStorage');
        window.location.href = 'login.html#error=missing_temp_token';
        return;
    }
    
    // Mostrar los últimos 4 dígitos del número de teléfono
    if (phoneNumber) {
        phoneDisplay.textContent = '********' + phoneNumber;
    } else {
        phoneDisplay.textContent = '**** *** ****';
        console.warn('No se encontró el número de teléfono para mostrar');
    }
    
    // Iniciar contador para reenvío
    initCountdown();
    
    // Solo permitir números en el campo de código
    verificationCode.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    // Manejar el envío del formulario
    verificationForm.addEventListener('submit', handleFormSubmit);
    
    // Evento para reenviar código
    resendCodeBtn.addEventListener('click', handleResendCode);

    /**
     * Inicializa el contador para reenvío de código
     */
    function initCountdown() {
        let countdown = 60;
        resendCodeBtn.disabled = true;
        countdownTimer.style.display = 'block';
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownValue.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                countdownTimer.style.display = 'none';
                resendCodeBtn.disabled = false;
            }
        }, 1000);
    }

    /**
     * Maneja el envío del formulario de verificación
     * @param {Event} e - Evento de submit
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar código
        const code = verificationCode.value.trim();
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            window.Notifications.showFieldError(verificationCode, 'validation_code_format');
            return;
        }
        
        // Activar estado de carga
        window.Notifications.toggleFormLoading(verificationForm, true, 'Verificando código...');
        
        try {
            // Obtener el token temporal de sessionStorage
            const tempToken = sessionStorage.getItem('tempToken');
            
            // Enviar solicitud de verificación
            const response = await fetch('http://localhost:3000/api/session/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tempToken: tempToken,
                    code: code
                })
            });
            
            // Intenta parsear la respuesta como JSON
            let data;
            try {
                data = await response.json();
            } catch (err) {
                console.error('Error al parsear respuesta JSON:', err);
                throw new Error('Error en formato de respuesta del servidor');
            }
            
            // Verificar si la respuesta fue exitosa
            if (!response.ok) {
                console.error('Error en verificación:', response.status, data);
                throw new Error(data.error || 'Error en la verificación');
            }
            
            console.log('Verificación exitosa, token recibido');
            
            // Guardar el token JWT en localStorage
            localStorage.setItem('token', data.token);
            
            // CAMBIO: Guardar el PIN de administrador si está en la respuesta
            if (data.pin) {
                localStorage.setItem('adminPin', data.pin);
            }
            
            // Obtener información del usuario desde el token
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            
            // Guardar datos relevantes
            localStorage.setItem('adminId', payload.id);
            if (payload.name) {
                localStorage.setItem('userName', payload.name);
            } else if (payload.email) {
                localStorage.setItem('userName', payload.email);
            }
            
            // Limpiar datos temporales
            sessionStorage.removeItem('tempToken');
            sessionStorage.removeItem('phoneNumber');
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('auth_login_success', '¡Verificación exitosa!');
            
            // Redireccionar después de un breve retraso
            setTimeout(() => {
                window.location.href = '../users/profileSelection.html';
            }, 1000);
            
        } catch (error) {
            console.error('Error en verificación SMS:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(verificationForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('verification_failed', 'Código incorrecto o expirado');
        }
    }

    /**
     * Maneja la solicitud de reenvío de código
     */
    async function handleResendCode() {
        try {
            // Desactivar botón y mostrar estado de carga
            resendCodeBtn.disabled = true;
            resendCodeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
            
            // Obtener el token temporal de sessionStorage
            const token = sessionStorage.getItem('tempToken');
            
            // Solicitar reenvío
            const response = await fetch('http://localhost:3000/api/session/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al reenviar el código');
            }
            
            // Si recibimos un nuevo phone number, actualizarlo
            if (data.phone) {
                sessionStorage.setItem('phoneNumber', data.phone);
                phoneDisplay.textContent = '********' + data.phone;
            }
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('code_resent', 'Código reenviado');
            
            // Restaurar botón y reiniciar contador
            resendCodeBtn.innerHTML = 'Reenviar código';
            resendCodeBtn.disabled = true;
            countdownTimer.style.display = 'block';
            
            // Reiniciar el contador
            initCountdown();
            
        } catch (error) {
            console.error('Error al reenviar código:', error);
            resendCodeBtn.innerHTML = 'Reenviar código';
            resendCodeBtn.disabled = false;
            window.Notifications.showError('code_resend_failed', 'Error al reenviar el código');
        }
    }
});