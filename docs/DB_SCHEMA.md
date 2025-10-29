# Supabase schema (relevant tables)

The project uses four main tables anchored to `auth.users` via an application `users` table.

## Overview

| Table            | Purpose                                                      |
|------------------|--------------------------------------------------------------|
| `users`          | App users mapped to `auth.users.id`                          |
| `user_images`    | Photos uploaded by a user (one user → many images)           |
| `clothing_items` | Saved or processed clothing records per user                 |
| `tryon_results`  | Generated try-on outputs linking a clothing item and a photo |

## `users`

| Column         | Type        | Constraints                 | Notes                          |
|----------------|-------------|-----------------------------|--------------------------------|
| `id`           | `uuid`      | PK                          |                                |
| `auth_id`      | `uuid`      | FK → `auth.users.id`        | 1:1 mapping to auth user       |
| `created_at`   | `timestamptz` | Default `now()`           |                                |
| `display_name` | `text`      |                             | Optional                        |

## `user_images`

| Column       | Type          | Constraints                      | Notes                       |
|--------------|---------------|-----------------------------------|-----------------------------|
| `id`         | `uuid`        | PK                                |                             |
| `user_id`    | `uuid`        | FK → `users.id`, NOT NULL         | Owner of the image          |
| `image_url`  | `text`        | NOT NULL                          | Path/URL in storage         |
| `created_at` | `timestamptz` | Default `now()`                   |                             |
| `mime_type`  | `text`        |                                   | e.g., `image/jpeg`          |

## `clothing_items`

| Column       | Type          | Constraints                      | Notes                             |
|--------------|---------------|-----------------------------------|-----------------------------------|
| `id`         | `uuid`        | PK                                |                                   |
| `user_id`    | `uuid`        | FK → `users.id`, NOT NULL         | Owner/creator                     |
| `title`      | `text`        |                                   | Item title/name                   |
| `image_url`  | `text`        |                                   | Source image of the clothing item |
| `created_at` | `timestamptz` | Default `now()`                   |                                   |

## `tryon_results`

| Column          | Type          | Constraints                              | Notes                                   |
|-----------------|---------------|-------------------------------------------|-----------------------------------------|
| `id`            | `uuid`        | PK                                        |                                         |
| `user_id`       | `uuid`        | FK → `users.id`, NOT NULL                 | For quick filtering by user             |
| `user_image_id` | `uuid`        | FK → `user_images.id`, NOT NULL           | The photo used for try‑on               |
| `clothing_id`   | `uuid`        | FK → `clothing_items.id`, NOT NULL        | The clothing item                       |
| `tryon_count`   | `int4`        |                                           | Number of runs for this pair            |
| `image_url`     | `text`        |                                           | Output image location (signed url)      |
| `created_at`    | `timestamptz` | Default `now()`                           |                                         |

## Relationships

| From                         | To                     | Cardinality | Notes                              |
|------------------------------|------------------------|-------------|------------------------------------|
| `users.auth_id`              | `auth.users.id`        | 1:1         | App user ↔ Auth user               |
| `user_images.user_id`        | `users.id`             | N:1         | Many images per user               |
| `clothing_items.user_id`     | `users.id`             | N:1         | Many clothing items per user       |
| `tryon_results.user_id`      | `users.id`             | N:1         | Denormalized for fast queries      |
| `tryon_results.user_image_id`| `user_images.id`       | N:1         |                                    |
| `tryon_results.clothing_id`  | `clothing_items.id`    | N:1         |                                    |

## Indexes / constraints (recommended)

| Table            | Columns                          | Type    | Purpose                                       |
|------------------|----------------------------------|---------|-----------------------------------------------|
| `user_images`    | `user_id`                        | BTREE   | Fast lookup of a user’s images                |
| `clothing_items` | `user_id`                        | BTREE   | Fast lookup of a user’s clothing items        |
| `tryon_results`  | `user_id`                        | BTREE   | Filter results by user                        |
| `tryon_results`  | `(user_image_id, clothing_id)`   | UNIQUE  | Ensure one result per image×clothing pair     |

## Storage

- User uploads are stored in a Supabase Storage bucket (e.g., `user_uploads`) and referenced via `user_images.image_url`.
- Try‑on outputs are referenced by `tryon_results.image_url` (configure as public or sign URLs on demand).


