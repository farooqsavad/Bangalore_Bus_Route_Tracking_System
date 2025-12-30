# Implementation Guide for Enhanced Transit Planning System (Updated)

This guide outlines how to implement the three requested features in the transport_final.ipynb notebook with improved time calculation:

1. Real geographic coordinates
2. Real-time data integration
3. Fare calculation

## 1. Real Geographic Coordinates

### Step 1: Load and Process Coordinates
Add this code to the data loading section:

```python
# Create a station coordinates dictionary
station_coords = {}

# Extract coordinates from stops.csv
for _, row in stops.iterrows():
    if pd.notna(row['stop_lat']) and pd.notna(row['stop_lon']):
        station_coords[row['stop_name']] = (float(row['stop_lat']), float(row['stop_lon']))

# For stations without coordinates, we'll use geocoding or approximation
def get_coordinates(station_name):
    # Check if we already have coordinates
    if station_name in station_coords:
        return station_coords[station_name]
    
    # Try to find a similar station name
    for known_station in station_coords:
        if station_name.lower() in known_station.lower() or known_station.lower() in station_name.lower():
            return station_coords[known_station]
    
    # If not found, use Bengaluru center coordinates with a small random offset
    # This ensures all stations have unique coordinates for visualization
    bengaluru_center = (12.9716, 77.5946)
    random_offset = (random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05))
    coords = (bengaluru_center[0] + random_offset[0], bengaluru_center[1] + random_offset[1])
    
    # Cache the result
    station_coords[station_name] = coords
    return coords

# Calculate distances between stations
from math import radians, sin, cos, sqrt, atan2

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points in kilometers"""
    R = 6371  # Earth radius in kilometers
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return distance

# Calculate realistic travel time based on distance and road type
def calculate_travel_time(distance_km, road_type='urban'):
    """
    Calculate realistic travel time based on distance and road type
    
    Parameters:
    - distance_km: Distance in kilometers
    - road_type: 'urban', 'suburban', or 'highway'
    
    Returns:
    - Travel time in minutes
    """
    # Average speeds (km/h) for different road types in Bengaluru
    speeds = {
        'urban': 15,       # Congested urban roads
        'suburban': 25,    # Less congested suburban roads
        'highway': 45      # Highways/ring roads
    }
    
    # Default to urban if road type not specified
    avg_speed = speeds.get(road_type, speeds['urban'])
    
    # Calculate time in minutes
    time_minutes = (distance_km / avg_speed) * 60
    
    # Add a small random variation (±10%) to make it more realistic
    time_minutes *= random.uniform(0.9, 1.1)
    
    return time_minutes
```

### Step 2: Update the TransitPlanner._process_path Method
Modify the _process_path method to include coordinates and improved time calculation:

```python
def _process_path(self, path):
    """Process a path to extract steps, time, and transfers"""
    edges = list(nx.utils.pairwise(path))
    
    total_time = 0
    total_distance = 0
    steps = []
    current_route = None
    
    for (u, v) in edges:
        try:
            edge_data = self.G.get_edge_data(u, v)
            if edge_data:
                min_time = min([d['time'] for d in edge_data.values()])
                route_options = [d for d in edge_data.values() if d['time'] == min_time]
                route_data = route_options[0]
                route_id = route_data['route_id']
                
                # Get coordinates for distance calculation
                u_coords = get_coordinates(u)
                v_coords = get_coordinates(v)
                
                # Calculate segment distance
                segment_dist = haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
                total_distance += segment_dist
                
                # Verify if the time in the graph is realistic
                # If not, recalculate based on distance
                estimated_time = calculate_travel_time(segment_dist, 'urban')
                
                # Use the graph time if it's within a reasonable range of our estimate
                # Otherwise use our estimate (this helps correct unrealistic times)
                if 0.5 * estimated_time <= min_time <= 2.0 * estimated_time:
                    adjusted_time = min_time
                else:
                    adjusted_time = estimated_time
                
                if route_id != current_route:
                    if current_route is not None:
                        steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                        total_time += self.transfer_penalty  # Add transfer penalty
                    current_route = route_id
                    steps.append(f"Take Route {route_id} from {u}")
                
                total_time += adjusted_time
        except (TypeError, KeyError, IndexError, ValueError):
            # If there's an issue with this edge, add a generic step
            if current_route is not None:
                steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                total_time += self.transfer_penalty
            current_route = "Unknown"
            steps.append(f"Travel from {u} to {v}")
            
            # Estimate distance for unknown segments
            u_coords = get_coordinates(u)
            v_coords = get_coordinates(v)
            segment_dist = haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
            total_distance += segment_dist
            
            # Calculate realistic travel time based on distance
            road_type = 'urban'  # Default to urban roads
            
            # Try to guess road type based on distance
            if segment_dist > 15:
                road_type = 'highway'
            elif segment_dist > 5:
                road_type = 'suburban'
                
            estimated_time = calculate_travel_time(segment_dist, road_type)
            total_time += estimated_time
    
    # Add coordinates for each station in the path
    path_coords = [get_coordinates(station) for station in path]
    
    return {
        'path': path,
        'coordinates': path_coords,
        'time': total_time,
        'distance': total_distance,
        'steps': steps,
        'transfers': len([s for s in steps if 'Transfer' in s])
    }
```

