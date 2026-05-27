create database wanderlux_db;
use wanderlux_db;
CREATE TABLE packages (
  id           INT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  location     VARCHAR(200) NOT NULL,
  duration     VARCHAR(80)  NOT NULL,
  days         INT          NOT NULL,
  price_usd    DECIMAL(10,2) NOT NULL,    
  price_inr    INT GENERATED ALWAYS AS (ROUND(price_usd * 83)) STORED,
  rating       DECIMAL(3,1) NOT NULL,
  reviews      INT          NOT NULL,
  badge        VARCHAR(30),               
  badge_label  VARCHAR(30),
  description  TEXT,
  image_url    VARCHAR(500),
  is_international BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE package_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  package_id  INT NOT NULL,
  category    VARCHAR(50) NOT NULL,       
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE package_highlights (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  package_id  INT NOT NULL,
  highlight   VARCHAR(100) NOT NULL,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE package_itinerary (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  package_id  INT NOT NULL,
  day_number  INT NOT NULL,
  day_title   VARCHAR(150) NOT NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE itinerary_activities (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  itinerary_id INT NOT NULL,
  activity     VARCHAR(300) NOT NULL,
  sort_order   INT DEFAULT 0,
  FOREIGN KEY (itinerary_id) REFERENCES package_itinerary(id) ON DELETE CASCADE
);
CREATE TABLE package_includes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  package_id  INT NOT NULL,
  item        VARCHAR(200) NOT NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE package_excludes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  package_id  INT NOT NULL,
  item        VARCHAR(200) NOT NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE destinations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  package_count INT DEFAULT 0,
  image_url   VARCHAR(500)
);
CREATE TABLE testimonials (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(150) NOT NULL,
  trip_name   VARCHAR(200),
  review_text TEXT        NOT NULL,
  rating      INT         NOT NULL DEFAULT 5,
  avatar_url  VARCHAR(500)
);
CREATE TABLE coupons (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  type        ENUM('percent','flat') NOT NULL,
  value       DECIMAL(10,2) NOT NULL,      
  min_order   INT DEFAULT 0,               
  description VARCHAR(200),
  is_active   BOOLEAN DEFAULT TRUE
);
CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(300),              
  phone        VARCHAR(20),
  nationality  VARCHAR(60) DEFAULT 'Indian',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE bookings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref      VARCHAR(20) NOT NULL UNIQUE,   
  user_id          INT,
  package_id       INT NOT NULL,
  travel_date      DATE,
  adults           INT NOT NULL DEFAULT 1,
  transport_mode   ENUM('flight','train','cab','none') DEFAULT 'none',
  transport_detail VARCHAR(200),                  
  transport_cost   INT DEFAULT 0,                 
  package_cost_inr INT NOT NULL,                  
  gst_amount       INT NOT NULL,                  
  discount_amount  INT DEFAULT 0,
  coupon_code      VARCHAR(30),
  total_amount     INT NOT NULL,
  status           ENUM('confirmed','upcoming','cancelled') DEFAULT 'confirmed',
  booked_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);
CREATE TABLE booking_travellers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT NOT NULL,
  is_lead      BOOLEAN DEFAULT FALSE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(200),               
  phone        VARCHAR(20),                
  passport_no  VARCHAR(30),
  nationality  VARCHAR(60) DEFAULT 'Indian',
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE TABLE wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  package_id  INT NOT NULL,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, package_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE TABLE domestic_flights (
  id          VARCHAR(10) PRIMARY KEY,    
  airline     VARCHAR(100) NOT NULL,
  flight_code VARCHAR(20) NOT NULL,
  departs     VARCHAR(10) NOT NULL,
  arrives     VARCHAR(10) NOT NULL,
  duration    VARCHAR(20) NOT NULL,
  base_price  INT NOT NULL,              
  biz_price   INT,                       
  first_price INT,                       
  flight_class ENUM('Economy','Business','First') DEFAULT 'Economy',
  stops       VARCHAR(30) DEFAULT 'Non-stop'
);
CREATE TABLE international_flights (
  id          VARCHAR(10) PRIMARY KEY,
  airline     VARCHAR(100) NOT NULL,
  flight_code VARCHAR(20) NOT NULL,
  departs     VARCHAR(10) NOT NULL,
  arrives     VARCHAR(10) NOT NULL,
  duration    VARCHAR(30) NOT NULL,
  base_price  INT NOT NULL,
  biz_price   INT,
  first_price INT,
  flight_class ENUM('Economy','Business','First') DEFAULT 'Economy',
  stops       VARCHAR(30) DEFAULT 'Non-stop'
);
CREATE TABLE domestic_trains (
  id          VARCHAR(10) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  number      VARCHAR(10)  NOT NULL,
  departs     VARCHAR(10)  NOT NULL,
  arrives     VARCHAR(15)  NOT NULL,
  duration    VARCHAR(20)  NOT NULL,
  running_days VARCHAR(80)
);
CREATE TABLE train_classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  train_id    VARCHAR(10) NOT NULL,
  class_code  VARCHAR(10) NOT NULL,    
  class_label VARCHAR(50) NOT NULL,
  price       INT NOT NULL,
  availability VARCHAR(20) DEFAULT 'Avail',
  FOREIGN KEY (train_id) REFERENCES domestic_trains(id) ON DELETE CASCADE
);
CREATE TABLE domestic_cabs (
  id          VARCHAR(10) PRIMARY KEY,
  cab_type    VARCHAR(50) NOT NULL,
  models      VARCHAR(150),
  capacity    VARCHAR(30),
  base_price  INT NOT NULL,
  per_km      INT NOT NULL,
  is_ac       BOOLEAN DEFAULT TRUE
);
CREATE TABLE international_cabs (
  id          VARCHAR(10) PRIMARY KEY,
  cab_type    VARCHAR(50) NOT NULL,
  models      VARCHAR(150),
  capacity    VARCHAR(30),
  base_price  INT NOT NULL,
  per_km      INT NOT NULL,
  is_ac       BOOLEAN DEFAULT TRUE
);
CREATE TABLE reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  package_id  INT,
  rating      INT NOT NULL DEFAULT 5,
  title       VARCHAR(200),
  body        TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
);
CREATE TABLE searchable_places (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150),
  region   ENUM('domestic','international') NOT NULL
);
INSERT INTO packages (id, title, location, duration, days, price_usd, rating, reviews, badge, badge_label, description, image_url, is_international) VALUES
(1,  'Bali & Ubud Sacred Journey',
     'Bali, Indonesia',
     '10 Days / 9 Nights', 10, 1890.00, 4.9, 218,
     'popular', 'Popular',
     'Immerse yourself in the spiritual heart of Bali. From the misty highlands of Ubud to the sacred temples of Besakih, this journey takes you deep into Balinese culture, art, and spirituality.',
     'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&fit=crop&auto=format',
     TRUE),
(2,  'Rajasthan Royal Experience',
     'Rajasthan, India',
     '12 Days / 11 Nights', 12, 2240.00, 4.8, 173,
     'luxury', 'Luxury',
     'A regal journey through India''s most magnificent state. Sleep in converted maharaja palaces, ride camels at sunset in the Thar Desert, and discover centuries of Rajput history and culture.',
     'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80&fit=crop&auto=format',
     FALSE),
(3,  'Patagonia Expedition',
     'Torres del Paine, Chile',
     '14 Days / 13 Nights', 14, 4200.00, 4.9, 89,
     'adventure', 'Adventure',
     'Push your limits at the end of the world. Trek the legendary W Circuit through Torres del Paine, witness calving glaciers, and sleep under skies ablaze with stars in Earth''s most dramatic wilderness.',
     'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
     TRUE),
(4,  'Greek Islands Odyssey',
     'Santorini & Mykonos, Greece',
     '8 Days / 7 Nights', 8, 2850.00, 4.7, 341,
     'new', 'New',
     'The most iconic islands of the Aegean await. Watch the world''s most famous sunset from Oia, sail through turquoise waters, taste volcanic wines, and discover whitewashed villages that feel like a dream.',
     'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80&fit=crop&auto=format',
     TRUE),
(5,  'Kenya Safari & Coast',
     'Masai Mara & Diani, Kenya',
     '11 Days / 10 Nights', 11, 3680.00, 4.9, 156,
     'popular', 'Popular',
     'The ultimate African adventure. Track the Big Five across the golden savannah of Masai Mara, witness the Great Migration, then unwind on Kenya''s stunning Indian Ocean coast at Diani Beach.',
     'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80&fit=crop&auto=format',
     TRUE),
(6,  'Japan Cherry Blossom Trail',
     'Tokyo, Kyoto & Hiroshima',
     '14 Days / 13 Nights', 14, 3950.00, 5.0, 204,
     'luxury', 'Luxury',
     'Experience Japan at its most transcendently beautiful — during cherry blossom season. Walk beneath tunnels of pink sakura, stay in a traditional ryokan, and journey through temples, markets, and neon-lit streets.',
     'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80&fit=crop&auto=format',
     TRUE),
(7,  'Maldives Overwater Escape',
     'North Malé Atoll, Maldives',
     '7 Days / 6 Nights', 7, 4800.00, 4.8, 127,
     'luxury', 'Luxury',
     'Absolute seclusion on turquoise waters. Your overwater glass-floor villa is perched above the Indian Ocean — step directly into the lagoon, float above reef fish, and forget that the rest of the world exists.',
     'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&fit=crop&auto=format',
     TRUE),
(8,  'Nepal Himalaya Trek',
     'Kathmandu & Annapurna, Nepal',
     '16 Days / 15 Nights', 16, 2100.00, 4.8, 91,
     'adventure', 'Adventure',
     'One of the world''s great treks. Circle the Annapurna massif through lush rhododendron forests, high mountain passes, and traditional Gurung villages, watching sunrise paint Machhapuchhre gold.',
     'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80&fit=crop&auto=format',
     TRUE),
