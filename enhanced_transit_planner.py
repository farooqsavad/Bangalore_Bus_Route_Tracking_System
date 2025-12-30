import networkx as nx
import random
import time
import datetime
from math import radians, sin, cos, sqrt, atan2

class EnhancedTransitPlanner:
    def __init__(self, graph, station_coords, calculate_fare_func):
        self.G = graph
        self.transfer_penalty = 10  # minutes
        self.station_coords = station_coords
        self.calculate_fare = calculate_fare_func
        self.major_hubs = self._identify_major_hubs()
        self.traffic_conditions = self._initialize_traffic_conditions()
        self.last_traffic_update = time.time()
        self.update_interval = 300  # Update traffic every 5 minutes
        
    def _identify_major_hubs(self, top_n=20):
        """Identify the major transit hubs based on degree centrality"""
        # Calculate degree for each node
        degree_dict = dict(self.G.degree())
        # Sort nodes by degree and take top N
        return sorted(degree_dict.items(), key=lambda x: x[1], reverse=True)[:top_n]
    
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
    
    def haversine_distance(self, lat1, lon1, lat2, lon2):
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
        
    def calculate_path(self, origin, destination, consider_traffic=True):
        """Find the optimal path between origin and destination"""
        # First try direct path
        try:
            return self._calculate_direct_path(origin, destination, consider_traffic)
        except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
            # If direct path fails, try to find a path with transfers
            return self._calculate_path_with_transfers(origin, destination, consider_traffic)
    
    def _calculate_direct_path(self, origin, destination, consider_traffic=True):
        """Calculate a direct path between origin and destination"""
        path = nx.shortest_path(self.G, origin, destination, weight='time')
        return self._process_path(path, consider_traffic)
    
    def _calculate_path_with_transfers(self, origin, destination, consider_traffic=True):
        """Find a path that may require transfers between different routes"""
        # Try to find intermediate points that can connect origin and destination
        all_nodes = list(self.G.nodes())
        
        # First check if origin and destination are in the graph
        if origin not in all_nodes or destination not in all_nodes:
            # Try to find closest nodes by name similarity
            if origin not in all_nodes:
                closest = self._find_closest_node(origin, all_nodes)
                if closest:
                    origin = closest
            if destination not in all_nodes:
                closest = self._find_closest_node(destination, all_nodes)
                if closest:
                    destination = closest
        
        # If we still don't have valid nodes, return None
        if origin not in all_nodes or destination not in all_nodes:
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
                    path_info = self._process_path(combined_path, consider_traffic)
                    possible_paths.append(path_info)
                except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                    continue
        
        # Try two-hub transfers if no paths found yet
        if not possible_paths:
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
                                path_info = self._process_path(combined_path, consider_traffic)
                                possible_paths.append(path_info)
                            except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                                continue
        
        # If we found any paths, return the one with the shortest time
        if possible_paths:
            return min(possible_paths, key=lambda x: x['time'])
        
        # If all else fails, try a more exhaustive search with random intermediate nodes
        random_nodes = random.sample(all_nodes, min(30, len(all_nodes)))
        
        for node in random_nodes:
            if node != origin and node != destination:
                try:
                    path1 = nx.shortest_path(self.G, origin, node, weight='time')
                    path2 = nx.shortest_path(self.G, node, destination, weight='time')
                    combined_path = path1 + path2[1:]
                    path_info = self._process_path(combined_path, consider_traffic)
                    possible_paths.append(path_info)
                except (nx.NetworkXNoPath, nx.NetworkXError, KeyError, ValueError, IndexError):
                    continue
        
        if possible_paths:
            return min(possible_paths, key=lambda x: x['time'])
            
        # If we still can't find a path, return None
        return None
    
    def _process_path(self, path, consider_traffic=True):
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
                    u_coords = self.station_coords.get(u, (12.9716, 77.5946))  # Default to Bengaluru center
                    v_coords = self.station_coords.get(v, (12.9716, 77.5946))
                    
                    # Calculate segment distance
                    segment_dist = self.haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
                    total_distance += segment_dist
                    
                    # Apply real-time traffic adjustment if requested
                    if consider_traffic:
                        adjusted_time = self.get_real_time_travel_time(u, v, min_time)
                    else:
                        adjusted_time = min_time
                    
                    if route_id != current_route:
                        # If we're changing routes, calculate fare for the previous segment
                        if current_route is not None:
                            steps.append(f"Transfer at {u} (Time: {total_time:.1f} mins)")
                            total_time += self.transfer_penalty  # Add transfer penalty
                            
                            # Calculate fare for the completed segment
                            segment_fare = self.calculate_fare(segment_distance, route_type)
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
                    segment_fare = self.calculate_fare(segment_distance, route_type)
                    total_fare += segment_fare
                    segment_distance = 0
                
                current_route = "Unknown"
                route_type = '3'  # Default to regular bus
                steps.append(f"Travel from {u} to {v}")
                
                # Estimate distance for unknown segments
                u_coords = self.station_coords.get(u, (12.9716, 77.5946))
                v_coords = self.station_coords.get(v, (12.9716, 77.5946))
                segment_dist = self.haversine_distance(u_coords[0], u_coords[1], v_coords[0], v_coords[1])
                total_distance += segment_dist
                segment_distance += segment_dist
                
                # Estimate time based on distance (assuming 20 km/h average speed)
                estimated_time = (segment_dist / 20) * 60  # Convert to minutes
                total_time += estimated_time
        
        # Calculate fare for the last segment
        if segment_distance > 0:
            segment_fare = self.calculate_fare(segment_distance, route_type)
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
            'route_segments': route_segments,
            'traffic_conditions': [self.traffic_conditions.get((path[i], path[i+1]), 1.0) 
                                 for i in range(len(path)-1)]
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