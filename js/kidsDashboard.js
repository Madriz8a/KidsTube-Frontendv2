document.addEventListener("DOMContentLoaded", function () {
  const welcomeTitle = document.getElementById("welcomeTitle");
  const profileName = document.getElementById("profileName");
  const navProfileAvatar = document.getElementById("navProfileAvatar");
  const playlistsContainer = document.getElementById("playlistsContainer");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const noPlaylistsMessage = document.getElementById("noPlaylistsMessage");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const searchResultsSection = document.getElementById("searchResultsSection");
  const searchResults = document.getElementById("searchResults");
  const closeSearchBtn = document.getElementById("closeSearchBtn");
  const exitProfileBtn = document.getElementById("exitProfileBtn");

  // Referencias para el modal de reproducción de video
  const videoPlayerModal = document.getElementById("videoPlayerModal");
  const videoTitle = document.getElementById("videoTitle");
  const videoDescription = document.getElementById("videoDescription");
  const videoPlayer = document.getElementById("videoPlayer");
  const autoplaySwitch = document.getElementById("autoplaySwitch");
  const playlistBadge = document.getElementById("playlistBadge");
  const currentPlaylistName = document.getElementById("currentPlaylistName");
  const prevVideoBtn = document.getElementById("prevVideoBtn");
  const nextVideoBtn = document.getElementById("nextVideoBtn");

  // Variables globales
  let currentProfile = null;
  let playlists = [];
  let currentPlaylistVideos = [];
  let currentVideoIndex = -1;
  let searchResultVideos = [];

  // Inicialización
  init();

  /**
   * Inicializa la página
   */
  function init() {
    // Obtener información del perfil del localStorage
    const profileData = JSON.parse(localStorage.getItem("currentProfile"));

    if (!profileData || !profileData.pin) {
      // Si no hay perfil seleccionado, redirigir a la selección de perfiles
      window.location.href = "profileSelection.html";
      return;
    }

    currentProfile = profileData;

    // Verificar si existe token
    const token = localStorage.getItem("token");
    console.log("¿Existe token?", !!token);

    if (!token) {
      // Si no hay token de administrador, intentar obtenerlo
      // Esto es solo temporal para depuración
      console.error("No hay token de administrador en localStorage");
      alert(
        "No se encontró el token de administrador. Por favor, inicie sesión nuevamente."
      );
      window.location.href = "../shared/login.html"; // Redirigir a la página de inicio de sesión
      return;
    }

    // Mostrar información del perfil
    displayProfileInfo();

    // Cargar playlists asignadas al perfil
    loadPlaylists();

    // Configurar event listeners
    setupEventListeners();
  }

  /**
   * Muestra la información del perfil en la interfaz
   */
  function displayProfileInfo() {
    if (!currentProfile) return;

    // Actualizar nombre de perfil
    welcomeTitle.textContent = `¡Hola, ${currentProfile.full_name}!`;
    profileName.textContent = currentProfile.full_name;

    // Mostrar avatar
    navProfileAvatar.innerHTML = `<img src="${currentProfile.avatar}" alt="${currentProfile.full_name}" class="profile-avatar-img">`;
  }

  /**
   * Configura los event listeners
   */
  function setupEventListeners() {
    // Salir del perfil
    exitProfileBtn.addEventListener("click", function () {
      sessionStorage.removeItem("adminPinVerified");
      sessionStorage.removeItem("adminPinVerifiedTime");
      localStorage.removeItem("currentProfile");
      window.location.href = "profileSelection.html";
    });

    // Búsqueda de videos
    searchButton.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        handleSearch();
      }
    });

    // Cerrar resultados de búsqueda
    closeSearchBtn.addEventListener("click", function () {
      searchResultsSection.style.display = "none";
      searchInput.value = "";
      
      document.getElementById("playlistsContainer").style.display = "block";
  });

    // Evento para reproducción automática
    autoplaySwitch.addEventListener("change", function () {
      // Se utilizará en la reproducción de videos
    });

    // Botones de navegación de videos
    prevVideoBtn.addEventListener("click", playPreviousVideo);
    nextVideoBtn.addEventListener("click", playNextVideo);

    // Configurar evento para cerrar modal de video
    const videoPlayerModalInstance = new bootstrap.Modal(videoPlayerModal);
    videoPlayerModal.addEventListener("hidden.bs.modal", function () {
      // Detener la reproducción del video cuando se cierra el modal
      videoPlayer.innerHTML = "";
      currentVideoIndex = -1;
    });
  }

  /**
   * Carga las playlists asignadas al perfil
   */
  async function loadPlaylists() {
    try {
      console.log(
        "Cargando playlists para el perfil:",
        currentProfile.full_name
      );
      console.log("PIN utilizado:", currentProfile.pin);
      console.log("Profile ID:", currentProfile._id);

      // Obtenemos el token del administrador para mayor compatibilidad
      const token = localStorage.getItem("token");

      // Importante: Asegurarnos de usar el endpoint correcto que filtra por ID del perfil
      const response = await fetch(
        `http://localhost:3000/api/restricted/playlists?profileId=${currentProfile._id}`,
        {
          method: "GET",
          headers: {
            "x-restricted-pin": currentProfile.pin,
            "Authorization": `Bearer ${token}`, // Añadimos el token del administrador
          },
        }
      );

      // Log para depuración
      console.log("Respuesta de la API:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error de API:", errorText);
        throw new Error(
          `Error al cargar las playlists: ${response.status} ${response.statusText}`
        );
      }

      playlists = await response.json();
      console.log("Playlists recibidas:", playlists);

      // Ocultar el indicador de carga
      loadingIndicator.style.display = "none";

      // Mostrar playlists
      if (playlists && playlists.length > 0) {
        renderPlaylists(playlists);
      } else {
        console.log("No se encontraron playlists para este perfil");
        noPlaylistsMessage.style.display = "block";
      }
    } catch (error) {
      console.error("Error al cargar playlists:", error);
      loadingIndicator.style.display = "none";
      noPlaylistsMessage.style.display = "block";

      // Mostrar mensaje de error más específico
      noPlaylistsMessage.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>No se pudieron cargar las playlists</h3>
                    <p>Hubo un problema al comunicarse con el servidor. ${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Intentar de nuevo
                    </button>
                </div>
            `;
    }
  }

  /**
   * Renderiza las playlists en la interfaz
   * @param {Array} playlists - Lista de playlists
   */
  function renderPlaylists(playlists) {
    // Contenedor principal para todas las secciones de playlist
    const playlistSectionsContainer = document.createElement("div");

    // Para cada playlist, crear una sección
    playlists.forEach((playlist) => {
      // Crear sección de playlist
      const playlistSection = document.createElement("div");
      playlistSection.className = "playlist-section mb-5";

      // Encabezado de la sección
      const sectionHeader = document.createElement("div");
      sectionHeader.className =
        "section-header d-flex justify-content-between align-items-center mb-3";
      sectionHeader.innerHTML = `
                <h2 class="section-title">
                    <i class="bi bi-collection-play me-2"></i> ${playlist.name}
                </h2>
                <span class="badge bg-primary rounded-pill video-count">${
                  playlist.videoCount || 0
                } videos</span>
            `;

      // Contenedor para los videos de esta playlist
      const videosRow = document.createElement("div");
      videosRow.className = "row g-4";
      videosRow.id = `playlist-${playlist._id}-videos`;

      // Añadir un indicador de carga para los videos
      videosRow.innerHTML = `
                <div class="col-12 text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando videos...</span>
                    </div>
                    <p class="mt-2">Cargando videos...</p>
                </div>
            `;

      // Añadir sección al contenedor principal
      playlistSection.appendChild(sectionHeader);
      playlistSection.appendChild(videosRow);
      playlistSectionsContainer.appendChild(playlistSection);

      // Cargar videos para esta playlist
      loadVideosForPlaylist(playlist._id, videosRow);
    });

    // Reemplazar el contenido del contenedor de playlists
    playlistsContainer.innerHTML = "";
    playlistsContainer.appendChild(playlistSectionsContainer);
  }

  /**
   * Carga los videos para una playlist específica
   * @param {string} playlistId - ID de la playlist
   * @param {HTMLElement} container - Contenedor donde mostrar los videos
   */
  async function loadVideosForPlaylist(playlistId, container) {
    try {
      console.log(`Cargando videos para playlist: ${playlistId}`);

      // Obtenemos el token del administrador para mayor compatibilidad
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/restricted/videos?playlistId=${playlistId}`,
        {
          method: "GET",
          headers: {
            "x-restricted-pin": currentProfile.pin,
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      // Log para depuración
      console.log(
        "Respuesta de API de videos:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error de API (videos):", errorText);
        throw new Error(
          `Error al cargar los videos: ${response.status} ${response.statusText}`
        );
      }

      const videos = await response.json();
      console.log(`Videos recibidos para playlist ${playlistId}:`, videos);

      // Limpiar el contenedor
      container.innerHTML = "";

      if (!videos || videos.length === 0) {
        console.log(`No hay videos en la playlist ${playlistId}`);
        // Mostrar mensaje de que no hay videos
        container.innerHTML = `
                    <div class="col-12">
                        <div class="empty-playlist">
                            <i class="bi bi-camera-video-off"></i>
                            <p>No hay videos en esta playlist</p>
                        </div>
                    </div>
                `;
        return;
      }

      // Renderizar cada video
      videos.forEach((video) => {
        const videoCard = createVideoCard(video, playlistId);
        container.appendChild(videoCard);
      });
    } catch (error) {
      console.error("Error al cargar videos:", error);
      container.innerHTML = `
                <div class="col-12">
                    <div class="empty-playlist">
                        <i class="bi bi-exclamation-triangle"></i>
                        <p>Error al cargar los videos: ${error.message}</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadVideosForPlaylist('${playlistId}', this.parentNode.parentNode.parentNode)">
                            <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                        </button>
                    </div>
                </div>
            `;
    }
  }

  /**
   * Crea un elemento de tarjeta de video
   * @param {Object} video - Datos del video
   * @param {string} playlistId
   * @returns {HTMLElement}
   */
  function createVideoCard(video, playlistId) {
    // Crear columna para el video
    const videoCol = document.createElement("div");
    videoCol.className = "col-md-3 col-sm-6";

    // Obtener el ID de YouTube para la miniatura
    const youtubeId = extractYouTubeId(video.youtubeUrl);
    const thumbnailUrl = youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
      : "path/to/default-thumbnail.jpg";

    // Construir la tarjeta de video
    videoCol.innerHTML = `
            <div class="video-card" data-video-id="${
              video._id
            }" data-playlist-id="${playlistId}">
                <div class="video-thumbnail">
                    <img src="${thumbnailUrl}" alt="${
      video.name
    }" class="video-thumbnail-img">
                    <div class="play-overlay">
                        <i class="bi bi-play-circle-fill"></i>
                    </div>
                </div>
                <div class="video-info">
                    <h5 class="video-title">${video.name}</h5>
                    <p class="video-playlist-name">
                        <i class="bi bi-collection-play"></i> ${getPlaylistName(
                          playlistId
                        )}
                    </p>
                </div>
            </div>
        `;

    // Añadir evento click para reproducir el video
    const videoCard = videoCol.querySelector(".video-card");
    videoCard.addEventListener("click", function () {
      const videoId = this.getAttribute("data-video-id");
      const plId = this.getAttribute("data-playlist-id");
      playVideo(videoId, plId);
    });

    return videoCol;
  }

  /**
   * Obtiene el nombre de una playlist por su ID
   * @param {string} playlistId - ID de la playlist
   * @returns {string} - Nombre de la playlist
   */
  function getPlaylistName(playlistId) {
    const playlist = playlists.find((p) => p._id === playlistId);
    return playlist ? playlist.name : "Playlist";
  }

  /**
   * Extrae el ID de video de una URL de YouTube
   * @param {string} url - URL del video
   * @returns {string|null} - ID del video o null si no es válida
   */
  function extractYouTubeId(url) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  }

  /**
   * Maneja la búsqueda de videos
   */
  async function handleSearch() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        // Mostrar sección de resultados con indicador de carga
        searchResultsSection.style.display = "block";
        
        document.getElementById("playlistsContainer").style.display = "none";
        
        searchResults.innerHTML = `
            <div class="col-12 text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <p class="mt-2">Buscando "${searchTerm}"...</p>
            </div>
        `;

      // Realizar la búsqueda
      const response = await fetch(
        `http://localhost:3000/api/restricted/videos?search=${encodeURIComponent(
          searchTerm
        )}`,
        {
          method: "GET",
          headers: {
            "x-restricted-pin": currentProfile.pin,
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al buscar videos");
      }

      const videos = await response.json();
      searchResultVideos = videos;

      // Mostrar resultados
      searchResults.innerHTML = "";

      if (videos.length === 0) {
        searchResults.innerHTML = `
                    <div class="col-12">
                        <div class="empty-state">
                            <i class="bi bi-search"></i>
                            <h3>No se encontraron resultados</h3>
                            <p>Intenta con otra búsqueda</p>
                        </div>
                    </div>
                `;
        return;
      }

      // Renderizar cada video encontrado
      videos.forEach((video, index) => {
        // Determinar a qué playlist pertenece el video
        const playlistId = video.playlistId;

        const videoCard = createVideoCard(video, playlistId);
        videoCard.classList.add("search-result");
        searchResults.appendChild(videoCard);
      });
    } catch (error) {
      console.error("Error:", error);
      searchResults.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Error al buscar</h3>
                        <p>Ocurrió un problema al realizar la búsqueda</p>
                        <button class="btn btn-primary mt-3" onclick="handleSearch()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Intentar de nuevo
                        </button>
                    </div>
                </div>
            `;
    }
  }

  /**
   * Reproduce un video
   * @param {string} videoId - ID del video
   * @param {string} playlistId - ID de la playlist
   */
  async function playVideo(videoId, playlistId) {
    try {
      // Primero, cargar los videos de la playlist para la navegación
      await loadPlaylistVideosForNavigation(playlistId);

      // Luego, buscar el video en la lista
      currentVideoIndex = currentPlaylistVideos.findIndex(
        (v) => v._id === videoId
      );

      if (currentVideoIndex === -1) {
        throw new Error("Video no encontrado en la playlist");
      }

      const video = currentPlaylistVideos[currentVideoIndex];

      // Obtener el nombre de la playlist
      const playlist = playlists.find((p) => p._id === playlistId);

      // Actualizar información en el modal
      videoTitle.textContent = video.name;
      videoDescription.textContent = video.description || "Sin descripción";

      // Mostrar nombre de la playlist en el badge
      if (playlist) {
        currentPlaylistName.textContent = playlist.name;
        playlistBadge.classList.remove("d-none");
      } else {
        playlistBadge.classList.add("d-none");
      }

      // Habilitar/deshabilitar botones de navegación
      updateNavigationButtons();

      // Obtener el ID de YouTube
      const youtubeId = extractYouTubeId(video.youtubeUrl);

      if (!youtubeId) {
        throw new Error("URL de YouTube inválida");
      }

      // Crear iframe para el reproductor
      const autoplay = autoplaySwitch.checked ? "1" : "0";
      videoPlayer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay}&rel=0" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;

      // Mostrar el modal
      const modalInstance = new bootstrap.Modal(videoPlayerModal);
      modalInstance.show();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al reproducir el video");
    }
  }

  /**
   * Carga los videos de una playlist para la navegación
   * @param {string} playlistId - ID de la playlist
   */
  async function loadPlaylistVideosForNavigation(playlistId) {
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/restricted/videos?playlistId=${playlistId}`,
        {
          method: "GET",
          headers: {
            "x-restricted-pin": currentProfile.pin,
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar los videos de la playlist");
      }

      currentPlaylistVideos = await response.json();
    } catch (error) {
      console.error("Error:", error);
      currentPlaylistVideos = [];
    }
  }

  /**
   * Actualiza el estado de los botones de navegación
   */
  function updateNavigationButtons() {
    if (currentVideoIndex <= 0) {
      prevVideoBtn.setAttribute("disabled", "disabled");
    } else {
      prevVideoBtn.removeAttribute("disabled");
    }

    if (currentVideoIndex >= currentPlaylistVideos.length - 1) {
      nextVideoBtn.setAttribute("disabled", "disabled");
    } else {
      nextVideoBtn.removeAttribute("disabled");
    }
  }

  /**
   * Reproduce el video anterior en la playlist
   */
  function playPreviousVideo() {
    if (currentVideoIndex > 0) {
      currentVideoIndex--;
      const video = currentPlaylistVideos[currentVideoIndex];

      // Actualizar información en el modal
      videoTitle.textContent = video.name;
      videoDescription.textContent = video.description || "Sin descripción";

      // Obtener el ID de YouTube
      const youtubeId = extractYouTubeId(video.youtubeUrl);

      if (youtubeId) {
        // Crear iframe para el reproductor
        const autoplay = autoplaySwitch.checked ? "1" : "0";
        videoPlayer.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay}&rel=0" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
      }

      // Actualizar botones de navegación
      updateNavigationButtons();
    }
  }

  /**
   * Reproduce el siguiente video en la playlist
   */
  function playNextVideo() {
    if (currentVideoIndex < currentPlaylistVideos.length - 1) {
      currentVideoIndex++;
      const video = currentPlaylistVideos[currentVideoIndex];

      // Actualizar información en el modal
      videoTitle.textContent = video.name;
      videoDescription.textContent = video.description || "Sin descripción";

      // Obtener el ID de YouTube
      const youtubeId = extractYouTubeId(video.youtubeUrl);

      if (youtubeId) {
        // Crear iframe para el reproductor
        const autoplay = autoplaySwitch.checked ? "1" : "0";
        videoPlayer.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay}&rel=0" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
      }

      // Actualizar botones de navegación
      updateNavigationButtons();
    }
  }
});