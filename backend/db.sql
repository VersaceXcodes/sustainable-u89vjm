-- Table: users
-- Stores information about registered users.
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at VARCHAR(50) NOT NULL,
    updated_at VARCHAR(50) NOT NULL
);

-- Table: categories
-- Stores product categories for organization and filtering.
CREATE TABLE categories (
    category_id VARCHAR(255) PRIMARY KEY NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Table: products
-- Stores core information about each product listed on the platform.
CREATE TABLE products (
    product_id VARCHAR(255) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    primary_image_url VARCHAR(255) NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    overall_score DECIMAL(3,2),
    sustainability_score DECIMAL(3,2),
    ethical_score DECIMAL(3,2),
    durability_score DECIMAL(3,2),
    created_at VARCHAR(50) NOT NULL,
    updated_at VARCHAR(50) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Table: product_attributes
-- Stores specific attributes related to sustainability, ethical sourcing, or durability.
CREATE TABLE product_attributes (
    attribute_id VARCHAR(255) PRIMARY KEY NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    attribute_type VARCHAR(50) NOT NULL CHECK (attribute_type IN ('sustainability', 'ethical', 'durability')),
    description TEXT
);

-- Table: product_to_attribute (Junction Table)
-- Links products to their relevant attributes (Many-to-Many relationship).
CREATE TABLE product_to_attribute (
    product_id VARCHAR(255) NOT NULL,
    attribute_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (product_id, attribute_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(attribute_id) ON DELETE CASCADE
);

-- Table: reviews
-- Stores user-submitted reviews for products.
CREATE TABLE reviews (
    review_id VARCHAR(255) PRIMARY KEY NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    overall_rating SMALLINT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    sustainability_rating SMALLINT CHECK (sustainability_rating IS NULL OR (sustainability_rating >= 1 AND sustainability_rating <= 5)),
    ethical_rating SMALLINT CHECK (ethical_rating IS NULL OR (ethical_rating >= 1 AND ethical_rating <= 5)),
    durability_rating SMALLINT CHECK (durability_rating IS NULL OR (durability_rating >= 1 AND durability_rating <= 5)),
    helpful_votes INT DEFAULT 0 NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    created_at VARCHAR(50) NOT NULL,
    updated_at VARCHAR(50) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table: review_photos
-- Stores references to photos uploaded with reviews.
CREATE TABLE review_photos (
    photo_id VARCHAR(255) PRIMARY KEY NOT NULL,
    review_id VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    uploaded_at VARCHAR(50) NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE
);

-- Table: user_bookmarks
-- Tracks products bookmarked by users.
CREATE TABLE user_bookmarks (
    user_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    bookmarked_at VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Seed Data for Categories
INSERT INTO categories (category_id, name, description) VALUES
('cat_001', 'Electronics', 'Devices and gadgets, from smartphones to laptops'),
('cat_002', 'Apparel', 'Clothing and fashion items'),
('cat_003', 'Home Goods', 'Items for your living space, from furniture to decor'),
('cat_004', 'Personal Care', 'Products for hygiene and well-being'),
('cat_005', 'Food & Beverage', 'Groceries and consumables'),
('cat_006', 'Outdoor Gear', 'Equipment for adventures and nature activities');

-- Seed Data for Product Attributes
INSERT INTO product_attributes (attribute_id, name, attribute_type, description) VALUES
('attr_001', 'Recycled Materials', 'sustainability', 'Made from post-consumer recycled content'),
('attr_002', 'Vegan', 'ethical', 'Contains no animal products or by-products'),
('attr_003', 'Fair Trade Certified', 'ethical', 'Ensures fair wages and safe working conditions'),
('attr_004', 'Low Carbon Footprint', 'sustainability', 'Manufactured with significantly reduced greenhouse gas emissions'),
('attr_005', 'B Corp Certified', 'ethical', 'Certified by B Lab for meeting rigorous standards of social and environmental performance'),
('attr_006', 'Durable Construction', 'durability', 'Built to last with high-quality materials and robust design'),
('attr_007', 'Organic Cotton', 'sustainability', 'Made from cotton grown without synthetic pesticides or fertilizers'),
('attr_008', 'Energy Efficient', 'sustainability', 'Consumes less energy compared to similar products'),
('attr_009', 'Locally Sourced', 'ethical', 'Materials or manufacturing processes are primarily from the local region'),
('attr_010', 'Water Resistant', 'durability', 'Protects against water ingress to a certain degree');

-- Seed Data for Users (Example users)
INSERT INTO users (user_id, username, email, password_hash, created_at, updated_at) VALUES
('user_abc', 'ecowoman_emily', 'emily@sustainareview.com', 'hashed_password_emily', '2023-10-26 10:00:00', '2023-10-26 10:00:00'),
('user_def', 'practical_paul', 'paul@sustainareview.com', 'hashed_password_paul', '2023-10-26 10:05:00', '2023-10-26 10:05:00'),
('user_ghi', 'ethical_alex', 'alex@sustainareview.com', 'hashed_password_alex', '2023-10-26 10:10:00', '2023-10-26 10:10:00'),
('user_jkl', 'review_guru', 'guru@sustainareview.com', 'hashed_password_guru', '2023-10-26 10:15:00', '2023-10-26 10:15:00');

-- Seed Data for Products (Example products)
INSERT INTO products (product_id, name, brand_name, description, primary_image_url, category_id, overall_score, sustainability_score, ethical_score, durability_score, created_at, updated_at) VALUES
('prod_001', 'EcoPure Water Bottle', 'AquaLife', 'A reusable water bottle made from 100% recycled stainless steel.', 'https://picsum.photos/seed/aquife/300/300', 'cat_003', 4.7, 4.9, 4.5, 4.8, '2023-10-26 11:00:00', '2023-10-26 11:00:00'),
('prod_002', 'TrailBlazer Hiking Boots', 'SummitChaser', 'Durable and waterproof hiking boots for all terrains.', 'https://picsum.photos/seed/hikewear/300/300', 'cat_006', 4.5, 4.0, 4.2, 4.9, '2023-10-26 11:05:00', '2023-10-26 11:05:00'),
('prod_003', 'Conscious Cotton T-Shirt', 'EverGreen Apparel', 'A soft, breathable t-shirt made from organic cotton.', 'https://picsum.photos/seed/cottontee/300/300', 'cat_002', 4.6, 4.8, 4.7, 4.3, '2023-10-26 11:10:00', '2023-10-26 11:10:00'),
('prod_004', 'SolarCharge Power Bank', 'Sunergy', 'A portable charger that harnesses solar energy.', 'https://picsum.photos/seed/solarbank/300/300', 'cat_001', 4.3, 4.6, 4.0, 4.1, '2023-10-26 11:15:00', '2023-10-26 11:15:00'),
('prod_005', 'Artisan Coffee Beans', 'BeanCraft', 'Ethically sourced and single-origin coffee beans.', 'https://picsum.photos/seed/coffeebeans/300/300', 'cat_005', 4.8, 4.7, 4.9, NULL, '2023-10-26 11:20:00', '2023-10-26 11:20:00'),
('prod_006', 'DuraBlend Kitchen Blender', 'KitchenPro', 'A powerful and long-lasting blender with multiple settings.', 'https://picsum.photos/seed/blender/300/300', 'cat_003', 4.6, 4.2, 4.4, 4.7, '2023-10-26 11:25:00', '2023-10-26 11:25:00'),
('prod_007', 'Naturals Skincare Set', 'PureSkin Co.', 'Gentle, organic skincare products.', 'https://picsum.photos/seed/skincare/300/300', 'cat_004', 4.4, 4.5, 4.6, 4.0, '2023-10-26 11:30:00', '2023-10-26 11:30:00'),
('prod_008', 'Zenith Laptop', 'TechNova', 'High-performance laptop with recycled aluminum casing.', 'https://picsum.photos/seed/laptoptech/300/300', 'cat_001', 4.7, 4.8, 4.5, 4.6, '2023-10-26 11:35:00', '2023-10-26 11:35:00'),
('prod_009', 'EverWarm Winter Jacket', 'ArcticGear', 'Insulated jacket made with recycled fill.', 'https://picsum.photos/seed/winterjack/300/300', 'cat_002', 4.5, 4.7, 4.3, 4.7, '2023-10-26 11:40:00', '2023-11-01 09:00:00'),
('prod_010', 'Adventure Backpack', 'Explorer Pack', 'Rugged backpack designed for long trips, water resistant.', 'https://picsum.photos/seed/backpack/300/300', 'cat_006', 4.6, 4.3, 4.5, 4.8, '2023-10-26 11:45:00', '2023-10-26 11:45:00');


-- Seed Data for Product to Attribute Linking (Examples)
INSERT INTO product_to_attribute (product_id, attribute_id) VALUES
('prod_001', 'attr_001'), -- EcoPure Water Bottle - Recycled Materials
('prod_001', 'attr_008'), -- EcoPure Water Bottle - Energy Efficient (Conceptual, usually for electronics but can apply to manufacturing)
('prod_002', 'attr_006'), -- TrailBlazer Hiking Boots - Durable Construction
('prod_003', 'attr_007'), -- Conscious Cotton T-Shirt - Organic Cotton
('prod_003', 'attr_002'), -- Conscious Cotton T-Shirt - Vegan
('prod_004', 'attr_008'), -- SolarCharge Power Bank - Energy Efficient
('prod_004', 'attr_004'), -- SolarCharge Power Bank - Low Carbon Footprint
('prod_005', 'attr_003'), -- Artisan Coffee Beans - Fair Trade Certified
('prod_005', 'attr_009'), -- Artisan Coffee Beans - Locally Sourced (Hypothetical for example)
('prod_006', 'attr_006'), -- DuraBlend Kitchen Blender - Durable Construction
('prod_007', 'attr_002'), -- Naturals Skincare Set - Vegan
('prod_007', 'attr_007'), -- Naturals Skincare Set - Organic Cotton (for packaging/ingredients)
('prod_008', 'attr_001'), -- Zenith Laptop - Recycled Materials
('prod_008', 'attr_008'), -- Zenith Laptop - Energy Efficient
('prod_009', 'attr_001'), -- EverWarm Winter Jacket - Recycled Materials
('prod_010', 'attr_006'), -- Adventure Backpack - Durable Construction
('prod_010', 'attr_010'); -- Adventure Backpack - Water Resistant

-- Seed Data for Reviews (Example reviews)
INSERT INTO reviews (review_id, product_id, user_id, title, body, overall_rating, sustainability_rating, ethical_rating, durability_rating, helpful_votes, moderation_status, created_at, updated_at) VALUES
('rev_001', 'prod_001', 'user_abc', 'Fantastic Eco-Bottle!', 'Love this bottle! Keeps water cold all day and I feel good knowing it''s recycled.', 5, 5, 4, 5, 10, 'approved', '2023-10-27 09:00:00', '2023-10-28 14:30:00'),
('rev_002', 'prod_002', 'user_def', 'Solid boots, worth the price.', 'These boots are incredibly durable. Hiked several miles in them and they held up perfectly. A bit stiff initially but broke in well.', 4, 4, 4, 5, 8, 'approved', '2023-10-27 09:15:00', '2023-10-29 11:00:00'),
('rev_003', 'prod_003', 'user_ghi', 'So soft and ethical!', 'The most comfortable t-shirt I own. Knowing it''s organic cotton and ethically made makes it even better.', 5, 5, 5, 4, 12, 'approved', '2023-10-27 09:30:00', '2023-10-28 19:05:00'),
('rev_004', 'prod_001', 'user_def', 'Good bottle, but heavy.', 'It is a good bottle, but it is heavier than I expected.', 4, 4, 4, 5, 2, 'approved', '2023-10-27 10:00:00', '2023-10-27 10:00:00'),
('rev_005', 'prod_004', 'user_abc', 'Charges well, even on cloudy days.', 'The solar panel is surprisingly effective. Great for camping.', 4, 5, 4, 4, 5, 'approved', '2023-10-28 10:00:00', '2023-10-28 10:00:00'),
('rev_006', 'prod_008', 'user_ghi', 'Fast and sleek laptop', 'The performance is top-notch, and I appreciate the sustainable design choices.', 5, 5, 5, 5, 7, 'approved', '2023-10-28 11:00:00', '2023-10-28 11:00:00'),
('rev_007', 'prod_003', 'user_def', 'Shrank in the wash!', 'Washed it once according to instructions and it shrunk significantly.', 2, 3, 4, 3, 1, 'approved', '2023-10-29 12:00:00', '2023-10-29 12:00:00'),
('rev_008', 'prod_002', 'user_ghi', 'Needs better waterproofing', 'While durable, my feet got wet during a heavy rain shower.', 3, 3, 4, 5, 3, 'approved', '2023-10-29 13:00:00', '2023-10-29 13:00:00'),
('rev_009', 'prod_005', 'user_jkl', 'Best coffee, ethically sourced', 'Rich flavor profile and the ethical sourcing story is inspiring.', 5, 5, 5, NULL, 6, 'approved', '2023-10-30 08:00:00', '2023-10-30 08:00:00'),
('rev_010', 'prod_010', 'user_jkl', 'Great backpack for treks', 'Very sturdy and comfortable, even when fully loaded. The water resistance is a nice touch.', 4, 4, 4, 5, 4, 'approved', '2023-10-30 09:00:00', '2023-10-30 09:00:00');

-- Seed Data for Review Photos (Example photos associated with reviews)
INSERT INTO review_photos (photo_id, review_id, photo_url, uploaded_at) VALUES
('photo_001', 'rev_001', 'https://picsum.photos/seed/bottle_user_a/400/300', '2023-10-27 09:05:00'),
('photo_002', 'rev_003', 'https://picsum.photos/seed/tshirt_user_c/400/300', '2023-10-27 09:35:00'),
('photo_003', 'rev_005', 'https://picsum.photos/seed/powerbank_user_a/400/300', '2023-10-28 10:05:00'),
('photo_004', 'rev_006', 'https://picsum.photos/seed/laptop_user_c/400/300', '2023-10-28 11:05:00'),
('photo_005', 'rev_010', 'https://picsum.photos/seed/backpack_user_c/400/300', '2023-10-30 09:05:00');

-- Seed Data for User Bookmarks (Example bookmarks)
INSERT INTO user_bookmarks (user_id, product_id, bookmarked_at) VALUES
('user_abc', 'prod_001', '2023-10-27 10:00:00'),
('user_abc', 'prod_008', '2023-10-28 15:00:00'),
('user_def', 'prod_002', '2023-10-27 11:00:00'),
('user_def', 'prod_006', '2023-10-29 13:00:00'),
('user_ghi', 'prod_003', '2023-10-28 12:00:00'),
('user_ghi', 'prod_007', '2023-10-29 14:00:00');