import pandas as pd
import numpy as np
import networkx as nx
import random
import time
import datetime
from math import radians, sin, cos, sqrt, atan2

# Load route data
routes = pd.read_csv("routes.csv")
stops = pd.read_csv("stops.csv")

# Extract start and end points
routes['start_point'] = routes['route_long_name'].str.split(' - ').str[0]
routes['end_point'] = routes['route_long_name'].str.split(' - ').str[-1]

# Create a station coordinates dictionary
station_coords = {}

# Extract coordinates from stops.csv
for _, row in stops.iterrows():
    if pd.notna(row['stop_lat']) and pd.notna(row['stop_lon']):
        station_coords[row['stop_name']] = (float(row['stop_lat']), float(row['stop_lon']))

# For stations without coordinates, use approximation
def get_coordinates(station_name):
    # Check if we already have coordinates
    if station_name in station_coords:
        return station_coords[station_name]
    
    # Try to find a similar station name
    for known_station in station_coords:
        if station_name.lower() in known_station.lower() or known_station.lower() in station_name.lower():
            return station_coords[known_station]
    
    # If not found, use Bengaluru center coordinates with a small random offset
    bengaluru_center = (12.9716, 77.5946)
    random_offset = (random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05))
    coords = (bengaluru_center[0] + random_offset[0], bengaluru_center[1] + random_offset[1])
    
    # Cache the result
    station_coords[station_name] = coords
    return coords

# Calculate distances between stations
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

# Create directed multi-graph for detailed route analysis
G_multi = nx.MultiDiGraph()
route_speeds = {'Standard': 20, 'Express': 30, 'Premium': 25}  # km/h (hypothetical)

for _, row in routes.iterrows():
    nodes = row['route_long_name'].split(' - ')
    for i in range(len(nodes)-1):
        G_multi.add_edge(nodes[i].strip(), nodes[i+1].strip(),
                  route_id=row['route_id'],
                  type=row['route_type'],
                  speed=route_speeds.get(row['route_short_name'][:2], 20),
                  time=60 * (1/route_speeds.get(row['route_short_name'][:2], 20)))  # Convert to minutes

