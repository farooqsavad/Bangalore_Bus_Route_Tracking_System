// Charts for Transport Analytics Platform

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard Charts
    initPassengerTrendsChart();
    initTransportModeChart();
    initPeakHourChart();
    initRouteEfficiencyChart();
    
    // Analytics Charts
    initNetworkPerformanceChart();
    initRouteUtilizationChart();
    initPassengerDemographicsChart();
    initFareCollectionChart();
    initOperationalCostsChart();
    initRevenueTrendsChart();
    
    // Traffic Charts
    initTrafficMap();
    initCongestionHotspotsChart();
    initTrafficFlowChart();
    initDelayPredictionChart();
    
    // Optimization Charts
    initRouteOptimizationChart();
    initFleetAllocationChart();
    initScheduleOptimizationChart();
    initResourceUtilizationChart();
    
    // Reports Charts
    initPerformanceMetricsChart();
    initEfficiencyAnalysisChart();
    initEnvironmentalImpactChart();
    initCostAnalysisChart();
    initServiceQualityChart();
});

// Dashboard Charts
function initPassengerTrendsChart() {
    const ctx = document.getElementById('passenger-trends-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Daily Passengers (thousands)',
                data: [65, 72, 78, 75, 82, 88, 92, 95, 89, 85, 79, 83],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initTransportModeChart() {
    const ctx = document.getElementById('transport-mode-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bus', 'Metro', 'Tram', 'Ferry', 'Shared Mobility'],
            datasets: [{
                data: [45, 30, 10, 5, 10],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f1c40f',
                    '#e74c3c',
                    '#9b59b6'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function initPeakHourChart() {
    const ctx = document.getElementById('peak-hour-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'],
            datasets: [{
                label: 'Passenger Volume',
                data: [15, 30, 60, 75, 45, 35, 40, 35, 30, 40, 50, 65, 80, 70, 45, 25],
                backgroundColor: function(context) {
                    const index = context.dataIndex;
                    const value = context.dataset.data[index];
                    return value > 60 ? 'rgba(231, 76, 60, 0.7)' : 'rgba(52, 152, 219, 0.7)';
                },
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Thousands of Passengers'
                    }
                }
            }
        }
    });
}

function initRouteEfficiencyChart() {
    const ctx = document.getElementById('route-efficiency-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Timeliness', 'Capacity Utilization', 'Fuel Efficiency', 'Maintenance', 'Customer Satisfaction', 'Cost Efficiency'],
            datasets: [
                {
                    label: 'Current Performance',
                    data: [85, 70, 65, 80, 75, 60],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
                },
                {
                    label: 'Target Performance',
                    data: [90, 85, 80, 85, 90, 80],
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(46, 204, 113, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Analytics Charts
function initNetworkPerformanceChart() {
    const ctx = document.getElementById('network-performance-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [
                {
                    label: 'On-time Performance',
                    data: [88, 85, 90, 92, 89, 91, 93, 94],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Network Efficiency',
                    data: [75, 78, 80, 82, 84, 83, 86, 88],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Passenger Satisfaction',
                    data: [70, 72, 75, 78, 80, 82, 85, 87],
                    borderColor: '#f1c40f',
                    backgroundColor: 'rgba(241, 196, 15, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Performance (%)'
                    }
                }
            }
        }
    });
}

// Initialize remaining charts with placeholder data
function initRouteUtilizationChart() {
    const ctx = document.getElementById('route-utilization-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Route A', 'Route B', 'Route C', 'Route D', 'Route E', 'Route F', 'Route G', 'Route H'],
            datasets: [{
                label: 'Capacity Utilization (%)',
                data: [85, 65, 90, 75, 95, 60, 80, 70],
                backgroundColor: 'rgba(52, 152, 219, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initPassengerDemographicsChart() {
    const ctx = document.getElementById('passenger-demographics-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'pie',
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
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Initialize remaining charts with minimal placeholder implementations
function initFareCollectionChart() {
    createSimpleChart('fare-collection-chart', 'line');
}

function initOperationalCostsChart() {
    createSimpleChart('operational-costs-chart', 'bar');
}

function initRevenueTrendsChart() {
    createSimpleChart('revenue-trends-chart', 'line');
}

function initTrafficMap() {
    const mapContainer = document.getElementById('traffic-map');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;"><p>Traffic Map Visualization</p></div>';
}

function initCongestionHotspotsChart() {
    createSimpleChart('congestion-hotspots-chart', 'bar');
}

function initTrafficFlowChart() {
    createSimpleChart('traffic-flow-chart', 'line');
}

function initDelayPredictionChart() {
    createSimpleChart('delay-prediction-chart', 'line');
}

function initRouteOptimizationChart() {
    createSimpleChart('route-optimization-chart', 'bar');
}

function initFleetAllocationChart() {
    createSimpleChart('fleet-allocation-chart', 'pie');
}

function initScheduleOptimizationChart() {
    createSimpleChart('schedule-optimization-chart', 'line');
}

function initResourceUtilizationChart() {
    createSimpleChart('resource-utilization-chart', 'bar');
}

function initPerformanceMetricsChart() {
    createSimpleChart('performance-metrics-chart', 'radar');
}

function initEfficiencyAnalysisChart() {
    createSimpleChart('efficiency-analysis-chart', 'line');
}

function initEnvironmentalImpactChart() {
    createSimpleChart('environmental-impact-chart', 'bar');
}

function initCostAnalysisChart() {
    createSimpleChart('cost-analysis-chart', 'line');
}

function initServiceQualityChart() {
    createSimpleChart('service-quality-chart', 'radar');
}

// Helper function to create simple charts with minimal code
function createSimpleChart(elementId, type) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return;
    
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let data, options;
    
    switch(type) {
        case 'line':
            data = {
                labels: labels,
                datasets: [{
                    label: 'Data',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true
                }]
            };
            break;
        case 'bar':
            data = {
                labels: labels,
                datasets: [{
                    label: 'Data',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: 'rgba(52, 152, 219, 0.7)'
                }]
            };
            break;
        case 'pie':
        case 'doughnut':
            data = {
                labels: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#f1c40f',
                        '#e74c3c',
                        '#9b59b6'
                    ]
                }]
            };
            break;
        case 'radar':
            data = {
                labels: ['Metric A', 'Metric B', 'Metric C', 'Metric D', 'Metric E', 'Metric F'],
                datasets: [{
                    label: 'Current',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)'
                }]
            };
            break;
        default:
            data = {
                labels: labels,
                datasets: [{
                    label: 'Data',
                    data: [65, 59, 80, 81, 56, 55]
                }]
            };
    }
    
    options = {
        responsive: true,
        maintainAspectRatio: false
    };
    
    new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}