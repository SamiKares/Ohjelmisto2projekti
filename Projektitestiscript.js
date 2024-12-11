//valitse kartan alkupaikka
 const map = L.map('map', {
    worldCopyJump: true,
    maxBounds: [[-90, -180], [90, 180]],
    lang: 'en',
    center: [51.505, -0.09], // London coordinates
    zoom: 6,
    minZoom: 3,
    maxZoom: 10,
    zoomControl: true,
    zoomDelta: 0.5,
    zoomSnap: 0.5,
    wheelDebounceTime: 40,
    continuousWorld: true    // Add this
});
//tää on vaan testiä varte
let distancetraveled = 0
let currentLocationMarker = null;
let airportMarkers = [];
let currentloca = 'EGGW'


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    lang: 'en'
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
    travelData(2)
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

                    const tempGIF = document.querySelector('#airport-temp img');
                    const conditionGIF = document.querySelector('#airport-conditions img');
                    const windGIF = document.querySelector('#airport-wind img');

                    const temp = weatherData.main.temp;
                    const condition = weatherData.weather[0].main.toLowerCase();
                    const windSpeed = weatherData.wind.speed;

                    if (temp < 0) {
                        tempGIF.src = 'img/cold.gif';
                    } else {
                        tempGIF.src = 'img/hot.gif';
                    }

                    if (condition.includes('rain')) {               // checkaa sään ja vaihtaa
                        conditionGIF.src = 'img/rain.gif';          // GIF sen mukaan
                    } else if (condition.includes('cloud')) {
                        conditionGIF.src = 'img/cloudy.gif';
                    } else if (condition.includes('clear')) {
                        conditionGIF.src = 'img/sun.gif';
                    } else if (condition.includes('storm')) {
                        conditionGIF.src = 'img/storm.gif';
                    } else if (condition.includes('snow')) {
                        conditionGIF.src = 'img/snow.gif';
                    } else if (condition.includes('rain')) {
                        conditionGIF.src = 'img/rain.gif';
                    } else {
                        conditionGIF.src = 'img/cloudy.gif';
                    }

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
                        travelData(flightTime)
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

function getIntermediatePoints(start, end, numPoints = 5) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;
        const lat = start[0] + (end[0] - start[0]) * fraction;
        const lng = start[1] + (end[1] - start[1]) * fraction;
        points.push([lat, lng]);
    }
    return points;
}

function getIntermediatePoints(start, end, numPoints = 5) {
    let startLng = start[1];
    let endLng = end[1];

    // Special handling for Tokyo to San Francisco (or similar trans-Pacific routes)
    if (startLng > 0 && endLng < 0) {
        endLng += 360; // This makes it go east across the Pacific
    }

    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;
        const lat = start[0] + (end[0] - start[0]) * fraction;
        let lng = startLng + (endLng - startLng) * fraction;

        // Normalize longitude back to -180/180 range
        lng = ((lng + 540) % 360) - 180;
        points.push([lat, lng]);
    }
    return points;
}
async function flyToAirport(code) {
    try {
        const fromAirport = await fetch(`http://127.0.0.1:3000/currentloca?icao=${currentloca}`);
        const fromData = await fromAirport.json();

        const toAirport = await fetch(`http://127.0.0.1:3000/currentloca?icao=${code}`);
        const toData = await toAirport.json();

        let points;

        // If crossing the Pacific (e.g., from Japan to USA)
        if (fromData.longitude_deg > 100 && toData.longitude_deg < -100) {
            // Create path through the Pacific
            points = [
                [fromData.latitude_deg, fromData.longitude_deg],                // Start point
                [fromData.latitude_deg, 179.9],                                // Before dateline
                [(fromData.latitude_deg + toData.latitude_deg)/2, -179.9],     // After dateline
                [toData.latitude_deg, toData.longitude_deg]                    // End point
            ];
        } else {
            // Normal route for all other cases
            points = [
                [fromData.latitude_deg, fromData.longitude_deg],
                [toData.latitude_deg, toData.longitude_deg]
            ];
        }

        const motionPolyline = L.motion.polyline(points, {
            color: '#ff0000',
            weight: 2,
            dashArray: '5, 10'
        }, {
            auto: true,
            duration: 3500,
            easing: L.Motion.Ease.easeInOutQuart
        }, {
            removeOnEnd: true,
            showMarker: true,
            icon: L.divIcon({
                html: "<i class='fas fa-plane' style='font-size: 24px; color: black;'></i>",
                iconSize: L.point(24, 24),
                iconAnchor: [12, 12],
                className: 'moving-plane'
            })
        });

        motionPolyline.addTo(map);
        map.fitBounds(points);

        const response = await fetch(`http://127.0.0.1:3000/fly?to=${code}`, {
            method: 'GET'
        });

        if (response.ok) {
            console.log(`Flying to ${code}`);
            currentloca = code;
            setTimeout(async () => {
                await currentLocation();
                await displayAirports();
            }, 3500);
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

//pelaajan nimi juttu
async function playernamequery() {
    let playerName = prompt("Please enter your name:");
    document.getElementById('player-name').textContent = `Player name: ${playerName}`
}
//matkadata
let totalHours = 0;
let tirednessHours = 0;
let tirednessMeter = 0;

//checkpointin checkaaminen, heh
function updateCheckpoints(currentCheckpointIndex) {
    const checkpoints = document.querySelectorAll('.checkpoint');

    checkpoints.forEach((checkpoint, index) => {
        if (index === currentCheckpointIndex) {
            checkpoint.classList.add('active');
            checkpoint.classList.remove('visited');
        } else if (index < currentCheckpointIndex) {
            checkpoint.classList.add('visited');
            checkpoint.classList.remove('active');
        } else {
            checkpoint.classList.remove('active', 'visited');
        }
    });
}

//peliaika lentoväsymys functio
function travelData(hoursToAdd) {
    totalHours += hoursToAdd;
    tirednessHours += hoursToAdd;
    tirednessMeter = tirednessHours * 5;


    document.getElementById('time').textContent = `Hours passed: ${Math.round(totalHours)}`;
    updateTiredness();


    if (tirednessHours >= 20) {
        alert("olet todella väsynyt sinun täytyy levätä");
        totalHours += 8;
        resetTiredness();
        updateTiredness();
    }
}

document.getElementById('restbutton').addEventListener('click', () => {
    resetTiredness();
    totalHours += 5;
    updateTiredness();
});


function resetTiredness() {
    tirednessMeter = 0;
    tirednessHours = 0;
}

function updateTiredness() {
    document.getElementById('tiredness').textContent =
        `Väsymyksesi: ${Math.round(tirednessMeter)} / 100%`;
}
document.addEventListener('DOMContentLoaded', displayAirports);
playernamequery()

