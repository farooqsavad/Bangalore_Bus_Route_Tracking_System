// Traffic Charts for Transport Analytics Platform

// Traffic Map Initialization
function initTrafficMap() {
    const mapContainer = document.getElementById('traffic-map');
    if (!mapContainer) return;
    
    // Create a map centered on Bengaluru
    const map = L.map(mapContainer).setView([12.9716, 77.5946], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Define traffic hotspots with congestion levels
    const trafficHotspots = [
        {name: "Silk Board", lat: 12.9170, lng: 77.6226, congestion: 95},
        {name: "KR Puram", lat: 12.9987, lng: 77.6644, congestion: 90},
        {name: "Hebbal", lat: 13.0358, lng: 77.5920, congestion: 85},
        {name: "Marathahalli", lat: 12.9591, lng: 77.6974, congestion: 88},
        {name: "Majestic", lat: 12.9767, lng: 77.5713, congestion: 80},
        {name: "Electronic City", lat: 12.8399, lng: 77.6770, congestion: 75},
        {name: "Whitefield", lat: 12.9698, lng: 77.7500, congestion: 82},
        {name: "Bannerghatta Road", lat: 12.8933, lng: 77.5978, congestion: 78},
        {name: "Outer Ring Road", lat: 12.9352, lng: 77.6245, congestion: 92},
        {name: "MG Road", lat: 12.9747, lng: 77.6080, congestion: 70}
    ];
    
    // Add markers for traffic hotspots with color based on congestion level
    trafficHotspots.forEach(spot => {
        const congestionColor = getCongestionColor(spot.congestion);
        
        const marker = L.circleMarker([spot.lat, spot.lng], {
            radius: 10,
            fillColor: congestionColor,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`<b>${spot.name}</b><br>Congestion: ${spot.congestion}%`);
    });
    
    // Add major roads with traffic intensity
    const majorRoads = [
        {
            name: "Outer Ring Road",
            path: [
                [13.0358, 77.5920], // Hebbal
                [13.0277, 77.6352], // Kalyan Nagar
                [12.9987, 77.6644], // KR Puram
                [12.9591, 77.6974], // Marathahalli
                [12.9352, 77.6245], // Koramangala
                [12.9170, 77.6226]  // Silk Board
            ],
            congestion: 90
        },
        {
            name: "Hosur Road",
            path: [
                [12.9170, 77.6226], // Silk Board
                [12.8933, 77.5978], // Bannerghatta Road Junction
                [12.8399, 77.6770]  // Electronic City
            ],
            congestion: 85
        },
        {
            name: "Whitefield Road",
            path: [
                [12.9987, 77.6644], // KR Puram
                [12.9698, 77.7500]  // Whitefield
            ],
            congestion: 80
        }
    ];
    
    // Add polylines for major roads
    majorRoads.forEach(road => {
        const congestionColor = getCongestionColor(road.congestion);
        
        const polyline = L.polyline(road.path, {
            color: congestionColor,
            weight: 5,
            opacity: 0.7
        }).addTo(map);
        
        polyline.bindPopup(`<b>${road.name}</b><br>Congestion: ${road.congestion}%`);
    });
    
    // Add legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        
        const grades = [0, 25, 50, 75, 90];
        const labels = [];
        
        div.innerHTML = '<h4 style="margin:0 0 10px 0">Traffic Congestion</h4>';
        
        for (let i = 0; i < grades.length; i++) {
            const from = grades[i];
            const to = grades[i + 1];
            
            labels.push(
                '<i style="background:' + getCongestionColor(from + 1) + '; width:20px; height:10px; display:inline-block; margin-right:5px"></i> ' +
                from + (to ? '&ndash;' + to + '%' : '+%')
            );
        }
        
        div.innerHTML += labels.join('<br>');
        return div;
    };
    legend.addTo(map);
}

// Helper function to get color based on congestion level
function getCongestionColor(congestion) {
    return congestion > 90 ? '#d73027' :
           congestion > 75 ? '#fc8d59' :
           congestion > 50 ? '#fee08b' :
           congestion > 25 ? '#d9ef8b' :
                             '#91cf60';
}

// Congestion Hotspots Chart
function initCongestionHotspotsChart() {
    const ctx = document.getElementById('congestion-hotspots-chart');
    if (!ctx) return;
    
    const locations = [
        'Silk Board', 'KR Puram', 'Hebbal', 'Marathahalli', 
        'Majestic', 'Electronic City', 'Whitefield', 'Bannerghatta Road'
    ];
    
    const morningData = [95, 90, 85, 88, 80, 75, 82, 78];
    const eveningData = [92, 95, 90, 85, 75, 85, 88, 80];
    const weekendData = [60, 65, 55, 70, 65, 50, 60, 75];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [
                {
                    label: 'Morning Peak (8-10 AM)',
                    data: morningData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: 'Evening Peak (5-8 PM)',
                    data: eveningData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: 'Weekend Average',
                    data: weekendData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Traffic Congestion by Location (%)',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '% congestion';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Congestion Level (%)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Traffic Flow Chart
function initTrafficFlowChart() {
    const ctx = document.getElementById('traffic-flow-chart');
    if (!ctx) return;
    
    const hours = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM'];
    
    const silkBoardData = [30, 55, 95, 90, 70, 50, 45, 40, 45, 60, 75, 85, 95, 90, 70, 50, 30];
    const hebbalData = [25, 50, 85, 80, 60, 45, 40, 35, 40, 50, 70, 90, 85, 75, 60, 40, 25];
    const whitefieldData = [20, 45, 80, 85, 65, 40, 35, 30, 35, 45, 65, 80, 90, 85, 65, 45, 30];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Silk Board',
                    data: silkBoardData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Hebbal',
                    data: hebbalData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Whitefield',
                    data: whitefieldData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Traffic Flow Throughout the Day',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '% congestion';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Congestion Level (%)'
                    }
                }
            }
        }
    });
}

// Delay Prediction Chart
function initDelayPredictionChart() {
    const ctx = document.getElementById('delay-prediction-chart');
    if (!ctx) return;
    
    const routes = [
        'Majestic → Electronic City', 
        'Whitefield → Majestic', 
        'Hebbal → Silk Board',
        'KR Puram → Majestic',
        'Bannerghatta → Hebbal',
        'Electronic City → Whitefield'
    ];
    
    const normalTimeData = [45, 55, 60, 40, 65, 70];
    const peakTimeData = [75, 90, 95, 65, 95, 110];
    const weekendData = [35, 45, 50, 35, 55, 60];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: routes,
            datasets: [
                {
                    label: 'Normal Hours',
                    data: normalTimeData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                },
                {
                    label: 'Peak Hours',
                    data: peakTimeData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: 'Weekend',
                    data: weekendData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Travel Time Comparison by Route (minutes)',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Travel Time (minutes)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}