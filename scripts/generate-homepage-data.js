/**
 * Generate Homepage Snapshot JSON
 * 
 * Creates a static snapshot for the homepage containing:
 * - Featured organizations (top 25 by projects)
 * - Global metrics
 * 
 * Run with: node scripts/generate-homepage-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const OUTPUT_PATH = path.join(__dirname, '..', 'new-api-details', 'homepage.json');

async function generateHomepageData() {
    console.log('[START] Generating homepage snapshot...');

    // 1. Fetch featured organizations (top 25 by projects, currently active)
    console.log('[FETCH] Loading featured organizations...');
    const featuredOrgs = await prisma.organizations.findMany({
        where: {
            is_currently_active: true,
        },
        orderBy: {
            total_projects: 'desc',
        },
        take: 25,
        select: {
            id: true,
            name: true,
            slug: true,
            img_r2_url: true,
            logo_r2_url: true,
            image_url: true,
            total_projects: true,
        },
    });

    // 2. Get global metrics
    console.log('[FETCH] Calculating global metrics...');
    const totalOrgs = await prisma.organizations.count();
    const activeOrgs = await prisma.organizations.count({
        where: { is_currently_active: true },
    });

    // Sum total projects
    const projectsResult = await prisma.organizations.aggregate({
        _sum: {
            total_projects: true,
        },
    });
    const totalProjects = projectsResult._sum.total_projects || 0;

    // 3. Build homepage snapshot
    const homepageData = {
        slug: 'homepage',
        published_at: new Date().toISOString(),

        featured_organizations: featuredOrgs.map((org) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            img_r2_url: org.logo_r2_url || org.img_r2_url || org.image_url,
        })),

        metrics: {
            total_organizations: totalOrgs,
            active_organizations: activeOrgs,
            total_projects: totalProjects,
        },

        meta: {
            version: 1,
            generated_at: new Date().toISOString(),
        },
    };

    // 4. Write to file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(homepageData, null, 2));

    console.log('[DONE] Homepage snapshot generated!');
    console.log(`  - Featured orgs: ${featuredOrgs.length}`);
    console.log(`  - Total orgs: ${totalOrgs}`);
    console.log(`  - Total projects: ${totalProjects}`);
    console.log(`  - Output: ${OUTPUT_PATH}`);

    await prisma.$disconnect();
}

// Run
generateHomepageData().catch((error) => {
    console.error('[ERROR]', error);
    process.exit(1);
});
