import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Indonesian Gen-Z names
const fakeNames = [
  'Rizky Pratama', 'Ayu Lestari', 'Dimas Saputra', 'Nabila Putri', 'Fajar Hidayat',
  'Siti Nurhaliza', 'Andi Firmansyah', 'Dewi Kartika', 'Reza Mahendra', 'Fitri Handayani',
  'Budi Santoso', 'Mega Wati', 'Yoga Prasetyo', 'Rina Marlina', 'Agus Setiawan',
  'Tika Sari', 'Arief Rahman', 'Nadia Kusuma', 'Hendra Wijaya', 'Putri Amelia',
  'Bayu Anggara', 'Sinta Dewi', 'Galih Prakoso', 'Wulan Dari', 'Eko Prasetya',
  'Mira Susanti', 'Fandi Ahmad', 'Lina Oktavia', 'Joko Widodo Jr', 'Ratna Sari',
  'Bagus Hernando', 'Yuni Astuti', 'Doni Salmanan', 'Indah Permata', 'Wahyu Nugroho',
  'Citra Kirana', 'Aldi Taher', 'Maya Safira', 'Rangga Putra', 'Vina Garnacho',
  'Irfan Hakim', 'Anisa Rahma', 'Gilang Ramadhan', 'Dina Fitriani', 'Fikri Haikal',
  'Rosa Meldianti', 'Naufal Abshar', 'Bella Shofie', 'Kemal Palevi', 'Zahra Aurelia',
  'Tommy Kurniawan', 'Sella Nasution', 'Rio Ferdinand ID', 'Cici Paramida', 'Bambang Pamungkas',
  'Tiara Andini', 'Raffi Nagita', 'Shinta Bachir', 'Denny Caknan', 'Vanessa Angel',
  'Kevin Sanjaya', 'Lesti Kejora', 'Gibran Maulana', 'Syifa Hadju', 'Pratama Arhan',
  'Aurel Hermansyah', 'Kaesang Gamer', 'Fuji Utami', 'Atta Halilintar Jr', 'Raisa Andriana',
  'Jordi Onsu', 'Amanda Manopo', 'Iqbaal Ramadhan', 'Maudy Ayunda', 'Aliando Syarief',
  'Prilly Latuconsina', 'Stefan William', 'Natasha Wilona', 'Verrell Bramasta', 'Febby Rastanty',
  'Bryan Domani', 'Sandrinna Michelle', 'Angga Yunanda', 'Adhisty Zara', 'Arbani Yasiz',
  'Rey Mbayang', 'Dinda Hauw', 'Teuku Rassya', 'Ranty Maria', 'Harris Vriza',
  'Lea Ciarachel', 'Bastian Steel', 'Mikha Tambayong', 'Randy Martin', 'Angela Gilsha',
  'Rizky Billar', 'Lesty KDI', 'Jirayut Gamer', 'Rachel Vennya', 'Fadil Jaidi',
  'Bintang Emon', 'Sisca Kohl', 'Jerome Polin', 'Tasya Farasya', 'Windah Basudara',
  'Jess No Limit', 'MiawAug Fan', 'ONIC Kairi', 'BTR Luxxy', 'RRQ Hoshi',
  'EVOS Legend', 'Alter Ego Pai', 'Bigetron RA', 'Geek Fam ID', 'NXL Valor',
  'DedekGaming', 'FrostDiamond Jr', 'BangAlex ID', 'KenZero', 'SkinnyGamerID',
  'AkuGamer_ID', 'PakBepe', 'MboiGaming', 'CewekGamer01', 'NoobMaster69ID',
  'ProPlayerKW', 'SultanSteam', 'AnakMama_GG', 'KontolAyam99', 'GabutGaming',
  'SteamLoverID', 'GameManiac', 'IndoGamer', 'KocakGaming', 'SantaiAja',
  'NoLifeGamer', 'WibuGaming', 'OtakuSteam', 'MagerPlayer', 'RebHanGaming',
  'TuyulGamer', 'BocilKematian', 'KangGame', 'PejuangTanggal', 'SteamAddictID',
  'GasPolGame', 'CuanGaming', 'MantapJiwa', 'BarBarKing', 'AFK_Player',
  'MabarYuk', 'PushRankID', 'LegendGamer', 'AntiMetaID', 'SoloCarryGG',
  'TopFragger', 'GGWellPlayed', 'EZGameEZLife', 'GitGudScrub', 'SteamSaleHunter',
];