(9,  'Morocco Desert & Medinas',
     'Marrakech, Fes & Sahara',
     '10 Days / 9 Nights', 10, 1750.00, 4.6, 188,
     'new', 'New',
     'Morocco intoxicates the senses. Navigate labyrinths of ancient medinas, sip mint tea with Berber families, sleep in a luxury Sahara camp under infinite stars, and wake to the dunes at sunrise.',
     'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80&fit=crop&auto=format',
     TRUE),
(10, 'Santorini & Athens Odyssey',
     'Santorini & Athens, Greece',
     '10 Days / 9 Nights', 10, 3200.00, 4.9, 143,
     'luxury', 'Luxury',
     'Greece''s crown jewel. Watch the world''s most iconic sunset from Oia, swim in the electric-blue Aegean, explore millennia of history at the Acropolis, and sip volcanic wine overlooking the caldera.',
     'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80&fit=crop&auto=format',
     TRUE),
(11, 'Sri Lanka Tea & Tigers',
     'Colombo, Kandy & Yala, Sri Lanka',
     '12 Days / 11 Nights', 12, 1480.00, 4.7, 112,
     'new', 'New',
     'An island of astonishing contrasts. Track Sri Lankan leopards through Yala''s thorn forests, ride the world''s most scenic train through emerald tea hills, and seek blessings at the sacred Temple of the Tooth.',
     'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80&fit=crop&auto=format',
     TRUE),
(12, 'Bali Spirit & Temples',
     'Ubud, Seminyak & Nusa Penida, Bali',
     '10 Days / 9 Nights', 10, 1650.00, 4.8, 231,
     'popular', 'Popular',
     'Bali''s magic is real. Wake to mist over emerald rice terraces, float in a cliff-edge infinity pool, seek the blessings of flower-scented temple ceremonies, and snorkel with manta rays off Nusa Penida.',
     'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&fit=crop&auto=format',
     TRUE),
(13, 'Patagonia End of the World',
     'Torres del Paine & El Calafate',
     '14 Days / 13 Nights', 14, 4500.00, 4.9, 68,
     'adventure', 'Adventure',
     'At the edge of the earth, where granite towers scrape ice-blue skies and ancient glaciers calve into turquoise lakes. The W Circuit of Torres del Paine is one of the world''s great wilderness walks.',
     'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
     TRUE),
(14, 'Vietnam Timeless Journey',
     'Hanoi, Halong Bay & Hội An',
     '13 Days / 12 Nights', 13, 1720.00, 4.7, 189,
     'new', 'New',
     'Vietnam rewards all five senses. Cruise through Halong Bay''s karst labyrinth on a traditional junk, wander Hội An''s lantern-lit old town, and eat your way through the world''s most vibrant street food culture.',
     'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80&fit=crop&auto=format',
     TRUE),
(15, 'Iceland Fire & Ice',
     'Reykjavik & Ring Road, Iceland',
     '8 Days / 7 Nights', 8, 3800.00, 4.9, 97,
     'adventure', 'Adventure',
     'A country where fire and ice have sculpted the landscape into something utterly otherworldly. Chase the Aurora Borealis across starlit skies, walk on ancient glaciers, and bathe in geothermal springs.',
     'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80&fit=crop&auto=format',
     TRUE),
(16, 'Andaman Island Escape',
     'Port Blair, Havelock & Neil Island',
     '7 Days / 6 Nights', 7, 780.00, 4.6, 174,
     'popular', 'Popular',
     'India''s last frontier of pristine ocean. Radhanagar Beach is Asia''s finest stretch of sand. Dive into coral gardens teeming with clownfish, witness bioluminescent plankton, and explore colonial history at Cellular Jail.',
     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&fit=crop&auto=format',
     FALSE),
(17, 'Rajasthan Royal Circuit',
     'Jaipur, Udaipur & Jodhpur, India',
     '12 Days / 11 Nights', 12, 1150.00, 4.8, 207,
     'luxury', 'Luxury',
     'India''s most regal region, where maharajas built palaces of dreams and warriors carved fortresses into desert sandstone. Stay in heritage havelis, take camelback at sunset, and feel the grandeur of royal Rajasthan.',
     'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80&fit=crop&auto=format',
     FALSE),
(18, 'Bhutan Dragon Kingdom',
     'Paro, Thimphu & Punakha, Bhutan',
     '8 Days / 7 Nights', 8, 2800.00, 4.9, 54,
     'luxury', 'Luxury',
     'The world''s only carbon-negative country. Bhutan measures success in Gross National Happiness, not GDP. Trek to the cliffside Tiger''s Nest monastery, witness masked festival dances, and soak in a traditional hot stone bath.',
     'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80&fit=crop&auto=format',
     TRUE),
(19, 'Dubai Luxury Weekend',
     'Dubai, UAE',
     '5 Days / 4 Nights', 5, 1950.00, 4.7, 198,
     'luxury', 'Luxury',
     'Where the impossible is merely Tuesday. Breakfast above the clouds on the Burj Khalifa, roar across red dunes on a desert safari, shop for gold by the kilo, and drift past a glittering skyline on a traditional dhow.',
     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&fit=crop&auto=format',
     TRUE),
(20, 'Ladakh High Altitude Adventure',
     'Leh, Nubra Valley & Pangong, India',
     '9 Days / 8 Nights', 9, 890.00, 4.8, 134,
     'adventure', 'Adventure',
     'The roof of the world. Ladakh''s high-altitude desert is moon-like, spiritual, and utterly spectacular. Cross the world''s highest motorable passes, camp beside the otherworldly blue of Pangong Lake, and spot rare snow leopards.',
     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format',
     FALSE),
(21, 'Goa Sun, Spice & Sea',
     'North & South Goa, India',
     '6 Days / 5 Nights', 6, 420.00, 4.6, 312,
     'popular', 'Popular',
     'India''s golden coast at its most vibrant. Wake to the crash of Arabian Sea waves, explore colonial Portuguese churches draped in bougainvillea, feast on fiery vindaloo, and dance till dawn at Goa''s legendary beach shacks.',
     'https://images.unsplash.com/photo-1598977286061-b5fd75a35e17?w=800&q=80&fit=crop&auto=format',
     FALSE);
