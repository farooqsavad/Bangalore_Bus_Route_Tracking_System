// Main JavaScript for Transport Analytics Platform

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    setTimeout(function() {
        const preloader = document.querySelector('.preloader');
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1500);

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.querySelector('i').classList.toggle('fa-bars');
            mobileToggle.querySelector('i').classList.toggle('fa-times');
        });
    }

    // Module navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const modules = document.querySelectorAll('.module');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show page transition
            const pageTransition = document.querySelector('.page-transition');
            pageTransition.classList.add('active');
            
            setTimeout(() => {
                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
                
                // Show active module
                const targetModule = this.getAttribute('data-module');
                modules.forEach(module => module.classList.remove('active'));
                document.getElementById(targetModule).classList.add('active');
                
                // Hide mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    mobileToggle.querySelector('i').classList.add('fa-bars');
                    mobileToggle.querySelector('i').classList.remove('fa-times');
                }
                
                // Hide page transition
                pageTransition.classList.add('exit');
                setTimeout(() => {
                    pageTransition.classList.remove('active');
                    pageTransition.classList.remove('exit');
                }, 500);
            }, 500);
        });
    });

    // Route Planner functionality
    const planJourneyBtn = document.getElementById('plan-journey');
    if (planJourneyBtn) {
        planJourneyBtn.addEventListener('click', function() {
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            const timeOption = document.getElementById('time').value;
            const showAlternatives = document.getElementById('show-alternatives').checked;
            
            // Show loading indicator
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            document.getElementById('error-message').style.display = 'none';
            document.getElementById('alternative-routes').innerHTML = '';
            
            // Simulate a delay for the planning process
            setTimeout(() => {
                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';
                
                // Show results (in a real app, this would be based on actual data)
                if (origin !== destination) {
                    document.getElementById('results').style.display = 'block';
                    document.getElementById('route-title').textContent = `${origin} → ${destination}`;
                    
                    // Simulate random data
                    const time = Math.floor(Math.random() * 60) + 15;
                    const distance = (Math.random() * 20 + 5).toFixed(1);
                    const fare = Math.floor(Math.random() * 50) + 10;
                    const transfers = Math.floor(Math.random() * 3);
                    
                    document.getElementById('time-value').textContent = `${time}m`;
                    document.getElementById('distance-value').textContent = `${distance} km`;
                    document.getElementById('fare-value').textContent = `₹${fare}`;
                    document.getElementById('transfers-value').textContent = transfers;
                    
                    // Generate route steps
                    const stepsContainer = document.getElementById('route-steps');
                    stepsContainer.innerHTML = '';
                    
                    const step1 = document.createElement('div');
                    step1.className = 'step';
                    step1.textContent = `Take Route 500A from ${origin}`;
                    stepsContainer.appendChild(step1);
                    
                    if (transfers > 0) {
                        const transferStep = document.createElement('div');
                        transferStep.className = 'step transfer';
                        transferStep.textContent = `Transfer at Central Station`;
                        stepsContainer.appendChild(transferStep);
                        
                        const step2 = document.createElement('div');
                        step2.className = 'step';
                        step2.textContent = `Take Route 305B to ${destination}`;
                        stepsContainer.appendChild(step2);
                    }
                    
                    const finalStep = document.createElement('div');
                    finalStep.className = 'step';
                    finalStep.textContent = `Arrive at ${destination}`;
                    stepsContainer.appendChild(finalStep);
                    
                    // Show map placeholder
                    document.getElementById('map').innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                            <p>Map visualization would show the route from ${origin} to ${destination}</p>
                        </div>
                    `;
                    
                    // Show alternative routes if requested
                    if (showAlternatives) {
                        const altRoutesContainer = document.getElementById('alternative-routes');
                        
                        for (let i = 0; i < 2; i++) {
                            const altTime = time + Math.floor(Math.random() * 15) + 5;
                            const altDistance = (parseFloat(distance) + Math.random() * 3).toFixed(1);
                            const altFare = fare - Math.floor(Math.random() * 10);
                            const altTransfers = Math.floor(Math.random() * 2);
                            
                            const routeCard = document.createElement('div');
                            routeCard.className = 'route-card';
                            
                            routeCard.innerHTML = `
                                <div class="route-header">
                                    <div class="route-title">Alternative Route ${i+1}: ${origin} → ${destination}</div>
                                </div>
                                
                                <div class="route-stats">
                                    <div class="stat">
                                        <div class="stat-value">${altTime}m</div>
                                        <div class="stat-label">Total Time</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">${altDistance} km</div>
                                        <div class="stat-label">Distance</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">₹${altFare}</div>
                                        <div class="stat-label">Fare</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">${altTransfers}</div>
                                        <div class="stat-label">Transfers</div>
                                    </div>
                                </div>
                                
                                <div class="route-steps">
                                    <div class="step">Take Route ${300 + i}C from ${origin}</div>
                                    ${altTransfers ? '<div class="step transfer">Transfer at South Station</div>' : ''}
                                    ${altTransfers ? '<div class="step">Take Route 205D to ' + destination + '</div>' : ''}
                                    <div class="step">Arrive at ${destination}</div>
                                </div>
                            `;
                            
                            altRoutesContainer.appendChild(routeCard);
                        }
                    }
                } else {
                    // Show error message if origin and destination are the same
                    document.getElementById('error-message').style.display = 'block';
                }
            }, 1500);
        });
    }

    // Settings functionality
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            // Simulate saving settings
            const theme = document.getElementById('theme').value;
            const dataRefresh = document.getElementById('data-refresh').value;
            const notifications = document.getElementById('notifications').checked;
            const analyticsConsent = document.getElementById('analytics-consent').checked;
            
            // Apply theme (in a real app)
            // document.body.className = theme;
            
            // Show success message
            alert('Settings saved successfully!');
        });
    }

    // Reset settings button
    const resetSettingsBtn = document.getElementById('reset-settings');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function() {
            document.getElementById('theme').value = 'light';
            document.getElementById('data-refresh').value = '60';
            document.getElementById('notifications').checked = true;
            document.getElementById('analytics-consent').checked = true;
            
            alert('Settings reset to default values!');
        });
    }

    // Generate placeholder logo
    const logoPlaceholder = document.getElementById('logo-placeholder');
    if (logoPlaceholder) {
        logoPlaceholder.src = generateLogoPlaceholder();
    }
});

// Function to generate a placeholder logo
function generateLogoPlaceholder() {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    // Draw a blue circle
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a white "T" letter
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', 20, 20);
    
    // Convert to data URL
    return canvas.toDataURL();
}