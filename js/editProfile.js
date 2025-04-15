document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fullNameInput = document.getElementById('fullName');
    const pinInput = document.getElementById('pin');
    const profileIdInput = document.getElementById('profileId');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const selectedAvatar = document.getElementById('selectedAvatar');
    const playlistsContainer = document.getElementById('playlistsContainer');
    const playlistCheckboxes = document.getElementById('playlistCheckboxes');
    const noPlaylistsMessage = document.getElementById('noPlaylistsMessage');
    
    // Modal de confirmación para eliminar
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Referencias para el nombre del usuario en la navbar
    const userDisplayName = document.getElementById('userDisplayName');
    
    // Variables para almacenar datos
    let selectedAvatarUrl = '';
    let playlists = [];
    let profileData = null;
    let originalAssociatedPlaylists = [];
    
    // Inicialización
    init();
    
    /**
     * Inicializa la página
     */
    function init() {
        // Mostrar el nombre de usuario en la navbar
        displayUserName();
        
        // Obtener el ID del perfil de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const profileId = urlParams.get('id');
        
        if (!profileId) {
            window.Notifications.showError('profile_not_found');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        // Establecer el ID del perfil en el formulario
        profileIdInput.value = profileId;
        
        // Cargar datos del perfil y playlists
        loadProfileData(profileId);
        
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
        // Selección de avatar
        avatarOptions.forEach(option => {
            option.addEventListener('click', function() {
                const avatarUrl = this.getAttribute('data-avatar');
                selectedAvatarUrl = avatarUrl;
                selectedAvatar.src = avatarUrl;
                
                // Remover la clase 'selected' de todos los avatares
                avatarOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Añadir la clase 'selected' al avatar seleccionado
                this.classList.add('selected');
            });
        });
        
        // Validación de PIN (solo números y 6 dígitos)
        pinInput.addEventListener('input', function(e) {
            // Reemplazar cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a 6 dígitos
            if (this.value.length > 6) {
                this.value = this.value.slice(0, 6);
            }
        });
        
        // Validación de campos en tiempo real
        fullNameInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        pinInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                window.Notifications.showFieldError(this, 'validation_required');
            } else if (!window.Notifications.validatePin(this.value)) {
                window.Notifications.showFieldError(this, 'validation_pin_format');
            } else {
                window.Notifications.clearFieldError(this);
            }
        });
        
        // Envío del formulario
        editProfileForm.addEventListener('submit', handleFormSubmit);
        
        // Configurar botón de eliminar perfil
        const deleteProfileBtn = document.createElement('button');
        deleteProfileBtn.type = 'button';
        deleteProfileBtn.className = 'btn btn-danger';
        deleteProfileBtn.innerHTML = '<i class="bi bi-trash"></i> Eliminar Perfil';
        deleteProfileBtn.addEventListener('click', function() {
            // Mostrar modal de confirmación
            const modal = new bootstrap.Modal(deleteConfirmationModal);
            modal.show();
        });
        
        // Añadir botón de eliminar al formulario
        const actionButtons = document.querySelector('.d-grid.gap-2.d-md-flex.justify-content-md-end');
        if (actionButtons) {
            actionButtons.prepend(deleteProfileBtn);
        }
        
        // Configurar botón de confirmar eliminación
        confirmDeleteBtn.addEventListener('click', handleDeleteProfile);
        
        // Event listener para el botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
    
    /**
     * Carga los datos del perfil
     * @param {string} profileId - ID del perfil a editar
     */
    async function loadProfileData(profileId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.Notifications.showError('auth_not_authenticated');
                setTimeout(() => {
                    window.location.href = '../shared/login.html';
                }, 2000);
                return;
            }
            
            // Obtener datos del perfil
            const profileResponse = await fetch(`http://localhost:3000/api/admin/restricted_users?id=${profileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!profileResponse.ok) {
                throw new Error('Error al cargar los datos del perfil');
            }
            
            profileData = await profileResponse.json();
            
            // Mostrar datos del perfil
            displayProfileData(profileData);
            
            // Cargar playlists disponibles
            await loadPlaylists(profileId);
            
            // Mostrar el formulario y ocultar el indicador de carga
            loadingIndicator.style.display = 'none';
            editProfileForm.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            window.Notifications.showError('profile_not_found');
            
            // Ocultar indicador de carga y mostrar mensaje de error
            loadingIndicator.style.display = 'none';
            
            // Mostrar botón para volver al dashboard
            const actionButtons = document.querySelector('.d-grid.gap-2.d-md-flex.justify-content-md-end');
            if (actionButtons) {
                actionButtons.innerHTML = `
                    <a href="dashboard.html" class="btn btn-primary">
                        <i class="bi bi-arrow-left"></i> Volver al Dashboard
                    </a>
                `;
            }
        }
    }
    
    /**
     * Muestra los datos del perfil en el formulario
     * @param {Object} profile - Datos del perfil
     */
    function displayProfileData(profile) {
        fullNameInput.value = profile.full_name;
        pinInput.value = profile.pin;
        selectedAvatarUrl = profile.avatar;
        selectedAvatar.src = profile.avatar;
        
        // Seleccionar el avatar correspondiente
        avatarOptions.forEach(option => {
            if (option.getAttribute('data-avatar') === profile.avatar) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    /**
     * Carga las playlists disponibles y marca las asignadas al perfil
     * @param {string} profileId - ID del perfil
     */
    async function loadPlaylists(profileId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.Notifications.showError('auth_not_authenticated');
                return;
            }
            
            // Obtener todas las playlists
            const response = await fetch('http://localhost:3000/api/admin/playlists', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar las playlists');
            }
            
            playlists = await response.json();
            
            // Obtener playlists asociadas al perfil (recorriendo las playlists y verificando si el perfil está en associatedProfiles)
            const associatedPlaylists = playlists.filter(playlist => 
                playlist.associatedProfiles && playlist.associatedProfiles.includes(profileId)
            );
            
            // Guardar IDs de playlists asociadas para comparar cambios después
            originalAssociatedPlaylists = associatedPlaylists.map(playlist => playlist._id);
            
            // Mostrar las playlists en la interfaz
            if (playlists.length > 0) {
                noPlaylistsMessage.style.display = 'none';
                renderPlaylists(playlists, originalAssociatedPlaylists);
            } else {
                noPlaylistsMessage.style.display = 'block';
                playlistCheckboxes.innerHTML = '';
                
                // Mostrar mensaje con enlace para crear una playlist
                playlistCheckboxes.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No hay playlists disponibles. 
                        <a href="createPlaylist.html" class="alert-link">Crea una playlist primero</a>.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            window.Notifications.showError('server_error');
            
            // Mostrar mensaje de error
            noPlaylistsMessage.style.display = 'block';
            playlistCheckboxes.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar las playlists.
                    <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Renderiza las playlists en el formulario
     * @param {Array} playlists - Lista de playlists
     * @param {Array} selectedPlaylists - IDs de playlists seleccionadas
     */
    function renderPlaylists(playlists, selectedPlaylists) {
        playlistCheckboxes.innerHTML = '';
        
        playlists.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            
            const isChecked = selectedPlaylists.includes(playlist._id) ? 'checked' : '';
            
            playlistItem.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="playlist-${playlist._id}" value="${playlist._id}" ${isChecked}>
                    <label class="form-check-label" for="playlist-${playlist._id}">
                        <i class="bi bi-collection-play"></i> ${playlist.name}
                        <span class="badge bg-secondary rounded-pill ms-2">${playlist.videoCount || 0} videos</span>
                    </label>
                </div>
            `;
            
            playlistCheckboxes.appendChild(playlistItem);
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
        window.Notifications.toggleFormLoading(editProfileForm, true, 'Actualizando perfil...');
        
        // Obtener los valores del formulario
        const profileId = profileIdInput.value;
        const fullName = fullNameInput.value.trim();
        const pin = pinInput.value;
        const avatar = selectedAvatarUrl;
        
        // Obtener los IDs de las playlists seleccionadas
        const selectedPlaylists = [];
        document.querySelectorAll('#playlistCheckboxes input[type="checkbox"]:checked').forEach(checkbox => {
            selectedPlaylists.push(checkbox.value);
        });
        
        try {
            // Actualizar el perfil
            await updateProfile(profileId, fullName, pin, avatar);
            
            // Actualizar playlists asociadas
            await updateProfilePlaylists(profileId, originalAssociatedPlaylists, selectedPlaylists);
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('profile_update_success');
            
            // Redireccionar al dashboard después de un breve retraso
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            
            // Desactivar estado de carga
            window.Notifications.toggleFormLoading(editProfileForm, false);
            
            // Mostrar mensaje de error
            window.Notifications.showError('profile_update_failed');
        }
    }
    
    /**
     * Valida el formulario antes de enviarlo
     * @returns {boolean} - True si el formulario es válido, false en caso contrario
     */
    function validateForm() {
        let isValid = true;
        
        // Validar nombre completo
        if (fullNameInput.value.trim() === '') {
            window.Notifications.showFieldError(fullNameInput, 'validation_required');
            isValid = false;
        }
        
        // Validar PIN
        if (pinInput.value.trim() === '') {
            window.Notifications.showFieldError(pinInput, 'validation_required');
            isValid = false;
        } else if (pinInput.value.length !== 6 || !/^\d+$/.test(pinInput.value)) {
            window.Notifications.showFieldError(pinInput, 'validation_pin_format');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Actualiza un perfil infantil en el servidor
     * @param {string} profileId - ID del perfil
     * @param {string} fullName - Nombre completo del perfil
     * @param {string} pin - PIN de 6 dígitos
     * @param {string} avatar - URL del avatar seleccionado
     */
    async function updateProfile(profileId, fullName, pin, avatar) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se ha iniciado sesión');
        }
        
        const response = await fetch(`http://localhost:3000/api/admin/restricted_users?id=${profileId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                full_name: fullName,
                pin: pin,
                avatar: avatar
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el perfil');
        }
        
        return await response.json();
    }
    
    /**
     * Actualiza las playlists asignadas al perfil
     * @param {string} profileId - ID del perfil
     * @param {Array} originalPlaylists - IDs de playlists originalmente asignadas
     * @param {Array} newPlaylists - IDs de playlists seleccionadas
     */
    async function updateProfilePlaylists(profileId, originalPlaylists, newPlaylists) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se ha iniciado sesión');
        }
        
        // Playlists a añadir (están en newPlaylists pero no en originalPlaylists)
        const playlistsToAdd = newPlaylists.filter(id => !originalPlaylists.includes(id));
        
        // Playlists a quitar (están en originalPlaylists pero no en newPlaylists)
        const playlistsToRemove = originalPlaylists.filter(id => !newPlaylists.includes(id));
        
        // Proceso para añadir el perfil a nuevas playlists
        for (const playlistId of playlistsToAdd) {
            // Obtener datos de la playlist
            const getResponse = await fetch(`http://localhost:3000/api/admin/playlists?id=${playlistId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!getResponse.ok) {
                console.error(`No se pudo obtener la playlist ${playlistId}`);
                continue;
            }
            
            const playlist = await getResponse.json();
            
            // Añadir el perfil a la lista de perfiles asociados
            const associatedProfiles = Array.isArray(playlist.associatedProfiles) 
                ? [...playlist.associatedProfiles, profileId]
                : [profileId];
            
            // Actualizar la playlist con el nuevo perfil
            const updateResponse = await fetch(`http://localhost:3000/api/admin/playlists?id=${playlistId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: playlist.name,
                    associatedProfiles: associatedProfiles
                })
            });
            
            if (!updateResponse.ok) {
                console.error(`No se pudo actualizar la playlist ${playlistId}`);
            }
        }
        
        // Proceso para quitar el perfil de playlists existentes
        for (const playlistId of playlistsToRemove) {
            // Obtener datos de la playlist
            const getResponse = await fetch(`http://localhost:3000/api/admin/playlists?id=${playlistId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!getResponse.ok) {
                console.error(`No se pudo obtener la playlist ${playlistId}`);
                continue;
            }
            
            const playlist = await getResponse.json();
            
            // Quitar el perfil de la lista de perfiles asociados
            const associatedProfiles = Array.isArray(playlist.associatedProfiles) 
                ? playlist.associatedProfiles.filter(id => id !== profileId)
                : [];
            
            // Actualizar la playlist sin el perfil
            const updateResponse = await fetch(`http://localhost:3000/api/admin/playlists?id=${playlistId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: playlist.name,
                    associatedProfiles: associatedProfiles
                })
            });
            
            if (!updateResponse.ok) {
                console.error(`No se pudo actualizar la playlist ${playlistId}`);
            }
        }
    }
    
    /**
     * Maneja la eliminación de un perfil
     */
    async function handleDeleteProfile() {
        try {
            const profileId = profileIdInput.value;
            const token = localStorage.getItem('token');
            
            if (!token || !profileId) {
                throw new Error('No se puede eliminar el perfil');
            }
            
            // Mostrar estado de carga en el botón de eliminar
            confirmDeleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...`;
            confirmDeleteBtn.disabled = true;
            
            // Quitar el perfil de todas las playlists asociadas
            await updateProfilePlaylists(profileId, originalAssociatedPlaylists, []);
            
            // Eliminar el perfil
            const response = await fetch(`http://localhost:3000/api/admin/restricted_users?id=${profileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('No se pudo eliminar el perfil');
            }
            
            // Cerrar el modal
            const modalEl = document.getElementById('deleteConfirmationModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Mostrar mensaje de éxito
            window.Notifications.showSuccess('profile_delete_success');
            
            // Redireccionar al dashboard después de un breve retraso
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            
            // Restaurar estado del botón de eliminar
            confirmDeleteBtn.innerHTML = `Eliminar perfil`;
            confirmDeleteBtn.disabled = false;
            
            // Cerrar el modal
            const modalEl = document.getElementById('deleteConfirmationModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Mostrar mensaje de error
            window.Notifications.showError('profile_delete_failed');
        }
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
            window.Notifications.showSuccess('auth_logout_success');
            
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