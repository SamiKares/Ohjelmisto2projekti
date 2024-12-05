//valitse kartan alkupaikka
 const map = L.map('map', {
            center: [51.505, -0.09], // London coordinates
            zoom: 6,
            minZoom: 3,  // Minimum zoom level
            maxZoom: 10, // Maximum zoom level
            zoomControl: true, // Show the default zoom controls
            zoomDelta: 0.5,    // Allow fractional zoom levels
            zoomSnap: 0.5,     // Snap to 0.5 zoom levels
            wheelDebounceTime: 40 // Debounce wheel events
        });
//tää on vaan testiä varte

let currentLocationMarker = null;
let airportMarkers = [];
let currentloca = 'EGGW'

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
//muokkaa easterner datan leafletin muotoo
function transformAirportData(airport) {
    return {
        distance: airport[0],
        name: airport[1],
        code: airport[2],
        country: airport[3],
        latitude: airport[4],
        longitude: airport[5]
    };
}
//piirtää nykyisen sijainnin
async function currentLocation() {
    try {
        if (currentLocationMarker) {
            map.removeLayer(currentLocationMarker);
        }
        const response = await fetch(`http://127.0.0.1:3000/currentloca?icao=${currentloca}`);
        const locationNow = await response.json();

        const locationArray = [
            0,  // etäisyys mahdollisuus
            locationNow.name,
            locationNow.ident,
            locationNow.iso_country,
            locationNow.latitude_deg,
            locationNow.longitude_deg
        ];

        const airport = transformAirportData(locationArray);

        var airportIcon = L.icon({
            iconUrl: 'icons/airport.png',

            iconSize:     [38, 95], // size of the icon
            shadowSize:   [50, 64], // size of the shadow
            iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            shadowAnchor: [4, 62],  // the same for the shadow
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
        currentLocationMarker = L.marker([airport.latitude, airport.longitude], {
            icon: airportIcon
        }).addTo(map);

        marker.bindPopup(`
            <div class="current-airport-popup">
                <h3>${airport.name} (Current)</h3>
                <p>Code: ${airport.code}</p>
                <p>Country: ${airport.country}</p>
            </div>
        `);

    } catch (error) {
        console.error('Error displaying current location:', error);
    }
}
currentLocation()
//easterner leaflettii
async function displayAirports() {
    try {
        airportMarkers.forEach(marker => map.removeLayer(marker));
        airportMarkers = [];

        const response = await fetch('http://127.0.0.1:3000/easterner');
        const airportsObject = await response.json();
        const bounds = [];

        Object.values(airportsObject).forEach((airportData, index) => {
            const airport = transformAirportData(airportData);
            const marker = L.marker([airport.latitude, airport.longitude]).addTo(map);
            airportMarkers.push(marker);
//en tiedä miksi vaatii molemmat mut ei toiminut toisen poistaessa :D
    marker.bindPopup(`
        <div class="airport-popup">
        <h3>${airport.name}</h3>
        <p>Code: ${airport.code}</p>
        <p>Country: ${airport.country}</p>
        <p>Distance: ${airport.distance.toFixed(2)} km</p>
    </div>
`);

    marker.on('popupopen', async function() {
        try {
            const weatherResponse = await fetch(`http://127.0.0.1:3000/weatherat?airport=${airport.code}`);
            const weatherData = await weatherResponse.json();

            const popupContent = document.createElement('div');
            popupContent.className = 'airport-popup';
            popupContent.innerHTML = `
                        <h3>${airport.name}</h3>
                        <p>Code: ${airport.code}</p>
                        <p>Country: ${airport.country}</p>
                        <p>Distance: ${airport.distance.toFixed(2)} km</p>
                        <p>Weather: ${weatherData.main.temp.toFixed(1)}°C, ${weatherData.weather[0].description}</p>
                        <button class="fly-to">Fly here</button>
                    `;

                    const flyButton = popupContent.querySelector('.fly-to');
                    flyButton.addEventListener('click', () => {
                        flyToAirport(airport.code);
                    });

                    marker.setPopupContent(popupContent);
                } catch (error) {
                    console.error('Error fetching weather:', error);
                }
            });

            bounds.push([airport.latitude, airport.longitude]);
        });
        if (bounds.length > 0) {
            map.fitBounds(bounds);
        }
        //tähän pitää flaskaa siirtymä!

        async function flyToAirport(code) {
            const response = await fetch(`http://127.0.0.1:3000/fly?to=${code}`, {
                    method: 'GET'
                })
            const result = await response;
            if (result.ok) {
                console.log(`Flying to ${code}`);
                currentloca = code
                let newLoc = await currentLocation();
                await displayAirports();
                console.log(newLoc)
            }
        }
//errorrororo
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            error: error
        });
        }
}
async function createGame(){
    const response = await fetch(`http://127.0.0.1:3000/create_game`, {
        method: 'GET'
    })
const result = await response;
if (result.ok) {
    console.log(`Created game ${response[0]}`);
}
}
document.addEventListener('DOMContentLoaded', displayAirports);