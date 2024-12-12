'use strict';
//valitse kartan alkupaikka
 const map = L.map('map', {
    worldCopyJump: true,
    //maxBounds: [[-90, -360], [90, 360]],
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

let distancetraveled = 0
let currentLocationMarker = null;
let airportMarkers = [];



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
        const response = await fetch(`http://127.0.0.1:3000/currentloca`);
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
        //console.error('Error displaying current location:', error);
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
                    }                                               // Simppeli sään ja lämpötilan checkaaminen
                                                                    // ja kuvan vaihtaminen

                    if (condition.includes('rain') || condition.includes('sade')) {         
                        conditionGIF.src = 'img/rain.gif';
                    } else if (condition.includes('cloud') || condition.includes('pilvinen')) {
                        conditionGIF.src = 'img/cloudy.gif';
                    } else if (condition.includes('clear') || condition.includes('selkeä')) {
                        conditionGIF.src = 'img/sun.gif';
                    } else if (condition.includes('storm') || condition.includes('ukkonen')) {
                        conditionGIF.src = 'img/storm.gif';
                    } else if (condition.includes('snow') || condition.includes('lumi')) {
                        conditionGIF.src = 'img/snow.gif';
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

async function flyToAirport(code) {
    try {
        const fromAirport = await fetch(`http://127.0.0.1:3000/currentloca`);
        const fromData = await fromAirport.json();

        const toAirport = await fetch(`http://127.0.0.1:3000/destloca?icao=${code}`);
        const toData = await toAirport.json();
        let points;
            points = [
                [fromData.latitude_deg, fromData.longitude_deg],
                [toData.latitude_deg, toData.longitude_deg]
            ];
        let fromLng = fromData.longitude_deg;
        let toLng = toData.longitude_deg;
        if (fromLng > 0 && toLng < -90) {
            const response = await fetch(`http://127.0.0.1:3000/fly?to=${code}`, {
                method: 'GET'
            });
            
            if (response.ok) {
                console.log(`Flying to ${code}`);
                await currentLocation();
                await displayAirports();
            }
        } else {
        const motionPolyline = L.motion.polyline(points, {
            color: '#ff0000',
            weight: 2,
            dashArray: '5, 10',
            noWrap: false
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
            setTimeout(async () => {
                await currentLocation();
                await displayAirports();
            }, 3500);
        }
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

async function pullLoca() {
    try{
        const response = await fetch(`http://127.0.0.1:3000/pull_loca`, {
            method: 'GET'
        });
        if (response.ok) {
            console.log(`Toimii`);
            const jsonvalue = await response.json()
            const json = JSON.parse(jsonvalue)
            const currentIcao = json["location"]
            console.log(currentIcao)
        }
    }
    catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            error: error
        });
        }
}