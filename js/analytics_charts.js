// Enhanced Analytics Charts for Transport Analytics Platform

// Network Performance Chart with improved visualization
function initEnhancedNetworkPerformanceChart() {
    const ctx = document.getElementById('network-performance-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
            datasets: [
                {
                    label: 'On-time Performance',
                    data: [88, 85, 90, 92, 89, 91, 93, 94, 92, 95, 94, 96],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Network Efficiency',
                    data: [75, 78, 80, 82, 84, 83, 86, 88, 87, 89, 90, 91],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Passenger Satisfaction',
                    data: [70, 72, 75, 78, 80, 82, 85, 87, 86, 88, 89, 90],
                    borderColor: '#f1c40f',
                    backgroundColor: 'rgba(241, 196, 15, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Network Performance Metrics Over Time',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Performance (%)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Enhanced Route Utilization Chart
function initEnhancedRouteUtilizationChart() {
    const ctx = document.getElementById('route-utilization-chart');
    if (!ctx) return;
    
    const routes = [
        'Route 500A (Majestic-Whitefield)', 
        'Route 500B (Majestic-Electronic City)', 
        'Route 501 (Majestic-Yelahanka)',
        'Route 502 (Majestic-Banashankari)', 
        'Route 503 (Whitefield-Hebbal)', 
        'Route 504 (Whitefield-Banashankari)',
        'Route 505 (Jayanagar-Electronic City)',
        'Route 506 (Jayanagar-Hebbal)'
    ];
    
    const utilizationData = [85, 92, 78, 65, 88, 72, 80, 75];
    const targetData = Array(routes.length).fill(90);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: routes,
            datasets: [
                {
                    label: 'Current Utilization (%)',
                    data: utilizationData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgb(52, 152, 219)',
                    borderWidth: 1,
                    borderRadius: 5
                },
                {
                    label: 'Target Utilization',
                    data: targetData,
                    type: 'line',
                    borderColor: 'rgba(231, 76, 60, 0.7)',
                    borderWidth: 2,
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(231, 76, 60, 0.7)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Route Capacity Utilization Analysis',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '%';
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
                        text: 'Utilization (%)',
                        font: {
                            weight: 'bold'
                        }
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

// Enhanced Passenger Demographics Chart
function initEnhancedPassengerDemographicsChart() {
    const ctx = document.getElementById('passenger-demographics-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Students', 'Working Professionals', 'Seniors', 'Tourists', 'Others'],
            datasets: [{
                data: [30, 45, 15, 5, 5],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f1c40f',
                    '#e74c3c',
                    '#9b59b6'
                ],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Passenger Demographics Distribution',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Enhanced Fare Collection Chart
function initEnhancedFareCollectionChart() {
    const ctx = document.getElementById('fare-collection-chart');
    if (!ctx) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const regularFares = [320, 350, 375, 390, 410, 430, 450, 470, 455, 440, 420, 435];
    const expressFares = [150, 165, 180, 195, 210, 225, 240, 255, 245, 230, 215, 225];
    const specialFares = [50, 55, 60, 65, 70, 75, 80, 85, 80, 75, 70, 75];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Regular Routes',
                    data: regularFares,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgb(52, 152, 219)',
                    borderWidth: 1
                },
                {
                    label: 'Express Routes',
                    data: expressFares,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgb(46, 204, 113)',
                    borderWidth: 1
                },
                {
                    label: 'Special Services',
                    data: specialFares,
                    backgroundColor: 'rgba(241, 196, 15, 0.7)',
                    borderColor: 'rgb(241, 196, 15)',
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
                    text: 'Monthly Fare Collection by Service Type',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.raw + ' lakhs';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹ lakhs)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    stacked: true
                },
                x: {
                    stacked: true
                }
            }
        }
    });
}

// Enhanced Operational Costs Chart
function initEnhancedOperationalCostsChart() {
    const ctx = document.getElementById('operational-costs-chart');
    if (!ctx) return;
    
    const categories = ['Fuel', 'Maintenance', 'Staff', 'Insurance', 'Depreciation', 'Administration', 'Other'];
    
    const currentYearData = [35, 20, 25, 8, 7, 3, 2];
    const previousYearData = [30, 18, 23, 8, 7, 4, 3];
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Current Year',
                    data: currentYearData,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgb(52, 152, 219)',
                    pointBackgroundColor: 'rgb(52, 152, 219)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(52, 152, 219)'
                },
                {
                    label: 'Previous Year',
                    data: previousYearData,
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderColor: 'rgb(231, 76, 60)',
                    pointBackgroundColor: 'rgb(231, 76, 60)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(231, 76, 60)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Operational Cost Distribution (%)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '%';
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 40,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

// Enhanced Revenue Trends Chart
function initEnhancedRevenueTrendsChart() {
    const ctx = document.getElementById('revenue-trends-chart');
    if (!ctx) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const revenueData = [520, 565, 615, 650, 690, 730, 770, 810, 780, 745, 705, 735];
    const costData = [480, 510, 540, 570, 600, 630, 660, 690, 675, 650, 625, 645];
    const profitData = revenueData.map((rev, i) => rev - costData[i]);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: 'rgb(46, 204, 113)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Costs',
                    data: costData,
                    borderColor: 'rgb(231, 76, 60)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Profit',
                    data: profitData,
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Revenue, Cost and Profit Trends',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.raw + ' lakhs';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹ lakhs)',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}