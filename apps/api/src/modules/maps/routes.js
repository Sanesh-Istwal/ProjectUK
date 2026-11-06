import { Router } from 'express';
import { mapsService } from './service.js';
import { requireAuth, requireRole } from '../../common/authMiddleware.js';
import { AppError } from '../../common/errors.js';
import { ROLES, ERROR_CODES } from '@projectuk/shared';

export const mapsRouter = Router();

// GET /api/v1/maps/markers (viewport bounding box query)
mapsRouter.get('/markers', async (req, res, next) => {
  try {
    const { minLng, minLat, maxLng, maxLat, format } = req.query;
    const places = await mapsService.getMarkersInBounds({ minLng, minLat, maxLng, maxLat });

    // Support GeoJSON format for direct MapLibre source consumption
    if (format === 'geojson') {
      const geojson = {
        type: 'FeatureCollection',
        features: places.map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.lng, p.lat]
          },
          properties: {
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category
          }
        }))
      };
      return res.json(geojson);
    }

    res.json(places);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/maps/places/:id
mapsRouter.get('/places/:id', async (req, res, next) => {
  try {
    const place = await mapsService.getPlaceById(req.params.id);
    if (!place) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Place not found', 404);
    }
    res.json({ place });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/maps/places (add place, requires contributor or moderator role)
mapsRouter.post('/places', requireAuth, requireRole(ROLES.CONTRIBUTOR, ROLES.MODERATOR), async (req, res, next) => {
  try {
    const { title, description, category, lat, lng } = req.body || {};
    if (!title || lat === undefined || lng === undefined) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Title, lat, and lng are required', 400);
    }

    const place = await mapsService.createPlace({ title, description, category, lat, lng });
    res.status(201).json({ place, message: 'Place created successfully' });
  } catch (err) {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
  }
});
