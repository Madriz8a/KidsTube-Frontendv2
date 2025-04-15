document.addEventListener('DOMContentLoaded', function() {
    const createPlaylistForm = document.getElementById('createPlaylistForm');
    const playlistNameInput = document.getElementById('playlistName');
    const profilesContainer = document.getElementById('profilesContainer');
    const profileCheckboxes = document.getElementById('profileCheckboxes');
    const noProfilesMessage = document.getElementById('noProfilesMessage');
    
    // Referencias para el nombre del usuario en la navbar
    const userDisplayName = document.getElementById('userDisplayName');
    
    // Variables para almacenar datos
    let profiles = [];
    
    // Inicialización
    init();
    
    /**
     * Inicializa la página
     */
    function init() {
        // Mostrar el nombre de usuario en la navbar
        displayUserName();
        
        // Cargar perfiles disponibles
        loadProfiles();
        
        // Configurar event listeners
        setupEventListeners();
    }
    
    /**
     * Muestra el nombre del usuario en la navbar
     */
    function displayUserName() {
        const userName = localStorage.getItem('userName');
        if (userName) {
            userDisplayName.textContent = userName;
        }
    }
    
    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Validación de campos en tiempo real
        playlistNameInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        // Envío del formulario
        createPlaylistForm.addEventListener('submit', handleFormSubmit);
        
        // Event listener para el botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
    
    /**
     * Carga los perfiles infantiles disponibles para asignar a la playlist
     */
    async function loadProfiles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.Notifications.showError('auth_not_authenticated');
                setTimeout(() => {
                    window.location.href = '../shared/login.html';
                }, 2000);
                return;
            }
            
            const response = await fetch('http://localhost:3000/api/admin/restricted_users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar los perfiles');
            }
            
            profiles = await response.json();
            
            // Mostrar los perfiles en la interfaz
            if (profiles.length > 0) {
                noProfilesMessage.style.display = 'none';
                renderProfiles(profiles);
            } else {
                noProfilesMessage.style.display = 'block';
                profileCheckboxes.innerHTML = '';
                
                // Mostrar mensaje amigable de que no hay perfiles
                profileCheckboxes.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No hay perfiles infantiles disponibles. 
                        <a href="createProfile.html" class="alert-link">Crea un perfil primero</a>.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            window.Notifications.showError('server_error', 'Error de carga');
            
            // Mostrar mensaje de error
            profileCheckboxes.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No se pudieron cargar los perfiles infantiles. 
                    <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Renderiza los perfiles en el formulario
     * @param {Array} profiles - Lista de perfiles infantiles
     */
    function renderProfiles(profiles) {
        profileCheckboxes.innerHTML = '';
        
        profiles.forEach(profile => {
            const profileItem = document.createElement('div');
            profileItem.className = 'profile-item d-flex align-items-center';
            
            profileItem.innerHTML = `
                <div class="form-check profile-checkbox">
                    <input class="form-check-input" type="checkbox" id="profile-${profile._id}" value="${profile._id}">
                    <div class="profile-avatar">
                        <img src="${profile.avatar}" alt="${profile.full_name}">
                    </div>
                    <label class="form-check-label" for="profile-${profile._id}">
                        ${profile.full_name}
                    </label>
                </div>
            `;
            
            profileCheckboxes.appendChild(profileItem);
        });
    }
    
    /**
     * Maneja el envío del formulario
     * @param {Event} e - Evento de submit
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar el formulario
        if (!validateForm()) {
            return;
        }
        
        // Activar estado de carga
        window.Notifications.toggleFormLoading(createPlaylistForm, true, 'Creando playlist...');
        
        // Obtener los valores del formulario
        const playlistName = playlistNameInput.value.trim();
        
        // Obtener los IDs de los perfiles seleccionados
        const selectedProfiles = [];
        document.querySelectorAll('#profileCheckboxes input[type="checkbox"]:checked').forEach(checkbox => {
            selectedProfiles.push(checkbox.value);
        });
        
        try {
            // Crear la playlist
            const playlistData = await createPlaylist(playlistName, selectedProfiles);
            
            if (playlistData && playlistData._id) {
                // Mostrar mensaje de éxito
                window.Notifications.showSuccess('playlist_create_success');
                
                // Redireccionar al dashboard después de un breve retraso
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(createPlaylistForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('playlist_create_failed');
        }
    }
    
    /**
     * Valida el formulario antes de enviarlo
     * @returns {boolean} - True si el formulario es válido, false en caso contrario
     */
    function validateForm() {
        let isValid = true;
        
        // Validar nombre de la playlist
        if (playlistNameInput.value.trim() === '') {
            window.Notifications.showFieldError(playlistNameInput, 'validation_required');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Crea una playlist en el servidor
     * @param {string} name - Nombre de la playlist
     * @param {Array} associatedProfiles - IDs de los perfiles asociados
     * @returns {Promise<Object>} - Datos de la playlist creada
     */
    async function createPlaylist(name, associatedProfiles) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se ha iniciado sesión');
        }
        
        const response = await fetch('http://localhost:3000/api/admin/playlists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                associatedProfiles: associatedProfiles
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la playlist');
        }
        
        return await response.json();
    }
    
    /**
     * Maneja el cierre de sesión
     */
    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../shared/login.html';
                return;
            }
            
            const response = await fetch('http://localhost:3000/api/session', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Siempre limpiar localStorage y redirigir, sin importar la respuesta del API
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('auth_logout_success', 'Sesión cerrada');
            
            // Redireccionar después de un breve retraso
            setTimeout(() => {
                window.location.href = '../shared/login.html';
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            
            // Incluso si hay error, limpiamos el almacenamiento y redirigimos
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userName');
            window.location.href = '../shared/login.html';
        }
    }
});