export function getCocDerivedStats(characteristics: Record<string, number>) {
  const str = characteristics.STR || 0;
  const siz = characteristics.SIZ || 0;
  const dex = characteristics.DEX || 0;

  // Build and Damage Bonus
  const dbBuildMap = [
    { max: 64, db: '-2', build: -2 },
    { max: 84, db: '-1', build: -1 },
    { max: 124, db: '0', build: 0 },
    { max: 164, db: '+1D4', build: 1 },
    { max: 204, db: '+1D6', build: 2 },
    { max: 284, db: '+2D6', build: 3 }, // Simplified for higher bounds
  ];

  const totalStrSiz = str + siz;
  let db = '0';
  let build = 0;

  for (const threshold of dbBuildMap) {
    if (totalStrSiz <= threshold.max) {
      db = threshold.db;
      build = threshold.build;
      break;
    }
  }
  // Hard cap fallback
  if (totalStrSiz > 284) {
    db = '+2D6'; 
    build = 3;
  }

  // Move Rate
  let move = 8;
  if (dex < siz && str < siz) {
    move = 7;
  } else if (dex > siz && str > siz) {
    move = 9;
  }
  // Age penalties are usually applied to Move, skipping for simplicity unless needed

  return { db, build, move };
}
