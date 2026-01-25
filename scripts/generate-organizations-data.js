/**
 * Generate Organizations Static JSON Data
 * 
 * This script queries all organizations and generates:
 * 1. organizations.index.json - For /organizations list page (minimal fields)
 * 2. organizations/{slug}.json - One file per organization (full data)
 * 3. organizations.metadata.json - Filter metadata (techs, topics, categories, years)
 * 
 * Run with: node scripts/generate-organizations-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(__dirname, '..', 'new-api-details', 'organizations');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');

async function generateOrganizationsData() {
    console.log('[START] Generating organizations static data...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Fetch all organizations
    console.log('[FETCH] Loading organizations from database...');
    const organizations = await prisma.organizations.findMany({
        select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            description: true,
            image_url: true,
            img_r2_url: true,
            logo_r2_url: true,
            url: true,
            active_years: true,
            first_year: true,
            last_year: true,
            is_currently_active: true,
            technologies: true,
            topics: true,
            total_projects: true,
            stats: true,
            years: true,
            first_time: true,
            contact: true,
            social: true,
        },
        orderBy: { name: 'asc' },
    });
    console.log(`[FETCH] Loaded ${organizations.length} organizations`);

    // 2. Generate index.json (minimal fields for list view)
    console.log('[GENERATE] Creating index.json (list view)...');
    const indexData = {
        slug: 'organizations-index',
        published_at: new Date().toISOString(),
        total: organizations.length,
        organizations: organizations.map(org => ({
            id: org.id,
            slug: org.slug,
            name: org.name,
            category: org.category,
            description: org.description,
            image_url: org.image_url,
            img_r2_url: org.img_r2_url,
            logo_r2_url: org.logo_r2_url,
            url: org.url,
            active_years: org.active_years,
            first_year: org.first_year,
            last_year: org.last_year,
            is_currently_active: org.is_currently_active,
            technologies: org.technologies,
            topics: org.topics,
            total_projects: org.total_projects,
            first_time: org.first_time,
        })),
        meta: {
            version: 1,
            generated_at: new Date().toISOString(),
        },
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
    console.log(`[GENERATE] ✓ Created index.json with ${organizations.length} organizations`);

    // 3. Generate individual organization files
    console.log('[GENERATE] Creating individual organization files...');
    let successCount = 0;
    let errorCount = 0;

    for (const org of organizations) {
        try {
            const orgData = {
                ...org,
                meta: {
                    version: 1,
                    generated_at: new Date().toISOString(),
                },
            };

            const orgFile = path.join(OUTPUT_DIR, `${org.slug}.json`);
            fs.writeFileSync(orgFile, JSON.stringify(orgData, null, 2));
            successCount++;
        } catch (error) {
            console.error(`[ERROR] Failed to write ${org.slug}.json:`, error.message);
            errorCount++;
        }
    }

    console.log(`[GENERATE] ✓ Created ${successCount} organization files`);
    if (errorCount > 0) {
        console.log(`[WARN] Failed to create ${errorCount} organization files`);
    }

    // 4. Generate metadata.json (filter metadata)
    console.log('[GENERATE] Creating metadata.json (filter data)...');
    
    // Collect unique values
    const techSet = new Set();
    const topicSet = new Set();
    const categorySet = new Set();
    const yearSet = new Set();
    
    // Count occurrences
    const techCounts = new Map();
    const topicCounts = new Map();
    const categoryCounts = new Map();
    const yearCounts = new Map();

    organizations.forEach(org => {
        // Technologies
        (org.technologies || []).forEach(tech => {
            techSet.add(tech);
            techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
        });

        // Topics
        (org.topics || []).forEach(topic => {
            topicSet.add(topic);
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });

        // Categories
        if (org.category) {
            categorySet.add(org.category);
            categoryCounts.set(org.category, (categoryCounts.get(org.category) || 0) + 1);
        }

        // Years
        (org.active_years || []).forEach(year => {
            yearSet.add(year);
            yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
        });
    });

    const metadata = {
        slug: 'organizations-metadata',
        published_at: new Date().toISOString(),
        technologies: Array.from(techSet).sort().map(tech => ({
            name: tech,
            count: techCounts.get(tech),
        })),
        topics: Array.from(topicSet).sort().map(topic => ({
            name: topic,
            count: topicCounts.get(topic),
        })),
        categories: Array.from(categorySet).sort().map(category => ({
            name: category,
            count: categoryCounts.get(category),
        })),
        years: Array.from(yearSet).sort((a, b) => b - a).map(year => ({
            year: year,
            count: yearCounts.get(year),
        })),
        totals: {
            organizations: organizations.length,
            technologies: techSet.size,
            topics: topicSet.size,
            categories: categorySet.size,
            years: yearSet.size,
        },
        meta: {
            version: 1,
            generated_at: new Date().toISOString(),
        },
    };

    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log(`[GENERATE] ✓ Created metadata.json`);
    console.log(`  - ${metadata.totals.technologies} technologies`);
    console.log(`  - ${metadata.totals.topics} topics`);
    console.log(`  - ${metadata.totals.categories} categories`);
    console.log(`  - ${metadata.totals.years} years`);

    console.log('[COMPLETE] Organizations static data generation finished!');
}

generateOrganizationsData()
    .then(() => {
        console.log('[SUCCESS] Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[ERROR] Script failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
