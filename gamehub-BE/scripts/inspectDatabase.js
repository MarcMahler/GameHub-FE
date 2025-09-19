const mongoose = require('mongoose');
require('dotenv').config();

async function inspectDatabase() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehub';
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    console.log('═'.repeat(60));

    // Get database instance
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Collections (${collections.length} total):`);
    console.log('═'.repeat(60));
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📁 Collection: ${collectionName}`);
      
      // Get collection stats
    //   const stats = await db.collection(collectionName).stats();
    //   console.log(`   📊 Documents: ${stats.count}`);
    //   console.log(`   💾 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    //   console.log(`   🗂️  Average Doc Size: ${stats.avgObjSize ? (stats.avgObjSize / 1024).toFixed(2) + ' KB' : 'N/A'}`);
      
      // Get sample document to show structure
      const sampleDoc = await db.collection(collectionName).findOne();
      if (sampleDoc) {
        console.log(`   🔍 Sample Document Structure:`);
        console.log('   ' + JSON.stringify(flattenObject(sampleDoc), null, 2).replace(/\n/g, '\n   '));
      } else {
        console.log(`   📭 No documents found`);
      }
      
      // Get indexes
      const indexes = await db.collection(collectionName).indexes();
      if (indexes.length > 1) { // More than just the default _id index
        console.log(`   🗃️  Indexes:`);
        indexes.forEach(index => {
          if (index.name !== '_id_') {
            console.log(`      - ${index.name}: ${JSON.stringify(index.key)}`);
          }
        });
      }
    }

    // Show database-level stats
    console.log('\n' + '═'.repeat(60));
    console.log('🗄️  Database Statistics:');
    console.log('═'.repeat(60));
    
    const dbStats = await db.stats();
    console.log(`📊 Total Collections: ${dbStats.collections}`);
    console.log(`📄 Total Documents: ${dbStats.objects}`);
    console.log(`💾 Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗂️  Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗃️  Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);

    // Show model schemas (from Mongoose)
    console.log('\n' + '═'.repeat(60));
    console.log('🏗️  Mongoose Model Schemas:');
    console.log('═'.repeat(60));
    
    try {
      const User = require('../models/User');
      const Game = require('../models/Game');
      
      console.log('\n👤 User Schema:');
      console.log(getSchemaStructure(User.schema));
      
      console.log('\n🎮 Game Schema:');
      console.log(getSchemaStructure(Game.schema));
    } catch (error) {
      console.log('⚠️  Could not load model schemas:', error.message);
    }

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Helper function to flatten object structure for display
function flattenObject(obj, prefix = '', maxDepth = 2, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return typeof obj === 'object' && obj !== null ? '[Object]' : obj;
  }
  
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, flattenObject(value, newKey, maxDepth, currentDepth + 1));
      } else if (Array.isArray(value)) {
        flattened[newKey] = `[Array(${value.length})]`;
        if (value.length > 0) {
          flattened[`${newKey}[0]`] = flattenObject(value[0], '', maxDepth, currentDepth + 1);
        }
      } else {
        flattened[newKey] = typeof value === 'string' && value.length > 50 
          ? `"${value.substring(0, 50)}..."` 
          : value;
      }
    }
  }
  
  return flattened;
}

// Helper function to get schema structure
function getSchemaStructure(schema) {
  const structure = {};
  
  schema.eachPath((pathname, schematype) => {
    if (pathname === '_id' || pathname === '__v') return;
    
    let type = schematype.constructor.name;
    
    // Handle special cases
    if (schematype.options) {
      if (schematype.options.type) {
        if (Array.isArray(schematype.options.type)) {
          type = `[${schematype.options.type[0].name || 'Mixed'}]`;
        } else {
          type = schematype.options.type.name || 'Mixed';
        }
      }
      
      // Add additional info
      const info = [];
      if (schematype.options.required) info.push('required');
      if (schematype.options.unique) info.push('unique');
      if (schematype.options.default !== undefined) info.push(`default: ${schematype.options.default}`);
      if (schematype.options.enum) info.push(`enum: [${schematype.options.enum.join(', ')}]`);
      
      if (info.length > 0) {
        type += ` (${info.join(', ')})`;
      }
    }
    
    structure[pathname] = type;
  });
  
  return JSON.stringify(structure, null, 2);
}

// Run the inspection
if (require.main === module) {
  inspectDatabase().catch(console.error);
}

module.exports = inspectDatabase;