### Step 3: Update the Map Visualization
Update the map visualization to use real coordinates:

```python
# Generate route map with real coordinates
m = folium.Map(location=[12.9716, 77.5946], zoom_start=12, tiles='CartoDB positron')

# Add markers for origin and destination with special styling
origin_coords = get_coordinates(origin)
dest_coords = get_coordinates(destination)

folium.Marker(
    location=[origin_coords[0], origin_coords[1]],
    popup=f"<b>Start:</b> {origin}",
    icon=folium.Icon(color='green', icon='play', prefix='fa')
).add_to(m)

folium.Marker(
    location=[dest_coords[0], dest_coords[1]],
    popup=f"<b>End:</b> {destination}",
    icon=folium.Icon(color='red', icon='stop', prefix='fa')
).add_to(m)

# Add route line with real coordinates
locations = [[coords[0], coords[1]] for coords in result['coordinates']]
folium.PolyLine(
    locations,
    color='blue',
    weight=4,
    opacity=0.8,
    tooltip=f"Journey: {origin} to {destination}"
).add_to(m)
```

## 2. Real-Time Data Integration

### Step 1: Add Traffic Simulation Functions
Add these methods to the TransitPlanner class:

```python
def _initialize_traffic_conditions(self):
    """Initialize traffic conditions for all edges in the graph"""
    traffic = {}
    
    # Get current hour to simulate time-based traffic patterns
    current_hour = datetime.datetime.now().hour
    
    # Define peak hours (8-10 AM and 5-7 PM)
    is_peak_hour = (8 <= current_hour <= 10) or (17 <= current_hour <= 19)
    
    # Assign traffic multipliers to each edge
    for u, v, data in self.G.edges(data=True):
        edge_key = (u, v)
        
        # Base multiplier (1.0 = normal traffic)
        if is_peak_hour:
            # Higher traffic during peak hours - more realistic range
            base_multiplier = random.uniform(1.3, 1.6)
        else:
            # Normal to light traffic during off-peak
            base_multiplier = random.uniform(0.8, 1.1)
        
        # Add some randomness for each edge
        traffic[edge_key] = base_multiplier * random.uniform(0.9, 1.1)
    
    return traffic

def update_traffic_conditions(self):
    """Update traffic conditions based on time of day and simulated real-time data"""
    current_time = time.time()
    
    # Only update if enough time has passed since last update
    if current_time - self.last_traffic_update < self.update_interval:
        return
    
    self.last_traffic_update = current_time
    current_hour = datetime.datetime.now().hour
    
    # Define peak hours
    is_peak_hour = (8 <= current_hour <= 10) or (17 <= current_hour <= 19)
    
    # Update traffic for each edge
    for edge_key in self.traffic_conditions:
        current_multiplier = self.traffic_conditions[edge_key]
        
        # Gradually shift traffic conditions
        if is_peak_hour:
            # Increase traffic during peak hours - more realistic range
            target = random.uniform(1.3, 1.6)
        else:
            # Decrease traffic during off-peak
            target = random.uniform(0.8, 1.1)
        
        # Smooth transition to new traffic conditions
        new_multiplier = current_multiplier * 0.7 + target * 0.3
        
        # Add some randomness to simulate real-time fluctuations
        new_multiplier *= random.uniform(0.95, 1.05)
        
        self.traffic_conditions[edge_key] = new_multiplier

def get_real_time_travel_time(self, u, v, base_time):
    """Get real-time adjusted travel time between two nodes"""
    edge_key = (u, v)
    
    # Update traffic conditions if needed
    self.update_traffic_conditions()
    
    # Get traffic multiplier for this edge
    multiplier = self.traffic_conditions.get(edge_key, 1.0)
    
    # Apply traffic multiplier to base travel time
    return base_time * multiplier
```

