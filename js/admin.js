const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentUser = null;
let restrictedProfiles = [];
let playlists = [];
let totalVideosCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando dashboard...');

    updateUserInfoFromStorage();
    
    // Cargar los datos para el dashboard
    console.log('Cargando datos del dashboard...');
    await Promise.all([
        loadRestrictedProfiles(),
        loadPlaylists()
    ]);
    
    // Calcular total de videos y actualizar contador
    updateVideosCount();
    
    // Inicializar eventos de la página
    initEvents();
    console.log('Dashboard inicializado correctamente');
});

/**
 * Actualiza información básica del usuario desde localStorage
 */
function updateUserInfoFromStorage() {
    // Actualizar nombre en la barra de navegación con datos de localStorage
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) {
        const userName = localStorage.getItem('userName');
        userDisplayName.textContent = userName || 'Usuario';
    }
}

/**
 * Carga los datos del usuario actual (opcional, para datos adicionales)
 */
async function loadUserData() {
    const token = localStorage.getItem('token');
    const adminId = localStorage.getItem('adminId');
    
    if (!token || !adminId) {
        console.warn('No hay token o adminId para cargar datos de usuario');
        return;
    }
    
    try {
        console.log('Cargando datos completos del usuario...');
        const response = await fetch(`${API_URL}/users?id=${adminId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Error al cargar datos de usuario:', response.status);
            showNotification('error', 'Error al cargar datos completos de usuario');
            return;
        }
        
        currentUser = await response.json();
        console.log('Datos de usuario cargados correctamente');
        updateUserInfo(currentUser);
        
    } catch (error) {
        console.error('Error en loadUserData:', error);
        showNotification('error', 'Error al cargar tus datos. Intenta recargar la página.');
    }
}

/**
 * Carga los perfiles restringidos del usuario
 */
async function loadRestrictedProfiles() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.warn('No hay token para cargar perfiles');
        return;
    }
    
    try {
        console.log('Cargando perfiles restringidos...');
        const response = await fetch(`${API_URL}/admin/restricted_users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Error al cargar perfiles:', response.status);
            throw new Error('Error al cargar perfiles');
        }
        
        restrictedProfiles = await response.json();
        console.log(`${restrictedProfiles.length} perfiles cargados correctamente`);
        
        // Actualizar interfaz con los perfiles
        updateRestrictedProfilesUI(restrictedProfiles);
        
    } catch (error) {
        console.error('Error cargando perfiles:', error);
        showNotification('error', 'Error al cargar perfiles. Intenta recargar la página.');
    }
}

/**
 * Carga las playlists del usuario
 */
async function loadPlaylists() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.warn('No hay token para cargar playlists');
        return;
    }
    
    try {
        console.log('Cargando playlists...');
        const response = await fetch(`${API_URL}/admin/playlists`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Error al cargar playlists:', response.status);
            throw new Error('Error al cargar playlists');
        }
        
        playlists = await response.json();
        console.log(`${playlists.length} playlists cargadas correctamente`);
        
        // Actualizar interfaz con las playlists
        updatePlaylistsUI(playlists);
        
    } catch (error) {
        console.error('Error cargando playlists:', error);
        showNotification('error', 'Error al cargar playlists. Intenta recargar la página.');
    }
}

/**
 * Calcula el total de videos y actualiza el contador
 */
function updateVideosCount() {
    console.log('Calculando total de videos...');
    
    // Verificar cada playlist e imprimir su videoCount para depuración
    playlists.forEach(playlist => {
        console.log(`Playlist "${playlist.name}": ${playlist.videoCount || 0} videos`);
    });
    
    totalVideosCount = playlists.reduce((total, playlist) => {
        return total + (playlist.videoCount || 0);
    }, 0);
    
    console.log(`Total de videos calculado: ${totalVideosCount}`);
    
    const videosCountElement = document.getElementById('videosCount');
    if (videosCountElement) {
        videosCountElement.textContent = totalVideosCount;
    } else {
        console.warn('Elemento videosCount no encontrado en el DOM');
    }
    
    // Actualizar también los otros contadores
    const profilesCountElement = document.getElementById('profilesCount');
    if (profilesCountElement) {
        profilesCountElement.textContent = restrictedProfiles.length;
    }
    
    const playlistsCountElement = document.getElementById('playlistsCount');
    if (playlistsCountElement) {
        playlistsCountElement.textContent = playlists.length;
    }
}

/**
 * Actualiza la interfaz con la información del usuario
 * @param {Object} user - Datos del usuario
 */
