/**
 * Generate Topics Static JSON Data
 * 
 * This script reads organizations data and generates:
 * 1. topics/index.json - For /topics list page (all topics with counts)
 * 2. topics/{slug}.json - One file per topic (organizations, stats)
 * 
 * Topics are derived from organizations.topics[] array.
 * 
 * Run with: node scripts/generate-topics-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(__dirname, '..', 'new-api-details', 'topics');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

/**
 * Normalize topic name to slug
 */
function normalizeSlug(topicName) {
    return topicName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Normalize topic name (preserve original capitalization)
 */
function normalizeName(topicName) {
    return topicName.trim();
}

async function generateTopicsData() {
    console.log('[START] Generating topics static data...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Fetch all organizations with topics
    console.log('[FETCH] Loading organizations from database...');
    const organizations = await prisma.organizations.findMany({
        select: {
            slug: true,
            name: true,
            topics: true,
            active_years: true,
            first_year: true,
            last_year: true,
            total_projects: true,
            is_currently_active: true,
            years: true,
        },
        orderBy: { name: 'asc' },
    });
    console.log(`[FETCH] Loaded ${organizations.length} organizations`);

    // 2. Build topic map
    console.log('[PROCESS] Building topic index...');
    const topicMap = new Map(); // slug -> { name, orgs, byYear }

    organizations.forEach((org) => {
        (org.topics || []).forEach((topic) => {
            const slug = normalizeSlug(topic);
            const name = normalizeName(topic);

            if (!topicMap.has(slug)) {
                topicMap.set(slug, {
                    name: name,
                    slug: slug,
                    orgs: new Map(), // slug -> org data
                    byYear: {}, // year -> { orgCount, projectCount }
                });
            }

            const topicData = topicMap.get(slug);

            // Add org if not already added
            if (!topicData.orgs.has(org.slug)) {
                topicData.orgs.set(org.slug, {
                    slug: org.slug,
                    name: org.name,
                    first_year: org.first_year,
                    last_year: org.last_year,
                    total_projects: org.total_projects,
                    is_currently_active: org.is_currently_active,
                    active_years: org.active_years,
                });
            }

            // Update year stats
            (org.active_years || []).forEach((year) => {
                if (!topicData.byYear[year]) {
                    topicData.byYear[year] = {
                        orgCount: 0,
                        projectCount: 0,
                    };
                }
                topicData.byYear[year].orgCount += 1;

                // Calculate project count for this year from org.years data
                if (org.years && typeof org.years === 'object') {
                    const yearKey = `year_${year}`;
                    if (org.years[yearKey] && org.years[yearKey].num_projects) {
                        topicData.byYear[year].projectCount += org.years[yearKey].num_projects;
                    }
                }
            });
        });
    });

    console.log(`[PROCESS] Found ${topicMap.size} unique topics`);

    // 3. Generate individual topic files
    console.log('[GENERATE] Creating individual topic files...');
    let successCount = 0;
    let errorCount = 0;
    const topicList = [];

    for (const [slug, topicData] of topicMap.entries()) {
        try {
            const orgsArray = Array.from(topicData.orgs.values()).sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            // Calculate total projects across all orgs
            const totalProjects = orgsArray.reduce((sum, org) => sum + (org.total_projects || 0), 0);

            // Get all years this topic appears in
            const years = Object.keys(topicData.byYear)
                .map(y => parseInt(y))
                .filter(y => !isNaN(y))
                .sort((a, b) => b - a);

            // Build yearly stats
            const yearlyStats = {};
            YEARS.forEach(year => {
                if (topicData.byYear[year]) {
                    yearlyStats[year] = {
                        organizationCount: topicData.byYear[year].orgCount,
                        projectCount: topicData.byYear[year].projectCount,
                    };
                }
            });

            const topicPageData = {
                slug: slug,
                name: topicData.name,
                published_at: new Date().toISOString(),
                organizationCount: orgsArray.length,
                projectCount: totalProjects,
                years: years,
                organizations: orgsArray,
                yearlyStats: yearlyStats,
                meta: {
                    version: 1,
                    generated_at: new Date().toISOString(),
                },
            };

            const topicFile = path.join(OUTPUT_DIR, `${slug}.json`);
            fs.writeFileSync(topicFile, JSON.stringify(topicPageData, null, 2));
            successCount++;

            // Add to list for index
            topicList.push({
                slug: slug,
                name: topicData.name,
                organizationCount: orgsArray.length,
                projectCount: totalProjects,
                years: years,
            });
        } catch (error) {
            console.error(`[ERROR] Failed to write ${slug}.json:`, error.message);
            errorCount++;
        }
    }

    console.log(`[GENERATE] ✓ Created ${successCount} topic files`);
    if (errorCount > 0) {
        console.log(`[WARN] Failed to create ${errorCount} topic files`);
    }

    // 4. Generate index.json
    console.log('[GENERATE] Creating index.json...');
    const indexData = {
        slug: 'topics-index',
        published_at: new Date().toISOString(),
        total: topicList.length,
        topics: topicList.sort((a, b) => {
            // Sort by organization count (desc), then name
            if (b.organizationCount !== a.organizationCount) {
                return b.organizationCount - a.organizationCount;
            }
            return a.name.localeCompare(b.name);
        }),
        meta: {
            version: 1,
            generated_at: new Date().toISOString(),
        },
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
    console.log(`[GENERATE] ✓ Created index.json with ${topicList.length} topics`);

    console.log('[COMPLETE] Topics static data generation finished!');
}

generateTopicsData()
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
