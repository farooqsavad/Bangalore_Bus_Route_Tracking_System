// Charts Loader for Transport Analytics Platform

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Leaflet map for traffic visualization
    loadLeafletMap();
    
    // Dashboard Charts
    initPassengerTrendsChart();
    initTransportModeChart();
    initPeakHourChart();
    initRouteEfficiencyChart();
    
    // Analytics Charts - Use enhanced versions if available
    if (typeof initEnhancedNetworkPerformanceChart === 'function') {
        initEnhancedNetworkPerformanceChart();
    } else {
        initNetworkPerformanceChart();
    }
    
    if (typeof initEnhancedRouteUtilizationChart === 'function') {
        initEnhancedRouteUtilizationChart();
    } else {
        initRouteUtilizationChart();
    }
    
    if (typeof initEnhancedPassengerDemographicsChart === 'function') {
        initEnhancedPassengerDemographicsChart();
    } else {
        initPassengerDemographicsChart();
    }
    
    if (typeof initEnhancedFareCollectionChart === 'function') {
        initEnhancedFareCollectionChart();
    } else {
        initFareCollectionChart();
    }
    
    if (typeof initEnhancedOperationalCostsChart === 'function') {
        initEnhancedOperationalCostsChart();
    } else {
        initOperationalCostsChart();
    }
    
    if (typeof initEnhancedRevenueTrendsChart === 'function') {
        initEnhancedRevenueTrendsChart();
    } else {
        initRevenueTrendsChart();
    }
    
    // Traffic Charts - Use enhanced versions from traffic_charts.js if available
    if (typeof initTrafficMap === 'function') {
        initTrafficMap();
    }
    
    if (typeof initCongestionHotspotsChart === 'function') {
        initCongestionHotspotsChart();
    }
    
    if (typeof initTrafficFlowChart === 'function') {
        initTrafficFlowChart();
    }
    
    if (typeof initDelayPredictionChart === 'function') {
        initDelayPredictionChart();
    }
    
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

// Function to load Leaflet map
function loadLeafletMap() {
    // Check if Leaflet is loaded
    if (typeof L !== 'undefined') {
        console.log('Leaflet is loaded and ready for map visualization');
    } else {
        console.warn('Leaflet is not loaded. Traffic map visualization may not work properly.');
    }
}