function updateUserInfo(user) {
    // Actualizar nombre en la barra de navegación
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) {
        userDisplayName.textContent = user.name || 'Usuario';
    }
    
    // Actualizar nombre en el perfil
    const profileName = document.getElementById('profileName');
    if (profileName) {
        profileName.textContent = `${user.name || ''} ${user.last_name || ''}`;
    }
}

/**
 * Actualiza la interfaz con los perfiles restringidos
 * @param {Array} profiles - Lista de perfiles restringidos
 */
function updateRestrictedProfilesUI(profiles) {
    console.log('Actualizando UI de perfiles...');
    
    // Actualizar el contador de perfiles
    const profilesCount = document.getElementById('profilesCount');
    if (profilesCount) {
        profilesCount.textContent = profiles.length;
    }
    
    // Si hay una sección para mostrar perfiles, actualizarla
    const profilesList = document.getElementById('restrictedProfilesList');
    if (profilesList) {
        profilesList.innerHTML = '';
        
        if (profiles.length === 0) {
            profilesList.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="text-muted mb-3">
                        <i class="bi bi-people" style="font-size: 2rem;"></i>
                    </div>
                    <p>No hay perfiles infantiles creados.</p>
                    <a href="createProfile.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle"></i> Crear primer perfil
                    </a>
                </div>
            `;
            return;
        }
        
        profiles.forEach(profile => {
            const profileCard = document.createElement('div');
            profileCard.className = 'col-md-4 col-sm-6 mb-4';
            profileCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body text-center">
                        <img src="${profile.avatar || 'https://loodibee.com/wp-content/uploads/Netflix-avatar-2.png'}" 
                             alt="${profile.full_name}" class="profile-avatar" 
                             style="width: 80px; height: 80px; object-fit: cover;">
                        <h5 class="card-title mt-2">${profile.full_name}</h5>
                        <p class="text-muted small">PIN: ******</p>
                        <div class="mt-3">
                            <a href="editProfile.html?id=${profile._id}" class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-pencil"></i> Editar
                            </a>
                            <button class="btn btn-sm btn-outline-danger delete-profile" data-id="${profile._id}" data-name="${profile.full_name}">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            profilesList.appendChild(profileCard);
        });
        
        // Añadir eventos a los botones de eliminar
        attachProfileEvents();
    } else {
        console.warn('Elemento restrictedProfilesList no encontrado en el DOM');
    }
}

/**
 * Actualiza la interfaz con las playlists
 * @param {Array} playlists - Lista de playlists
 */
function updatePlaylistsUI(playlists) {
    console.log('Actualizando UI de playlists...');
    
    // Actualizar el contador de playlists
    const playlistsCount = document.getElementById('playlistsCount');
    if (playlistsCount) {
        playlistsCount.textContent = playlists.length;
    }
    
    // Si hay una sección para mostrar playlists, actualizarla
    const playlistsList = document.getElementById('playlistsList');
    if (playlistsList) {
        playlistsList.innerHTML = '';
        
        if (playlists.length === 0) {
            playlistsList.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="text-muted mb-3">
                        <i class="bi bi-collection" style="font-size: 2rem;"></i>
                    </div>
                    <p>No hay playlists creadas.</p>
                    <a href="createPlaylist.html" class="btn btn-success btn-sm">
                        <i class="bi bi-plus-circle"></i> Crear primera playlist
                    </a>
                </div>
            `;
            return;
        }
        
        playlists.forEach(playlist => {
            // Calcular cuántos perfiles tienen acceso a esta playlist
            const profilesCount = Array.isArray(playlist.associatedProfiles) ? playlist.associatedProfiles.length : 0;
            
            const playlistCard = document.createElement('div');
            playlistCard.className = 'col-md-6 mb-4';
            playlistCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-start">
                            <div class="playlist-thumbnail">
                                <i class="bi bi-collection-play"></i>
                            </div>
                            <div class="playlist-info">
                                <h5 class="playlist-title">${playlist.name}</h5>
                                <div class="playlist-meta">
                                    <span class="playlist-videos-count">
                                        <i class="bi bi-play-btn"></i> ${playlist.videoCount || 0} videos
                                    </span>
                                    <span class="playlist-profiles-count">
                                        <i class="bi bi-people"></i> ${profilesCount} perfiles
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-end">
                            <a href="editPlaylist.html?id=${playlist._id}" class="btn btn-sm btn-outline-success me-1">
                                <i class="bi bi-pencil"></i> Editar
                            </a>
                            <a href="addVideo.html?playlistId=${playlist._id}" class="btn btn-sm btn-outline-primary me-1">
                                <i class="bi bi-plus-circle"></i> Añadir Video
                            </a>
                            <button class="btn btn-sm btn-outline-danger delete-playlist" data-id="${playlist._id}" data-name="${playlist.name}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            playlistsList.appendChild(playlistCard);
        });
        
        // Añadir eventos a los botones de eliminar
        attachPlaylistEvents();
    } else {
        console.warn('Elemento playlistsList no encontrado en el DOM');
    }
}

