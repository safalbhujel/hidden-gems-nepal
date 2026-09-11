
# Phase 4: Database Schema & Seed Data

**Status:** ✅ COMPLETE
**Date:** September 11, 2026
**Supabase Project:** HiddenGems Nepal

---

## Overview

Phase 4 established the complete database schema for HiddenGems Nepal using PostgreSQL with PostGIS for geospatial queries. All tables are created in the `public` schema with comprehensive Row Level Security (RLS) policies.

---

## Tables Created

### 1. `provinces`

Stores the 7 provinces of Nepal.

| Column     | Type        | Constraints                            |
| ---------- | ----------- | -------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name       | TEXT        | NOT NULL                               |
| slug       | TEXT        | NOT NULL, UNIQUE                       |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                          |
| updated_at | TIMESTAMPTZ | DEFAULT NOW()                          |

**Seed Data:** 7 provinces (Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim)

---

### 2. `districts`

Stores all 77 districts of Nepal, linked to provinces.

| Column      | Type        | Constraints                                |
| ----------- | ----------- | ------------------------------------------ |
| id          | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()     |
| name        | TEXT        | NOT NULL                                   |
| slug        | TEXT        | NOT NULL                                   |
| province_id | UUID        | REFERENCES provinces(id) ON DELETE CASCADE |
| created_at  | TIMESTAMPTZ | DEFAULT NOW()                              |
| updated_at  | TIMESTAMPTZ | DEFAULT NOW()                              |

**Constraints:** UNIQUE(name, province_id)
**Seed Data:** 77 districts grouped by province
**Indexes:** idx_districts_province_id, idx_districts_slug

---

### 3. `categories`

Stores the 8 vibe-based primary categories for place classification.

| Column      | Type        | Constraints                            |
| ----------- | ----------- | -------------------------------------- |
| id          | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name        | TEXT        | NOT NULL                               |
| slug        | TEXT        | NOT NULL, UNIQUE                       |
| description | TEXT        | Optional                               |
| icon        | TEXT        | Optional (emoji for UI)                |
| is_active   | BOOLEAN     | DEFAULT TRUE                           |
| created_at  | TIMESTAMPTZ | DEFAULT NOW()                          |
| updated_at  | TIMESTAMPTZ | DEFAULT NOW()                          |

**Seed Data:** 8 categories (Nature Escapes, Food Gems, Cafés & Chill, Views & Sunsets, Picnic & Hangout, Date Spots, Adventure & Hikes, Culture & Local Life)
**Indexes:** idx_categories_slug, idx_categories_is_active

---

### 4. `tags`

Stores multi-select attributes for granular place discovery.

| Column     | Type        | Constraints                            |
| ---------- | ----------- | -------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name       | TEXT        | NOT NULL                               |
| slug       | TEXT        | NOT NULL, UNIQUE                       |
| is_active  | BOOLEAN     | DEFAULT TRUE                           |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                          |
| updated_at | TIMESTAMPTZ | DEFAULT NOW()                          |

**Seed Data:** 17 tags (Waterfall, Lake, Riverside, Sunset, Sunrise, Short Hike, Photography, Aesthetic, Couples, Friends, Family Friendly, Quiet, Budget Friendly, Local Favorite, Village, Cultural, Hidden)
**Indexes:** idx_tags_slug, idx_tags_is_active

---

### 5. `profiles`

Stores user profile data, auto-created via trigger on auth signup.

| Column     | Type        | Constraints                                              |
| ---------- | ----------- | -------------------------------------------------------- |
| id         | UUID        | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| username   | TEXT        | UNIQUE                                                   |
| full_name  | TEXT        | Optional                                                 |
| avatar_url | TEXT        | Optional                                                 |
| bio        | TEXT        | Optional                                                 |
| is_admin   | BOOLEAN     | DEFAULT FALSE                                            |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                                            |
| updated_at | TIMESTAMPTZ | DEFAULT NOW()                                            |

**Trigger:** `on_auth_user_created` - Automatically creates profile row when new user signs up via Supabase Auth
**Trigger:** `on_profile_update` - Auto-updates `updated_at` timestamp

---

### 6. `places`

Core entity storing all hidden gems with PostGIS geospatial support.

| Column         | Type                   | Constraints                                                                                   |
| -------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| id             | UUID                   | PRIMARY KEY, DEFAULT gen_random_uuid()                                                        |
| name           | TEXT                   | NOT NULL                                                                                      |
| slug           | TEXT                   | NOT NULL, UNIQUE                                                                              |
| description    | TEXT                   | NOT NULL                                                                                      |
| why_special    | TEXT                   | NOT NULL                                                                                      |
| category_id    | UUID                   | REFERENCES categories(id) ON DELETE SET NULL                                                  |
| district_id    | UUID                   | REFERENCES districts(id) ON DELETE SET NULL                                                   |
| submitted_by   | UUID                   | REFERENCES profiles(id) ON DELETE SET NULL                                                    |
| location       | GEOGRAPHY(Point, 4326) | PostGIS spatial type                                                                          |
| map_url        | TEXT                   | Optional                                                                                      |
| video_url      | TEXT                   | Optional (external video embeds)                                                              |
| budget         | TEXT                   | Optional                                                                                      |
| best_time      | TEXT                   | Optional                                                                                      |
| best_season    | TEXT                   | Optional                                                                                      |
| difficulty     | TEXT                   | Optional                                                                                      |
| travel_tips    | TEXT                   | Optional                                                                                      |
| status         | TEXT                   | DEFAULT 'PENDING', CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED')) |
| hidden_score   | INTEGER                | DEFAULT 0, CHECK (0 <= hidden_score <= 100)                                                   |
| average_rating | NUMERIC(3,2)           | DEFAULT 0.00 (cached)                                                                         |
| review_count   | INTEGER                | DEFAULT 0 (cached)                                                                            |
| created_at     | TIMESTAMPTZ            | DEFAULT NOW()                                                                                 |
| updated_at     | TIMESTAMPTZ            | DEFAULT NOW()                                                                                 |