### Step 2: Update the TransitPlanner Constructor
Add these lines to the __init__ method:

```python
self.traffic_conditions = self._initialize_traffic_conditions()
self.last_traffic_update = time.time()
self.update_interval = 300  # Update traffic every 5 minutes
```

### Step 3: Update the _process_path Method
Modify the time calculation in the _process_path method:

```python
# Apply real-time traffic adjustment with sanity check
base_time = min_time if 0.5 * estimated_time <= min_time <= 2.0 * estimated_time else estimated_time
adjusted_time = self.get_real_time_travel_time(u, v, base_time)
total_time += adjusted_time
```

### Step 4: Add Traffic Visualization
Add a traffic heatmap visualization:

```python
def visualize_traffic(self):
    """Visualize current traffic conditions on the network"""
    # Create a map centered on Bengaluru
    m = folium.Map(location=[12.9716, 77.5946], zoom_start=12)
    
    # Add traffic lines for each edge
    for (u, v), multiplier in self.traffic_conditions.items():
        try:
            # Get coordinates
            u_coords = get_coordinates(u)
            v_coords = get_coordinates(v)
            
            # Determine color based on traffic level
            if multiplier < 1.0:
                color = 'green'  # Light traffic
                weight = 3
            elif multiplier < 1.3:
                color = 'orange'  # Moderate traffic
                weight = 4
            else:
                color = 'red'  # Heavy traffic
                weight = 5
            
            # Add line with tooltip showing traffic level
            folium.PolyLine(
                [(u_coords[0], u_coords[1]), (v_coords[0], v_coords[1])],
                color=color,
                weight=weight,
                opacity=0.7,
                tooltip=f"{u} → {v}: Traffic {multiplier:.2f}x"
            ).add_to(m)
        except:
            continue
    
    return m
```

## 3. Fare Calculation

### Step 1: Add Fare Calculation Function
Add this function to the data loading section:

```python
# Add fare calculation based on distance
def calculate_fare(distance_km, route_type):
    """Calculate fare based on distance and route type"""
    # Base fare
    if route_type == '3':  # Regular bus
        base_fare = 5
        rate_per_km = 1.5
    elif route_type == '700':  # Express
        base_fare = 10
        rate_per_km = 2.0
    else:  # Premium or other
        base_fare = 15
        rate_per_km = 2.5
    
    # Calculate fare with distance-based component
    fare = base_fare + max(0, distance_km - 2) * rate_per_km
    
    # Round to nearest rupee
    return round(fare)
```

### Step 2: Update the _process_path Method
Modify the _process_path method to calculate fares:

