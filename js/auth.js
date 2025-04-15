const API_URL = 'http://localhost:3000/api';

// Guardar datos del usuario en localStorage
function saveAuthData(payload, token, adminPin) {
    localStorage.setItem('token', token);
    localStorage.setItem('adminId', payload.id);
    
    if (payload.name) {
        localStorage.setItem('userName', payload.name);
    } else if (payload.email) {
        localStorage.setItem('userName', payload.email);
    }
    
    // Guardamos el PIN del administrador para verificación futura
    if (adminPin) {
        localStorage.setItem('adminPin', adminPin);
    }
}

// Obtener token desde localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Obtener ID del administrador
function getAdminId() {
    return localStorage.getItem('adminId');
}

function isAuthenticated() {
    return !!getToken();
}

// Función para cerrar sesión
async function logout() {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        const response = await fetch(`${API_URL}/session`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Error al cerrar sesión en API pero continuamos con cierre local');
        }

        // Siempre limpiar localStorage y redirigir independientemente de la respuesta del API
        localStorage.removeItem('token');
        localStorage.removeItem('adminId');
        localStorage.removeItem('userName');
        localStorage.removeItem('profilePin');
        localStorage.removeItem('adminPin'); 
        
        // Mensaje de éxito antes de redirigir
        if (window.Notifications) {
            window.Notifications.showSuccess('auth_logout_success', 'Sesión cerrada');
        }
        
        setTimeout(() => {
            window.location.href = '../shared/login.html';
        }, 1000);
    } catch (error) {
        console.error('Error en logout:', error);
        // Incluso si hay un error, limpiamos el almacenamiento local
        localStorage.removeItem('token');
        localStorage.removeItem('adminId');
        localStorage.removeItem('userName');
        localStorage.removeItem('profilePin');
        localStorage.removeItem('adminPin');
        
        window.location.href = '../shared/login.html';
    }
}

// Verificar si el usuario tiene permisos para acceder a una página
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../shared/login.html';
        return false;
    }
    return true;
}

function updateUserUI() {
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) {
        const userName = localStorage.getItem('userName');
        userDisplayName.textContent = userName || 'Usuario';
    }
}

