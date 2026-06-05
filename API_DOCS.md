# API Documentation (Express + PostgreSQL)

This backend follows a **Layered Architecture**:

- **Routes** → define URL paths + middlewares
- **Controllers** → HTTP request/response handling
- **Services** → business rules and validations
- **Repositories/Models (Sequelize)** → database access

Base URL (local): `http://localhost:3000`

---

## Authentication & Authorization

### JWT Authentication (required for `/api/*`)

All current `/api/artworks` endpoints require a JWT.

- **Header**: `Authorization: Bearer <token>`
- **JWT payload requirement**: must include `id` (used as `decoded.id`)
- **User status**: user must exist and have `users.status = true`

If missing/invalid:

- **401** `{"error":"Token no proporcionado"}`
- **401** `{"error":"Token inválido"}`
- **401** `{"error":"Usuario no autorizado"}`

### Role-based access

Some endpoints require specific `roles.name` values:

- `Admin`
- `Curador`
- `Artista`
- `Visitante`

If role is not allowed:

- **403** `{"error":"No tienes permisos para realizar esta acción"}`

---

## Data Model Notes (Schema Alignment)

### Artwork status ENUM (`status_art`)

Allowed values:

- `Pendiente`
- `Aprobado`
- `Rechazado`

### Artwork image (`bytea`)

Database column: `artworks.original_image` is `bytea` and is handled as a binary buffer in Node/Sequelize.

- Upload: multipart/form-data file field name is **`image`**
- Download: returns raw bytes (`image/jpeg` header is used)

---

## Health

### GET `/health`

**Description**: Basic health check.

**Authentication**: Public.

**Success Response**:

- **200**

```json
{ "ok": true }
```

---

## Artworks API

Base path: `/api/artworks`

All endpoints below are **authenticated** (JWT required).

### POST `/api/artworks`

**Description**: Create a new artwork (uploads original image and creates initial stats row).

**Authentication**: Required.

**Authorization**: Role must be **Artista**.

**Request Body**: `multipart/form-data`

- **File**: `image` (required, max 10MB)
- **Fields**:
  - `title` (string, required)
  - `creation_year` (integer, required)
  - `technique` (string, required)
  - `dimensions` (string, required)
  - `tags` (optional) array of tag IDs, either:
    - JSON array string (e.g. `"[1,2,3]"`), or
    - repeated fields depending on client (implementation accepts array)

**Success Response**:

- **201**

```json
{
  "message": "Obra creada exitosamente",
  "artwork": {
    "id": 123,
    "title": "Mi obra",
    "status": "Pendiente"
  }
}
```

**Error Responses**:

- **400** (validation errors)

```json
{
  "errors": [
    { "type": "field", "msg": "title es requerido", "path": "title", "location": "body" }
  ]
}
```

- **400** (missing image)

```json
{ "error": "Imagen requerida" }
```

- **401** / **403** / **500**

```json
{ "error": "..." }
```

---

### GET `/api/artworks`

**Description**: List artworks with optional filters.

**Authentication**: Required.

**Authorization**:

- **Visitante** users are forced to see only `status = "Aprobado"` regardless of requested `status`.
- Other roles may filter by `status`.

**Query Params**:

- `status` (optional) one of: `Pendiente | Aprobado | Rechazado`
- `artist_id` (optional) integer
- `tag` (optional) string, performs case-insensitive partial match on tag name

**Success Response**:

- **200** (array)

```json
[
  {
    "id": 123,
    "title": "Mi obra",
    "creation_year": 2024,
    "technique": "Óleo",
    "dimensions": "50x70",
    "original_image": "<bytes...>",
    "status": "Aprobado",
    "artist_id": 9,
    "created_at": "2026-05-07T17:00:00.000Z",
    "artist": { "id": 9, "full_name": "Ana Pérez", "email": "ana@example.com" },
    "Tags": [{ "id": 1, "name": "Paisaje" }],
    "ArtworkStat": { "artwork_id": 123, "view_count": 10, "download_count": 2 }
  }
]
```

**Error Responses**:

- **400** (invalid status)

```json
{ "error": "Estado inválido" }
```

- **401** / **500**

```json
{ "error": "..." }
```

---

### GET `/api/artworks/:id`

**Description**: Get artwork details (includes artist, tags, stats, and comments). Also increments `artwork_stats.view_count`.

**Authentication**: Required.

**Authorization**:

- If user role is **Visitante**, the artwork must be `status = "Aprobado"` or it returns **403**.
- If user role is not `Admin` or `Curador`, the response omits `original_image`.

**Path Parameters**:

- `id` (required) artwork ID

**Success Response**:

- **200**

```json
{
  "id": 123,
  "title": "Mi obra",
  "creation_year": 2024,
  "technique": "Óleo",
  "dimensions": "50x70",
  "status": "Aprobado",
  "artist_id": 9,
  "created_at": "2026-05-07T17:00:00.000Z",
  "artist": { "id": 9, "full_name": "Ana Pérez", "email": "ana@example.com" },
  "Tags": [{ "id": 1, "name": "Paisaje" }],
  "ArtworkStat": { "artwork_id": 123, "view_count": 11, "download_count": 2 },
  "Comments": [
    {
      "id": 50,
      "artwork_id": 123,
      "user_id": 22,
      "content": "Excelente obra",
      "created_at": "2026-05-07T17:10:00.000Z",
      "User": { "id": 22, "full_name": "Juan López" }
    }
  ]
}
```

**Error Responses**:

- **403** (visitante accessing non-approved artwork)

```json
{ "error": "No tienes acceso a esta obra" }
```

- **404**

```json
{ "error": "Obra no encontrada" }
```

- **401** / **500**

```json
{ "error": "..." }
```

---

### PATCH `/api/artworks/:id/status`

**Description**: Update artwork `status`. If the new status is `Rechazado` and `message` is provided, creates an `art_message` row linked to the artwork.

**Authentication**: Required.

**Authorization**: Role must be **Admin** or **Curador**.

**Path Parameters**:

- `id` (required) artwork ID

**Request Body** (JSON):

```json
{
  "status": "Aprobado",
  "message": "Opcional: motivo si se rechaza"
}
```

**Success Response**:

- **200**

```json
{
  "message": "Estado actualizado exitosamente",
  "artwork": {
    "id": 123,
    "status": "Aprobado"
  }
}
```

**Error Responses**:

- **400** (invalid status)

```json
{ "error": "Estado inválido" }
```

- **404**

```json
{ "error": "Obra no encontrada" }
```

- **401** / **403** / **500**

```json
{ "error": "..." }
```

---

### GET `/api/artworks/:id/download`

**Description**: Download the original artwork image (increments `artwork_stats.download_count`).

**Authentication**: Required.

**Authorization**: Role must be **Admin** or **Curador**.

**Path Parameters**:

- `id` (required) artwork ID

**Success Response**:

- **200**
- **Content-Type**: `image/jpeg`
- **Content-Disposition**: `attachment; filename="<title>.jpg"`

Binary response body (raw bytes).

**Error Responses**:

- **404**

```json
{ "error": "Imagen no encontrada" }
```

- **401** / **403** / **500**

```json
{ "error": "..." }
```

---

## Standard Error Shape

Most endpoints return errors as:

```json
{ "error": "Mensaje de error" }
```

Validation errors (only on `POST /api/artworks`) return:

```json
{ "errors": [ { "msg": "..." } ] }
```