```python
def _process_path(self, path):
    """Process a path to extract steps, time, and transfers"""
    edges = list(nx.utils.pairwise(path))
    
    total_time = 0
    total_distance = 0
    total_fare = 0
    steps = []
    current_route = None
    route_segments = []
    route_type = None
    segment_distance = 0
    
    for (u, v) in edges:
        try:
            edge_data = self.G.get_edge_data(u, v)
            if edge_data:
                min_time = min([d['time'] for d in edge_data.values()])
                route_options = [d for d in edge_data.values() if d['time'] == min_time]
                route_data = route_options[0]
                route_id = route_data['route_id']
                
                # Get coordinates for distance calculation
                u_coords = get_coordinates(u)
                v_coords = get_coordinates(v)
                
                # Calculate segment distance
                segment_dist = haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
                total_distance += segment_dist
                
                # Calculate realistic travel time based on distance
                estimated_time = calculate_travel_time(segment_dist, 'urban')
                
                # Use the graph time if it's within a reasonable range of our estimate
                # Otherwise use our estimate (this helps correct unrealistic times)
                if 0.5 * estimated_time <= min_time <= 2.0 * estimated_time:
                    base_time = min_time
                else:
                    base_time = estimated_time
                
                # Apply real-time traffic adjustment
                adjusted_time = self.get_real_time_travel_time(u, v, base_time)
                
                if route_id != current_route:
                    # If we're changing routes, calculate fare for the previous segment
                    if current_route is not None:
                        steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                        total_time += self.transfer_penalty  # Add transfer penalty
                        
                        # Calculate fare for the completed segment
                        segment_fare = calculate_fare(segment_distance, route_type)
                        total_fare += segment_fare
                        
                        # Reset segment distance for new route
                        segment_distance = 0
                    
                    current_route = route_id
                    route_type = route_data.get('type', '3')  # Default to regular bus if type not specified
                    steps.append(f"Take Route {route_id} from {u}")
                    route_segments.append({
                        'route_id': route_id,
                        'start': u,
                        'type': route_type
                    })
                
                segment_distance += segment_dist
                total_time += adjusted_time
        except (TypeError, KeyError, IndexError, ValueError):
            # If there's an issue with this edge, add a generic step
            if current_route is not None:
                steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                total_time += self.transfer_penalty
                
                # Calculate fare for the completed segment
                segment_fare = calculate_fare(segment_distance, route_type)
                total_fare += segment_fare
                segment_distance = 0
            
            current_route = "Unknown"
            route_type = '3'  # Default to regular bus
            steps.append(f"Travel from {u} to {v}")
            
            # Estimate distance for unknown segments
            u_coords = get_coordinates(u)
            v_coords = get_coordinates(v)
            segment_dist = haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
            total_distance += segment_dist
            segment_distance += segment_dist
            
            # Calculate realistic travel time based on distance
            road_type = 'urban'  # Default to urban roads
            
            # Try to guess road type based on distance
            if segment_dist > 15:
                road_type = 'highway'
            elif segment_dist > 5:
                road_type = 'suburban'
                
            estimated_time = calculate_travel_time(segment_dist, road_type)
            total_time += estimated_time
    
    # Calculate fare for the last segment
    if segment_distance > 0:
        segment_fare = calculate_fare(segment_distance, route_type)
        total_fare += segment_fare
    
    # Add coordinates for each station in the path
    path_coords = [get_coordinates(station) for station in path]
    
    return {
        'path': path,
        'coordinates': path_coords,
        'time': total_time,
        'distance': total_distance,
        'fare': total_fare,
        'steps': steps,
        'transfers': len([s for s in steps if 'Transfer' in s]),
        'route_segments': route_segments,
        'traffic_conditions': [self.traffic_conditions.get((path[i], path[i+1]), 1.0) 
                             for i in range(len(path)-1)]
    }
```

### Step 3: Update the Journey Planner UI
Update the journey planner UI to display fare information:

```python
display(HTML(f"""
<div style="border:2px solid #1f77b4; padding:20px; border-radius:10px; background-color:#f8f9fa;">
    <h3 style="color:#2c3e50;">🚌 Optimal Route: {origin} → {destination}</h3>
    <div style="display:flex; margin-bottom:15px;">
        <div style="flex:1; padding:10px; background-color:#e8f4f8; border-radius:5px; margin-right:10px;">
            <p style="font-size:16px;">⏱️ Total Time: <strong>{time_str}</strong></p>
        </div>
        <div style="flex:1; padding:10px; background-color:#e8f8f0; border-radius:5px; margin-right:10px;">
            <p style="font-size:16px;">🔄 Transfers: <strong>{result['transfers']}</strong></p>
        </div>
        <div style="flex:1; padding:10px; background-color:#f8f0e8; border-radius:5px;">
            <p style="font-size:16px;">💰 Fare: <strong>₹{result['fare']}</strong></p>
        </div>
    </div>
    <div style="padding:10px; background-color:#f0f8f8; border-radius:5px; margin-bottom:15px;">
        <p style="font-size:16px;">🛣️ Distance: <strong>{result['distance']:.1f} km</strong></p>
    </div>
    <h4 style="color:#2c3e50; border-bottom:1px solid #ddd; padding-bottom:8px;">Journey Steps:</h4>
    <ol style="padding-left:20px;">
        {"".join(f"<li style='margin-bottom:8px;'>{step}</li>" for step in result['steps'])}
    </ol>
</div>
"""))
```

## 4. Additional Enhancements

