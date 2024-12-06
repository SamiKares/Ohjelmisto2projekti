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
let distancetraveled = 0
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
    addHours(3)
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
                    console.log(weatherData)
                    //ui update tesmi töss
                    document.getElementById('airportcondition').innerHTML = `${weatherData.weather[0].description}`;
                    document.getElementById('airport-temp-print').innerHTML = `${weatherData.main.temp.toFixed(1)}°C`;
                    document.getElementById('airport-wind-print').innerHTML = `${weatherData.wind.speed}M/S`;
                    document.getElementById('airport-name').innerHTML = `${airport.name}`
                    const flyButton = popupContent.querySelector('.fly-to');
                    flyButton.addEventListener('click', () => {
                        const adderdistance = parseFloat(`${airport.distance.toFixed(2)}`)
                        distancetraveled += adderdistance
                        console.log(`${airport.distance.toFixed(2)}`)
                        flyToAirport(airport.code);
                        document.getElementById('distance-travel').textContent = `${Math.round(distancetraveled)} Km `
                        console.log(distancetraveled)
                        const flightTime = adderdistance/500
                        console.log(flightTime)
                        addHours(flightTime)
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
//lisätty react motion scripta l.motion by Igor Vladyka
async function flyToAirport(code) {
    try {
        // nykyinen sijainti muuttujaan
        const fromAirport = await fetch(`http://127.0.0.1:3000/currentloca?icao=${currentloca}`);
        const fromData = await fromAirport.json();
        console.log(fromAirport)
        // määränpää muuttujaan
        const toAirport = await fetch(`http://127.0.0.1:3000/currentloca?icao=${code}`);
        const toData = await toAirport.json();

        // luo reitin
        const coordinates = [
            [fromData.latitude_deg, fromData.longitude_deg],
            [toData.latitude_deg, toData.longitude_deg]
        ];
/*
        // puhdistus
        map.eachLayer((layer) => {
            if (layer instanceof L.Motion.Polyline) {
                map.removeLayer(layer);
            }
        });
*/
const motionPolyline = L.motion.polyline(coordinates, {
    // Style options
    color: '#ff0000',  // or 'khaki' depending on your preference
    weight: 2,
    dashArray: '5, 10'
}, {
    // Motion options
    auto: true,
    duration: 3000,    // 7 seconds animation (using the longer duration from second example)
    easing: L.Motion.Ease.easeInOutQuart
}, {
    // Marker options
    removeOnEnd: true,
    showMarker: true,
    icon: L.divIcon({
        html: "<i class='fas fa-plane' style='transform: ; font-size: 24px; color: black;'></i>",
        iconSize: L.point(24, 24),
        iconAnchor: [12, 12],
        className: 'moving-plane'

    })
});

// Add to map and fit bounds
motionPolyline.addTo(map);
map.fitBounds(coordinates);
        const response = await fetch(`http://127.0.0.1:3000/fly?to=${code}`, {
            method: 'GET'
        });

        if (response.ok) {
            console.log(`Flying to ${code}`);
            currentloca = code;
            setTimeout(async () => {
                await currentLocation();
                await displayAirports();
            }, 4000);  // Same as animation duration
        }
    } catch (error) {
        console.error('Error during flight:', error);
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
let totalHours = 0;

function addHours(hoursToAdd) {
    totalHours += hoursToAdd;
    document.getElementById('time').textContent =
        `Hours passed: ${Math.round(totalHours)}`;
}
document.addEventListener('DOMContentLoaded', displayAirports);