**Indexes:**

- `idx_places_location` - **GIST index** for lightning-fast nearby discovery queries
- `idx_places_slug`
- `idx_places_status`
- `idx_places_category`
- `idx_places_district`

**Trigger:** `on_place_update` - Auto-updates `updated_at` timestamp

---

### 7. `place_images`

Stores 1-6 images per place with ordering support.

| Column     | Type        | Constraints                             |
| ---------- | ----------- | --------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()  |
| place_id   | UUID        | REFERENCES places(id) ON DELETE CASCADE |
| image_url  | TEXT        | NOT NULL                                |
| sort_order | INTEGER     | DEFAULT 0                               |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                           |

**Indexes:** idx_place_images_place_id

---

### 8. `place_tags`

Junction table for many-to-many relationship between places and tags.

| Column                | Type               | Constraints                             |
| --------------------- | ------------------ | --------------------------------------- |
| place_id              | UUID               | REFERENCES places(id) ON DELETE CASCADE |
| tag_id                | UUID               | REFERENCES tags(id) ON DELETE CASCADE   |
| **PRIMARY KEY** | (place_id, tag_id) | Composite primary key                   |

---

### 9. `reviews`

Stores user ratings and comments for places.

| Column     | Type        | Constraints                               |
| ---------- | ----------- | ----------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()    |
| place_id   | UUID        | REFERENCES places(id) ON DELETE CASCADE   |
| user_id    | UUID        | REFERENCES profiles(id) ON DELETE CASCADE |
| rating     | INTEGER     | NOT NULL, CHECK (1 <= rating <= 5)        |
| comment    | TEXT        | Optional                                  |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                             |
| updated_at | TIMESTAMPTZ | DEFAULT NOW()                             |

**Constraints:** UNIQUE(place_id, user_id) - One review per user per place
**Trigger:** `on_review_update` - Auto-updates `updated_at` timestamp

---

### 10. `saved_places`

Stores user wishlists (saved/bookmarked places).

| Column                | Type                | Constraints                               |
| --------------------- | ------------------- | ----------------------------------------- |
| user_id               | UUID                | REFERENCES profiles(id) ON DELETE CASCADE |
| place_id              | UUID                | REFERENCES places(id) ON DELETE CASCADE   |
| created_at            | TIMESTAMPTZ         | DEFAULT NOW()                             |
| **PRIMARY KEY** | (user_id, place_id) | Composite primary key                     |

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

### Public Reference Tables (provinces, districts, categories, tags)

- **SELECT:** Anyone can read (for filters, dropdowns, explore page)
- **ALL:** Authenticated users can manage (admin operations)

### Profiles

- **SELECT:** Public profiles are viewable by everyone
- **UPDATE:** Users can only update their own profile

### Places

- **SELECT:** Approved places viewable by everyone; users can view their own draft/pending places
- **INSERT:** Authenticated users can create places (must be submitted_by themselves)
- **UPDATE:** Users can update their own places
- **ALL:** Admins can manage all places

### Place Images

- **SELECT:** Images of approved places viewable by everyone
- **INSERT:** Authenticated users can upload images
- **DELETE:** Users can delete images from their own places

### Place Tags

- **SELECT:** Viewable by everyone
- **ALL:** Authenticated users can tag places

### Reviews

- **SELECT:** Viewable by everyone
- **INSERT:** Authenticated users can create reviews (must be their own user_id)
- **UPDATE/DELETE:** Users can only update/delete their own reviews

### Saved Places

- **SELECT:** Users can view their own saved places
- **INSERT:** Authenticated users can save places (must be their own user_id)
- **DELETE:** Users can unsave their own places

---

## Key Features

### PostGIS Integration

- **Extension:** PostGIS 3.3.7 enabled
- **Spatial Type:** `GEOGRAPHY(Point, 4326)` for GPS coordinates
- **GIST Index:** Enables lightning-fast nearby discovery queries using `ST_DWithin()`

### Automated Triggers

- `handle_new_user()` - Auto-creates profile on auth signup
- `handle_updated_at()` - Auto-updates `updated_at` timestamp on all tables

### Idempotent Seeding

- All seed data uses `ON CONFLICT DO NOTHING` to allow safe re-runs
- Can be executed multiple times without errors

### Performance Indexes

- Foreign keys indexed for fast JOINs
- Slug columns indexed for URL lookups
- Status columns indexed for moderation queries
- GIST spatial index for geographic queries

---

## Next Steps

Phase 4 is complete. Moving to **Phase 5: Authentication** will implement:

- Signup flow with email/password
- Login/logout functionality
- Password reset
- Protected routes
- Session management

---

## References

- Requirements Document: Section 21 (Data Model Planning)
- Requirements Document: Section 15 (Location and Geography Requirements)
- Requirements Document: Section 19 (Security and Privacy)
