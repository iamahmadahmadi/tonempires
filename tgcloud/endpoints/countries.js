// GET /api/countries — population is the number of TON Empires players per country.
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { COUNTRIES } from '../lib/game.js';

export default async function () {
  const rows = await db.all(sql`
    SELECT country_id, COUNT(*) AS population
    FROM users
    WHERE country_id > 0
    GROUP BY country_id
  `);
  const populationByCountry = new Map(rows.map((row) => [Number(row.countryId ?? row.country_id), Number(row.population || 0)]));
  return COUNTRIES.map((country) => ({
    ...country,
    population: populationByCountry.get(country.id) || 0,
    users: populationByCountry.get(country.id) || 0,
  }));
}
