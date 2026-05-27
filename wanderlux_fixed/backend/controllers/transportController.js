// controllers/transportController.js — Transport Options
const db = require('../config/db');

const getTransportOptions = async (req, res) => {
  try {
    const { type } = req.query; // 'domestic' or 'international'
    const isIntl = type === 'international';

    const grouped = { flights: [], trains: [], cabs: [] };

    if (isIntl) {
        // International Flights
        const [flights] = await db.query(
            `SELECT id, airline, flight_code, departs, arrives, duration, base_price, flight_class, stops
             FROM international_flights ORDER BY base_price ASC`
        );
        grouped.flights = flights.map(f => ({
            id: f.id, provider: f.airline, code: f.flight_code, departs: f.departs, arrives: f.arrives,
            duration: f.duration, price: parseFloat(f.base_price), class: f.flight_class, stops: f.stops
        }));

        // International Cabs
        const [cabs] = await db.query(
            `SELECT id, cab_type, models, capacity, base_price, is_ac
             FROM international_cabs ORDER BY base_price ASC`
        );
        grouped.cabs = cabs.map(c => ({
            id: c.id, provider: c.cab_type, code: c.models, departs: 'Any', arrives: 'Any',
            duration: 'Flexible', price: parseFloat(c.base_price), class: c.is_ac ? 'AC' : 'Non-AC', stops: c.capacity
        }));
    } else {
        // Domestic Flights
        const [flights] = await db.query(
            `SELECT id, airline, flight_code, departs, arrives, duration, base_price, flight_class, stops
             FROM domestic_flights ORDER BY base_price ASC`
        );
        grouped.flights = flights.map(f => ({
            id: f.id, provider: f.airline, code: f.flight_code, departs: f.departs, arrives: f.arrives,
            duration: f.duration, price: parseFloat(f.base_price), class: f.flight_class, stops: f.stops
        }));

        // Domestic Trains
        const [trains] = await db.query(
            `SELECT t.id, t.name, t.number, t.departs, t.arrives, t.duration, c.price, c.class_label
             FROM domestic_trains t
             JOIN train_classes c ON t.id = c.train_id
             ORDER BY c.price ASC`
        );
        grouped.trains = trains.map(t => ({
            id: t.id, provider: t.name, code: t.number, departs: t.departs, arrives: t.arrives,
            duration: t.duration, price: parseFloat(t.price), class: t.class_label, stops: 'Direct'
        }));

        // Domestic Cabs
        const [cabs] = await db.query(
            `SELECT id, cab_type, models, capacity, base_price, is_ac
             FROM domestic_cabs ORDER BY base_price ASC`
        );
        grouped.cabs = cabs.map(c => ({
            id: c.id, provider: c.cab_type, code: c.models, departs: 'Any', arrives: 'Any',
            duration: 'Flexible', price: parseFloat(c.base_price), class: c.is_ac ? 'AC' : 'Non-AC', stops: c.capacity
        }));
    }

    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('getTransportOptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transport.' });
  }
};

module.exports = { getTransportOptions };
