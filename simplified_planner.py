import networkx as nx
import random
import time
import datetime
from math import radians, sin, cos, sqrt, atan2

# Create a simplified transit network for testing
G = nx.MultiDiGraph()

# Define some stations
stations = [
    "Majestic", "Whitefield", "Electronic City", "Hebbal", 
    "Jayanagar", "Banashankari", "Kengeri", "Yelahanka",
    "Silk Board", "MG Road", "Indiranagar", "Koramangala",
    "HSR Layout", "BTM Layout", "JP Nagar", "Marathahalli"
]

# Create station coordinates (simplified for Bengaluru area)
station_coords = {
    "Majestic": (12.9767, 77.5713),
    "Whitefield": (12.9698, 77.7500),
    "Electronic City": (12.8399, 77.6770),
    "Hebbal": (13.0358, 77.5920),
    "Jayanagar": (12.9250, 77.5938),
    "Banashankari": (12.9175, 77.5467),
    "Kengeri": (12.8987, 77.4877),
    "Yelahanka": (13.1004, 77.5963),
    "Silk Board": (12.9170, 77.6226),
    "MG Road": (12.9747, 77.6080),
    "Indiranagar": (12.9784, 77.6408),
    "Koramangala": (12.9352, 77.6245),
    "HSR Layout": (12.9116, 77.6474),
    "BTM Layout": (12.9166, 77.6101),
    "JP Nagar": (12.9077, 77.5851),
    "Marathahalli": (12.9591, 77.6974)
}

# Define routes
routes = [
    ("Majestic", "MG Road", "500A", "3"),
    ("MG Road", "Indiranagar", "500A", "3"),
    ("Indiranagar", "Marathahalli", "500A", "3"),
    ("Marathahalli", "Whitefield", "500A", "3"),
    ("Whitefield", "Electronic City", "500A", "3"),
    
    ("Majestic", "Silk Board", "500B", "3"),
    ("Silk Board", "Electronic City", "500B", "3"),
    
    ("Majestic", "MG Road", "501", "3"),
    ("MG Road", "Hebbal", "501", "3"),
    ("Hebbal", "Yelahanka", "501", "3"),
    
    ("Majestic", "JP Nagar", "502", "3"),
    ("JP Nagar", "Jayanagar", "502", "3"),
    ("Jayanagar", "Banashankari", "502", "3"),
    
    ("Whitefield", "Marathahalli", "503", "3"),
    ("Marathahalli", "Indiranagar", "503", "3"),
    ("Indiranagar", "MG Road", "503", "3"),
    ("MG Road", "Hebbal", "503", "3"),
    
    ("Whitefield", "Marathahalli", "504", "3"),
    ("Marathahalli", "Koramangala", "504", "3"),
    ("Koramangala", "BTM Layout", "504", "3"),
    ("BTM Layout", "JP Nagar", "504", "3"),
    ("JP Nagar", "Banashankari", "504", "3"),
    
    ("Jayanagar", "BTM Layout", "505", "3"),
    ("BTM Layout", "HSR Layout", "505", "3"),
    ("HSR Layout", "Electronic City", "505", "3"),
    
    ("Jayanagar", "MG Road", "506", "3"),
    ("MG Road", "Hebbal", "506", "3"),
    
    ("Kengeri", "Banashankari", "507", "3"),
    ("Banashankari", "BTM Layout", "507", "3"),
    ("BTM Layout", "Electronic City", "507", "3"),
    
    ("Kengeri", "Majestic", "508", "3"),
    ("Majestic", "Hebbal", "508", "3"),
    
    ("Kengeri", "Banashankari", "509", "3"),
    
    ("Kengeri", "Majestic", "510", "3"),
    ("Majestic", "Hebbal", "510", "3"),
    ("Hebbal", "Yelahanka", "510", "3"),
    
    ("Banashankari", "Majestic", "511", "3"),
    ("Majestic", "Hebbal", "511", "3"),
    ("Hebbal", "Yelahanka", "511", "3"),
    
    ("Whitefield", "Marathahalli", "512", "3"),
    ("Marathahalli", "Hebbal", "512", "3"),
    ("Hebbal", "Yelahanka", "512", "3"),
    
    # Express routes
    ("Majestic", "Electronic City", "Express1", "700"),
    ("Majestic", "Whitefield", "Express2", "700"),
    ("Majestic", "Hebbal", "Express3", "700"),
    ("Whitefield", "Electronic City", "Express4", "700"),
    ("Jayanagar", "Hebbal", "Express5", "700"),
    ("Kengeri", "Yelahanka", "Express6", "700")
]

# Add edges to the graph
for start, end, route_id, route_type in routes:
    # Calculate distance
    start_coords = station_coords[start]
    end_coords = station_coords[end]
    
    # Haversine distance
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
    
    distance = haversine_distance(start_coords[0], start_coords[1], end_coords[0], end_coords[1])
    
    # Calculate time based on distance and route type
    speed = 30 if route_type == "700" else 20  # km/h
    time_minutes = (distance / speed) * 60
    
    # Add edge with attributes
    G.add_edge(start, end, 
               route_id=route_id,
               type=route_type,
               distance=distance,
               time=time_minutes)

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

class TransitPlanner:
    def __init__(self, graph, station_coords):
        self.G = graph
        self.station_coords = station_coords
        self.transfer_penalty = 10  # minutes
        self.major_hubs = self._identify_major_hubs()
        
    def _identify_major_hubs(self, top_n=5):
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
            for hub1, _ in self.major_hubs:
                if hub1 != origin and hub1 != destination:
                    for hub2, _ in self.major_hubs:
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
        random_nodes = random.sample(all_nodes, min(10, len(all_nodes)))
        
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
                    # Find the edge with minimum time
                    min_time = float('inf')
                    best_edge = None
                    
                    for key, data in edge_data.items():
                        if data['time'] < min_time:
                            min_time = data['time']
                            best_edge = data
                    
                    route_data = best_edge
                    route_id = route_data['route_id']
                    segment_dist = route_data['distance']
                    
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
                u_coords = self.station_coords.get(u, (12.9716, 77.5946))
                v_coords = self.station_coords.get(v, (12.9716, 77.5946))
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
        path_coords = [self.station_coords.get(station, (12.9716, 77.5946)) for station in path]
        
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
planner = TransitPlanner(G, station_coords)

# Print some basic information about the graph
print(f"Graph has {len(G.nodes())} nodes and {len(G.edges())} edges")
print(f"Top 5 major hubs: {planner.major_hubs}")

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

# Test with some invalid or misspelled stations
print("\n\nTesting with invalid or misspelled stations:")
test_cases = [
    ("Majestic", "Electronik City"),  # Misspelled destination
    ("Whitfield", "Hebbal"),          # Misspelled origin
    ("Majestic", "Airport"),          # Non-existent destination
    ("Kormangala", "Hebbal")          # Misspelled origin
]

for origin, destination in test_cases:
    print(f"\nTesting route from {origin} to {destination}")
    result = planner.calculate_path(origin, destination)
    
    if result:
        print(f"✅ Found route: {len(result['path'])} stops, {result['time']:.1f} minutes, {result['distance']:.1f} km, ₹{result['fare']}")
        print(f"Steps: {len(result['steps'])} steps, {result['transfers']} transfers")
        print(f"First few steps: {result['steps'][:3]}")
    else:
        print(f"❌ No route found between {origin} and {destination}")