### Step 1: Add Time-of-Day Based Planning
Add time-of-day based planning to account for different traffic patterns:

```python
def calculate_path_for_time(self, origin, destination, departure_time=None):
    """Calculate optimal path based on specified departure time"""
    # If no departure time specified, use current time
    if departure_time is None:
        departure_time = datetime.datetime.now()
    
    # Extract hour for traffic calculation
    hour = departure_time.hour
    
    # Determine if it's peak hour
    is_peak_hour = (8 <= hour <= 10) or (17 <= hour <= 19)
    
    # Adjust traffic conditions based on time
    if is_peak_hour:
        # During peak hours, prioritize routes with less transfers
        # even if they're slightly longer
        transfer_penalty_multiplier = 1.5
    else:
        # During off-peak, regular transfer penalty
        transfer_penalty_multiplier = 1.0
    
    # Store original transfer penalty
    original_penalty = self.transfer_penalty
    
    # Adjust transfer penalty temporarily
    self.transfer_penalty = original_penalty * transfer_penalty_multiplier
    
    # Calculate path with adjusted settings
    result = self.calculate_path(origin, destination)
    
    # Restore original transfer penalty
    self.transfer_penalty = original_penalty
    
    # Add departure and arrival times to result
    if result:
        result['departure_time'] = departure_time
        result['arrival_time'] = departure_time + datetime.timedelta(minutes=result['time'])
        result['is_peak_hour'] = is_peak_hour
    
    return result
```

### Step 2: Add Alternative Routes Suggestion
Implement a method to suggest alternative routes:

```python
def suggest_alternatives(self, origin, destination, max_alternatives=3):
    """Suggest alternative routes between origin and destination"""
    # Get the primary route first
    primary_route = self.calculate_path(origin, destination)
    
    if not primary_route:
        return []
    
    alternatives = [primary_route]
    
    # Try routes through different hubs to find alternatives
    for hub, _ in self.major_hubs[:10]:  # Use top 10 hubs
        if hub != origin and hub != destination:
            try:
                # Force a route through this hub
                path1 = nx.shortest_path(self.G, origin, hub, weight='time')
                path2 = nx.shortest_path(self.G, hub, destination, weight='time')
                
                # Combine the paths
                combined_path = path1 + path2[1:]
                path_info = self._process_path(combined_path)
                
                # Check if this route is significantly different from existing ones
                is_different = True
                for existing in alternatives:
                    # Calculate path similarity (% of common stations)
                    common_stations = set(path_info['path']).intersection(set(existing['path']))
                    similarity = len(common_stations) / len(set(path_info['path']).union(set(existing['path'])))
                    
                    # If more than 70% similar, consider it not different enough
                    if similarity > 0.7:
                        is_different = False
                        break
                
                # Only add if it's different and not more than 30% longer than the primary route
                if is_different and path_info['time'] <= primary_route['time'] * 1.3:
                    alternatives.append(path_info)
                    
                    # Stop once we have enough alternatives
                    if len(alternatives) >= max_alternatives + 1:  # +1 for the primary route
                        break
                        
            except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                continue
    
    return alternatives
```

### Step 3: Add Journey Comparison Visualization
Add a method to visualize and compare multiple routes:

