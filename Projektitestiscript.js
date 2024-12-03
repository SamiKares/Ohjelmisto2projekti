async function gamelooptest() {
        const response = await fetch('http://127.0.0.1:3000/easterner');
        const data = await response.json();
        console.log(data);
}
gamelooptest()
const map = L.map('map').setView([0, 0], 2);

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Function to fetch and display locations
async function displayLocations() {
    try {
        // Replace with your Flask server URL if different
        const response = await fetch('http://127.0.0.1:3000/easterner');
        const locations = await response.json();

        // Bounds to fit all markers
        const bounds = [];

        locations.forEach(location => {
            // Create marker for each location
            // Assuming your location data has 'latitude' and 'longitude' fields
            const marker = L.marker([location.latitude, location.longitude]).addTo(map);

            // Add popup with location info
            marker.bindPopup(`
                <h3>${location.name || 'Location'}</h3>
                <p>${location.description || ''}</p>
            `);

            // Add coordinates to bounds
            bounds.push([location.latitude, location.longitude]);
        });

        // Fit map to show all markers if there are any
        if (bounds.length > 0) {
            map.fitBounds(bounds);
        }

    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Load locations when page loads
document.addEventListener('DOMContentLoaded', displayLocations);