class TransitPlanner:
    def __init__(self, graph):
        self.G = graph
        self.transfer_penalty = 10  # minutes
        self.major_hubs = self._identify_major_hubs()
        
    def _identify_major_hubs(self, top_n=20):
        """Identify the major transit hubs based on degree centrality"""
        # Calculate degree for each node
        degree_dict = dict(self.G.degree())
        # Sort nodes by degree and take top N
        return sorted(degree_dict.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
    def calculate_path(self, origin, destination):
        """Find the optimal path between origin and destination"""
        # First try direct path
        try:
            return self._calculate_direct_path(origin, destination)
        except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError) as e:
            print(f"Direct path failed: {e}")
            # If direct path fails, try to find a path with transfers
            return self._calculate_path_with_transfers(origin, destination)
    
    def _calculate_direct_path(self, origin, destination):
        """Calculate a direct path between origin and destination"""
        path = nx.shortest_path(self.G, origin, destination, weight='time')
        return self._process_path(path)
    
    def _calculate_path_with_transfers(self, origin, destination):
        """Find a path that may require transfers between different routes"""
        # Try to find intermediate points that can connect origin and destination
        all_nodes = list(self.G.nodes())
        
        # First check if origin and destination are in the graph
        if origin not in all_nodes or destination not in all_nodes:
            print(f"Origin or destination not in graph. Origin: {origin in all_nodes}, Destination: {destination in all_nodes}")
            # Try to find closest nodes by name similarity
            if origin not in all_nodes:
                closest = self._find_closest_node(origin, all_nodes)
                if closest:
                    print(f"Found closest match for origin: {closest}")
                    origin = closest
                else:
                    print(f"No close match found for origin: {origin}")
            if destination not in all_nodes:
                closest = self._find_closest_node(destination, all_nodes)
                if closest:
                    print(f"Found closest match for destination: {closest}")
                    destination = closest
                else:
                    print(f"No close match found for destination: {destination}")
        
        # If we still don't have valid nodes, return None
        if origin not in all_nodes or destination not in all_nodes:
            print("Still no valid nodes after trying to find closest matches")
            return None
        
        # Find all possible paths through major hubs
        possible_paths = []
        
        # Try paths through major hubs
        for hub, _ in self.major_hubs:
            if hub != origin and hub != destination:
                try:
                    # Check if there's a path from origin to hub
                    path1 = nx.shortest_path(self.G, origin, hub, weight='time')
                    # Check if there's a path from hub to destination
                    path2 = nx.shortest_path(self.G, hub, destination, weight='time')
                    
                    # Combine the paths (remove duplicate hub node)
                    combined_path = path1 + path2[1:]
                    path_info = self._process_path(combined_path)
                    possible_paths.append(path_info)
                    print(f"Found path through hub {hub}")
                except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError) as e:
                    print(f"Path through hub {hub} failed: {e}")
                    continue
        
        # Try two-hub transfers if no paths found yet
        if not possible_paths:
            print("No single-hub paths found, trying two-hub paths")
            for hub1, _ in self.major_hubs[:10]:  # Limit to top 10 hubs for performance
                if hub1 != origin and hub1 != destination:
                    for hub2, _ in self.major_hubs[:10]:  # Limit to top 10 hubs for performance
                        if hub2 != origin and hub2 != destination and hub2 != hub1:
                            try:
                                # Check paths between all segments
                                path1 = nx.shortest_path(self.G, origin, hub1, weight='time')
                                path2 = nx.shortest_path(self.G, hub1, hub2, weight='time')
                                path3 = nx.shortest_path(self.G, hub2, destination, weight='time')
                                
                                # Combine the paths (remove duplicate hub nodes)
                                combined_path = path1 + path2[1:] + path3[1:]
                                path_info = self._process_path(combined_path)
                                possible_paths.append(path_info)
                                print(f"Found path through hubs {hub1} and {hub2}")
                            except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                                continue
        
        # If we found any paths, return the one with the shortest time
        if possible_paths:
            print(f"Found {len(possible_paths)} possible paths")
            return min(possible_paths, key=lambda x: x['time'])
        
        # If all else fails, try a more exhaustive search with random intermediate nodes
        print("No hub paths found, trying random intermediate nodes")
        random_nodes = random.sample(all_nodes, min(30, len(all_nodes)))
        
        for node in random_nodes:
            if node != origin and node != destination:
                try:
                    path1 = nx.shortest_path(self.G, origin, node, weight='time')
                    path2 = nx.shortest_path(self.G, node, destination, weight='time')
                    combined_path = path1 + path2[1:]
                    path_info = self._process_path(combined_path)
                    possible_paths.append(path_info)
                    print(f"Found path through random node {node}")
                except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                    continue
        
        if possible_paths:
            print(f"Found {len(possible_paths)} possible paths through random nodes")
            return min(possible_paths, key=lambda x: x['time'])
            
        # If we still can't find a path, return None
        print("No paths found at all")
        return None
    
    def _process_path(self, path):
        """Process a path to extract steps, time, and transfers"""
        edges = list(zip(path[:-1], path[1:]))
        
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
                    total_time += min_time
            except (TypeError, KeyError, IndexError, ValueError) as e:
                print(f"Error processing edge {u} -> {v}: {e}")
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
            'route_segments': route_segments
        }
    
    def _find_closest_node(self, query, nodes):
        """Find the closest node by name similarity"""
        # Simple string similarity - return the node that contains the query string
        matches = [node for node in nodes if query.lower() in node.lower()]
        if matches:
            return matches[0]
        
        # If no direct substring match, try to find nodes that share words
        query_words = set(query.lower().split())
        best_match = None
        best_score = 0
        
        for node in nodes:
            node_words = set(node.lower().split())
            common_words = query_words.intersection(node_words)
            score = len(common_words)
            
            if score > best_score:
                best_score = score
                best_match = node
        
        # Return the best match if we found one with at least one common word
        if best_score > 0:
            return best_match
            
        return None

# Initialize the planner with the multi-graph that has time information
planner = TransitPlanner(G_multi)

# Print some basic information about the graph
print(f"Graph has {len(G_multi.nodes())} nodes and {len(G_multi.edges())} edges")
print(f"Top 5 major hubs: {planner.major_hubs[:5]}")

# Test the planner with some example routes
test_origins = ["Majestic", "Whitefield", "Jayanagar", "Kengeri"]
test_destinations = ["Electronic City", "Hebbal", "Banashankari", "Yelahanka"]

for origin in test_origins:
    for destination in test_destinations:
        if origin != destination:
            print(f"\n\nTesting route from {origin} to {destination}")
            result = planner.calculate_path(origin, destination)
            
            if result:
                print(f"✅ Found route: {len(result['path'])} stops, {result['time']:.1f} minutes, {result['distance']:.1f} km, ₹{result['fare']}")
                print(f"Steps: {len(result['steps'])} steps, {result['transfers']} transfers")
                print(f"First few steps: {result['steps'][:3]}")
            else:
                print(f"❌ No route found between {origin} and {destination}")