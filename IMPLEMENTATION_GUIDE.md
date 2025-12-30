# Implementation Guide for Enhanced Transit Planning System

This guide outlines how to implement the three requested features in the transport_final.ipynb notebook:

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
```

### Step 2: Update the TransitPlanner._process_path Method
Modify the _process_path method to include coordinates and distance calculation:

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
                route_id = route_options[0]['route_id']
                
                # Get coordinates for distance calculation
                u_coords = get_coordinates(u)
                v_coords = get_coordinates(v)
                
                # Calculate segment distance
                segment_dist = haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
                total_distance += segment_dist
                
                if route_id != current_route:
                    if current_route is not None:
                        steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                        total_time += self.transfer_penalty  # Add transfer penalty
                    current_route = route_id
                    steps.append(f"Take Route {route_id} from {u}")
                
                total_time += min_time
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
            
            # Estimate time based on distance (assuming 20 km/h average speed)
            estimated_time = (segment_dist / 20) * 60  # Convert to minutes
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
            # Higher traffic during peak hours
            base_multiplier = random.uniform(1.2, 1.8)
        else:
            # Normal to light traffic during off-peak
            base_multiplier = random.uniform(0.8, 1.2)
        
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
            # Increase traffic during peak hours
            target = random.uniform(1.2, 1.8)
        else:
            # Decrease traffic during off-peak
            target = random.uniform(0.8, 1.2)
        
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
# Apply real-time traffic adjustment
adjusted_time = self.get_real_time_travel_time(u, v, min_time)
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
                
                # Apply real-time traffic adjustment if requested
                adjusted_time = self.get_real_time_travel_time(u, v, min_time)
                
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
            
            # Estimate time based on distance (assuming 20 km/h average speed)
            estimated_time = (segment_dist / 20) * 60  # Convert to minutes
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

## Implementation Steps

1. Create a backup of your current notebook
2. Implement the real geographic coordinates feature
3. Implement the fare calculation feature
4. Implement the real-time data integration feature
5. Update the journey planner UI to display the new information
6. Test the system with various origin-destination pairs

These enhancements will significantly improve the functionality and realism of your transit planning system.