const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/admin/database/structure - Get database structure
router.get('/structure', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get collections
    const collections = await db.listCollections().toArray();
    
    const structure = {
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState
      },
      collections: []
    };

    // Get details for each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      
      try {
        const stats = await db.collection(collectionName).stats();
        const sampleDoc = await db.collection(collectionName).findOne();
        const indexes = await db.collection(collectionName).indexes();
        
        structure.collections.push({
          name: collectionName,
          stats: {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize || 0
          },
          sampleDocument: sampleDoc ? flattenStructure(sampleDoc) : null,
          indexes: indexes.filter(idx => idx.name !== '_id_').map(idx => ({
            name: idx.name,
            keys: idx.key
          }))
        });
      } catch (error) {
        structure.collections.push({
          name: collectionName,
          error: error.message
        });
      }
    }

    // Add database stats
    try {
      const dbStats = await db.stats();
      structure.database.stats = {
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexSize: dbStats.indexSize
      };
    } catch (error) {
      structure.database.statsError = error.message;
    }

    res.json(structure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/database/schemas - Get Mongoose schemas
router.get('/schemas', async (req, res) => {
  try {
    const schemas = {};
    
    // Get registered models
    const modelNames = mongoose.modelNames();
    
    for (const modelName of modelNames) {
      const model = mongoose.model(modelName);
      schemas[modelName] = getSchemaInfo(model.schema);
    }

    res.json(schemas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/database/stats - Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const stats = {
      database: mongoose.connection.name,
      totalCollections: collections.length,
      collections: {}
    };

    for (const collection of collections) {
      try {
        const collStats = await db.collection(collection.name).stats();
        stats.collections[collection.name] = {
          documents: collStats.count,
          size: collStats.size,
          avgDocSize: collStats.avgObjSize || 0
        };
      } catch (error) {
        stats.collections[collection.name] = { error: error.message };
      }
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function flattenStructure(obj, maxDepth = 2, currentDepth = 0) {
  if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
    return typeof obj;
  }

  if (Array.isArray(obj)) {
    return {
      type: 'Array',
      length: obj.length,
      sample: obj.length > 0 ? flattenStructure(obj[0], maxDepth, currentDepth + 1) : null
    };
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' || key === '__v') continue;
    
    if (value && typeof value === 'object') {
      result[key] = flattenStructure(value, maxDepth, currentDepth + 1);
    } else {
      result[key] = typeof value;
    }
  }

  return result;
}

function getSchemaInfo(schema) {
  const info = {
    paths: {},
    virtuals: [],
    methods: Object.keys(schema.methods),
    statics: Object.keys(schema.statics)
  };

  schema.eachPath((pathname, schematype) => {
    if (pathname === '_id' || pathname === '__v') return;

    const pathInfo = {
      type: schematype.constructor.name,
      required: !!schematype.options.required,
      unique: !!schematype.options.unique,
      default: schematype.options.default
    };

    if (schematype.options.enum) {
      pathInfo.enum = schematype.options.enum;
    }

    if (schematype.options.ref) {
      pathInfo.ref = schematype.options.ref;
    }

    info.paths[pathname] = pathInfo;
  });

  // Get virtuals
  for (const virtual of Object.keys(schema.virtuals)) {
    if (virtual !== 'id') {
      info.virtuals.push(virtual);
    }
  }

  return info;
}

module.exports = router;