// Review comments by rating category
const reviews5Star = [
  'GILA SIH INI GAME, grafisnya kek real life beneran 🔥🔥🔥',
  'Worth it banget buat harganya, no cap frfr',
  'Admin fast respon, akun langsung dikirim. Mantap jiwa!',
  'GOAT sih ini game, 10/10 would buy again 💯',
  'Baru 5 menit udah dapet akun, speed run admin wkwk',
  'Asli ini game bikin lupa makan, lupa tidur, lupa mantan 😭',
  'Best purchase ever di ZOGAMING! Akun aman, game mantap',
  'Gak nyesel beli disini, admin ramah + fast respon 🙏',
  'Grafiknya gila, ceritanya bikin nangis. 11/10! 😢🔥',
  'Buset ini game keren parah, sampe ketiduran mainin',
  'Pake VR makin keren, recommended bgt buat yang suka immersive',
  'Sumpah ini game worth every rupiah yang gw keluarin',
  'Udah main 200+ jam masih gak bosen, gila sih 🎮',
  'Steam sharing paling trusted ya ZOGAMING, udah beli 3x semua lancar',
  'Paling worth it sih ini, game AAA harga receh 🤑',
  'AWOAKWOAKWK game ini bikin gw jadi no life beneran',
  'Rekomendasi bgt buat yang budget tipis tapi mau game bagus',
  'Admin legendaris, jam 2 pagi masih fast respon 🫡',
  'Nyesel gak beli dari dulu, gamenya the best lah pokoknya',
  'Grafis HD, gameplay smooth, harga murah. Apalagi yang kurang? 😍',
  'Beli game disini tuh kek beli kebahagiaan wkwkwk',
  'Ini bukan game, ini masterpiece. Chef kiss 🤌',
  'Mantap bener, akun langsung aktif. GG admin!',
  'Ceritanya deep banget, sampe mikir 3 hari setelah tamat',
  'Gokil sih ZOGAMING, beli jam 12 malem tetep dilayani 🫡🫡',
  'Game paling worth it yang pernah gw beli. Period.',
  'Auto rekomendasiin ke semua temen gw. WAJIB BELI!',
  'Udah level pro karena kebanyakan main game ini wkwk',
  'Trusted seller! Akun aman sentosa, game lancar jaya ✨',
  'Pertama beli agak ragu, ternyata beneran legit. Salut! 👏',
];

const reviews4Star = [
  'Bagus sih gamenya, cuma agak berat di laptop kentang gw 😅',
  'Overall oke, admin respon cepet. Cuma grafis di PC gw kurang smooth',
  'Gamenya seru tapi butuh waktu adaptasi controlnya',
  'Recommended lah, cuma perlu PC yang lumayan buat max setting',
  '8/10, gamenya keren tapi endingnya agak gantung',
  'Seru sih, tapi kalau bisa tambahin fitur multiplayer lokal dong',
  'Akun dikirim cepet, gamenya oke. Kurang dikit aja di storyline',
  'Worth it buat harga segini, cuma loading agak lama aja',
  'Bagus overall, tapi agak repetitif di mid-game',
  'Controlnya enak, grafis oke, cerita lumayan. 4 bintang lah',
  'Gamenya asik tapi gw kena bug di chapter 3, untung bisa di-bypass',
  'Oke lah buat steam sharing, gamenya sendiri solid 👍',
  'Admin ramah, gamenya bagus. Minus dikit di optimisasi aja',
  'Buat harga segini sih udah lebih dari cukup, no complaint',
  'Game bagus tapi side questnya agak filler, main story mantap',
  'Seru buat mabar sama temen, cuma agak addicting wkwk',
  'Solid game, cuma sayang DLC-nya belum include',
  'Gameplay mantap, cuma soundtracknya kurang nendang',
  'Beli buat weekend gaming, gak nyesel tapi gak mind-blowing juga',
  'Oke banget buat harganya, cukup puas lah 7.5/10',
];

const reviews3Star = [
  'Yaa lumayan lah buat ngabisin waktu, gak terlalu wah tapi oke',
  'Mid sih menurutku, tapi worth it lah buat harga segini',
  'Game-nya standar aja sih, gak se-hype yang orang bilang',
  'B aja sih, tapi adminnya ramah jadi ya oke lah',
  'Grafis bagus tapi gameplay repetitive banget',
  'Ekspektasi tinggi tapi pas main biasa aja 😐',
  'Buat casual gaming sih oke, buat hardcore kurang',
  'Ceritanya bagus tapi gameplaynya agak monoton',
  'So-so lah, tapi buat harga segini ya gak bisa komplain',
  'Agak overrated sih menurut gw, tapi tetep layak dicoba',
];