```python
def visualize_route_comparison(self, routes, origin, destination):
    """Visualize multiple routes on the same map for comparison"""
    # Create a map centered on Bengaluru
    m = folium.Map(location=[12.9716, 77.5946], zoom_start=12, tiles='CartoDB positron')
    
    # Add markers for origin and destination
    origin_coords = get_coordinates(origin)
    dest_coords = get_coordinates(destination)
    
    folium.Marker(
        location=[origin_coords[0], origin_coords[1]],
        popup=f"<b>Start:</b> {origin}",
        icon=folium.Icon(color='green', icon='play', prefix='fa')
    ).add_to(m)
    
    folium.Marker(
        location=[dest_coords[0], dest_coords[1]],
        popup=f"<b>End:</b> {destination}",
        icon=folium.Icon(color='red', icon='stop', prefix='fa')
    ).add_to(m)
    
    # Colors for different routes
    colors = ['blue', 'purple', 'orange', 'darkgreen']
    
    # Add each route with a different color
    for i, route in enumerate(routes):
        color = colors[i % len(colors)]
        
        # Create route line
        locations = [[coords[0], coords[1]] for coords in route['coordinates']]
        
        # Create a descriptive tooltip
        tooltip = (f"Route {i+1}: {origin} → {destination}<br>"
                  f"Time: {route['time']:.1f} mins | "
                  f"Distance: {route['distance']:.1f} km | "
                  f"Fare: ₹{route.get('fare', 0)}")
        
        # Add the route line
        folium.PolyLine(
            locations,
            color=color,
            weight=4,
            opacity=0.8,
            tooltip=tooltip
        ).add_to(m)
        
        # Add small markers for transfer points
        for step in route['steps']:
            if 'Transfer at' in step:
                # Extract station name
                station = step.split('Transfer at ')[1].split(' (Time')[0]
                station_coords = get_coordinates(station)
                
                # Add a small circle marker
                folium.CircleMarker(
                    location=[station_coords[0], station_coords[1]],
                    radius=5,
                    color=color,
                    fill=True,
                    fill_color=color,
                    fill_opacity=0.7,
                    tooltip=f"Transfer point: {station}"
                ).add_to(m)
    
    # Add a legend
    legend_html = '''
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000; background-color: white; 
                padding: 10px; border: 2px solid grey; border-radius: 5px;">
      <p><b>Route Comparison</b></p>
    '''
    
    for i, route in enumerate(routes):
        color = colors[i % len(colors)]
        legend_html += f'''
        <p>
          <span style="color:{color}; font-size: 24px;">&#9473;</span>
          Route {i+1}: {route['time']:.1f} mins, ₹{route.get('fare', 0)}
        </p>
        '''
    
    legend_html += '</div>'
    
    # Add the legend to the map
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m
```

### Step 4: Add Accessibility Analysis
Add a method to analyze accessibility from a given location:

```python
def analyze_accessibility(self, origin, max_time_minutes=60):
    """Analyze which stations are accessible within a given time from origin"""
    accessible_stations = []
    
    # Get all nodes in the graph
    all_nodes = list(self.G.nodes())
    
    # For each potential destination
    for destination in all_nodes:
        if destination != origin:
            try:
                # Try to find a path
                result = self.calculate_path(origin, destination)
                
                # If found and within time limit
                if result and result['time'] <= max_time_minutes:
                    accessible_stations.append({
                        'station': destination,
                        'time': result['time'],
                        'distance': result['distance'],
                        'transfers': result['transfers'],
                        'coordinates': get_coordinates(destination)
                    })
            except:
                continue
    
    # Sort by travel time
    accessible_stations.sort(key=lambda x: x['time'])
    
    return accessible_stations

def visualize_accessibility(self, origin, max_time_minutes=60):
    """Create a heatmap of accessibility from a given origin"""
    # Get accessible stations
    accessible = self.analyze_accessibility(origin, max_time_minutes)
    
    if not accessible:
        return None
    
    # Create a map
    m = folium.Map(location=[12.9716, 77.5946], zoom_start=12)
    
    # Add marker for origin
    origin_coords = get_coordinates(origin)
    folium.Marker(
        location=[origin_coords[0], origin_coords[1]],
        popup=f"<b>Origin:</b> {origin}",
        icon=folium.Icon(color='green', icon='home', prefix='fa')
    ).add_to(m)
    
    # Create data for heatmap - weight by inverse of time
    # (closer = higher weight)
    heat_data = []
    
    for station in accessible:
        coords = station['coordinates']
        # Weight inversely proportional to time
        # (normalize to 0-1 range based on max_time_minutes)
        weight = 1 - (station['time'] / max_time_minutes)
        heat_data.append([coords[0], coords[1], weight])
    
    # Add heatmap layer
    HeatMap(heat_data, radius=15, gradient={0.4: 'blue', 0.65: 'lime', 0.8: 'yellow', 1: 'red'}).add_to(m)
    
    # Add a legend
    legend_html = f'''
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000; background-color: white; 
                padding: 10px; border: 2px solid grey; border-radius: 5px;">
      <p><b>Accessibility from {origin}</b></p>
      <p>Showing stations reachable within {max_time_minutes} minutes</p>
      <p>Total accessible stations: {len(accessible)}</p>
      <p>Closest station: {accessible[0]['station']} ({accessible[0]['time']:.1f} mins)</p>
      <p>Farthest station: {accessible[-1]['station']} ({accessible[-1]['time']:.1f} mins)</p>
    </div>
    '''
    
    # Add the legend to the map
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m
```

