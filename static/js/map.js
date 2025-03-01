const socket = io();

const maxBounds = [
    [-120, -180],  // Southwest coordinates (min lat, min lng)
    [120, 180]     // Northeast coordinates (max lat, max lng)
];

const map = L.map('map', {
    center: [20, 0],  // Center the map on the world
    zoom: 2,          // Set initial zoom level
    minZoom: 2.5,     // Minimum zoom (just enough to show the world)
    maxZoom: 5,       // Maximum zoom (keep the world view)
    dragging: true,   // Enable dragging, but will be restricted by maxBounds
    touchZoom: true,
    zoomControl: false, // Disable zooming controls
    scrollWheelZoom: true, // Enable zoom with mouse wheel
    doubleClickZoom: false, // Disable zooming on double click
    boxZoom: false,  // Disable zooming by drawing a box
    keyboard: false,  // Disable keyboard interaction
    attributionControl: false, // Optionally, hide attribution control
    maxBounds: maxBounds,  // Set the max bounds (the invisible barrier)
    maxBoundsViscosity: 0.5  // Make the max bounds "sticky"
});

// Satellite Map Layer from Esri
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com">Esri</a> & OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Load country borders (GeoJSON)
let selectedCountryLayer = null;  // Variable to store the previously selected country layer

fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
    .then(response => response.json())
    .then(data => {
        const geojsonLayer = L.geoJSON(data, {
            style: function (feature) {
                return {
                    color: "#FFFFFF", // Default border color
                    weight: 2,
                    fillOpacity: 0
                };
            },
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', function() {
                    layer.setStyle({ color: "#FFFFFF", weight: 3, fillOpacity: 0.4 });
                });
                layer.on('mouseout', function() {
                    if (selectedCountryLayer !== layer) {
                        layer.setStyle({ color: "#FFFFFF", weight: 2, fillOpacity: 0 });
                    }
                });

                // Add click event to zoom and display info about the country
                layer.on('click', function () {
                    // Reset style for the previously selected country (if any)
                    if (selectedCountryLayer && selectedCountryLayer !== layer) {
                        selectedCountryLayer.setStyle({ color: "#FFFFFF", weight: 2, fillOpacity: 0 });
                    }

                    // Get the bounds of the clicked country and adjust zoom level
                    const bounds = layer.getBounds();  // Get the bounds of the clicked country
                    map.fitBounds(bounds, { padding: [50, 50] });  // Adjust zoom and position to fit the country

                    const countryName = feature.properties.name;
                    const countryCode = feature.properties.iso_a2;
                    fetchCountryInfo(countryCode);

                    // Set the clicked country as the selected layer
                    selectedCountryLayer = layer;
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

function fetchCountryInfo(countryCode) {
    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
        .then(response => response.json())
        .then(countryData => {
            const countryName = countryData[0].name.common;
            const flagUrl = countryData[0].flags.png;

            // Update the sidebar with information about the clicked region
            document.getElementById("info").innerHTML = `
                <div class="country-info">
                    <img src="${flagUrl}" alt="${countryName} Flag">
                    <h3>${countryName}</h3>
                </div>
                <p><strong>Country:</strong> ${countryName}</p>
            `;

            // Show the sidebar with animation
            document.getElementById("sidebar").classList.add("open");
            document.getElementById("toggleSidebar").innerHTML = '×';
            document.getElementById("map").classList.add("shifted");
        })
        .catch(error => console.error('Error fetching country details:', error));

    // Send region info to the server
    
}

function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Reverse geocode using Nominatim API
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => {
            const region = data.address ? data.address.country : "Unknown region";

            // Fetch country details using the Restcountries API
            const countryCode = data.address.country_code.toUpperCase(); // Get country code (ISO 3166-1 alpha-2)

            fetchCountryInfo(countryCode);

            // Send region info to the server
            socket.emit('region_clicked', { lat, lng, region });
        })
        .catch(error => console.error('Error fetching region data:', error));
}

map.on('click', onMapClick);

// Toggle sidebar visibility on button click
document.getElementById('toggleSidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const mapElement = document.getElementById('map');
    const toggleButton = document.getElementById('toggleSidebar');

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        mapElement.classList.remove('shifted');
        toggleButton.innerHTML = '≡';  // Change button text to '≡' when closed
    } else {
        sidebar.classList.add('open');
        mapElement.classList.add('shifted');
        toggleButton.innerHTML = '×';  // Change button text to '×' when opened
    }
});
