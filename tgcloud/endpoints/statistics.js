// GET /api/statistics
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { COUNTRIES, getTotalUpgrades, parseUpgrades } from '../lib/game.js';

export default async function (input, ctx) {
  const allUsers = await db.all(sql`
    SELECT id, tg_id, username, country_id, points, earnings, upgrades FROM users
  `);

  const countryRows = COUNTRIES.map((country) => {
    const countryUsers = allUsers.filter((u) => Number(u.countryId ?? u.country_id) === country.id);
    const points = countryUsers.reduce((sum, u) => sum + (u.points || 0) + getTotalUpgrades(u), 0);
    const budget = countryUsers.reduce((sum, u) => sum + (u.earnings || 0), 0);
    return {
      id: country.id, name: country.name, population: countryUsers.length,
      budget, points, users: countryUsers.length,
    };
  });

  return {
    countries: countryRows,
    users: allUsers.length,
    totalUsers: allUsers.length,
    totalCountries: COUNTRIES.length,
    totalUpgrades: allUsers.reduce((sum, u) => sum + getTotalUpgrades(u), 0),
    total_budget: allUsers.reduce((sum, u) => sum + (u.earnings || 0), 0),
    total_population: countryRows.reduce((sum, c) => sum + c.population, 0),
    totalPoints: allUsers.reduce((sum, u) => sum + (u.points || 0), 0),
    topCountries: [...countryRows].sort((a, b) => b.points - a.points).slice(0, 5),
  };
}