const reviews2Star = [
  'Bruh proses lama bener, nunggu 2 jam baru dikirim 💀',
  'Gamenya sih oke tapi laptop gw gak kuat, salah gw sih wkwk',
  'Agak lag sih di PC gw, mungkin spec kurang kali ya',
  'Kurang seru menurut gw, tapi selera orang beda-beda',
  'Admin agak slow respon pas weekend, tapi akhirnya dapet sih',
  'Game-nya kurang polish, banyak bug minor yang ganggu',
  'Hmm agak kecewa sih, gak sesuai ekspektasi dari trailer',
  'Ceritanya bagus tapi controlnya awkward banget di keyboard',
];

const reviews1Star = [
  'Laptop gw meledak gara-gara game ini, spec minimum bohong 💀💀',
  'Beli pas lagi impulsive, ternyata genre-nya bukan selera gw wkwk',
  'Game-nya bagus tapi gw rage quit di boss terakhir, uninstall deh 😤',
  'Gak bisa refund karena udah ketagihan, technically 5 star tapi kesel 😂',
  'Crash mulu di PC gw, mungkin karena masih pake Windows 7 🤡',
];

// Product review count proportional to downloads
function getReviewCount(downloads: number): number {
  if (downloads >= 1000000) return Math.floor(Math.random() * 30) + 100; // 100-130
  if (downloads >= 800000) return Math.floor(Math.random() * 20) + 75;  // 75-95
  if (downloads >= 500000) return Math.floor(Math.random() * 20) + 50;  // 50-70
  if (downloads >= 400000) return Math.floor(Math.random() * 15) + 35;  // 35-50
  if (downloads >= 300000) return Math.floor(Math.random() * 10) + 28;  // 28-38
  if (downloads >= 200000) return Math.floor(Math.random() * 10) + 18;  // 18-28
  if (downloads >= 100000) return Math.floor(Math.random() * 8) + 10;   // 10-18
  if (downloads >= 50000) return Math.floor(Math.random() * 5) + 5;     // 5-10
  return Math.floor(Math.random() * 3) + 3;                              // 3-5
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedRating(): { rating: number; pool: string[] } {
  const rand = Math.random();
  if (rand < 0.40) return { rating: 5, pool: reviews5Star };      // 40% give 5 stars
  if (rand < 0.70) return { rating: 4, pool: reviews4Star };      // 30% give 4 stars
  if (rand < 0.85) return { rating: 3, pool: reviews3Star };      // 15% give 3 stars
  if (rand < 0.95) return { rating: 2, pool: reviews2Star };      // 10% give 2 stars
  return { rating: 1, pool: reviews1Star };                        // 5% give 1 star
}

export async function POST() {
  try {
    const sql = getDb();

    // Ensure reviews table exists
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, user_id)
      )
    `;

    // Create fake reviewer users
    const defaultHash = await bcrypt.hash('reviewer123', 10);
    const userIds: number[] = [];

    for (let i = 0; i < fakeNames.length; i++) {
      const name = fakeNames[i];
      const email = `reviewer${i + 1}@zogaming.fake`;
      const result = await sql`
        INSERT INTO users (name, email, password_hash, phone, role)
        VALUES (${name}, ${email}, ${defaultHash}, '', 'customer')
        ON CONFLICT (email) DO UPDATE SET name = ${name}
        RETURNING id
      `;
      userIds.push(result[0].id as number);
    }

    // Get all products
    const products = await sql`SELECT id, name, downloads FROM products ORDER BY downloads DESC`;

    let totalReviews = 0;
    const usedPairs = new Set<string>(); // track product_id + user_id pairs

    for (const product of products) {
      const reviewCount = getReviewCount(product.downloads as number || 0);
      const availableUsers = [...userIds].sort(() => Math.random() - 0.5); // shuffle
      const usersForProduct = availableUsers.slice(0, Math.min(reviewCount, availableUsers.length));

      for (const userId of usersForProduct) {
        const pairKey = `${product.id}-${userId}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        const { rating, pool } = getWeightedRating();
        const comment = pickRandom(pool);

        // Random date in last 6 months
        const daysAgo = Math.floor(Math.random() * 180);
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - daysAgo);

        try {
          await sql`
            INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
            VALUES (${product.id}, ${userId}, ${rating}, ${comment}, ${reviewDate.toISOString()})
            ON CONFLICT (product_id, user_id) DO NOTHING
          `;
          totalReviews++;
        } catch {
          // Skip duplicates
        }
      }

      // Update product average rating
      const avgResult = await sql`
        SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${product.id}
      `;
      if (avgResult[0]?.avg_rating) {
        await sql`UPDATE products SET rating = ${avgResult[0].avg_rating} WHERE id = ${product.id}`;
      }
    }

    return NextResponse.json({
      message: `Seeded ${totalReviews} reviews from ${userIds.length} fake users!`,
      totalReviews,
      totalUsers: userIds.length,
    });
  } catch (error) {
    console.error('Review seed error:', error);
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
  }
}
