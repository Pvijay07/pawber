-- Expansion Queue for progressive vicinity alerts
CREATE TABLE IF NOT EXISTS booking_expansion_queue (
    booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
    booking_type TEXT CHECK (booking_type IN ('instant', 'scheduled')),
    current_radius INT DEFAULT 5,
    last_notified_at TIMESTAMP DEFAULT NOW(),
    next_expansion_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for background worker performance
CREATE INDEX IF NOT EXISTS idx_expansion_next ON booking_expansion_queue(next_expansion_at);

-- Geospatial distance function (Haversine)
-- Returns distance in KM
CREATE OR REPLACE FUNCTION calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE                                                                                                                                                                 
    R numeric := 6371; -- Earth radius in KM                                                                                                                              
    dLat numeric := radians(lat2 - lat1);                                                                                                                               
    dLon numeric := radians(lon2 - lon1);                                                                                                                               
    a numeric;                                                                                                                                                          
    c numeric;                                                                                                                                                          
BEGIN                                                                                                                                                                   
    a := sin(dLat / 2) * sin(dLat / 2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon / 2) * sin(dLon / 2);                                                       
    c := 2 * atan2(sqrt(a), sqrt(1 - a));                                                                                                                               
    RETURN R * c;                                                                                                                                                       
END;                                                                                                                                                                    
$$ LANGUAGE plpgsql IMMUTABLE;