INSERT INTO package_categories (package_id, category) VALUES
(1,'beach'),(1,'cultural'),
(2,'cultural'),(2,'luxury'),
(3,'adventure'),(3,'mountain'),
(4,'beach'),(4,'luxury'),
(5,'wildlife'),(5,'beach'),
(6,'cultural'),(6,'luxury'),
(7,'beach'),(7,'luxury'),
(8,'adventure'),(8,'mountain'),(8,'cultural'),
(9,'cultural'),(9,'adventure'),
(10,'beach'),(10,'cultural'),(10,'luxury'),
(11,'wildlife'),(11,'cultural'),(11,'adventure'),
(12,'beach'),(12,'cultural'),(12,'adventure'),
(13,'adventure'),(13,'mountain'),(13,'wildlife'),
(14,'cultural'),(14,'adventure'),(14,'beach'),
(15,'adventure'),(15,'mountain'),(15,'wildlife'),
(16,'beach'),(16,'adventure'),
(17,'cultural'),(17,'luxury'),
(18,'cultural'),(18,'adventure'),(18,'mountain'),
(19,'luxury'),(19,'beach'),
(20,'adventure'),(20,'mountain'),(20,'cultural'),
(21,'beach'),(21,'cultural');
INSERT INTO package_highlights (package_id, highlight, sort_order) VALUES
(1,'Rice Terraces',1),(1,'Temple Walks',2),(1,'Cooking Class',3),(1,'Spa',4),
(2,'Palace Hotels',1),(2,'Desert Camp',2),(2,'Camel Safari',3),(2,'Forts',4),
(3,'W Trek',1),(3,'Glaciers',2),(3,'Wildlife',3),(3,'Wild Camping',4),
(4,'Santorini Sunset',1),(4,'Mykonos Beaches',2),(4,'Sailing',3),(4,'Wine Tour',4),
(5,'Big Five',1),(5,'Great Migration',2),(5,'Diani Beach',3),(5,'Maasai Culture',4),
(6,'Sakura Season',1),(6,'Ryokan Stay',2),(6,'Bullet Train',3),(6,'Tea Ceremony',4),
(7,'Overwater Villa',1),(7,'Diving',2),(7,'Dolphin Cruise',3),(7,'Spa',4),
(8,'Annapurna Circuit',1),(8,'Poon Hill',2),(8,'Teahouses',3),(8,'Sherpa Culture',4),
(9,'Sahara Camel',1),(9,'Medina Maze',2),(9,'Riad Hotel',3),(9,'Berber Culture',4),
(10,'Caldera Views',1),(10,'Oia Sunset',2),(10,'Acropolis',3),(10,'Wine Tasting',4),
(11,'Leopard Safari',1),(11,'Tea Plantations',2),(11,'Temple of Tooth',3),(11,'Train Ride',4),
(12,'Rice Terraces',1),(12,'Temple Ceremonies',2),(12,'Nusa Penida',3),(12,'Spa & Yoga',4),
(13,'W Trek',1),(13,'Perito Moreno Glacier',2),(13,'Condors',3),(13,'Guanacos',4),
(14,'Halong Bay Cruise',1),(14,'Lantern Town',2),(14,'Street Food',3),(14,'Motorbike Tour',4),
(15,'Northern Lights',1),(15,'Geysers',2),(15,'Black Sand Beach',3),(15,'Glacier Walk',4),
(16,'Radhanagar Beach',1),(16,'Scuba Diving',2),(16,'Cellular Jail',3),(16,'Bioluminescence',4),
(17,'Amber Fort',1),(17,'Lake Palace',2),(17,'Mehrangarh Fort',3),(17,'Camel Safari',4),
(18,'Tiger''s Nest Hike',1),(18,'Dzong Monasteries',2),(18,'Happiness Index',3),(18,'Hot Stone Bath',4),
(19,'Burj Khalifa',1),(19,'Desert Safari',2),(19,'Gold Souk',3),(19,'Dhow Dinner Cruise',4),
(20,'Pangong Lake',1),(20,'Nubra Camels',2),(20,'Thiksey Monastery',3),(20,'Khardung La Pass',4),
(21,'Baga Beach',1),(21,'Spice Plantation',2),(21,'Portuguese Churches',3),(21,'Sunset Cruise',4);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(101,1,1,'Arrival in Denpasar'),(102,1,2,'Sacred Temples'),(103,1,3,'Rice Terrace Trek'),
(104,1,4,'Arts & Crafts'),(105,1,5,'Mount Batur Sunrise'),(106,1,6,'Seminyak Beach'),
(107,1,7,'Wellness Day'),(108,1,8,'Nusa Penida'),(109,1,9,'Free Day'),(110,1,10,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(101,'Airport pickup & transfer to Ubud',1),(101,'Welcome dinner at a traditional warung',2),(101,'Evening orientation walk through town',3),
(102,'Visit Tirta Empul holy water temple',1),(102,'Goa Gajah Elephant Cave exploration',2),(102,'Sunset at Pura Luhur Uluwatu',3),
(103,'Sunrise hike through Tegallalang terraces',1),(103,'Traditional farming with local family',2),(103,'Cooking class: make nasi goreng & satay',3),
(104,'Batik and silver jewellery workshops',1),(104,'Visit Monkey Forest sanctuary',2),(104,'Kecak fire dance performance',3),
(105,'4am hike to volcano summit',1),(105,'Breakfast with crater views',2),(105,'Afternoon at Lake Batur',3),
(106,'Transfer to Seminyak',1),(106,'Beach day at Double Six Beach',2),(106,'Sunset cocktails at Ku De Ta',3),
(107,'Full-day Balinese spa treatment',1),(107,'Yoga at sunrise',2),(107,'Meditation with local priest',3),
(108,'Island boat trip',1),(108,'Kelingking Beach snorkelling',2),(108,'Angel''s Billabong & Broken Beach',3),
(109,'Explore at your leisure',1),(109,'Final souvenir shopping',2),(109,'Farewell dinner with Legong dance',3),
(110,'Breakfast at hotel',1),(110,'Transfer to airport',2),(110,'Depart with unforgettable memories',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(201,2,1,'Arrive Jaipur'),(202,2,2,'Pink City'),(203,2,3,'Pushkar Sacred Lake'),
(204,2,4,'Jodhpur Blue City'),(205,2,5,'Jaisalmer Golden City'),(206,2,6,'Desert Night'),
(207,2,7,'Bikaner'),(208,2,8,'Udaipur'),(209,2,9,'City of Romance'),
(210,2,10,'Ranthambore'),(211,2,11,'Return Jaipur'),(212,2,12,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(201,'Check in to heritage palace hotel',1),(201,'Evening visit to Amber Fort lit up',2),(201,'Welcome dinner with folk music',3),
(202,'Hawa Mahal at sunrise',1),(202,'City Palace & Jantar Mantar',2),(202,'Block printing workshop at local studio',3),
(203,'Drive to Pushkar',1),(203,'Visit the only Brahma Temple in world',2),(203,'Evening Aarti ceremony at ghats',3),
(204,'Mehrangarh Fort tour',1),(204,'Walk through indigo-painted old town',2),(204,'Traditional Rajasthani cooking lesson',3),
(205,'Drive to desert city',1),(205,'Golden Fort interior walk',2),(205,'Sunset over sand dunes',3),
(206,'Camel safari at dusk',1),(206,'Overnight luxury desert camp',2),(206,'Stargazing in the Thar Desert',3),
(207,'Visit the Junagarh Fort',1),(207,'Camel breeding farm',2),(207,'Rat Temple at Karni Mata',3),
(208,'Fly/train to Udaipur',1),(208,'Lake Pichola boat ride',2),(208,'City of Lakes walking tour',3),
(209,'Jagdish Temple visit',1),(209,'Saheliyon ki Bari gardens',2),(209,'Dinner at rooftop restaurant with lake view',3),
(210,'Morning jeep safari',1),(210,'Chance to spot tigers & leopards',2),(210,'Ranthambore Fort visit',3),
(211,'Drive back to Jaipur',1),(211,'Shopping at Johari Bazaar',2),(211,'Farewell dinner with Rajasthani dance',3),
(212,'Final breakfast',1),(212,'Airport transfer',2),(212,'Depart Jaipur',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(301,3,1,'Arrive Punta Arenas'),(302,3,2,'Transfer to Park'),(303,3,3,'Las Torres Base'),
(304,3,4,'Valle del Francés'),(305,3,5,'Grey Glacier'),(306,3,6,'Rest & Wildlife'),(307,3,7,'Cerro Castillo');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(301,'Arrival & team briefing',1),(301,'Gear check',2),(301,'Welcome dinner with fellow trekkers',3),
(302,'Bus to Puerto Natales',1),(302,'Park briefing & last supplies',2),(302,'Evening at refugio',3),
(303,'Trek to Mirador Las Torres',1),(303,'Glacial lake viewpoint',2),(303,'Camp at Chileno',3),
(304,'Cross pass to Valle del Francés',1),(304,'Hanging glaciers & condors overhead',2),(304,'Camp at Paine Grande',3),
(305,'Trek to Lago Grey',1),(305,'Kayaking near the glacier',2),(305,'Glacier trekking (crampons on)',3),
(306,'Day for recovery',1),(306,'Puma tracking with ranger',2),(306,'Guanaco & rhea spotting',3),
(307,'Off-the-beaten-path trail',1),(307,'Alternative viewpoints',2),(307,'Wild camping',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(401,4,1,'Arrive Santorini'),(402,4,2,'Santorini Highlights'),(403,4,3,'Sailing Day'),
(404,4,4,'Ferry to Mykonos'),(405,4,5,'Mykonos Beaches'),(406,4,6,'Delos Day Trip'),
(407,4,7,'Free Day'),(408,4,8,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(401,'Transfer to Oia cliffside hotel',1),(401,'Evening stroll along caldera',2),(401,'Sunset cocktails',3),
(402,'Ancient Akrotiri excavations',1),(402,'Red Beach & Black Beach',2),(402,'Volcano wine tasting tour',3),
(403,'Full-day private catamaran',1),(403,'Swim in volcanic hot springs',2),(403,'BBQ on deck at sunset',3),
(404,'Morning ferry crossing',1),(404,'Check in to boutique hotel',2),(404,'Explore Little Venice',3),
(405,'Paradise Beach morning',1),(405,'Super Paradise in afternoon',2),(405,'Dinner at Nammos beach club',3),
(406,'Ancient ruins of sacred island',1),(406,'Terrace of the Lions',2),(406,'Swim at remote cove',3),
(407,'Shopping in Mykonos Town',1),(407,'Windmills photo walk',2),(407,'Farewell dinner at harbour',3),
(408,'Transfer to Mykonos airport',1),(408,'Fly home via Athens',2);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(501,5,1,'Arrive Nairobi'),(502,5,2,'Fly to Mara'),(503,5,3,'Great Migration'),
(504,5,4,'Balloon Safari'),(505,5,5,'Amboseli'),(506,5,6,'Coastal Transfer'),
(507,5,7,'Diani Beach'),(508,5,8,'Wasini Island'),(509,5,9,'Free Beach Day'),
(510,5,10,'Mombasa Old Town'),(511,5,11,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(501,'Giraffe Centre visit',1),(501,'Karen Blixen Museum',2),(501,'Luxury lodge overnight',3),
(502,'Charter flight to Masai Mara',1),(502,'Afternoon game drive',2),(502,'Sundowner in the bush',3),
(503,'Full-day game drive',1),(503,'River crossing viewpoint',2),(503,'Hippo pool at dusk',3),
(504,'Dawn hot air balloon',1),(504,'Champagne breakfast on savannah',2),(504,'Maasai village visit',3),
(505,'Transfer to Amboseli',1),(505,'Kilimanjaro backdrop game drive',2),(505,'Elephant herds at waterhole',3),
(506,'Fly to Mombasa',1),(506,'Transfer to Diani Beach',2),(506,'Evening beach walk',3),
(507,'Full day at leisure',1),(507,'Optional diving/snorkelling',2),(507,'Beach barbeque dinner',3),
(508,'Boat to Wasini Island',1),(508,'Coral gardens snorkel',2),(508,'Swahili seafood lunch',3),
(509,'Sunrise yoga on beach',1),(509,'Snorkelling at reef',2),(509,'Sunset dhow cruise',3),
(510,'Fort Jesus visit',1),(510,'Old Town walking tour',2),(510,'Fly back to Nairobi',3),
(511,'Transfer to JKIA',1),(511,'Fly home',2);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(601,6,1,'Arrive Tokyo'),(602,6,2,'Tokyo Highlights'),(603,6,3,'Mt. Fuji Day'),
(604,6,4,'Hakone Overnight'),(605,6,5,'Kyoto Arrival'),(606,6,6,'Temple Circuit'),
(607,6,7,'Tea & Zen'),(608,6,8,'Nara Day Trip');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(601,'Check in to luxury hotel',1),(601,'Shinjuku exploration',2),(601,'Ramen dinner in Memory Lane',3),
(602,'Senso-ji Temple at dawn',1),(602,'Harajuku & Shibuya Crossing',2),(602,'TeamLab digital art museum',3),
(603,'Bullet train to Fuji area',1),(603,'Views from Chureito Pagoda',2),(603,'Onsen (hot spring) evening',3),
(604,'Ryokan check-in & yukata fitting',1),(604,'Kaiseki dinner (12 courses)',2),(604,'Open-air onsen under stars',3),
(605,'Shinkansen to Kyoto',1),(605,'Check in to machiya townhouse',2),(605,'Gion geisha district evening',3),
(606,'Fushimi Inari gates at sunrise',1),(606,'Arashiyama Bamboo Grove',2),(606,'Golden Pavilion (Kinkaku-ji)',3),
(607,'Tea ceremony at 250-year-old shop',1),(607,'Zen meditation at Ryoan-ji',2),(607,'Nishiki Market food tour',3),
(608,'Free-roaming deer in Nara Park',1),(608,'Todai-ji Giant Buddha',2),(608,'Return to Kyoto for sakura picnic',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(701,7,1,'Arrival'),(702,7,2,'Reef Diving'),(703,7,3,'Dolphin Cruise'),
(704,7,4,'Free Day'),(705,7,5,'Whale Shark'),(706,7,6,'Final Day'),(707,7,7,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(701,'Seaplane transfer from Malé',1),(701,'Check in to overwater villa',2),(701,'Welcome cocktail sunset',3),
(702,'PADI dive with marine biologist',1),(702,'House reef snorkelling at own pace',2),(702,'Overwater spa treatment',3),
(703,'Sunrise dolphin cruise',1),(703,'Deserted sandbank picnic',2),(703,'Night fishing with chefs',3),
(704,'Paddleboard at sunrise',1),(704,'Spa day',2),(704,'Private beach dinner',3),
(705,'Whale shark swim (seasonal)',1),(705,'Snorkelling with turtles',2),(705,'Marine conservation talk',3),
(706,'Morning snorkel',1),(706,'Last spa treatment',2),(706,'Final sunset from your deck',3),
(707,'Seaplane back to Malé',1),(707,'International departure',2);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(801,8,1,'Kathmandu Arrival'),(802,8,2,'Kathmandu Valley'),(803,8,3,'Fly to Pokhara'),
(804,8,4,'Trek Begins'),(805,8,5,'Jungle Trail');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(801,'Transfer to heritage hotel',1),(801,'Welcome briefing',2),(801,'Thamel evening walk',3),
(802,'Boudhanath stupa circumambulation',1),(802,'Pashupatinath cremation ghats',2),(802,'Durbar Square',3),
(803,'Mountain flight views',1),(803,'Pokhara lakeside',2),(803,'Gear check',3),
(804,'Drive to Besisahar',1),(804,'First day''s walk to Bulbule',2),(804,'Teahouse overnight',3),
(805,'Trek through subtropical forest',1),(805,'Waterfalls and suspension bridges',2),(805,'Arrive Jagat',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(901,9,1,'Arrive Marrakech'),(902,9,2,'Marrakech Medina'),(903,9,3,'Atlas Mountains'),
(904,9,4,'Drive to Fes'),(905,9,5,'Fes el-Bali');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(901,'Riad check-in in the medina',1),(901,'Djemaa el-Fna square at dusk',2),(901,'Tagine dinner with musicians',3),
(902,'Bahia Palace',1),(902,'Souk shopping with guide',2),(902,'Saadian Tombs',3),
(903,'Day trip to Ourika Valley',1),(903,'Berber village lunch',2),(903,'Cascades de l''Ourika',3),
(904,'Scenic mountain drive',1),(904,'Midday stop in Azrou cedar forest',2),(904,'Arrive Fes, riad check-in',3),
(905,'Tanneries viewpoint',1),(905,'Bou Inania Madrasa',2),(905,'Local family dinner',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1001,10,1,'Arrive Athens'),(1002,10,2,'Athens Highlights'),(1003,10,3,'Fly to Santorini'),
(1004,10,4,'Caldera Cruise'),(1005,10,5,'Beach Day'),(1006,10,6,'Fira & Villages');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1001,'Hotel check-in Plaka district',1),(1001,'Monastiraki Flea Market',2),(1001,'Taverna dinner with live bouzouki',3),
(1002,'Acropolis & Parthenon at sunrise',1),(1002,'Acropolis Museum',2),(1002,'Syntagma Square',3),
(1003,'Flight to Thira',1),(1003,'Cave hotel check-in Oia',2),(1003,'Caldera sunset walk',3),
(1004,'Catamaran day cruise',1),(1004,'Hot springs swim',2),(1004,'Akrotiri volcanic ruins',3),
(1005,'Red Beach & Black Sand Beach',1),(1005,'Perissa village lunch',2),(1005,'Wine tasting at Santo Wines',3),
(1006,'Fira cable car',1),(1006,'Pyrgos village hike',2),(1006,'Sunset dinner at Oia',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1101,11,1,'Arrive Colombo'),(1102,11,2,'Colombo City'),(1103,11,3,'Kandy'),
(1104,11,4,'Cultural Show'),(1105,11,5,'Tea Country');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1101,'Transfer to hotel',1),(1101,'Galle Face promenade evening',2),(1101,'Seafood by the ocean',3),
(1102,'Gangaramaya Temple',1),(1102,'Pettah Markets',2),(1102,'National Museum',3),
(1103,'Scenic drive',1),(1103,'Botanical Gardens',2),(1103,'Temple of the Tooth ceremony at dusk',3),
(1104,'Kandyan dance performance',1),(1104,'Spice garden visit',2),(1104,'Free afternoon',3),
(1105,'Ella train journey',1),(1105,'Tea factory tour',2),(1105,'Pedro Tea Estate walk',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1201,12,1,'Arrive Bali'),(1202,12,2,'Ubud Culture'),(1203,12,3,'Temple Circuit'),(1204,12,4,'Nusa Penida Day');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1201,'Arrival Ngurah Rai',1),(1201,'Ubud villa check-in',2),(1201,'Monkey Forest walk',3),
(1202,'Tegallalang Rice Terraces at sunrise',1),(1202,'Cooking class with local family',2),(1202,'Traditional healer visit',3),
(1203,'Tirta Empul purification ritual',1),(1203,'Besakih Mother Temple',2),(1203,'Kintamani volcano views',3),
(1204,'Fast boat to Nusa Penida',1),(1204,'Kelingking Beach cliff viewpoint',2),(1204,'Snorkel with manta rays',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1301,13,1,'Arrive Santiago'),(1302,13,2,'Fly South'),(1303,13,3,'Enter the Park'),
(1304,13,4,'Mirador Las Torres'),(1305,13,5,'Valle del Francés');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1301,'Santiago hotel',1),(1301,'Bellavista neighbourhood',2),(1301,'Chilean wine dinner',3),
(1302,'Flight to Punta Arenas',1),(1302,'Strait of Magellan',2),(1302,'Penguin colony visit',3),
(1303,'Transfer to Torres del Paine',1),(1303,'Refugio check-in',2),(1303,'First trail orientation',3),
(1304,'Sunrise hike to the towers',1),(1304,'Condor spotting',2),(1304,'Camp dinner',3),
(1305,'Trek through hanging glaciers',1),(1305,'Cuerno viewpoints',2),(1305,'Wildlife on trail',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1401,14,1,'Arrive Hanoi'),(1402,14,2,'Hanoi Heritage'),(1403,14,3,'Halong Bay'),(1404,14,4,'Halong Sunrise');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1401,'Old Quarter hotel',1),(1401,'Hoan Kiem Lake evening walk',2),(1401,'Pho at 49-year-old restaurant',3),
(1402,'Ho Chi Minh Mausoleum',1),(1402,'Temple of Literature',2),(1402,'Cyclo tour of Old Quarter',3),
(1403,'Transfer to port',1),(1403,'Board luxury junk',2),(1403,'Kayaking into caves',3),
(1404,'Tai chi on deck at sunrise',1),(1404,'Fishing village visit',2),(1404,'Return to Hanoi',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1501,15,1,'Arrive Reykjavik'),(1502,15,2,'Golden Circle'),(1503,15,3,'South Coast'),(1504,15,4,'Glacier Adventure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1501,'City centre walk',1),(1501,'Hallgrímskirkja church tower',2),(1501,'Northern Lights app setup',3),
(1502,'Þingvellir National Park',1),(1502,'Geysir hot spring eruptions',2),(1502,'Gullfoss waterfall',3),
(1503,'Seljalandsfoss waterfall cave walk',1),(1503,'Skógafoss',2),(1503,'Vík black sand beach',3),
(1504,'Vatnajökull glacier hike',1),(1504,'Ice cave exploration',2),(1504,'Northern Lights tour at night',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1601,16,1,'Arrive Port Blair'),(1602,16,2,'Havelock Island'),(1603,16,3,'Scuba Day'),(1604,16,4,'Neil Island');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1601,'Cellular Jail visit',1),(1601,'Sound & Light show',2),(1601,'Port Blair hotel',3),
(1602,'Ferry to Havelock',1),(1602,'Beach resort check-in',2),(1602,'Sunset at Radhanagar Beach',3),
(1603,'PADI intro dive or Elephant Beach snorkel',1),(1603,'Afternoon kayaking',2),(1603,'Bioluminescence night walk',3),
(1604,'Ferry to Neil Island',1),(1604,'Natural Bridge formation',2),(1604,'Bharatpur Beach',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1701,17,1,'Arrive Jaipur'),(1702,17,2,'Jaipur Forts'),(1703,17,3,'Ranthambore'),(1704,17,4,'Udaipur Arrival');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1701,'Pink City heritage haveli check-in',1),(1701,'Hawa Mahal photo stop',2),(1701,'Bazaar shopping at Johari',3),
(1702,'Amber Fort elephant courtyard',1),(1702,'Jaigarh cannon walk',2),(1702,'City Palace museum',3),
(1703,'Tiger reserve morning safari',1),(1703,'Ranthambore Fort ruins',2),(1703,'Jungle dinner',3),
(1704,'Scenic drive to Udaipur',1),(1704,'Lake Pichola boat ride',2),(1704,'City Palace rooftop dinner',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1801,18,1,'Arrive Paro'),(1802,18,2,'Tiger''s Nest Hike'),(1803,18,3,'Thimphu'),(1804,18,4,'Punakha');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1801,'Scenic Druk Air landing',1),(1801,'Rinpung Dzong visit',2),(1801,'Welcome hot stone bath',3),
(1802,'4-hour hike to Taktsang Monastery',1),(1802,'Offerings at the altar',2),(1802,'Valley views at sunset',3),
(1803,'Buddha Dordenma statue',1),(1803,'Traditional archery match',2),(1803,'Craft market',3),
(1804,'Dochula Pass 108 chortens',1),(1804,'Punakha Dzong river confluence',2),(1804,'Suspension bridge walk',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(1901,19,1,'Arrive Dubai'),(1902,19,2,'Skyline Day'),(1903,19,3,'Desert Safari'),(1904,19,4,'Heritage & Gold');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(1901,'5-star hotel check-in',1),(1901,'Dubai Mall & Fountain show',2),(1901,'Sheikh Mohammed dinner invite',3),
(1902,'Burj Khalifa At the Top',1),(1902,'Dubai Frame',2),(1902,'Jumeirah Beach sunset',3),
(1903,'Dune bashing in 4x4',1),(1903,'Camel ride & sandboarding',2),(1903,'Bedouin camp BBQ dinner',3),
(1904,'Old Dubai creek abra ride',1),(1904,'Gold & Spice Souks',2),(1904,'Dhow dinner cruise',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(2001,20,1,'Arrive Leh'),(2002,20,2,'Leh Exploration'),(2003,20,3,'Nubra Valley'),(2004,20,4,'Pangong Lake');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(2001,'Acclimatisation rest',1),(2001,'Shanti Stupa at dusk',2),(2001,'Local thukpa dinner',3),
(2002,'Leh Palace',1),(2002,'Namgyal Tsemo Gompa',2),(2002,'Leh Market shopping',3),
(2003,'Khardung La Pass (5,602m)',1),(2003,'Diskit Monastery',2),(2003,'Bactrian camel safari',3),
(2004,'3 Idiots viewpoint',1),(2004,'Pangong lakeside camp',2),(2004,'Sunrise over the blue lake',3);
INSERT INTO package_itinerary (id, package_id, day_number, day_title) VALUES
(2101,21,1,'Arrive North Goa'),(2102,21,2,'Heritage North Goa'),(2103,21,3,'Spice & Nature'),
(2104,21,4,'South Goa Transfer'),(2105,21,5,'Island & Dolphin Cruise'),(2106,21,6,'Departure');
INSERT INTO itinerary_activities (itinerary_id, activity, sort_order) VALUES
(2101,'Transfer to beachside resort',1),(2101,'Baga Beach stroll',2),(2101,'Sundowner at Tito''s Lane',3),
(2102,'Basilica of Bom Jesus',1),(2102,'Se Cathedral',2),(2102,'Fontainhas Latin Quarter walk',3),
(2103,'Dudhsagar Waterfall hike',1),(2103,'Tropical spice plantation lunch',2),(2103,'Evening at Anjuna flea market',3),
(2104,'Transfer to Palolem Beach',1),(2104,'Colva Beach detour',2),(2104,'Seafood dinner on the shore',3),
(2105,'Butterfly Island boat trip',1),(2105,'Dolphin spotting at dawn',2),(2105,'Sunset catamaran cruise',3),
(2106,'Final beach breakfast',1),(2106,'Transfer to Goa airport',2);
INSERT INTO package_includes (package_id, item) VALUES
(1,'Return flights'),(1,'9 nights accommodation'),(1,'Daily breakfast'),(1,'Airport transfers'),(1,'All activities listed'),(1,'Local expert guide'),(1,'Entrance fees'),
(2,'Domestic flights'),(2,'11 nights heritage hotels'),(2,'All meals'),(2,'Expert guides'),(2,'All safaris'),(2,'Cultural shows'),
(3,'Expert mountain guide'),(3,'All camping equipment'),(3,'Meals during trek'),(3,'Park permits'),(3,'Transport'),
(4,'Ferry crossings'),(4,'7 nights boutique hotels'),(4,'Daily breakfast'),(4,'Sailing day'),(4,'Wine tour'),(4,'Airport transfers'),
(5,'All internal flights'),(5,'10 nights accommodation'),(5,'Full board on safari'),(5,'Game drives'),(5,'Balloon safari'),(5,'All transfers'),
(6,'International flights'),(6,'13 nights mixed luxury accommodation'),(6,'Bullet train passes'),(6,'Daily breakfast'),(6,'Tea ceremony'),(6,'Guided tours'),
(7,'Seaplane transfers'),(7,'6 nights overwater villa'),(7,'Full board'),(7,'Non-motorised water sports'),(7,'One dive'),(7,'Dolphin cruise'),
(8,'Expert trekking guide & porter'),(8,'All teahouse accommodation'),(8,'All meals on trek'),(8,'Permits (ACAP + TIMS)'),(8,'Pokhara accommodation'),
(9,'9 nights riads'),(9,'Daily breakfast'),(9,'Some dinners'),(9,'Desert camp'),(9,'Camel trek'),(9,'All transfers'),
(10,'International flights'),(10,'9 nights luxury accommodation'),(10,'Daily breakfast'),(10,'Catamaran cruise'),(10,'Guided Acropolis tour'),
(11,'All internal transport'),(11,'11 nights accommodation'),(11,'Daily breakfast'),(11,'Yala safari jeep'),(11,'Train tickets'),(11,'Guides'),
(12,'All transfers'),(12,'9 nights villa accommodation'),(12,'Daily breakfast'),(12,'Cooking class'),(12,'Nusa Penida boat trip'),(12,'Temple guide'),
(13,'All internal flights'),(13,'13 nights mixed accommodation'),(13,'All meals on trek'),(13,'Expert guide'),(13,'National Park fees'),(13,'Gear support'),
(14,'2-night Halong Bay cruise'),(14,'12 nights accommodation'),(14,'Daily breakfast'),(14,'Street food tour'),(14,'All transfers'),
(15,'7 nights accommodation'),(15,'Golden Circle tour'),(15,'Glacier hike'),(15,'Northern Lights jeep tour'),(15,'Airport transfers'),
(16,'All ferry tickets'),(16,'6 nights accommodation'),(16,'Daily breakfast'),(16,'Scuba/snorkel session'),(16,'Cellular Jail tickets'),
(17,'11 nights heritage accommodation'),(17,'All transfers by private AC car'),(17,'Daily breakfast'),(17,'Tiger safari'),(17,'Lake Palace boat'),(17,'Guided tours'),
(18,'Bhutan sustainable development fee'),(18,'7 nights luxury lodge'),(18,'All meals'),(18,'Expert licensed guide'),(18,'All transfers'),(18,'Tiger''s Nest permit'),
(19,'4 nights 5-star hotel'),(19,'Daily breakfast'),(19,'Desert safari'),(19,'Dhow dinner cruise'),(19,'Burj Khalifa ticket'),(19,'Airport transfers'),
(20,'8 nights accommodation (camps + hotels)'),(20,'All meals during expedition'),(20,'Private 4x4 vehicle'),(20,'Expert Ladakhi guide'),(20,'All permits'),
(21,'5 nights beach resort'),(21,'Daily breakfast'),(21,'Dudhsagar trip'),(21,'Spice plantation'),(21,'Sunset cruise'),(21,'All transfers');
INSERT INTO package_excludes (package_id, item) VALUES
(1,'Visa fees'),(1,'Travel insurance'),(1,'Personal expenses'),(1,'Optional excursions'),
(2,'International flights'),(2,'Visa'),(2,'Travel insurance'),(2,'Tips'),
(3,'Flights to Punta Arenas'),(3,'Travel insurance'),(3,'Personal gear'),(3,'Pre/post accommodation'),
(4,'International flights'),(4,'Lunches & dinners'),(4,'Personal expenses'),
(5,'International flights'),(5,'Kenya e-visa'),(5,'Travel insurance'),(5,'Tips & gratuities'),
(6,'Some dinners'),(6,'Personal shopping'),(6,'Optional activities'),
(7,'International flights'),(7,'Alcoholic beverages'),(7,'Motorised activities'),(7,'Travel insurance'),
(8,'International flights'),(8,'Kathmandu accommodation'),(8,'Travel insurance'),(8,'Gear hire'),
(9,'International flights'),(9,'Visa (not required for most)'),(9,'Lunch'),(9,'Tips'),
(10,'Some dinners'),(10,'Optional activities'),(10,'Travel insurance'),
(11,'International flights'),(11,'Sri Lanka e-visa'),(11,'Travel insurance'),(11,'Some dinners'),
(12,'International flights'),(12,'Travel insurance'),(12,'Optional spa treatments'),
(13,'International flights'),(13,'Travel insurance'),(13,'Trekking gear hire'),(13,'Alcoholic beverages'),
(14,'International flights'),(14,'Vietnam e-visa'),(14,'Travel insurance'),(14,'Some dinners'),
(15,'International flights'),(15,'Travel insurance'),(15,'Blue Lagoon entry'),(15,'Most meals'),
(16,'Flights to Port Blair'),(16,'Travel insurance'),(16,'Some meals'),
(17,'Flights to Jaipur'),(17,'Some dinners'),(17,'Travel insurance'),
(18,'International flights to Paro'),(18,'Travel insurance'),(18,'Alcoholic beverages'),
(19,'Flights to Dubai'),(19,'Travel insurance'),(19,'Some meals'),
(20,'Flights to Leh'),(20,'Travel insurance'),(20,'Portable oxygen'),
(21,'Flights to Goa'),(21,'Lunches & dinners'),(21,'Personal expenses'),(21,'Water sports');
INSERT INTO destinations (name, country, package_count, image_url) VALUES
('Goa',       'India',        6,  'https://images.unsplash.com/photo-1598977286061-b5fd75a35e17?w=400&q=80&fit=crop&auto=format'),
('Bali',      'Indonesia',    8,  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80&fit=crop'),
('Rajasthan', 'India',        12, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80&fit=crop'),
('Santorini', 'Greece',       6,  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80&fit=crop'),
('Kenya',     'Africa',       9,  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&q=80&fit=crop'),
('Japan',     'Asia',         11, 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80&fit=crop'),
('Maldives',  'Indian Ocean', 5,  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80&fit=crop'),
('Nepal',     'Himalayas',    7,  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80&fit=crop'),
('Morocco',   'North Africa', 10, 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80&fit=crop'),
('Patagonia', 'Chile',        4,  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80&fit=crop');
INSERT INTO testimonials (author_name, trip_name, review_text, rating, avatar_url) VALUES
('Ananya Krishnan',
 'Bali Sacred Journey',
 'Wanderlux turned my Bali trip into a life-changing experience. Every detail was perfect — the local guides were extraordinary, the riad they chose was magical.',
 5,
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=face'),
('James & Emma Thornton',
 'Rajasthan Royal Experience',
 'The Rajasthan trip exceeded every expectation. Sleeping in a real maharaja palace, the camel safari at golden hour — I still can''t quite believe it was real.',
 5,
 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=100&q=80&fit=crop&crop=face'),
('Rohan Mehta',
 'Nepal Himalaya Trek',
 'My first proper adventure was the Nepal trek with Wanderlux. The sherpa guides were the highlight — their knowledge and warmth made the journey extraordinary.',
 5,
 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80&fit=crop&crop=face');
INSERT INTO coupons (code, type, value, min_order, description, is_active) VALUES
('WANDER10',  'percent', 10.00, 0,     '10% off your total booking',                          TRUE),
('LUXURY500', 'flat',   500.00, 50000, '₹500 flat off on bookings above ₹50,000',             TRUE),
('MONSOON15', 'percent', 15.00, 0,     '15% off — Monsoon special offer',                     TRUE);
INSERT INTO domestic_flights (id, airline, flight_code, departs, arrives, duration, base_price, biz_price, first_price, stops) VALUES
('f1', 'IndiGo',    '6E-423', '06:15', '08:30', '2h 15m', 4200,  11760, 21840, 'Non-stop'),
('f2', 'Air India', 'AI-102', '09:00', '11:20', '2h 20m', 5800,  16240, 30160, 'Non-stop'),
('f3', 'SpiceJet',  'SG-301', '14:30', '16:50', '2h 20m', 3750,  10500, 19500, 'Non-stop');
INSERT INTO international_flights (id, airline, flight_code, departs, arrives, duration, base_price, biz_price, first_price, stops) VALUES
('f1', 'Air India',          'AI-301',  '02:15', '14:30',   '7h+',         38000, 106400, 197600, 'Non-stop'),
('f2', 'Emirates',           'EK-504',  '03:30', '16:45',   '8h via DXB',  45000, 126000, 234000, '1 stop'),
('f3', 'Singapore Airlines', 'SQ-424',  '09:15', '22:30',   '8h via SIN',  52000, 145600, 270400, '1 stop'),
('f4', 'Qatar Airways',      'QR-571',  '23:45', '12:00+1', '9h via DOH',  41000, 114800, 213200, '1 stop'),
('f5', 'Lufthansa',          'LH-761',  '06:30', '18:45',   '9h via FRA',  48000, 134400, 249600, '1 stop'),
('f6', 'Virgin Atlantic',    'VS-302',  '14:00', '03:00+1', '11h via LHR', 55000, 154000, 286000, '1 stop');
INSERT INTO domestic_trains (id, name, number, departs, arrives, duration, running_days) VALUES
('t1', 'Rajdhani Express',  '12951', '17:00', '08:15+1', '15h 15m', 'Mon Wed Fri Sun'),
('t2', 'Duronto Express',   '12223', '22:55', '17:45+1', '18h 50m', 'Tue Thu Sat'),
('t3', 'Shatabdi Express',  '12001', '06:15', '14:00',   '7h 45m',  'Daily except Sun'),
('t4', 'Jan Shatabdi',      '12059', '05:10', '12:45',   '7h 35m',  'Daily'),
('t5', 'Garib Rath Express','12909', '15:40', '07:30+1', '15h 50m', 'Wed Sat');
INSERT INTO train_classes (train_id, class_code, class_label, price, availability) VALUES
('t1','1AC','First AC',       3200, 'Avail'),
('t1','2AC','Second AC',      1950, 'Avail'),
('t1','3AC','Third AC',       1350, 'WL 12'),
('t1','SL', 'Sleeper',         640, 'Avail'),
('t2','2AC','Second AC',      2100, 'Avail'),
('t2','3AC','Third AC',       1450, 'Avail'),
('t2','SL', 'Sleeper',         680, 'RAC 5'),
('t3','EC', 'Executive Chair',1850, 'Avail'),
('t3','CC', 'AC Chair Car',    980, 'Avail'),
('t4','CC', 'AC Chair Car',    540, 'Avail'),
('t4','2S', 'Second Sitting',  210, 'Avail'),
('t5','3AC','Third AC',        875, 'Avail'),
('t5','SL', 'Sleeper',         480, 'WL 28');
INSERT INTO domestic_cabs (id, cab_type, models, capacity, base_price, per_km, is_ac) VALUES
('c1', 'Sedan',          'Swift Dzire / Honda Amaze',        '4 passengers',  2800,  12, TRUE),
('c2', 'SUV',            'Toyota Innova Crysta',             '6 passengers',  3800,  15, TRUE),
('c3', 'XL / Traveller', 'Force Traveller / Tempo',          '12 passengers', 5500,  20, TRUE),
('c4', 'Luxury Sedan',   'Mercedes E-Class / BMW 5',         '4 passengers',  9500,  38, TRUE);
INSERT INTO international_cabs (id, cab_type, models, capacity, base_price, per_km, is_ac) VALUES
('c1', 'Sedan',    'Toyota Camry / Honda Accord',          '4 passengers', 4500,  18, TRUE),
('c2', 'SUV',      'Toyota Fortuner / Kia Sorento',        '6 passengers', 6800,  22, TRUE),
('c3', 'XL Van',   'Mercedes Vito / Toyota Hiace',         '8 passengers', 9500,  30, TRUE),
('c4', 'Luxury',   'Mercedes S-Class / BMW 7',             '4 passengers',16000,  55, TRUE);
INSERT INTO searchable_places (name, subtitle, region) VALUES
('Mumbai',       'Maharashtra, India',       'domestic'),
('Delhi',        'New Delhi, India',         'domestic'),
('Bangalore',    'Karnataka, India',         'domestic'),
('Chennai',      'Tamil Nadu, India',        'domestic'),
('Hyderabad',    'Telangana, India',         'domestic'),
('Kolkata',      'West Bengal, India',       'domestic'),
('Pune',         'Maharashtra, India',       'domestic'),
('Ahmedabad',    'Gujarat, India',           'domestic'),
('Kochi',        'Kerala, India',            'domestic'),
('Jaipur',       'Rajasthan, India',         'domestic'),
('Goa',          'India',                    'domestic'),
('Srinagar',     'J&K, India',              'domestic'),
('Leh',          'Ladakh, India',            'domestic'),
('Udaipur',      'Rajasthan, India',         'domestic'),
('Varanasi',     'Uttar Pradesh, India',     'domestic'),
('Amritsar',     'Punjab, India',            'domestic'),
('Agra',         'Uttar Pradesh, India',     'domestic'),
('Bali',         'Denpasar, Indonesia',      'international'),
('Bangkok',      'Thailand',                 'international'),
('Dubai',        'UAE',                      'international'),
('Singapore',    'Singapore',                'international'),
('Kathmandu',    'Nepal',                    'international'),
('Colombo',      'Sri Lanka',               'international'),
('Thimphu',      'Bhutan',                  'international'),
('Kuala Lumpur', 'Malaysia',                'international'),
('Tokyo',        'Japan',                   'international'),
('Kyoto',        'Japan',                   'international'),
('Santorini',    'Greece',                  'international'),
('Paris',        'France',                  'international'),
('London',       'United Kingdom',          'international'),
('Nairobi',      'Kenya',                   'international'),
('Marrakech',    'Morocco',                 'international'),
('Punta Arenas', 'Patagonia, Chile',        'international'),
('Maldives',     'Indian Ocean',            'international'),
('Port Blair',   'Andaman Islands, India',  'domestic');
INSERT INTO users (name, email, phone, nationality) VALUES
('Ananya Krishnan', 'ananya@example.com',  '+91 98765 11111', 'Indian'),
('James Thornton',  'james@example.com',   '+44 7700 900000', 'British'),
('Rohan Mehta',     'rohan@example.com',   '+91 99001 22222', 'Indian'),
('Guest User',      'guest@wanderlux.com', NULL,              'Indian');
INSERT INTO bookings
  (booking_ref, user_id, package_id, travel_date, adults,
   transport_mode, transport_detail, transport_cost,
   package_cost_inr, gst_amount, discount_amount, coupon_code,
   total_amount, status)
VALUES
('WDL-100001', 1, 1, '2025-10-15', 2,
 'flight', 'IndiGo 6E-423 · Economy', 8400,
 313740, 56473, 0, NULL,
 378613, 'confirmed'),
('WDL-100002', 2, 6, '2025-12-20', 2,
 'flight', 'Singapore Airlines SQ-424 · Business', 291200,
 655700, 118026, 0, NULL,
 1064926, 'confirmed'),
('WDL-100003', 3, 8, '2026-03-10', 1,
 'train', 'Rajdhani Express #12951 · 2AC', 1950,
 174300, 31374, 17467, 'WANDER10',
 189157, 'confirmed');
INSERT INTO booking_travellers (booking_id, is_lead, first_name, last_name, email, phone, nationality) VALUES
(1, TRUE,  'Ananya',  'Krishnan', 'ananya@example.com',  '+91 98765 11111', 'Indian'),
(1, FALSE, 'Priya',   'Krishnan', NULL,                   NULL,              'Indian'),
(2, TRUE,  'James',   'Thornton', 'james@example.com',   '+44 7700 900000', 'British'),
(2, FALSE, 'Emma',    'Thornton', NULL,                   NULL,              'British'),
(3, TRUE,  'Rohan',   'Mehta',    'rohan@example.com',   '+91 99001 22222', 'Indian');

DELIMITER $$

CREATE TRIGGER trg_auto_booking_ref
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  IF NEW.booking_ref IS NULL OR NEW.booking_ref = '' THEN
    SET NEW.booking_ref = CONCAT('WDL-', LPAD(FLOOR(100000 + RAND() * 900000), 6, '0'));
  END IF;
END$$

CREATE FUNCTION fn_calculate_total(
  p_package_id   INT,
  p_pax          INT,
  p_transport    INT,
  p_coupon_code  VARCHAR(30)
) RETURNS INT DETERMINISTIC
BEGIN
  DECLARE v_price_inr    INT DEFAULT 0;
  DECLARE v_pkg_cost     INT DEFAULT 0;
  DECLARE v_gst          INT DEFAULT 0;
  DECLARE v_subtotal     INT DEFAULT 0;
  DECLARE v_discount     INT DEFAULT 0;
  DECLARE v_coupon_type  VARCHAR(10);
  DECLARE v_coupon_val   DECIMAL(10,2);
  DECLARE v_min_order    INT;

  SELECT ROUND(price_usd * 83) INTO v_price_inr
  FROM packages WHERE id = p_package_id;

  SET v_pkg_cost = v_price_inr * p_pax;
  SET v_gst      = ROUND(v_pkg_cost * 0.18);
  SET v_subtotal = v_pkg_cost + p_transport + v_gst;

  IF p_coupon_code IS NOT NULL THEN
    SELECT type, value, min_order
    INTO v_coupon_type, v_coupon_val, v_min_order
    FROM coupons
    WHERE code = p_coupon_code AND is_active = TRUE;

    IF v_subtotal >= v_min_order THEN
      IF v_coupon_type = 'percent' THEN
        SET v_discount = ROUND(v_subtotal * v_coupon_val / 100);
      ELSEIF v_coupon_type = 'flat' THEN
        SET v_discount = v_coupon_val;
      END IF;
    END IF;
  END IF;

  RETURN v_subtotal - v_discount;
END$$

CREATE PROCEDURE sp_create_booking(
  IN p_user_id        INT,
  IN p_package_id     INT,
  IN p_travel_date    DATE,
  IN p_adults         INT,
  IN p_transport_mode VARCHAR(10),
  IN p_transport_det  VARCHAR(200),
  IN p_transport_cost INT,
  IN p_coupon_code    VARCHAR(30),
  IN p_lead_fname     VARCHAR(100),
  IN p_lead_lname     VARCHAR(100),
  IN p_lead_email     VARCHAR(200),
  IN p_lead_phone     VARCHAR(20),
  OUT p_booking_ref   VARCHAR(20)
)
BEGIN
  DECLARE v_pkg_cost   INT;
  DECLARE v_gst        INT;
  DECLARE v_subtotal   INT;
  DECLARE v_total      INT;
  DECLARE v_discount   INT;
  DECLARE v_price_inr  INT;
  DECLARE v_booking_id INT;

  SELECT ROUND(price_usd * 83) INTO v_price_inr
  FROM packages WHERE id = p_package_id;

  SET v_pkg_cost  = v_price_inr * p_adults;
  SET v_gst       = ROUND(v_pkg_cost * 0.18);
  SET v_subtotal  = v_pkg_cost + p_transport_cost + v_gst;
  SET v_total     = fn_calculate_total(p_package_id, p_adults, p_transport_cost, p_coupon_code);
  SET v_discount  = v_subtotal - v_total;

  SET p_booking_ref = CONCAT('WDL-', LPAD(FLOOR(100000 + RAND() * 900000), 6, '0'));

  INSERT INTO bookings (
    booking_ref, user_id, package_id, travel_date, adults,
    transport_mode, transport_detail, transport_cost,
    package_cost_inr, gst_amount, discount_amount, coupon_code, total_amount
  ) VALUES (
    p_booking_ref, p_user_id, p_package_id, p_travel_date, p_adults,
    p_transport_mode, p_transport_det, p_transport_cost,
    v_pkg_cost, v_gst, v_discount, p_coupon_code, v_total
  );

  SET v_booking_id = LAST_INSERT_ID();

  INSERT INTO booking_travellers (booking_id, is_lead, first_name, last_name, email, phone)
  VALUES (v_booking_id, TRUE, p_lead_fname, p_lead_lname, p_lead_email, p_lead_phone);
END$$

CREATE TRIGGER trg_increment_reviews
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE packages SET reviews = reviews + 1 WHERE id = NEW.package_id;
  END IF;
END$$

DELIMITER ;

DESC packages;
DESC destinations;
  -- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  -- patch_new_tables.sql
  -- Run this AFTER wanderlux_complete.sql to add:
  --   payments, invoices, cancellations, customer_support
  -- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  USE wanderlux_db;

  -- â”€â”€â”€ 1. PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  CREATE TABLE IF NOT EXISTS payments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT NOT NULL,
    booking_ref      VARCHAR(20) NOT NULL,
    user_id          INT,
    amount           INT NOT NULL,                             -- amount in INR paise-free integer
    currency         VARCHAR(5) DEFAULT 'INR',
    payment_method   ENUM('card','upi','netbanking','wallet') DEFAULT 'card',
    card_last4       VARCHAR(4),
    card_brand       VARCHAR(20),
    transaction_id   VARCHAR(60) UNIQUE,                      -- gateway txn ref
    gateway_ref      VARCHAR(60),
    status           ENUM('pending','success','failed','refunded') DEFAULT 'pending',
    paid_at          TIMESTAMP NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)
  );

  -- â”€â”€â”€ 2. INVOICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  CREATE TABLE IF NOT EXISTS invoices (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number   VARCHAR(30) NOT NULL UNIQUE,             -- e.g. INV-2025-000001
    booking_id       INT NOT NULL,
    booking_ref      VARCHAR(20) NOT NULL,
    user_id          INT,
    payment_id       INT,
    subtotal         INT NOT NULL,                            -- package_cost_inr + transport_cost
    gst_amount       INT NOT NULL,
    discount_amount  INT DEFAULT 0,
    total_amount     INT NOT NULL,
    issued_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
  );

  -- â”€â”€â”€ 3. CANCELLATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  CREATE TABLE IF NOT EXISTS cancellations (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT UNIQUE,                              -- nullable after booking deleted
    booking_ref      VARCHAR(20) NOT NULL,
    user_id          INT,
    reason           TEXT,
    refund_amount    INT DEFAULT 0,
    refund_policy    VARCHAR(200),
    refund_status    ENUM('pending','processed','no_refund') DEFAULT 'pending',
    cancelled_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)    REFERENCES users(id)
  );

  -- â”€â”€â”€ 4. CUSTOMER SUPPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  CREATE TABLE IF NOT EXISTS customer_support (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number    VARCHAR(20) NOT NULL UNIQUE,             -- e.g. TKT-100001
    user_id          INT,
    booking_ref      VARCHAR(20),                             -- optional link to booking
    name             VARCHAR(150) NOT NULL,
    email            VARCHAR(200) NOT NULL,
    subject          VARCHAR(200) NOT NULL,
    category         ENUM('general','booking_support','cancellation_refund','feedback','partnership','custom_package') DEFAULT 'general',
    message          TEXT NOT NULL,
    status           ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- â”€â”€â”€ TRIGGER: auto-generate ticket numbers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  DELIMITER $$
  CREATE TRIGGER trg_support_ticket_number
  BEFORE INSERT ON customer_support
  FOR EACH ROW
  BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
      SET NEW.ticket_number = CONCAT('TKT-', LPAD(FLOOR(100000 + RAND() * 900000), 6, '0'));
    END IF;
  END$$
  DELIMITER ;

  -- â”€â”€â”€ TRIGGER: auto-generate invoice numbers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  DELIMITER $$
  CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
      SET NEW.invoice_number = CONCAT('INV-', YEAR(NOW()), '-', LPAD(FLOOR(100000 + RAND() * 900000), 6, '0'));
    END IF;
  END$$
  DELIMITER ;

  -- â”€â”€â”€ SAMPLE DATA: payments for the 3 existing bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  -- Booking 1 (WDL-100001, user 1, total 378613)
  INSERT INTO payments (booking_id, booking_ref, user_id, amount, payment_method, card_last4, card_brand, transaction_id, gateway_ref, status, paid_at)
  VALUES (1, 'WDL-100001', 1, 378613, 'card', '4242', 'Visa', 'txn_1001_wdl100001', 'gw_ref_1001', 'success', '2025-09-01 10:23:00');

  -- Booking 2 (WDL-100002, user 2, total 1064926)
  INSERT INTO payments (booking_id, booking_ref, user_id, amount, payment_method, card_last4, card_brand, transaction_id, gateway_ref, status, paid_at)
  VALUES (2, 'WDL-100002', 2, 1064926, 'card', '5555', 'Mastercard', 'txn_1002_wdl100002', 'gw_ref_1002', 'success', '2025-11-05 14:10:00');

  -- Booking 3 (WDL-100003, user 3, total 189157)
  INSERT INTO payments (booking_id, booking_ref, user_id, amount, payment_method, card_last4, card_brand, transaction_id, gateway_ref, status, paid_at)
  VALUES (3, 'WDL-100003', 3, 189157, 'upi', NULL, NULL, 'txn_1003_wdl100003', 'gw_ref_1003', 'success', '2026-01-20 09:45:00');

  -- â”€â”€â”€ SAMPLE DATA: invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  INSERT INTO invoices (invoice_number, booking_id, booking_ref, user_id, payment_id, subtotal, gst_amount, discount_amount, total_amount, issued_at)
  VALUES
  ('INV-2025-100001', 1, 'WDL-100001', 1, 1, 322140, 56473, 0,     378613, '2025-09-01 10:24:00'),
  ('INV-2025-100002', 2, 'WDL-100002', 2, 2, 946900, 118026, 0,   1064926, '2025-11-05 14:11:00'),
  ('INV-2026-100003', 3, 'WDL-100003', 3, 3, 175790, 31374, 17467, 189157, '2026-01-20 09:46:00');

  -- â”€â”€â”€ SAMPLE DATA: customer support tickets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  INSERT INTO customer_support (ticket_number, user_id, booking_ref, name, email, subject, category, message, status, created_at)
  VALUES
  ('TKT-200001', 1, 'WDL-100001', 'Ananya Krishnan', 'ananya@example.com',
  'Seat upgrade query', 'booking_support',
  'Hi, I would like to know if it is possible to upgrade our flight seats to Business class for the Bali trip. Please advise.',
  'resolved', '2025-09-03 11:00:00'),
  ('TKT-200002', 2, 'WDL-100002', 'James Thornton', 'james@example.com',
  'Dietary requirements for Japan trip', 'booking_support',
  'We are vegetarian. Can you please ensure all meals on the Japan package are vegetarian-friendly? Thank you.',
  'in_progress', '2025-11-10 08:30:00'),
  ('TKT-200003', NULL, NULL, 'Raj Patel', 'raj.patel@example.com',
  'Custom honeymoon package enquiry', 'custom_package',
  'Looking for a custom honeymoon package to Maldives + Dubai for late March 2027. Budget ~â‚¹5 lakhs for 2 people. Please contact me.',
  'open', '2026-04-01 16:00:00');
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- patch_triggers_procedures.sql
-- Run AFTER wanderlux_complete.sql AND patch_new_tables.sql
--
-- Adds:
--   TRIGGER  trg_auto_invoice_on_payment  â€” auto-creates invoice when
--             a payment is inserted with status = 'success'
--   TRIGGER  trg_update_package_rating    â€” recalculates packages.rating
--             in real-time whenever a new review is submitted
--   PROCEDURE sp_cancel_booking           â€” atomic cancellation: computes
--             refund, writes cancellations row, marks payment refunded,
--             and hard-deletes the booking in one call
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

USE wanderlux_db;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- TRIGGER 1: trg_auto_invoice_on_payment
-- Fires AFTER a row is inserted into `payments`.
-- If the payment status is 'success', it immediately creates the
-- corresponding invoice row so the invoice is always in sync with the
-- payment â€” no extra backend round-trip needed.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DROP TRIGGER IF EXISTS trg_auto_invoice_on_payment;

DELIMITER $$

CREATE TRIGGER trg_auto_invoice_on_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  -- Only fire for successful payments
  IF NEW.status = 'success' THEN

    -- Avoid duplicate invoices for the same booking
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE payment_id = NEW.id) THEN

      INSERT INTO invoices (
        invoice_number,
        booking_id,
        booking_ref,
        user_id,
        payment_id,
        subtotal,
        gst_amount,
        discount_amount,
        total_amount,
        issued_at
      )
      SELECT
        CONCAT('INV-', YEAR(NOW()), '-', LPAD(FLOOR(100000 + RAND() * 900000), 6, '0')),
        b.id,
        b.booking_ref,
        b.user_id,
        NEW.id,
        b.package_cost_inr + IFNULL(b.transport_cost, 0),   -- subtotal
        b.gst_amount,
        IFNULL(b.discount_amount, 0),
        b.total_amount,
        NOW()
      FROM bookings b
      WHERE b.id = NEW.booking_id;

    END IF;
  END IF;
END$$

DELIMITER ;


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- TRIGGER 2: trg_update_package_rating
-- Fires AFTER a row is inserted into `reviews`.
-- Recalculates the average rating for the reviewed package from all
-- real review rows and writes it back to packages.rating â€” so the
-- rating shown on the site is always the true live average.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DROP TRIGGER IF EXISTS trg_update_package_rating;

DELIMITER $$

CREATE TRIGGER trg_update_package_rating
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  DECLARE v_avg_rating  DECIMAL(3,1);
  DECLARE v_review_count INT;

  -- Only update if the review is linked to a package
  IF NEW.package_id IS NOT NULL THEN

    SELECT
      ROUND(AVG(rating), 1),
      COUNT(*)
    INTO
      v_avg_rating,
      v_review_count
    FROM reviews
    WHERE package_id = NEW.package_id;

    UPDATE packages
    SET
      rating  = v_avg_rating,
      reviews = reviews + 1          -- increment the review counter
    WHERE id = NEW.package_id;

  END IF;
END$$

DELIMITER ;


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PROCEDURE: sp_cancel_booking
-- Called by the backend with (booking_id, user_id, reason).
-- Does everything in one atomic transaction:
--   1. Validates the booking exists and belongs to the user
--   2. Computes refund amount based on days until travel
--   3. Inserts a row into `cancellations`
--   4. Marks any successful payment as 'refunded'
--   5. Hard-deletes the booking (cascades to booking_travellers)
-- Returns OUT params so the backend can send the right response.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DROP PROCEDURE IF EXISTS sp_cancel_booking;

DELIMITER $$

CREATE PROCEDURE sp_cancel_booking(
  IN  p_booking_id   INT,
  IN  p_user_id      INT,
  IN  p_reason       TEXT,
  OUT p_booking_ref  VARCHAR(20),
  OUT p_refund_amt   INT,
  OUT p_policy       VARCHAR(200),
  OUT p_error        VARCHAR(200)
)
BEGIN
  DECLARE v_travel_date  DATE;
  DECLARE v_total        INT;
  DECLARE v_days_left    INT;

  -- Initialise output
  SET p_booking_ref = NULL;
  SET p_refund_amt  = 0;
  SET p_policy      = '';
  SET p_error       = NULL;

  -- â”€â”€ 1. Fetch booking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  SELECT booking_ref, travel_date, total_amount
  INTO   p_booking_ref, v_travel_date, v_total
  FROM   bookings
  WHERE  id      = p_booking_id
    AND  user_id = p_user_id
  LIMIT 1;

  IF p_booking_ref IS NULL THEN
    SET p_error = 'Booking not found or does not belong to this user';
  ELSE
    -- â”€â”€ 2. Compute refund â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    SET v_days_left = DATEDIFF(v_travel_date, CURDATE());

    IF v_days_left >= 30 THEN
      SET p_refund_amt = ROUND(v_total * 0.75);
      SET p_policy     = 'Full refund minus 25% deposit';
    ELSEIF v_days_left >= 15 THEN
      SET p_refund_amt = ROUND(v_total * 0.50);
      SET p_policy     = '50% refund';
    ELSE
      SET p_refund_amt = 0;
      SET p_policy     = 'No refund (< 15 days before departure)';
    END IF;

    -- â”€â”€ 3. Record in cancellations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    INSERT INTO cancellations (
      booking_id, booking_ref, user_id,
      reason, refund_amount, refund_policy, refund_status, cancelled_at
    ) VALUES (
      p_booking_id, p_booking_ref, p_user_id,
      IFNULL(p_reason, 'Cancelled by user'),
      p_refund_amt,
      p_policy,
      IF(p_refund_amt > 0, 'pending', 'no_refund'),
      NOW()
    );

    -- â”€â”€ 4. Mark payment refunded (if applicable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    IF p_refund_amt > 0 THEN
      UPDATE payments
      SET    status = 'refunded'
      WHERE  booking_id = p_booking_id
        AND  status     = 'success';
    END IF;

    -- â”€â”€ 5. Hard-delete booking (cascades to booking_travellers) â”€â”€â”€â”€â”€â”€â”€
    DELETE FROM bookings WHERE id = p_booking_id;
  END IF;

END$$

DELIMITER ;
-- fix_triggers.sql
-- Run this file in your MySQL database to fix trigger and procedure issues that block the backend.

USE wanderlux_db;

-- 1. Drop the auto-invoice trigger. 
-- We now insert the invoice explicitly in the Node.js backend inside a secure transaction.
-- Having this trigger active will cause duplicate entry errors or block the booking.
DROP TRIGGER IF EXISTS trg_auto_invoice_on_payment;

-- 2. Drop the sp_cancel_booking procedure.
-- We now handle the complete cancellation and cascading deletion securely in Node.js 
-- to ensure atomic operation and proper error reporting.
DROP PROCEDURE IF EXISTS sp_cancel_booking;

-- 3. Ensure ON DELETE CASCADE is set up correctly (in case it wasn't).
-- Usually these are already present, but this ensures no foreign key errors block deletion.

-- Drop existing foreign keys first (safe to run even if they don't exist perfectly)
ALTER TABLE booking_travellers DROP FOREIGN KEY IF EXISTS fk_bt_booking;
ALTER TABLE payments DROP FOREIGN KEY IF EXISTS fk_pay_booking;
ALTER TABLE invoices DROP FOREIGN KEY IF EXISTS fk_inv_booking;
ALTER TABLE cancellations DROP FOREIGN KEY IF EXISTS fk_cancel_booking;

-- Re-add them with ON DELETE CASCADE explicitly to be 100% safe
ALTER TABLE booking_travellers 
ADD CONSTRAINT fk_bt_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_inv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE cancellations 
ADD CONSTRAINT fk_cancel_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

SELECT 'SQL Fixes Applied Successfully. Triggers dropped and constraints updated.' as status;
-- alter_cancellations.sql
-- Run this in your MySQL database to add the snapshot fields to the cancellations table so "My Trips" can display deleted trips.

USE wanderlux_db;

ALTER TABLE cancellations
  ADD COLUMN package_id INT,
  ADD COLUMN package_title VARCHAR(255),
  ADD COLUMN package_location VARCHAR(255),
  ADD COLUMN package_image_url VARCHAR(255),
  ADD COLUMN travel_date DATE,
  ADD COLUMN adults INT DEFAULT 1,
  ADD COLUMN total_amount INT DEFAULT 0,
  ADD COLUMN status VARCHAR(20) DEFAULT 'cancelled';

SELECT 'Cancellations table successfully altered.' as message;