/**
 * Añade eventos a los botones de perfiles
 */
function attachProfileEvents() {
    // Botones de eliminar perfil
    document.querySelectorAll('.delete-profile').forEach(button => {
        button.addEventListener('click', (e) => {
            const profileId = e.currentTarget.getAttribute('data-id');
            const profileName = e.currentTarget.getAttribute('data-name');
            confirmDeleteProfile(profileId, profileName);
        });
    });
}

/**
 * Añade eventos a los botones de playlists
 */
function attachPlaylistEvents() {
    // Botones de eliminar playlist
    document.querySelectorAll('.delete-playlist').forEach(button => {
        button.addEventListener('click', (e) => {
            const playlistId = e.currentTarget.getAttribute('data-id');
            const playlistName = e.currentTarget.getAttribute('data-name');
            confirmDeletePlaylist(playlistId, playlistName);
        });
    });
}

/**
 * Solicita confirmación para eliminar un perfil
 * @param {string} profileId - ID del perfil a eliminar
 * @param {string} profileName - Nombre del perfil a eliminar
 */
function confirmDeleteProfile(profileId, profileName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el perfil "${profileName}"? Esta acción no se puede deshacer.`)) {
        deleteProfile(profileId);
    }
}

/**
 * Elimina un perfil restringido
 * @param {string} profileId - ID del perfil a eliminar
 */
async function deleteProfile(profileId) {
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/restricted_users?id=${profileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el perfil');
        }
        
        // Perfil eliminado correctamente
        showNotification('success', 'Perfil eliminado correctamente');
        
        // Recargar perfiles
        await loadRestrictedProfiles();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error al eliminar el perfil');
    }
}

/**
 * Solicita confirmación para eliminar una playlist
 * @param {string} playlistId - ID de la playlist a eliminar
 * @param {string} playlistName - Nombre de la playlist a eliminar
 */
function confirmDeletePlaylist(playlistId, playlistName) {
    if (confirm(`¿Estás seguro de que quieres eliminar la playlist "${playlistName}" y todos sus videos? Esta acción no se puede deshacer.`)) {
        deletePlaylist(playlistId);
    }
}

/**
 * Elimina una playlist
 * @param {string} playlistId - ID de la playlist a eliminar
 */
async function deletePlaylist(playlistId) {
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/playlists?id=${playlistId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar la playlist');
        }
        
        // Playlist eliminada correctamente
        showNotification('success', 'Playlist eliminada correctamente');
        
        // Recargar playlists
        await loadPlaylists();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error al eliminar la playlist');
    }
}

/**
 * Inicializa los eventos de la página
 */
function initEvents() {
    console.log('Inicializando eventos...');
    
    // Evento para el botón de cerrar sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

/**
 * Cierra la sesión del usuario
 */
async function logout() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            console.log('Cerrando sesión...');
            // Llamada a la API para invalidar el token
            const response = await fetch(`${API_URL}/session`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('Error al cerrar sesión en el servidor:', response.status);
            } else {
                console.log('Sesión cerrada correctamente en el servidor');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
    
    // Eliminar datos de sesión del almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userName');
    localStorage.removeItem('adminPin');
    console.log('Datos de autenticación eliminados del localStorage');
    
    // Redirigir a la página de selección de perfiles
    window.location.href = '../shared/login.html';
}

/**
 * Muestra una notificación en la interfaz
 * @param {string} type - Tipo de notificación (success, error, info)
 * @param {string} message - Mensaje a mostrar
 */
function showNotification(type, message) {
    console.log(`Mostrando notificación [${type}]: ${message}`);
    
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (!notification || !notificationTitle || !notificationMessage) {
        console.warn('Elementos de notificación no encontrados, mostrando alert');
        alert(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    // Configurar apariencia según el tipo
    if (type === 'success') {
        notification.classList.remove('bg-danger', 'bg-info');
        notification.classList.add('bg-success', 'text-white');
        notificationTitle.textContent = 'Éxito';
    } else if (type === 'error') {
        notification.classList.remove('bg-success', 'bg-info');
        notification.classList.add('bg-danger', 'text-white');
        notificationTitle.textContent = 'Error';
    } else if (type === 'info') {
        notification.classList.remove('bg-success', 'bg-danger');
        notification.classList.add('bg-info', 'text-white');
        notificationTitle.textContent = 'Información';
    }
    
    // Establecer mensaje
    notificationMessage.textContent = message;
    
    // Mostrar notificación
    const toast = new bootstrap.Toast(notification);
    toast.show();
}