## Implementation Steps

1. Create a backup of your current notebook
2. Implement the real geographic coordinates feature with improved time calculation
3. Implement the fare calculation feature
4. Implement the real-time data integration feature
5. Add the additional enhancements:
   - Time-of-day based planning
   - Alternative routes suggestion
   - Journey comparison visualization
   - Accessibility analysis
6. Update the journey planner UI to display the new information
7. Test the system with various origin-destination pairs

## Final Integration

To integrate all these features into a comprehensive transit planning system, create a new cell at the end of your notebook with this code:

```python
# Create an interactive journey planner with all enhanced features
def interactive_journey_planner():
    # Create input widgets
    origin_input = widgets.Text(description='Origin:', value='Majestic')
    destination_input = widgets.Text(description='Destination:', value='Whitefield')
    
    time_options = ['Current Time', 'Morning Peak (9 AM)', 'Evening Peak (6 PM)', 'Off-Peak (2 PM)']
    time_dropdown = widgets.Dropdown(description='Time:', options=time_options, value='Current Time')
    
    show_alternatives = widgets.Checkbox(description='Show alternative routes', value=False)
    
    # Create output area
    output_area = widgets.Output()
    
    # Create button
    plan_button = widgets.Button(description='Plan Journey')
    plan_button.style.button_color = '#3498db'
    
    # Define button click handler
    def on_button_click(b):
        with output_area:
            # Clear previous output
            output_area.clear_output()
            
            # Get input values
            origin = origin_input.value
            destination = destination_input.value
            
            # Set departure time based on selection
            if time_dropdown.value == 'Morning Peak (9 AM)':
                now = datetime.datetime.now()
                departure_time = datetime.datetime(now.year, now.month, now.day, 9, 0)
            elif time_dropdown.value == 'Evening Peak (6 PM)':
                now = datetime.datetime.now()
                departure_time = datetime.datetime(now.year, now.month, now.day, 18, 0)
            elif time_dropdown.value == 'Off-Peak (2 PM)':
                now = datetime.datetime.now()
                departure_time = datetime.datetime(now.year, now.month, now.day, 14, 0)
            else:
                departure_time = datetime.datetime.now()
            
            print(f"Planning journey from {origin} to {destination} at {departure_time.strftime('%H:%M')}")
            
            # Calculate route
            result = planner.calculate_path_for_time(origin, destination, departure_time)
            
            if not result:
                print(f"❌ No route found between {origin} and {destination}.")
                return
            
            # Format time as hours and minutes
            hours = int(result['time'] // 60)
            minutes = int(result['time'] % 60)
            
            if hours > 0:
                time_str = f"{hours}h {minutes}m"
            else:
                time_str = f"{minutes}m"
            
            # Display route information
            display(HTML(f"""
            <div style="border:2px solid #1f77b4; padding:20px; border-radius:10px; background-color:#f8f9fa;">
                <h3 style="color:#2c3e50;">🚌 Optimal Route: {origin} → {destination}</h3>
                <div style="display:flex; margin-bottom:15px;">
                    <div style="flex:1; padding:10px; background-color:#e8f4f8; border-radius:5px; margin-right:10px;">
                        <p style="font-size:16px;">⏱️ Total Time: <strong>{time_str}</strong></p>
                    </div>
                    <div style="flex:1; padding:10px; background-color:#e8f8f0; border-radius:5px; margin-right:10px;">
                        <p style="font-size:16px;">🔄 Transfers: <strong>{result['transfers']}</strong></p>
                    </div>
                    <div style="flex:1; padding:10px; background-color:#f8f0e8; border-radius:5px;">
                        <p style="font-size:16px;">💰 Fare: <strong>₹{result.get('fare', 0)}</strong></p>
                    </div>
                </div>
                <div style="padding:10px; background-color:#f0f8f8; border-radius:5px; margin-bottom:15px;">
                    <p style="font-size:16px;">🛣️ Distance: <strong>{result['distance']:.1f} km</strong></p>
                    <p style="font-size:16px;">🕒 Departure: <strong>{result['departure_time'].strftime('%H:%M')}</strong> | 
                       Arrival: <strong>{result['arrival_time'].strftime('%H:%M')}</strong></p>
                    <p style="font-size:16px;">🚦 Traffic: <strong>{"Heavy" if result.get('is_peak_hour', False) else "Normal"}</strong></p>
                </div>
                <h4 style="color:#2c3e50; border-bottom:1px solid #ddd; padding-bottom:8px;">Journey Steps:</h4>
                <ol style="padding-left:20px;">
                    {"".join(f"<li style='margin-bottom:8px;'>{step}</li>" for step in result['steps'])}
                </ol>
            </div>
            """))
            
            # Generate and display map
            m = folium.Map(location=[12.9716, 77.5946], zoom_start=12, tiles='CartoDB positron')
            
            # Add markers for origin and destination
            origin_coords = get_coordinates(origin)
            dest_coords = get_coordinates(destination)
            
            folium.Marker(
                location=[origin_coords[0], origin_coords[1]],
                popup=f"<b>Start:</b> {origin}",
                icon=folium.Icon(color='green', icon='play', prefix='fa')
            ).add_to(m)
            
            folium.Marker(
                location=[dest_coords[0], dest_coords[1]],
                popup=f"<b>End:</b> {destination}",
                icon=folium.Icon(color='red', icon='stop', prefix='fa')
            ).add_to(m)
            
            # Add route line
            locations = [[coords[0], coords[1]] for coords in result['coordinates']]
            folium.PolyLine(
                locations,
                color='blue',
                weight=4,
                opacity=0.8,
                tooltip=f"Journey: {origin} to {destination}"
            ).add_to(m)
            
            # Show alternative routes if requested
            if show_alternatives.value:
                alternatives = planner.suggest_alternatives(origin, destination, max_alternatives=2)
                
                if len(alternatives) > 1:
                    print(f"\n🔄 Found {len(alternatives)-1} alternative routes:")
                    
                    # Display comparison map
                    comparison_map = planner.visualize_route_comparison(alternatives, origin, destination)
                    display(comparison_map)
                    
                    # Display alternative routes info
                    for i, alt in enumerate(alternatives[1:], 1):
                        alt_hours = int(alt['time'] // 60)
                        alt_minutes = int(alt['time'] % 60)
                        
                        if alt_hours > 0:
                            alt_time_str = f"{alt_hours}h {alt_minutes}m"
                        else:
                            alt_time_str = f"{alt_minutes}m"
                        
                        display(HTML(f"""
                        <div style="border:2px solid #9b59b6; padding:15px; border-radius:10px; background-color:#f8f9fa; margin-top:15px;">
                            <h4 style="color:#2c3e50;">🔄 Alternative Route {i}: {origin} → {destination}</h4>
                            <div style="display:flex; margin-bottom:10px;">
                                <div style="flex:1; padding:8px; background-color:#f0e8f8; border-radius:5px; margin-right:10px;">
                                    <p style="font-size:14px;">⏱️ Time: <strong>{alt_time_str}</strong></p>
                                </div>
                                <div style="flex:1; padding:8px; background-color:#e8f0f8; border-radius:5px; margin-right:10px;">
                                    <p style="font-size:14px;">🔄 Transfers: <strong>{alt['transfers']}</strong></p>
                                </div>
                                <div style="flex:1; padding:8px; background-color:#f8e8f0; border-radius:5px;">
                                    <p style="font-size:14px;">💰 Fare: <strong>₹{alt.get('fare', 0)}</strong></p>
                                </div>
                            </div>
                            <div style="padding:8px; background-color:#f0f8f0; border-radius:5px;">
                                <p style="font-size:14px;">🛣️ Distance: <strong>{alt['distance']:.1f} km</strong></p>
                            </div>
                        </div>
                        """))
                else:
                    print("\nNo alternative routes found.")
            else:
                # Just show the main route map
                display(m)
    
    # Connect button click event
    plan_button.on_click(on_button_click)
    
    # Create layout
    input_box = widgets.VBox([
        widgets.HBox([origin_input, destination_input]),
        widgets.HBox([time_dropdown, show_alternatives]),
        plan_button
    ])
    
    # Display the UI
    display(widgets.VBox([input_box, output_area]))

# Run the interactive planner
interactive_journey_planner()
```

These enhancements will transform your transit planning system into a comprehensive, realistic, and user-friendly tool with accurate time calculations and advanced features.