// Evento para formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando auth.js...');
    
    if (document.getElementById('userDisplayName')) {
        updateUserUI();
    }
    
    // Enlazar eventos de logout
    const logoutButtons = document.querySelectorAll('#logoutButton');
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
    
    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Validación en tiempo real
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const repeatPasswordInput = document.getElementById('repeatPassword');
        const phoneInput = document.getElementById('phone');
        const pinInput = document.getElementById('pin');
        
        // Validación de email en tiempo real
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else if (!window.Notifications.validateEmail(this.value)) {
                    window.Notifications.showFieldError(this, 'validation_email');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Validación de contraseña en tiempo real
        if (passwordInput) {
            passwordInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else if (this.value.length < 8) {
                    window.Notifications.showFieldError(this, 'validation_password_length');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Validación de repetir contraseña en tiempo real
        if (repeatPasswordInput && passwordInput) {
            repeatPasswordInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else if (this.value !== passwordInput.value) {
                    window.Notifications.showFieldError(this, 'validation_password_match');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Validación de teléfono en tiempo real
        if (phoneInput) {
            phoneInput.addEventListener('blur', function() {
                if (this.value.trim() !== '' && !window.Notifications.validatePhone(this.value)) {
                    window.Notifications.showFieldError(this, 'validation_phone_format');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Validación de PIN en tiempo real
        if (pinInput) {
            pinInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else if (!window.Notifications.validatePin(this.value)) {
                    window.Notifications.showFieldError(this, 'validation_pin_format');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Evento de envío del formulario
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar que las contraseñas coincidan
            if (document.getElementById('password').value !== document.getElementById('repeatPassword').value) {
                window.Notifications.showFieldError(document.getElementById('repeatPassword'), 'validation_password_match');
                return;
            }
            
            // Validar el PIN
            const pin = document.getElementById('pin').value;
            if (!window.Notifications.validatePin(pin)) {
                window.Notifications.showFieldError(document.getElementById('pin'), 'validation_pin_format');
                return;
            }
            
            // Activar estado de carga
            window.Notifications.toggleFormLoading(registerForm, true, 'Creando cuenta...');
            
            try {
                const formData = {
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    repeat_password: document.getElementById('repeatPassword').value,
                    phone_number: document.getElementById('phone').value,
                    pin: document.getElementById('pin').value,
                    name: document.getElementById('name').value,
                    last_name: document.getElementById('lastName').value,
                    country: document.getElementById('country').value,
                    birthdate: document.getElementById('birthdate').value
                };
                
                const response = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Usar mensaje personalizado en lugar del error de API
                    throw new Error(window.Notifications.mapApiErrorToFrontend(data.error));
                }
                
                // Mostrar notificación de éxito
                window.Notifications.showSuccess('auth_register_success');
                
                // Redireccionar después de un breve retraso
                setTimeout(() => {
                    window.location.href = '../shared/login.html';
                }, 2000);
            } catch (error) {
                console.error('Error en registro:', error);
                
                // Desactivar estado de carga
                window.Notifications.toggleFormLoading(registerForm, false);
                
                // Mostrar error
                if (error.message && window.Notifications.errorMessages[error.message]) {
                    window.Notifications.showError(error.message);
                } else {
                    window.Notifications.showError('unknown_error');
                }
            }
        });
    }
    
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Validación en tiempo real
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        // Validación de email en tiempo real
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else if (!window.Notifications.validateEmail(this.value)) {
                    window.Notifications.showFieldError(this, 'validation_email');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Validación de contraseña en tiempo real
        if (passwordInput) {
            passwordInput.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    window.Notifications.showFieldError(this, 'validation_required');
                } else {
                    window.Notifications.clearFieldError(this);
                }
            });
        }
        
        // Evento de envío del formulario
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener elementos del formulario
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            
            // Validar formulario
            let hasErrors = false;
            
            if (email.value.trim() === '') {
                window.Notifications.showFieldError(email, 'validation_required');
                hasErrors = true;
            } else if (!window.Notifications.validateEmail(email.value)) {
                window.Notifications.showFieldError(email, 'validation_email');
                hasErrors = true;
            }
            
            if (password.value.trim() === '') {
                window.Notifications.showFieldError(password, 'validation_required');
                hasErrors = true;
            }
            
            if (hasErrors) {
                return;
            }
            
            // Activar estado de carga
            window.Notifications.toggleFormLoading(loginForm, true, 'Iniciando sesión...');
            
            try {
                const username = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const formData = {
                    username: username,
                    password: password
                };
                
                const response = await fetch(`${API_URL}/session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Usar mensaje personalizado en lugar del error de API
                    throw new Error(window.Notifications.mapApiErrorToFrontend(data.error));
                }
                
                // Obtener información del usuario decodificando el token
                const token = data.token;
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Obtener el PIN del usuario y guardarlo en localStorage
                try {
                    const userResponse = await fetch(`${API_URL}/users?id=${payload.id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        if (userData && userData.pin) {
                            // Guardar el PIN del administrador
                            localStorage.setItem('adminPin', userData.pin);
                        } else {
                            // PIN por defecto como respaldo
                            localStorage.setItem('adminPin', '123456');
                            console.warn('No se pudo obtener el PIN, usando PIN por defecto');
                        }
                    }
                } catch (pinError) {
                    console.error('Error al obtener el PIN:', pinError);
                    localStorage.setItem('adminPin', '123456');
                }
                
                // Guardar datos
                saveAuthData(payload, token);
                
                // Mostrar notificación de éxito
                window.Notifications.showSuccess('auth_login_success', '¡Bienvenido!');
                
                // Redireccionar después de un breve retraso
                setTimeout(() => {
                    window.location.href = '../users/profileSelection.html';
                }, 1000);
            } catch (error) {
                console.error('Error en login:', error);
                
                // Desactivar estado de carga
                window.Notifications.toggleFormLoading(loginForm, false);
                
                // Mostrar error
                if (error.message && window.Notifications.errorMessages[error.message]) {
                    window.Notifications.showError(error.message);
                } else {
                    window.Notifications.showError('auth_invalid_credentials');
                }
            }
        });
    }
});