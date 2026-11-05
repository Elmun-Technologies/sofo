# Dizayn indeksi — sahifa turi → URL → rasm

Rasmlar: `design/screens/`. Telefon versiyalari `M*` / `Mobile*` prefiksi bilan. Ma'lumotlar namuna.

| # | Sahifa | URL (tr) | Indeks | Desktop | Mobil |
|---|---|---|---|---|---|
| 1 | Bosh | `/tr` | ha | HomeFinal | MobileHomeF |
| 2 | Qidiruv + holatlar | `/tr/ara?q=` | noindex | SearchStates | MobileSearch |
| 3–4 | Film / Serial | `/tr/film/{slug}`, `/tr/dizi/{slug}` | sifat darvozasi | Movie, MovieAnswer | MobileMovieF, MobileTitle |
| 5 | Sezon / qism | `/tr/dizi/{slug}/sezon-{n}` | noindex (MVP) | Season | MSeason |
| 6 | Katalog | `/tr/katalog` | ha | Browse | MBrowse, MobileFiltersF |
| 7 | Til hubi | `/tr/turkce-dublaj` | ha | LangHub | MLangHub |
| 8 | To'plam | `/tr/turkce-dublaj/{liste-slug}` | ha | Collection | MCollection |
| 9 | Servis | `/tr/{service}` | ha | Service | MService |
| 10 | Yangi va ketayotganlar | `/tr/yeni-ve-ayrilanlar` | ha | NewLeaving | MNewLeaving |
| 11 | Treylerlar | `/tr/fragmanlar` | ha | Trailers | MTrailers |
| 12 | Shaxs | `/tr/kisi/{slug}` | noindex (MVP) | Person | MPerson |
| 13 | Kids | `/tr/cocuk` | ha | Kids | MKids |
| 14 | My list + xabarlar | `/tr/listem` | noindex | MyList | MobileListF, MNotify |
| 15 | Onboarding | modal | – | Onboarding | MOnboarding |
| 16 | Editionlar / 404 / bo'sh | `/`, 404 | – | Editions, States | MEditions |
| 17 | About / huquqiy | `/tr/hakkinda` | ha | About | MAbout |
| 18 | Share kartalar | og/story | – | Share (kodda yaratiladi) | – |
| 19 | Franshiza | `/tr/seri/{slug}` | ha | Franchise | MFranchise |
| 20 | Chiqish kuzatuvchisi | `/tr/yakinda-dijitalde` | ha | Releases | MReleases |
| + | AI qidiruv (2-bosqich) | – | noindex | AISearch | – |
| + | Modallar, KVKK | – | – | Modals | – |
| + | Brend / DS / Responsive | – | – | Brand, DS2, Responsive, Sitemap | – |
| + | Alertlar | – | – | Alerts | – |
| + | Admin | `/admin` | noindex | AdminDash, AdminQA, AdminLists | – |

Aniq URL slug'lari bo'yicha CLAUDE.md "URL conventions" asosiy; farq bo'lsa CLAUDE.md ustun.
