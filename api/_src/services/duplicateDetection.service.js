const Entry = require('../models/entry.model');

exports.checkDuplicates = async (name) => {
    // Implement fuzzy matching or exact matching logic
    const similarEntries = await Entry.findByNameSimilarity(name);
    return similarEntries;
};
